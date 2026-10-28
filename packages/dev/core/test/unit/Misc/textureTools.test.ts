import { expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Observable } from "core/Misc/observable";
import { GetTextureDataAsync, WhenTextureReadyAsync, _IsCompressedTextureFormat } from "core/Misc/textureTools";
import { Texture } from "core/Materials/Textures/texture";
import { _GetKTX2TextureFlipY } from "core/Misc/khronosTextureContainer2Encoder";

vi.mock("core/PostProcesses/postProcess.pure", async (importOriginal) => {
    const original = await importOriginal<typeof import("core/PostProcesses/postProcess.pure")>();
    return {
        ...original,
        PostProcess: class {
            public onEffectCreatedObservable = new Observable<typeof effect>();
            public constructor() {
                queueMicrotask(() => {
                    this.onEffectCreatedObservable.notifyObservers(effect);
                    queueMicrotask(() => {
                        compilationError = "Test shader compilation failed";
                        effect.onErrorObservable.notifyObservers();
                    });
                });
            }
            public dispose = vi.fn(() => (disposed = true));
        },
    };
});

let disposed = false;
let compilationError = "";
const effect = {
    onCompileObservable: new Observable<void>(),
    onErrorObservable: new Observable<void>(),
    getCompilationError: () => compilationError,
    isReady: () => false,
};

it.each([0x8c00, 0x8c02])("classifies PVRTC format %s as compressed and preserves its source rows", (format) => {
    const engine = new NullEngine();
    const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, false, true);
    try {
        texture.getInternalTexture()!.format = format;
        expect(_IsCompressedTextureFormat(format)).toBe(true);
        expect(_GetKTX2TextureFlipY(texture)).toBe(false);
    } finally {
        engine.dispose();
    }
});

it.each(["error", "load", "abort", "dispose"])("cleans up shared internal texture readiness observers after %s", async (outcome) => {
    const engine = new NullEngine();
    const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, false);
    const internal = texture.getInternalTexture()!;
    internal.isReady = false;
    const controller = new AbortController();
    const observersBefore = Texture.OnTextureLoadErrorObservable.observers.filter((observer) => !observer._willBeUnregistered).length;
    try {
        const ready = WhenTextureReadyAsync(texture, controller.signal);
        expect(internal.onErrorObservable.hasObservers()).toBe(true);
        if (outcome === "error") {
            internal._setError("Shared image failed");
            expect(texture.loadingError).toBe(false);
            await expect(ready).rejects.toThrow("Shared image failed");
        } else if (outcome === "load") {
            texture.onLoadObservable.notifyObservers(texture);
            await ready;
        } else if (outcome === "abort") {
            controller.abort();
            await expect(ready).rejects.toMatchObject({ name: "AbortError" });
        } else {
            texture.dispose();
            await expect(ready).rejects.toThrow("disposed");
        }
        expect(internal.onErrorObservable.hasObservers()).toBe(false);
        expect(texture.onLoadObservable.hasObservers()).toBe(false);
        expect(Texture.OnTextureLoadErrorObservable.observers.filter((observer) => !observer._willBeUnregistered)).toHaveLength(observersBefore);
    } finally {
        engine.dispose();
    }
});

it("rejects shader compilation failure and cleans up instead of leaving readback pending", async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, scene, false);
    texture.getInternalTexture()!.isReady = true;
    try {
        await expect(GetTextureDataAsync(texture, 4, 4, 0, 0, true)).rejects.toThrow("Test shader compilation failed");
        expect(disposed).toBe(true);
        expect(effect.onCompileObservable.hasObservers()).toBe(false);
        expect(effect.onErrorObservable.hasObservers()).toBe(false);
    } finally {
        scene.dispose();
        engine.dispose();
    }
});
