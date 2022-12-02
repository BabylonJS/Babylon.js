import type { HardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import type { Nullable } from "../../types";
import type { INativeEngine, NativeTexture } from "./nativeInterfaces";

/** @internal */
export class NativeHardwareTexture implements HardwareTextureWrapper {
    private readonly _engine: INativeEngine;
    private _nativeTexture: Nullable<NativeTexture>;

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
