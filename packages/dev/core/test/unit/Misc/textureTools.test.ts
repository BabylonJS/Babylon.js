import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { GetTextureDataAsync } from "core/Misc/textureTools";

const state = vi.hoisted(() => ({
    failCompilation: false,
    compilationError: "",
    gamma: -1,
    disposed: 0,
    compileObservers: -1,
    errorObservers: -1,
    apply: () => {},
}));

vi.mock("core/PostProcesses/postProcess.pure", async (importOriginal) => {
    const original = await importOriginal<typeof import("core/PostProcesses/postProcess.pure")>();
    const { Observable } = await import("core/Misc/observable");
    class FakeEffect {
        public onCompileObservable = new Observable<FakeEffect>();
        public onErrorObservable = new Observable<FakeEffect>();
        public isReady() {
            return !state.failCompilation;
        }
        public getCompilationError() {
            return state.compilationError;
        }
        public executeWhenCompiled(callback: (effect: FakeEffect) => void) {
            if (this.isReady()) {
                callback(this);
            } else {
                this.onCompileObservable.add(callback);
            }
        }
        public setTexture() {}
        public setFloat() {}
        public setInt(name: string, value: number) {
            if (name === "gamma") {
                state.gamma = value;
            }
        }
    }
    class FakePostProcess {
        public onEffectCreatedObservable = new Observable<FakeEffect>();
        public onApply = (_effect: FakeEffect) => {};
        private readonly _effect = new FakeEffect();
        public constructor() {
            state.apply = () => this.onApply(this._effect);
            queueMicrotask(() => {
                this.onEffectCreatedObservable.notifyObservers(this._effect);
                if (state.failCompilation) {
                    queueMicrotask(() => {
                        state.compilationError = "Test shader compilation failed.";
                        this._effect.onErrorObservable.notifyObservers(this._effect);
                    });
                }
            });
        }
        public dispose() {
            state.disposed++;
            state.compileObservers = this._effect.onCompileObservable.hasObservers() ? 1 : 0;
            state.errorObservers = this._effect.onErrorObservable.hasObservers() ? 1 : 0;
        }
    }
    return { ...original, PostProcess: FakePostProcess };
});

describe("GetTextureDataAsync RTT", () => {
    let engine: NullEngine;
    let scene: Scene;
    let texture: RawTexture;

    beforeEach(() => {
        Object.assign(state, { failCompilation: false, compilationError: "", gamma: -1, disposed: 0, compileObservers: -1, errorObservers: -1 });
        engine = new NullEngine();
        scene = new Scene(engine);
        texture = new RawTexture(new Uint8Array(64).fill(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, scene, false);
        texture.gammaSpace = false;
        vi.spyOn(texture, "isReady").mockReturnValue(true);
        vi.spyOn(scene.postProcessManager, "directRender").mockImplementation(() => state.apply());
        vi.spyOn(engine, "readPixels").mockResolvedValue(new Uint8Array(64).fill(64));
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("preserves display gamma conversion by default", async () => {
        await GetTextureDataAsync(texture, 4, 4, 0, 0, true);
        expect(state.gamma).toBe(0);
        expect(state.disposed).toBe(1);
    });

    it("can disable display gamma conversion for data readback", async () => {
        await GetTextureDataAsync(texture, 4, 4, 0, 0, true, 0, false);
        expect(state.gamma).toBe(1);
        expect(state.disposed).toBe(1);
    });

    it("rejects shader compilation errors and removes observers before disposing", async () => {
        state.failCompilation = true;
        const readback = GetTextureDataAsync(texture, 4, 4, 0, 0, true);
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error("Readback remained pending.")), 300);
        });
        try {
            await expect(Promise.race([readback, timeout])).rejects.toThrow("Test shader compilation failed.");
            expect(state.disposed).toBe(1);
            expect(state.compileObservers).toBe(0);
            expect(state.errorObservers).toBe(0);
        } finally {
            clearTimeout(timer);
        }
    });
});
