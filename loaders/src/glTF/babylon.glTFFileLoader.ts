/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export enum GLTFLoaderCoordinateSystemMode {
        // Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene (scene.useRightHandedSystem).
        // NOTE: When scene.useRightHandedSystem is false, an additional transform will be added to the root to transform the data from right-handed to left-handed.
        AUTO,

        // The glTF right-handed data is not transformed in any form and is loaded directly.
        PASS_THROUGH,

        // Sets the useRightHandedSystem flag on the scene.
        FORCE_RIGHT_HANDED,
    }

    export interface IGLTFLoaderData {
        json: Object;
        bin: ArrayBufferView;
    }

    export interface IGLTFLoader {
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
    }

    export class GLTFFileLoader implements ISceneLoaderPluginAsync {
        public static CreateGLTFLoaderV1: (parent: GLTFFileLoader) => IGLTFLoader;
        public static CreateGLTFLoaderV2: (parent: GLTFFileLoader) => IGLTFLoader;

        // V1 options
        public static HomogeneousCoordinates: boolean = false;
        public static IncrementalLoading: boolean = true;

        // V2 options
        public coordinateSystemMode: GLTFLoaderCoordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
        public onTextureLoaded: (texture: BaseTexture) => void;
        public onMaterialLoaded: (material: Material) => void;
        /**
         * Let the user decides if he needs to process the material (like precompilation) before affecting it to meshes
         */
        public onBeforeMaterialReadyAsync: (material: Material, targetMesh: AbstractMesh, isLOD: boolean, callback: () => void) => void;
        /**
         * Raised when all LODs are complete (or if there is no LOD and model is complete)
         */
        public onComplete: () => void;
        /**
         * Raised when first LOD complete (or if there is no LOD and model is complete)
         */
        public onFirstLODComplete: () => void;

        public name = "gltf";

        public extensions: ISceneLoaderPluginExtensions = {
            ".gltf": { isBinary: false },
            ".glb": { isBinary: true }
        };

        public importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            var loaderData = GLTFFileLoader._parse(data, onError);
            if (!loaderData) {
                return;
            }

            var loader = this._getLoader(loaderData, onError);
            if (!loader) {
                return;
            }

            loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onSuccess, onProgress, onError);
        }

        public loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            var loaderData = GLTFFileLoader._parse(data, onError);
            if (!loaderData) {
                return;
            }

            var loader = this._getLoader(loaderData, onError);
            if (!loader) {
                return;
            }

            return loader.loadAsync(scene, loaderData, rootUrl, onSuccess, onProgress, onError);
        }

        public canDirectLoad(data: string): boolean {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        }

        private static _parse(data: string | ArrayBuffer, onError: (message: string) => void): IGLTFLoaderData {
            if (data instanceof ArrayBuffer) {
                return GLTFFileLoader._parseBinary(data, onError);
            }

            try {
                return {
                    json: JSON.parse(data),
                    bin: null
                };
            }
            catch (e) {
                onError(e.message);
                return null;
            }
        }

        private _getLoader(loaderData: IGLTFLoaderData, onError: (message: string) => void): IGLTFLoader {
            const loaderVersion = { major: 2, minor: 0 };

            var asset = (<any>loaderData.json).asset || {};

            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                onError("Invalid version: " + asset.version);
                return null;
            }

            if (asset.minVersion !== undefined) {
                var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
                if (!minVersion) {
                    onError("Invalid minimum version: " + asset.minVersion);
                    return null;
                }

                if (GLTFFileLoader._compareVersion(minVersion, loaderVersion) > 0) {
                    onError("Incompatible minimum version: " + asset.minVersion);
                    return null;
                }
            }

            var createLoaders = {
                1: GLTFFileLoader.CreateGLTFLoaderV1,
                2: GLTFFileLoader.CreateGLTFLoaderV2
            };

            var createLoader = createLoaders[version.major];
            if (!createLoader) {
                onError("Unsupported version: " + asset.version);
                return null;
            }

            return createLoader(this);
        }

        private static _parseBinary(data: ArrayBuffer, onError: (message: string) => void): IGLTFLoaderData {
            const Binary = {
                Magic: 0x46546C67
            };

            var binaryReader = new BinaryReader(data);

            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                onError("Unexpected magic: " + magic);
                return null;
            }

            var version = binaryReader.readUint32();
            switch (version) {
                case 1: return GLTFFileLoader._parseV1(binaryReader, onError);
                case 2: return GLTFFileLoader._parseV2(binaryReader, onError);
            }

            onError("Unsupported version: " + version);
            return null;
        }

        private static _parseV1(binaryReader: BinaryReader, onError: (message: string) => void): IGLTFLoaderData {
            const ContentFormat = {
                JSON: 0
            };
            
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                onError("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
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
                    onError("Unexpected content format: " + contentFormat);
                    return null;
            }

            var bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            var body = binaryReader.readUint8Array(bytesRemaining);

            return {
                json: content,
                bin: body
            };
        }

        private static _parseV2(binaryReader: BinaryReader, onError: (message: string) => void): IGLTFLoaderData {
            const ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };

            var length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                onError("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
                return null;
            }

            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                onError("First chunk format is not JSON");
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
                        onError("Unexpected JSON chunk");
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
            if (parts.length != 2) {
                return null;
            }

            var major = +parts[0];
            if (isNaN(major)) {
                return null;
            }

            var minor = +parts[1];
            if (isNaN(minor)) {
                return null;
            }

            return {
                major: major,
                minor: minor
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

    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
    }
}
