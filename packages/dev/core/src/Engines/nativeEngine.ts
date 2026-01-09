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
     */
    public constructor(options: NativeEngineOptions = {}) {
        super(null, false, undefined, options.adaptToDeviceRatio);

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

function applyMixins(derivedCtor: any, constructors: any[]) {
    constructors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null));
        });
    });
}

applyMixins(NativeEngine, [ThinNativeEngine]);
