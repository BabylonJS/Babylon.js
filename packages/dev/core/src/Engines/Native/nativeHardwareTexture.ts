import { type IHardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import { type Nullable } from "../../types";
import { type INativeEngine, type NativeTexture, type NativeFramebuffer } from "./nativeInterfaces";

/** @internal */
export class NativeHardwareTexture implements IHardwareTextureWrapper {
    private readonly _engine: INativeEngine;
    private _nativeTexture: Nullable<NativeTexture>;

    /**
     * Shared bgfx framebuffer lazily built for frame graph render targets that attach this texture.
     * The frame graph creates several render-target wrappers referencing the same texture; they all
     * reuse this single framebuffer so passes don't clobber each other (see ThinNativeEngine.bindFramebuffer).
     * @internal
     */
    public _frameGraphFramebuffer: Nullable<NativeFramebuffer> = null;

    public get underlyingResource(): Nullable<NativeTexture> {
        return this._nativeTexture;
    }

    constructor(existingTexture: NativeTexture, engine: INativeEngine) {
        this._engine = engine;
        this.set(existingTexture);
    }

    public setUsage(): void {}

    public set(hardwareTexture: NativeTexture) {
        this._nativeTexture = hardwareTexture;
    }

    public reset() {
        this._nativeTexture = null;
    }

    public release() {
        if (this._nativeTexture) {
            this._engine.deleteTexture(this._nativeTexture);
        }

        this.reset();
    }
}
