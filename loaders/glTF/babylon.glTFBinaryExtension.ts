module BABYLON {
    const BinaryExtensionBufferName = "binary_glTF";

    enum EContentFormat {
        JSON = 0
    };

    interface IGLTFBinaryExtension {
        content: Object;
        body: Uint8Array;
    };

    interface IGLTFBinaryExtensionShader {
        bufferView: string;
    };

    interface IGLTFBinaryExtensionImage {
        bufferView: string;
        mimeType: string;
        height: number;
        width: number;
    };

    export class GLTFBinaryExtension extends GLTFFileLoaderExtension {
        private _binary: IGLTFBinaryExtension;

        public constructor() {
            super("KHR_binary_glTF");
        }

        public loadRuntimeAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): boolean {
            if (!(data instanceof ArrayBuffer)) {
                return false;
            }

            this._binary = this._parseBinary(<ArrayBuffer>data);
            if (!this._binary) {
                onError();
                return true;
            }

            var gltfRuntime = GLTFFileLoaderBase.CreateRuntime(this._binary.content, scene, rootUrl);

            if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
                Tools.Warn("glTF binary file does not have " + this.name + " specified in extensionsUsed");
                gltfRuntime.extensionsUsed.push(this.name);
            }

            onSuccess(gltfRuntime);
            return true;
        }

        public loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): boolean {
            if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
                return false;
            }

            if (id !== BinaryExtensionBufferName) {
                return false;
            }

            onSuccess(this._binary.body);
            return true;
        }

        public loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): boolean {
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

        public loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: () => void): boolean {
            var shader: IGLTFShader = gltfRuntime.shaders[id];
            if (!shader.extensions || !(this.name in shader.extensions)) {
                return false;
            }

            var binaryExtensionShader: IGLTFBinaryExtensionShader = shader.extensions[this.name];
            var bufferView: IGLTFBufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
            var shaderBytes = GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE);
            var shaderString = GLTFUtils.DecodeBufferToText(shaderBytes);
            onSuccess(shaderString);
            return true;
        }

        // Parses a glTF binary array buffer into its content and body
        private _parseBinary(data: ArrayBuffer): IGLTFBinaryExtension {
            var binaryReader = new BinaryReader(data);

            var magic = GLTFUtils.DecodeBufferToText(binaryReader.getUint8Array(4));
            if (magic != "glTF") {
                Tools.Error("Unexpected magic: " + magic);
                return null;
            }

            var version = binaryReader.getUint32();
            if (version != 1) {
                Tools.Error("Unsupported version: " + version);
                return null;
            }

            var length = binaryReader.getUint32();
            if (length != data.byteLength) {
                Tools.Error("Length in header does not match actual data length: " + length + " != " + data.byteLength);
                return null;
            }

            var contentLength = binaryReader.getUint32();
            var contentFormat = <EContentFormat>binaryReader.getUint32();

            var content: Object;
            switch (contentFormat) {
                case EContentFormat.JSON:
                    var jsonText = GLTFUtils.DecodeBufferToText(binaryReader.getUint8Array(contentLength));
                    content = JSON.parse(jsonText);
                    break;
                default:
                    Tools.Error("Unexpected content format: " + contentFormat);
                    return null;
            }

            var body = binaryReader.getUint8Array();

            return {
                content: content,
                body: body
            };
        };
    }

    class BinaryReader {
        private _arrayBuffer: ArrayBuffer;
        private _dataView: DataView;
        private _byteOffset: number;

        constructor(arrayBuffer: ArrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }

        public getUint32(): number {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        }

        public getUint8Array(length?: number): Uint8Array {
            if (!length) {
                length = this._arrayBuffer.byteLength - this._byteOffset;
            }

            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        }
    }

    GLTFFileLoader.RegisterExtension(new GLTFBinaryExtension());
}