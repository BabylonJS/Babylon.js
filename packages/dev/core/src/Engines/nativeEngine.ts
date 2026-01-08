/* eslint-disable @typescript-eslint/naming-convention */

import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { ThinNativeEngine, type ThinNativeEngineOptions } from "./thinNativeEngine";
import { Tools } from "../Misc/tools";

import "./AbstractEngine/abstractEngine.loadFile";
import "./AbstractEngine/abstractEngine.textureLoaders";
import "./NativeEngine/Extensions/nativeEngine.cubeTexture";

/**
 * Options to create the Native engine
 */
export interface NativeEngineOptions extends ThinNativeEngineOptions {}

/** @internal */
export class NativeEngine extends ThinNativeEngine {
    /**
     * @internal
     */
    public constructor(options: NativeEngineOptions = {}) {
        super(options);

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
    public wrapWebGLTexture(): InternalTexture {
        throw new Error("wrapWebGLTexture is not supported, use wrapNativeTexture instead.");
    }

    /**
     * @internal
     */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement, _faceIndex: number = 0, _lod: number = 0) {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }
}
