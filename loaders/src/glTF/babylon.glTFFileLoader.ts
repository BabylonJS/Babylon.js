/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export interface IGLTFLoaderData {
        json: Object;
        bin: ArrayBufferView;
    }

    export interface IGLTFLoader {
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onsuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onerror: () => void) => void;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onsuccess: () => void, onerror: () => void) => void;
    }

    export class GLTFFileLoader implements ISceneLoaderPluginAsync {
        public static GLTFLoaderV1: IGLTFLoader = null;
        public static GLTFLoaderV2: IGLTFLoader = null;

        public static HomogeneousCoordinates: boolean = false;
        public static IncrementalLoading: boolean = true;

        public extensions: ISceneLoaderPluginExtensions = {
            ".gltf": { isBinary: false },
            ".glb": { isBinary: true }
        };

        public importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError: () => void): void {
            var loaderData = GLTFFileLoader._parse(data);
            var loader = this._getLoader(loaderData);
            if (!loader) {
                onError();
                return;
            }

            loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onSuccess, onError);
        }

        public loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: () => void, onError: () => void): void {
            var loaderData = GLTFFileLoader._parse(data);
            var loader = this._getLoader(loaderData);
            if (!loader) {
                onError();
                return;
            }

            return loader.loadAsync(scene, loaderData, rootUrl, onSuccess, onError);
        }

        private static _parse(data: string | ArrayBuffer): IGLTFLoaderData {
            if (data instanceof ArrayBuffer) {
                return GLTFFileLoader._parseBinary(data);
            }

            return {
                json: JSON.parse(data),
                bin: null
            };
        }

        private _getLoader(loaderData: IGLTFLoaderData): IGLTFLoader {
            const loaderVersion = { major: 2, minor: 0 };

            var asset = (<any>loaderData.json).asset || {};

            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                Tools.Error("Invalid version");
                return null;
            }

            var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
            if (minVersion) {
                if (GLTFFileLoader._compareVersion(minVersion, loaderVersion) > 0) {
                    Tools.Error("Incompatible version");
                    return null;
                }
            }

            var loaders = {
                1: GLTFFileLoader.GLTFLoaderV1,
                2: GLTFFileLoader.GLTFLoaderV2
            };

            var loader = loaders[version.major];
            if (loader === undefined) {
                Tools.Error("Unsupported version");
                return null;
            }

            if (loader === null) {
                Tools.Error("v" + version.major + " loader is not available");
                return null;
            }

            return loader;
        }

        private static _parseBinary(data: ArrayBuffer): IGLTFLoaderData {
            const Binary = {
                Magic: 0x46546C67
            };

            var binaryReader = new BinaryReader(data);

            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                Tools.Error("Unexpected magic: " + magic);
                return null;
            }

            var version = binaryReader.readUint32();
            switch (version) {
                case 1: return GLTFFileLoader._parseV1(binaryReader);
                case 2: return GLTFFileLoader._parseV2(binaryReader);
            }

            Tools.Error("Unsupported version: " + version);
            return null;
        }

        private static _parseV1(binaryReader: BinaryReader): IGLTFLoaderData {
            const ContentFormat = {
                JSON: 0
            };
            
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                Tools.Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
                return null;
            }

            var contentLength = binaryReader.readUint32();
            var contentFormat = binaryReader.readUint32();

            var content: Object;
            switch (contentFormat) {
                case ContentFormat.JSON:
                    content = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(contentLength)));
                    break;
                default:
                    Tools.Error("Unexpected content format: " + contentFormat);
                    return null;
            }

            var bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            var body = binaryReader.readUint8Array(bytesRemaining);

            return {
                json: content,
                bin: body
            };
        }

        private static _parseV2(binaryReader: BinaryReader): IGLTFLoaderData {
            const ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };

            var length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                Tools.Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
                return null;
            }

            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                Tools.Error("First chunk format is not JSON");
                return null;
            }
            var json = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(chunkLength)));

            // Look for BIN chunk
            var bin: Uint8Array = null;
            while (binaryReader.getPosition() < binaryReader.getLength()) {
                chunkLength = binaryReader.readUint32();
                chunkFormat = binaryReader.readUint32();
                switch (chunkFormat) {
                    case ChunkFormat.JSON:
                        Tools.Error("Unexpected JSON chunk");
                        return null;
                    case ChunkFormat.BIN:
                        bin = binaryReader.readUint8Array(chunkLength);
                        break;
                    default:
                        // ignore unrecognized chunkFormat
                        binaryReader.skipBytes(chunkLength);
                        break;
                }
            }

            return {
                json: json,
                bin: bin
            };
        }

        private static _parseVersion(version: string): { major: number, minor: number } {
            if (!version) {
                return null;
            }

            var parts = version.split(".");
            if (parts.length === 0) {
                return null;
            }

            var major = parseInt(parts[0]);
            if (major > 1 && parts.length != 2) {
                return null;
            }

            var minor = parseInt(parts[1]);

            return {
                major: major,
                minor: parseInt(parts[0])
            };
        }

        private static _compareVersion(a: { major: number, minor: number }, b: { major: number, minor: number }) {
            if (a.major > b.major) return 1;
            if (a.major < b.major) return -1;
            if (a.minor > b.minor) return 1;
            if (a.minor < b.minor) return -1;
            return 0;
        }

        private static _decodeBufferToText(view: ArrayBufferView): string {
            var result = "";
            var length = view.byteLength;

            for (var i = 0; i < length; ++i) {
                result += String.fromCharCode(view[i]);
            }

            return result;
        }
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

        public getPosition(): number {
            return this._byteOffset;
        }

        public getLength(): number {
            return this._arrayBuffer.byteLength;
        }

        public readUint32(): number {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        }

        public readUint8Array(length: number): Uint8Array {
            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        }

        public skipBytes(length: number): void {
            this._byteOffset += length;
        }
    }

    BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
}
