import { GLTFLoaderExtension, GLTFLoader, GLTFLoaderBase } from "./glTFLoader";
import { GLTFUtils } from "./glTFLoaderUtils";
import type { Scene } from "core/scene";
import type { IGLTFLoaderData } from "../glTFFileLoader";
import type { IGLTFRuntime, IGLTFTexture, IGLTFImage, IGLTFBufferView, IGLTFShader } from "./glTFLoaderInterfaces";
import { EComponentType } from "./glTFLoaderInterfaces";

import type { IDataBuffer } from "core/Misc/dataReader";

const BinaryExtensionBufferName = "binary_glTF";

interface IGLTFBinaryExtensionShader {
    bufferView: string;
}

interface IGLTFBinaryExtensionImage {
    bufferView: string;
    mimeType: string;
    height: number;
    width: number;
}

/**
 * @internal
 * @deprecated
 */
export class GLTFBinaryExtension extends GLTFLoaderExtension {
    private _bin: IDataBuffer;

    public constructor() {
        super("KHR_binary_glTF");
    }

    public loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void): boolean {
        const extensionsUsed = (<any>data.json).extensionsUsed;
        if (!extensionsUsed || extensionsUsed.indexOf(this.name) === -1 || !data.bin) {
            return false;
        }

        this._bin = data.bin;
        onSuccess(GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
        return true;
    }

    public loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): boolean {
        if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
            return false;
        }

        if (id !== BinaryExtensionBufferName) {
            return false;
        }

        this._bin.readAsync(0, this._bin.byteLength).then(onSuccess, (error) => onError(error.message));
        return true;
    }

    public loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void): boolean {
        const texture: IGLTFTexture = gltfRuntime.textures[id];
        const source: IGLTFImage = gltfRuntime.images[texture.source];
        if (!source.extensions || !(this.name in source.extensions)) {
            return false;
        }

        const sourceExt: IGLTFBinaryExtensionImage = source.extensions[this.name];
        const bufferView: IGLTFBufferView = gltfRuntime.bufferViews[sourceExt.bufferView];
        const buffer = GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE);
        onSuccess(buffer);
        return true;
    }

    public loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void): boolean {
        const shader: IGLTFShader = gltfRuntime.shaders[id];
        if (!shader.extensions || !(this.name in shader.extensions)) {
            return false;
        }

        const binaryExtensionShader: IGLTFBinaryExtensionShader = shader.extensions[this.name];
        const bufferView: IGLTFBufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
        const shaderBytes = GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE);

        setTimeout(() => {
            const shaderString = GLTFUtils.DecodeBufferToText(shaderBytes);
            onSuccess(shaderString);
        });

        return true;
    }
}

GLTFLoader.RegisterExtension(new GLTFBinaryExtension());
