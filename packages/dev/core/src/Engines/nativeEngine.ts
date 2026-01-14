/* eslint-disable @typescript-eslint/naming-convention */

import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { Engine } from "./engine";
import type { ThinNativeEngineOptions } from "./thinNativeEngine";
import { ThinNativeEngine } from "./thinNativeEngine";

import "./AbstractEngine/abstractEngine.loadFile";
import "./AbstractEngine/abstractEngine.textureLoaders";
import "./Native/Extensions/nativeEngine.cubeTexture";

/**
 * Options to create the Native engine
 */
export interface NativeEngineOptions extends ThinNativeEngineOptions {}

/** @internal */
export class NativeEngine extends Engine {
    /**
     * @internal
     * Will be overriden by the Thin Native engine implementation
     * No code should be placed here
     */
    protected _initializeNativeEngine(_adaptToDeviceRatio: boolean): void {}

    /**
     * @internal
     */
    public constructor(options: NativeEngineOptions = {}) {
        super(null, false, undefined, options.adaptToDeviceRatio);

        this._initializeNativeEngine(options.adaptToDeviceRatio ?? false);
    }

    /**
     * @internal
     */
    public override wrapWebGLTexture(): InternalTexture {
        throw new Error("wrapWebGLTexture is not supported, use wrapNativeTexture instead.");
    }

    /**
     * @internal
     */
    public override _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement, _faceIndex: number = 0, _lod: number = 0) {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }
}

/**
 * @internal
 * Augments the NativeEngine type to include ThinNativeEngine methods and preventing dupplicate TS errors
 */
export interface NativeEngine extends Omit<ThinNativeEngine, keyof Engine> {}

/**
 * @internal
 * Applies the functionality of one or more base constructors to a derived constructor.
 */
function applyMixins(derivedCtor: any, constructors: any[]) {
    constructors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            if (name !== "constructor") {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            }
        });
    });
}

// Apply the ThinNativeEngine mixins to the NativeEngine.
applyMixins(NativeEngine, [ThinNativeEngine]);
