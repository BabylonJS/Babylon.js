import { GLTFLoaderExtension } from "./glTFLoader";
import { GLTFUtils } from "./glTFLoaderUtils";
import { Scene } from "babylonjs/scene";
import { IGLTFLoaderData } from "../glTFFileLoader";
import { IGLTFRuntime, IGLTFTexture, IGLTFImage, IGLTFBufferView, EComponentType, IGLTFShader } from "./glTFLoaderInterfaces";
import { GLTFLoader, GLTFLoaderBase } from "./glTFLoader";
import { IDataBuffer } from 'babylonjs/Misc/dataReader';

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

/** @hidden */
export class GLTFBinaryExtension extends GLTFLoaderExtension {
    private _bin: IDataBuffer;

    public constructor() {
        super("KHR_binary_glTF");
    }

    public loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: (message: string) => void): boolean {
        var extensionsUsed = (<any>data.json).extensionsUsed;
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

    public loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): boolean {
        var texture: IGLTFTexture = gltfRuntime.textures[id];
        var source: IGLTFImage = gltfRuntime.images[texture.source];
        if (!source.extensions || !(this.name in source.extensions)) {
            return false;
        }

        var sourceExt: IGLTFBinaryExtensionImage = source.extensions[this.name];
        var bufferView: IGLTFBufferView = gltfRuntime.bufferViews[sourceExt.bufferView];
        var buffer = GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE);
        onSuccess(buffer);
        return true;
    }

    public loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: (message: string) => void): boolean {
        var shader: IGLTFShader = gltfRuntime.shaders[id];
        if (!shader.extensions || !(this.name in shader.extensions)) {
            return false;
        }

        var binaryExtensionShader: IGLTFBinaryExtensionShader = shader.extensions[this.name];
        var bufferView: IGLTFBufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
        var shaderBytes = GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE);

        setTimeout(() => {
            var shaderString = GLTFUtils.DecodeBufferToText(shaderBytes);
            onSuccess(shaderString);
        });

        return true;
    }
}

GLTFLoader.RegisterExtension(new GLTFBinaryExtension());