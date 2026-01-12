/* eslint-disable @typescript-eslint/naming-convention */

import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { Engine } from "./engine";
import { Tools } from "../Misc/tools";

import "./AbstractEngine/abstractEngine.loadFile";
import "./AbstractEngine/abstractEngine.textureLoaders";
import "./Native/Extensions/nativeEngine.cubeTexture";
import { ThinNativeEngine } from "./thinNativeEngine";

/**
 * Options to create the Native engine
 */
export interface NativeEngineOptions {
    /**
     * defines whether to adapt to the device's viewport characteristics (default: false)
     */
    adaptToDeviceRatio?: boolean;
}

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

        Tools.LoadScript = function (scriptUrl, onSuccess, onError) {
            Tools.LoadFile(
                scriptUrl,
                (data) => {
                    Function(data as string).apply(null);
                    if (onSuccess) {
                        onSuccess();
                    }
                },
                undefined,
                undefined,
                false,
                (_request, exception) => {
                    if (onError) {
                        onError("LoadScript Error", exception);
                    }
                }
            );
        };
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
