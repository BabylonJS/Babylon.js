import { expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Observable } from "core/Misc/observable";
import { GetTextureDataAsync } from "core/Misc/textureTools";

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
