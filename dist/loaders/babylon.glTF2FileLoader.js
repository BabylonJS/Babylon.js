/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    /**
     * Mode that determines the coordinate system to use.
     */
    var GLTFLoaderCoordinateSystemMode;
    (function (GLTFLoaderCoordinateSystemMode) {
        /**
         * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
         */
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["AUTO"] = 0] = "AUTO";
        /**
         * Sets the useRightHandedSystem flag on the scene.
         */
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["FORCE_RIGHT_HANDED"] = 1] = "FORCE_RIGHT_HANDED";
    })(GLTFLoaderCoordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode || (BABYLON.GLTFLoaderCoordinateSystemMode = {}));
    /**
     * Mode that determines what animations will start.
     */
    var GLTFLoaderAnimationStartMode;
    (function (GLTFLoaderAnimationStartMode) {
        /**
         * No animation will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["NONE"] = 0] = "NONE";
        /**
         * The first animation will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["FIRST"] = 1] = "FIRST";
        /**
         * All animations will start.
         */
        GLTFLoaderAnimationStartMode[GLTFLoaderAnimationStartMode["ALL"] = 2] = "ALL";
    })(GLTFLoaderAnimationStartMode = BABYLON.GLTFLoaderAnimationStartMode || (BABYLON.GLTFLoaderAnimationStartMode = {}));
    /**
     * Loader state.
     */
    var GLTFLoaderState;
    (function (GLTFLoaderState) {
        /**
         * The asset is loading.
         */
        GLTFLoaderState[GLTFLoaderState["LOADING"] = 0] = "LOADING";
        /**
         * The asset is ready for rendering.
         */
        GLTFLoaderState[GLTFLoaderState["READY"] = 1] = "READY";
        /**
         * The asset is completely loaded.
         */
        GLTFLoaderState[GLTFLoaderState["COMPLETE"] = 2] = "COMPLETE";
    })(GLTFLoaderState = BABYLON.GLTFLoaderState || (BABYLON.GLTFLoaderState = {}));
    /**
     * File loader for loading glTF files into a scene.
     */
    var GLTFFileLoader = /** @class */ (function () {
        function GLTFFileLoader() {
            // #region Common options
            /**
             * Raised when the asset has been parsed
             */
            this.onParsedObservable = new BABYLON.Observable();
            // #endregion
            // #region V2 options
            /**
             * The coordinate system mode. Defaults to AUTO.
             */
            this.coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
            /**
            * The animation start mode. Defaults to FIRST.
            */
            this.animationStartMode = GLTFLoaderAnimationStartMode.FIRST;
            /**
             * Defines if the loader should compile materials before raising the success callback. Defaults to false.
             */
            this.compileMaterials = false;
            /**
             * Defines if the loader should also compile materials with clip planes. Defaults to false.
             */
            this.useClipPlane = false;
            /**
             * Defines if the loader should compile shadow generators before raising the success callback. Defaults to false.
             */
            this.compileShadowGenerators = false;
            /**
             * Defines if the Alpha blended materials are only applied as coverage.
             * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
             * If true, no extra effects are applied to transparent pixels.
             */
            this.transparencyAsCoverage = false;
            /** @hidden */
            this._normalizeAnimationGroupsToBeginAtZero = true;
            /**
             * Function called before loading a url referenced by the asset.
             */
            this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
            /**
             * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
             */
            this.onMeshLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
             */
            this.onTextureLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a material after parsing the glTF properties of the material.
             */
            this.onMaterialLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
             */
            this.onCameraLoadedObservable = new BABYLON.Observable();
            /**
             * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
             * For assets with LODs, raised when all of the LODs are complete.
             * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
             */
            this.onCompleteObservable = new BABYLON.Observable();
            /**
             * Observable raised after the loader is disposed.
             */
            this.onDisposeObservable = new BABYLON.Observable();
            /**
             * Observable raised after a loader extension is created.
             * Set additional options for a loader extension in this event.
             */
            this.onExtensionLoadedObservable = new BABYLON.Observable();
            // #endregion
            this._loader = null;
            /**
             * Name of the loader ("gltf")
             */
            this.name = "gltf";
            /**
             * Supported file extensions of the loader (.gltf, .glb)
             */
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        Object.defineProperty(GLTFFileLoader.prototype, "onParsed", {
            /**
             * Raised when the asset has been parsed
             */
            set: function (callback) {
                if (this._onParsedObserver) {
                    this.onParsedObservable.remove(this._onParsedObserver);
                }
                this._onParsedObserver = this.onParsedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onMeshLoaded", {
            /**
             * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
             */
            set: function (callback) {
                if (this._onMeshLoadedObserver) {
                    this.onMeshLoadedObservable.remove(this._onMeshLoadedObserver);
                }
                this._onMeshLoadedObserver = this.onMeshLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onTextureLoaded", {
            /**
             * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
             */
            set: function (callback) {
                if (this._onTextureLoadedObserver) {
                    this.onTextureLoadedObservable.remove(this._onTextureLoadedObserver);
                }
                this._onTextureLoadedObserver = this.onTextureLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onMaterialLoaded", {
            /**
             * Callback raised when the loader creates a material after parsing the glTF properties of the material.
             */
            set: function (callback) {
                if (this._onMaterialLoadedObserver) {
                    this.onMaterialLoadedObservable.remove(this._onMaterialLoadedObserver);
                }
                this._onMaterialLoadedObserver = this.onMaterialLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onCameraLoaded", {
            /**
             * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
             */
            set: function (callback) {
                if (this._onCameraLoadedObserver) {
                    this.onCameraLoadedObservable.remove(this._onCameraLoadedObserver);
                }
                this._onCameraLoadedObserver = this.onCameraLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onComplete", {
            /**
             * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
             */
            set: function (callback) {
                if (this._onCompleteObserver) {
                    this.onCompleteObservable.remove(this._onCompleteObserver);
                }
                this._onCompleteObserver = this.onCompleteObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onDispose", {
            /**
             * Callback raised after the loader is disposed.
             */
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onExtensionLoaded", {
            /**
             * Callback raised after a loader extension is created.
             */
            set: function (callback) {
                if (this._onExtensionLoadedObserver) {
                    this.onExtensionLoadedObservable.remove(this._onExtensionLoadedObserver);
                }
                this._onExtensionLoadedObserver = this.onExtensionLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns a promise that resolves when the asset is completely loaded.
         * @returns a promise that resolves when the asset is completely loaded.
         */
        GLTFFileLoader.prototype.whenCompleteAsync = function () {
            var _this = this;
            return new Promise(function (resolve) {
                _this.onCompleteObservable.add(function () {
                    resolve();
                }, undefined, undefined, undefined, true);
            });
        };
        Object.defineProperty(GLTFFileLoader.prototype, "loaderState", {
            /**
             * The loader state or null if the loader is not active.
             */
            get: function () {
                return this._loader ? this._loader.state : null;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        GLTFFileLoader.prototype.dispose = function () {
            if (this._loader) {
                this._loader.dispose();
                this._loader = null;
            }
            this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
            this.onMeshLoadedObservable.clear();
            this.onTextureLoadedObservable.clear();
            this.onMaterialLoadedObservable.clear();
            this.onCameraLoadedObservable.clear();
            this.onCompleteObservable.clear();
            this.onExtensionLoadedObservable.clear();
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        };
        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onProgress);
            });
        };
        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise which completes when objects have been loaded to the scene
         */
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.loadAsync(scene, loaderData, rootUrl, onProgress);
            });
        };
        /**
         * Load into an asset container.
         * @param scene The scene to load into
         * @param data The data to import
         * @param rootUrl The root url for scene and resources
         * @param onProgress The callback when the load progresses
         * @returns The loaded asset container
         */
        GLTFFileLoader.prototype.loadAssetContainerAsync = function (scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.importMeshAsync(null, scene, loaderData, rootUrl, onProgress).then(function (result) {
                    var container = new BABYLON.AssetContainer(scene);
                    Array.prototype.push.apply(container.meshes, result.meshes);
                    Array.prototype.push.apply(container.particleSystems, result.particleSystems);
                    Array.prototype.push.apply(container.skeletons, result.skeletons);
                    Array.prototype.push.apply(container.animationGroups, result.animationGroups);
                    container.removeAllFromScene();
                    return container;
                });
            });
        };
        /**
         * If the data string can be loaded directly.
         * @param data string contianing the file data
         * @returns if the data can be loaded directly
         */
        GLTFFileLoader.prototype.canDirectLoad = function (data) {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        };
        /**
         * Instantiates a glTF file loader plugin.
         * @returns the created plugin
         */
        GLTFFileLoader.prototype.createPlugin = function () {
            return new GLTFFileLoader();
        };
        GLTFFileLoader.prototype._parse = function (data) {
            var parsedData;
            if (data instanceof ArrayBuffer) {
                parsedData = GLTFFileLoader._parseBinary(data);
            }
            else {
                parsedData = {
                    json: JSON.parse(data),
                    bin: null
                };
            }
            this.onParsedObservable.notifyObservers(parsedData);
            this.onParsedObservable.clear();
            return parsedData;
        };
        GLTFFileLoader.prototype._getLoader = function (loaderData) {
            var _this = this;
            var loaderVersion = { major: 2, minor: 0 };
            var asset = loaderData.json.asset || {};
            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                throw new Error("Invalid version: " + asset.version);
            }
            if (asset.minVersion !== undefined) {
                var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
                if (!minVersion) {
                    throw new Error("Invalid minimum version: " + asset.minVersion);
                }
                if (GLTFFileLoader._compareVersion(minVersion, loaderVersion) > 0) {
                    throw new Error("Incompatible minimum version: " + asset.minVersion);
                }
            }
            var createLoaders = {
                1: GLTFFileLoader.CreateGLTFLoaderV1,
                2: GLTFFileLoader.CreateGLTFLoaderV2
            };
            var createLoader = createLoaders[version.major];
            if (!createLoader) {
                throw new Error("Unsupported version: " + asset.version);
            }
            var loader = createLoader();
            loader.coordinateSystemMode = this.coordinateSystemMode;
            loader.animationStartMode = this.animationStartMode;
            loader.compileMaterials = this.compileMaterials;
            loader.useClipPlane = this.useClipPlane;
            loader.compileShadowGenerators = this.compileShadowGenerators;
            loader.transparencyAsCoverage = this.transparencyAsCoverage;
            loader._normalizeAnimationGroupsToBeginAtZero = this._normalizeAnimationGroupsToBeginAtZero;
            loader.preprocessUrlAsync = this.preprocessUrlAsync;
            loader.onMeshLoadedObservable.add(function (mesh) { return _this.onMeshLoadedObservable.notifyObservers(mesh); });
            loader.onTextureLoadedObservable.add(function (texture) { return _this.onTextureLoadedObservable.notifyObservers(texture); });
            loader.onMaterialLoadedObservable.add(function (material) { return _this.onMaterialLoadedObservable.notifyObservers(material); });
            loader.onCameraLoadedObservable.add(function (camera) { return _this.onCameraLoadedObservable.notifyObservers(camera); });
            loader.onExtensionLoadedObservable.add(function (extension) { return _this.onExtensionLoadedObservable.notifyObservers(extension); });
            loader.onCompleteObservable.add(function () {
                _this.onMeshLoadedObservable.clear();
                _this.onTextureLoadedObservable.clear();
                _this.onMaterialLoadedObservable.clear();
                _this.onCameraLoadedObservable.clear();
                _this.onExtensionLoadedObservable.clear();
                _this.onCompleteObservable.notifyObservers(_this);
                _this.onCompleteObservable.clear();
            });
            return loader;
        };
        GLTFFileLoader._parseBinary = function (data) {
            var Binary = {
                Magic: 0x46546C67
            };
            var binaryReader = new BinaryReader(data);
            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                throw new Error("Unexpected magic: " + magic);
            }
            var version = binaryReader.readUint32();
            switch (version) {
                case 1: return GLTFFileLoader._parseV1(binaryReader);
                case 2: return GLTFFileLoader._parseV2(binaryReader);
            }
            throw new Error("Unsupported version: " + version);
        };
        GLTFFileLoader._parseV1 = function (binaryReader) {
            var ContentFormat = {
                JSON: 0
            };
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            var contentLength = binaryReader.readUint32();
            var contentFormat = binaryReader.readUint32();
            var content;
            switch (contentFormat) {
                case ContentFormat.JSON: {
                    content = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(contentLength)));
                    break;
                }
                default: {
                    throw new Error("Unexpected content format: " + contentFormat);
                }
            }
            var bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            var body = binaryReader.readUint8Array(bytesRemaining);
            return {
                json: content,
                bin: body
            };
        };
        GLTFFileLoader._parseV2 = function (binaryReader) {
            var ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };
            var length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                throw new Error("First chunk format is not JSON");
            }
            var json = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(chunkLength)));
            // Look for BIN chunk
            var bin = null;
            while (binaryReader.getPosition() < binaryReader.getLength()) {
                var chunkLength_1 = binaryReader.readUint32();
                var chunkFormat_1 = binaryReader.readUint32();
                switch (chunkFormat_1) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        bin = binaryReader.readUint8Array(chunkLength_1);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        binaryReader.skipBytes(chunkLength_1);
                        break;
                    }
                }
            }
            return {
                json: json,
                bin: bin
            };
        };
        GLTFFileLoader._parseVersion = function (version) {
            if (version === "1.0" || version === "1.0.1") {
                return {
                    major: 1,
                    minor: 0
                };
            }
            var match = (version + "").match(/^(\d+)\.(\d+)/);
            if (!match) {
                return null;
            }
            return {
                major: parseInt(match[1]),
                minor: parseInt(match[2])
            };
        };
        GLTFFileLoader._compareVersion = function (a, b) {
            if (a.major > b.major)
                return 1;
            if (a.major < b.major)
                return -1;
            if (a.minor > b.minor)
                return 1;
            if (a.minor < b.minor)
                return -1;
            return 0;
        };
        GLTFFileLoader._decodeBufferToText = function (buffer) {
            var result = "";
            var length = buffer.byteLength;
            for (var i = 0; i < length; i++) {
                result += String.fromCharCode(buffer[i]);
            }
            return result;
        };
        // #endregion
        // #region V1 options
        /**
         * Set this property to false to disable incremental loading which delays the loader from calling the success callback until after loading the meshes and shaders.
         * Textures always loads asynchronously. For example, the success callback can compute the bounding information of the loaded meshes when incremental loading is disabled.
         * Defaults to true.
         */
        GLTFFileLoader.IncrementalLoading = true;
        /**
         * Set this property to true in order to work with homogeneous coordinates, available with some converters and exporters.
         * Defaults to false. See https://en.wikipedia.org/wiki/Homogeneous_coordinates.
         */
        GLTFFileLoader.HomogeneousCoordinates = false;
        return GLTFFileLoader;
    }());
    BABYLON.GLTFFileLoader = GLTFFileLoader;
    var BinaryReader = /** @class */ (function () {
        function BinaryReader(arrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }
        BinaryReader.prototype.getPosition = function () {
            return this._byteOffset;
        };
        BinaryReader.prototype.getLength = function () {
            return this._arrayBuffer.byteLength;
        };
        BinaryReader.prototype.readUint32 = function () {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        };
        BinaryReader.prototype.readUint8Array = function (length) {
            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        };
        BinaryReader.prototype.skipBytes = function (length) {
            this._byteOffset += length;
        };
        return BinaryReader;
    }());
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFFileLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /** @hidden */
        var _ArrayItem = /** @class */ (function () {
            function _ArrayItem() {
            }
            /** @hidden */
            _ArrayItem.Assign = function (values) {
                if (values) {
                    for (var index = 0; index < values.length; index++) {
                        values[index]._index = index;
                    }
                }
            };
            return _ArrayItem;
        }());
        GLTF2._ArrayItem = _ArrayItem;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtilities.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/**
 * Defines the module used to import/export glTF 2.0 assets
 */
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Loader for loading a glTF 2.0 asset
         */
        var GLTFLoader = /** @class */ (function () {
            function GLTFLoader() {
                /** @hidden */
                this._completePromises = new Array();
                this._disposed = false;
                this._state = null;
                this._extensions = {};
                this._defaultSampler = {};
                this._defaultBabylonMaterials = {};
                this._requests = new Array();
                /**
                 * Mode that determines the coordinate system to use.
                 */
                this.coordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode.AUTO;
                /**
                 * Mode that determines what animations will start.
                 */
                this.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.FIRST;
                /**
                 * Defines if the loader should compile materials.
                 */
                this.compileMaterials = false;
                /**
                 * Defines if the loader should also compile materials with clip planes.
                 */
                this.useClipPlane = false;
                /**
                 * Defines if the loader should compile shadow generators.
                 */
                this.compileShadowGenerators = false;
                /**
                 * Defines if the Alpha blended materials are only applied as coverage.
                 * If false, (default) The luminance of each pixel will reduce its opacity to simulate the behaviour of most physical materials.
                 * If true, no extra effects are applied to transparent pixels.
                 */
                this.transparencyAsCoverage = false;
                /** @hidden */
                this._normalizeAnimationGroupsToBeginAtZero = true;
                /**
                 * Function called before loading a url referenced by the asset.
                 */
                this.preprocessUrlAsync = function (url) { return Promise.resolve(url); };
                /**
                 * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
                 */
                this.onMeshLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
                 */
                this.onTextureLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the loader creates a material after parsing the glTF properties of the material.
                 */
                this.onMaterialLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the loader creates a camera after parsing the glTF properties of the camera.
                 */
                this.onCameraLoadedObservable = new BABYLON.Observable();
                /**
                 * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
                 * For assets with LODs, raised when all of the LODs are complete.
                 * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
                 */
                this.onCompleteObservable = new BABYLON.Observable();
                /**
                 * Observable raised after the loader is disposed.
                 */
                this.onDisposeObservable = new BABYLON.Observable();
                /**
                 * Observable raised after a loader extension is created.
                 * Set additional options for a loader extension in this event.
                 */
                this.onExtensionLoadedObservable = new BABYLON.Observable();
            }
            /** @hidden */
            GLTFLoader._Register = function (name, factory) {
                if (GLTFLoader._ExtensionFactories[name]) {
                    BABYLON.Tools.Error("Extension with the name '" + name + "' already exists");
                    return;
                }
                GLTFLoader._ExtensionFactories[name] = factory;
                // Keep the order of registration so that extensions registered first are called first.
                GLTFLoader._ExtensionNames.push(name);
            };
            Object.defineProperty(GLTFLoader.prototype, "state", {
                /**
                 * Loader state or null if the loader is not active.
                 */
                get: function () {
                    return this._state;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * Disposes the loader, releases resources during load, and cancels any outstanding requests.
             */
            GLTFLoader.prototype.dispose = function () {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                this.onDisposeObservable.notifyObservers(this);
                this.onDisposeObservable.clear();
                this._clear();
            };
            /**
             * Imports one or more meshes from the loaded glTF data and adds them to the scene
             * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
             * @param scene the scene the meshes should be added to
             * @param data the glTF data to load
             * @param rootUrl root url to load from
             * @param onProgress event that fires when loading progress has occured
             * @returns a promise containg the loaded meshes, particles, skeletons and animations
             */
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress) {
                var _this = this;
                return Promise.resolve().then(function () {
                    var nodes = null;
                    if (meshesNames) {
                        var nodeMap_1 = {};
                        if (_this._gltf.nodes) {
                            for (var _i = 0, _a = _this._gltf.nodes; _i < _a.length; _i++) {
                                var node = _a[_i];
                                if (node.name) {
                                    nodeMap_1[node.name] = node;
                                }
                            }
                        }
                        var names = (meshesNames instanceof Array) ? meshesNames : [meshesNames];
                        nodes = names.map(function (name) {
                            var node = nodeMap_1[name];
                            if (!node) {
                                throw new Error("Failed to find node '" + name + "'");
                            }
                            return node;
                        });
                    }
                    return _this._loadAsync(nodes, scene, data, rootUrl, onProgress).then(function () {
                        return {
                            meshes: _this._getMeshes(),
                            particleSystems: [],
                            skeletons: _this._getSkeletons(),
                            animationGroups: _this._getAnimationGroups()
                        };
                    });
                });
            };
            /**
             * Imports all objects from the loaded glTF data and adds them to the scene
             * @param scene the scene the objects should be added to
             * @param data the glTF data to load
             * @param rootUrl root url to load from
             * @param onProgress event that fires when loading progress has occured
             * @returns a promise which completes when objects have been loaded to the scene
             */
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
                return this._loadAsync(null, scene, data, rootUrl, onProgress);
            };
            GLTFLoader.prototype._loadAsync = function (nodes, scene, data, rootUrl, onProgress) {
                var _this = this;
                return Promise.resolve().then(function () {
                    _this._babylonScene = scene;
                    _this._rootUrl = rootUrl;
                    _this._progressCallback = onProgress;
                    _this._state = BABYLON.GLTFLoaderState.LOADING;
                    _this._loadData(data);
                    _this._loadExtensions();
                    _this._checkExtensions();
                    var promises = new Array();
                    if (nodes) {
                        promises.push(_this._loadNodesAsync(nodes));
                    }
                    else {
                        var scene_1 = GLTFLoader._GetProperty("#/scene", _this._gltf.scenes, _this._gltf.scene || 0);
                        promises.push(_this._loadSceneAsync("#/scenes/" + scene_1._index, scene_1));
                    }
                    if (_this.compileMaterials) {
                        promises.push(_this._compileMaterialsAsync());
                    }
                    if (_this.compileShadowGenerators) {
                        promises.push(_this._compileShadowGeneratorsAsync());
                    }
                    var resultPromise = Promise.all(promises).then(function () {
                        _this._state = BABYLON.GLTFLoaderState.READY;
                        _this._startAnimations();
                    });
                    resultPromise.then(function () {
                        _this._rootBabylonMesh.setEnabled(true);
                        BABYLON.Tools.SetImmediate(function () {
                            if (!_this._disposed) {
                                Promise.all(_this._completePromises).then(function () {
                                    _this._state = BABYLON.GLTFLoaderState.COMPLETE;
                                    _this.onCompleteObservable.notifyObservers(_this);
                                    _this.onCompleteObservable.clear();
                                    _this._clear();
                                }).catch(function (error) {
                                    BABYLON.Tools.Error("glTF Loader: " + error.message);
                                    _this._clear();
                                });
                            }
                        });
                    });
                    return resultPromise;
                }).catch(function (error) {
                    if (!_this._disposed) {
                        BABYLON.Tools.Error("glTF Loader: " + error.message);
                        _this._clear();
                        throw error;
                    }
                });
            };
            GLTFLoader.prototype._loadData = function (data) {
                this._gltf = data.json;
                this._setupData();
                if (data.bin) {
                    var buffers = this._gltf.buffers;
                    if (buffers && buffers[0] && !buffers[0].uri) {
                        var binaryBuffer = buffers[0];
                        if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
                            BABYLON.Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                        }
                        binaryBuffer._data = Promise.resolve(data.bin);
                    }
                    else {
                        BABYLON.Tools.Warn("Unexpected BIN chunk");
                    }
                }
            };
            GLTFLoader.prototype._setupData = function () {
                GLTF2._ArrayItem.Assign(this._gltf.accessors);
                GLTF2._ArrayItem.Assign(this._gltf.animations);
                GLTF2._ArrayItem.Assign(this._gltf.buffers);
                GLTF2._ArrayItem.Assign(this._gltf.bufferViews);
                GLTF2._ArrayItem.Assign(this._gltf.cameras);
                GLTF2._ArrayItem.Assign(this._gltf.images);
                GLTF2._ArrayItem.Assign(this._gltf.materials);
                GLTF2._ArrayItem.Assign(this._gltf.meshes);
                GLTF2._ArrayItem.Assign(this._gltf.nodes);
                GLTF2._ArrayItem.Assign(this._gltf.samplers);
                GLTF2._ArrayItem.Assign(this._gltf.scenes);
                GLTF2._ArrayItem.Assign(this._gltf.skins);
                GLTF2._ArrayItem.Assign(this._gltf.textures);
                if (this._gltf.nodes) {
                    var nodeParents = {};
                    for (var _i = 0, _a = this._gltf.nodes; _i < _a.length; _i++) {
                        var node = _a[_i];
                        if (node.children) {
                            for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
                                var index = _c[_b];
                                nodeParents[index] = node._index;
                            }
                        }
                    }
                    var rootNode = this._createRootNode();
                    for (var _d = 0, _e = this._gltf.nodes; _d < _e.length; _d++) {
                        var node = _e[_d];
                        var parentIndex = nodeParents[node._index];
                        node._parent = parentIndex === undefined ? rootNode : this._gltf.nodes[parentIndex];
                    }
                }
            };
            GLTFLoader.prototype._loadExtensions = function () {
                for (var _i = 0, _a = GLTFLoader._ExtensionNames; _i < _a.length; _i++) {
                    var name_1 = _a[_i];
                    var extension = GLTFLoader._ExtensionFactories[name_1](this);
                    this._extensions[name_1] = extension;
                    this.onExtensionLoadedObservable.notifyObservers(extension);
                }
                this.onExtensionLoadedObservable.clear();
            };
            GLTFLoader.prototype._checkExtensions = function () {
                if (this._gltf.extensionsRequired) {
                    for (var _i = 0, _a = this._gltf.extensionsRequired; _i < _a.length; _i++) {
                        var name_2 = _a[_i];
                        var extension = this._extensions[name_2];
                        if (!extension || !extension.enabled) {
                            throw new Error("Require extension " + name_2 + " is not available");
                        }
                    }
                }
            };
            GLTFLoader.prototype._createRootNode = function () {
                this._rootBabylonMesh = new BABYLON.Mesh("__root__", this._babylonScene);
                this._rootBabylonMesh.setEnabled(false);
                var rootNode = { _babylonMesh: this._rootBabylonMesh };
                switch (this.coordinateSystemMode) {
                    case BABYLON.GLTFLoaderCoordinateSystemMode.AUTO: {
                        if (!this._babylonScene.useRightHandedSystem) {
                            rootNode.rotation = [0, 1, 0, 0];
                            rootNode.scale = [1, 1, -1];
                            GLTFLoader._LoadTransform(rootNode, this._rootBabylonMesh);
                        }
                        break;
                    }
                    case BABYLON.GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
                        this._babylonScene.useRightHandedSystem = true;
                        break;
                    }
                    default: {
                        throw new Error("Invalid coordinate system mode (" + this.coordinateSystemMode + ")");
                    }
                }
                this.onMeshLoadedObservable.notifyObservers(this._rootBabylonMesh);
                return rootNode;
            };
            GLTFLoader.prototype._loadNodesAsync = function (nodes) {
                var promises = new Array();
                for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                    var node = nodes_1[_i];
                    promises.push(this._loadNodeAsync("#/nodes/" + node._index, node));
                }
                promises.push(this._loadAnimationsAsync());
                return Promise.all(promises).then(function () { });
            };
            /** @hidden */
            GLTFLoader.prototype._loadSceneAsync = function (context, scene) {
                var promise = GLTF2.GLTFLoaderExtension._LoadSceneAsync(this, context, scene);
                if (promise) {
                    return promise;
                }
                var promises = new Array();
                for (var _i = 0, _a = scene.nodes; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var node = GLTFLoader._GetProperty(context + "/nodes/" + index, this._gltf.nodes, index);
                    promises.push(this._loadNodeAsync("#/nodes/" + node._index, node));
                }
                promises.push(this._loadAnimationsAsync());
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._forEachPrimitive = function (node, callback) {
                if (node._primitiveBabylonMeshes) {
                    for (var _i = 0, _a = node._primitiveBabylonMeshes; _i < _a.length; _i++) {
                        var babylonMesh = _a[_i];
                        callback(babylonMesh);
                    }
                }
                else {
                    callback(node._babylonMesh);
                }
            };
            GLTFLoader.prototype._getMeshes = function () {
                var meshes = new Array();
                // Root mesh is always first.
                meshes.push(this._rootBabylonMesh);
                var nodes = this._gltf.nodes;
                if (nodes) {
                    for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
                        var node = nodes_2[_i];
                        if (node._babylonMesh) {
                            meshes.push(node._babylonMesh);
                        }
                        if (node._primitiveBabylonMeshes) {
                            for (var _a = 0, _b = node._primitiveBabylonMeshes; _a < _b.length; _a++) {
                                var babylonMesh = _b[_a];
                                meshes.push(babylonMesh);
                            }
                        }
                    }
                }
                return meshes;
            };
            GLTFLoader.prototype._getSkeletons = function () {
                var skeletons = new Array();
                var skins = this._gltf.skins;
                if (skins) {
                    for (var _i = 0, skins_1 = skins; _i < skins_1.length; _i++) {
                        var skin = skins_1[_i];
                        if (skin._babylonSkeleton) {
                            skeletons.push(skin._babylonSkeleton);
                        }
                    }
                }
                return skeletons;
            };
            GLTFLoader.prototype._getAnimationGroups = function () {
                var animationGroups = new Array();
                var animations = this._gltf.animations;
                if (animations) {
                    for (var _i = 0, animations_1 = animations; _i < animations_1.length; _i++) {
                        var animation = animations_1[_i];
                        if (animation._babylonAnimationGroup) {
                            animationGroups.push(animation._babylonAnimationGroup);
                        }
                    }
                }
                return animationGroups;
            };
            GLTFLoader.prototype._startAnimations = function () {
                switch (this.animationStartMode) {
                    case BABYLON.GLTFLoaderAnimationStartMode.NONE: {
                        // do nothing
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.FIRST: {
                        var babylonAnimationGroups = this._getAnimationGroups();
                        if (babylonAnimationGroups.length !== 0) {
                            babylonAnimationGroups[0].start(true);
                        }
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.ALL: {
                        var babylonAnimationGroups = this._getAnimationGroups();
                        for (var _i = 0, babylonAnimationGroups_1 = babylonAnimationGroups; _i < babylonAnimationGroups_1.length; _i++) {
                            var babylonAnimationGroup = babylonAnimationGroups_1[_i];
                            babylonAnimationGroup.start(true);
                        }
                        break;
                    }
                    default: {
                        BABYLON.Tools.Error("Invalid animation start mode (" + this.animationStartMode + ")");
                        return;
                    }
                }
            };
            /** @hidden */
            GLTFLoader.prototype._loadNodeAsync = function (context, node) {
                var promise = GLTF2.GLTFLoaderExtension._LoadNodeAsync(this, context, node);
                if (promise) {
                    return promise;
                }
                if (node._babylonMesh) {
                    throw new Error(context + ": Invalid recursive node hierarchy");
                }
                var promises = new Array();
                var babylonMesh = new BABYLON.Mesh(node.name || "node" + node._index, this._babylonScene, node._parent._babylonMesh);
                node._babylonMesh = babylonMesh;
                GLTFLoader._LoadTransform(node, babylonMesh);
                if (node.mesh != undefined) {
                    var mesh = GLTFLoader._GetProperty(context + "/mesh", this._gltf.meshes, node.mesh);
                    promises.push(this._loadMeshAsync("#/meshes/" + mesh._index, node, mesh, babylonMesh));
                }
                if (node.camera != undefined) {
                    var camera = GLTFLoader._GetProperty(context + "/camera", this._gltf.cameras, node.camera);
                    this._loadCamera("#/cameras/" + camera._index, camera, babylonMesh);
                }
                if (node.children) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var index = _a[_i];
                        var childNode = GLTFLoader._GetProperty(context + "/children/" + index, this._gltf.nodes, index);
                        promises.push(this._loadNodeAsync("#/nodes/" + index, childNode));
                    }
                }
                this.onMeshLoadedObservable.notifyObservers(babylonMesh);
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadMeshAsync = function (context, node, mesh, babylonMesh) {
                var _this = this;
                var promises = new Array();
                var primitives = mesh.primitives;
                if (!primitives || primitives.length === 0) {
                    throw new Error(context + ": Primitives are missing");
                }
                GLTF2._ArrayItem.Assign(primitives);
                if (primitives.length === 1) {
                    var primitive = primitives[0];
                    promises.push(this._loadPrimitiveAsync(context + "/primitives/" + primitive._index, node, mesh, primitive, babylonMesh));
                }
                else {
                    node._primitiveBabylonMeshes = [];
                    for (var _i = 0, primitives_1 = primitives; _i < primitives_1.length; _i++) {
                        var primitive = primitives_1[_i];
                        var primitiveBabylonMesh = new BABYLON.Mesh((mesh.name || babylonMesh.name) + "_" + primitive._index, this._babylonScene, babylonMesh);
                        node._primitiveBabylonMeshes.push(primitiveBabylonMesh);
                        promises.push(this._loadPrimitiveAsync(context + "/primitives/" + primitive._index, node, mesh, primitive, primitiveBabylonMesh));
                        this.onMeshLoadedObservable.notifyObservers(babylonMesh);
                    }
                }
                if (node.skin != undefined) {
                    var skin = GLTFLoader._GetProperty(context + "/skin", this._gltf.skins, node.skin);
                    promises.push(this._loadSkinAsync("#/skins/" + skin._index, node, mesh, skin));
                }
                return Promise.all(promises).then(function () {
                    _this._forEachPrimitive(node, function (babylonMesh) {
                        babylonMesh._refreshBoundingInfo(true);
                    });
                });
            };
            GLTFLoader.prototype._loadPrimitiveAsync = function (context, node, mesh, primitive, babylonMesh) {
                var _this = this;
                var promises = new Array();
                this._createMorphTargets(context, node, mesh, primitive, babylonMesh);
                promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh).then(function (babylonGeometry) {
                    return _this._loadMorphTargetsAsync(context, primitive, babylonMesh, babylonGeometry).then(function () {
                        babylonGeometry.applyToMesh(babylonMesh);
                    });
                }));
                var babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
                if (primitive.material == undefined) {
                    babylonMesh.material = this._getDefaultMaterial(babylonDrawMode);
                }
                else {
                    var material = GLTFLoader._GetProperty(context + "/material}", this._gltf.materials, primitive.material);
                    promises.push(this._loadMaterialAsync("#/materials/" + material._index, material, babylonMesh, babylonDrawMode, function (babylonMaterial) {
                        babylonMesh.material = babylonMaterial;
                    }));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
                var _this = this;
                var promise = GLTF2.GLTFLoaderExtension._LoadVertexDataAsync(this, context, primitive, babylonMesh);
                if (promise) {
                    return promise;
                }
                var attributes = primitive.attributes;
                if (!attributes) {
                    throw new Error(context + ": Attributes are missing");
                }
                var promises = new Array();
                var babylonGeometry = new BABYLON.Geometry(babylonMesh.name, this._babylonScene);
                if (primitive.indices == undefined) {
                    babylonMesh.isUnIndexed = true;
                }
                else {
                    var accessor = GLTFLoader._GetProperty(context + "/indices", this._gltf.accessors, primitive.indices);
                    promises.push(this._loadIndicesAccessorAsync("#/accessors/" + accessor._index, accessor).then(function (data) {
                        babylonGeometry.setIndices(data);
                    }));
                }
                var loadAttribute = function (attribute, kind, callback) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                    if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                        babylonMesh._delayInfo.push(kind);
                    }
                    var accessor = GLTFLoader._GetProperty(context + "/attributes/" + attribute, _this._gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadVertexAccessorAsync("#/accessors/" + accessor._index, accessor, kind).then(function (babylonVertexBuffer) {
                        babylonGeometry.setVerticesBuffer(babylonVertexBuffer, accessor.count);
                    }));
                    if (callback) {
                        callback(accessor);
                    }
                };
                loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind);
                loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind);
                loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind);
                loadAttribute("TEXCOORD_0", BABYLON.VertexBuffer.UVKind);
                loadAttribute("TEXCOORD_1", BABYLON.VertexBuffer.UV2Kind);
                loadAttribute("JOINTS_0", BABYLON.VertexBuffer.MatricesIndicesKind);
                loadAttribute("WEIGHTS_0", BABYLON.VertexBuffer.MatricesWeightsKind);
                loadAttribute("COLOR_0", BABYLON.VertexBuffer.ColorKind, function (accessor) {
                    if (accessor.type === "VEC4" /* VEC4 */) {
                        babylonMesh.hasVertexAlpha = true;
                    }
                });
                return Promise.all(promises).then(function () {
                    return babylonGeometry;
                });
            };
            GLTFLoader.prototype._createMorphTargets = function (context, node, mesh, primitive, babylonMesh) {
                if (!primitive.targets) {
                    return;
                }
                if (node._numMorphTargets == undefined) {
                    node._numMorphTargets = primitive.targets.length;
                }
                else if (primitive.targets.length !== node._numMorphTargets) {
                    throw new Error(context + ": Primitives do not have the same number of targets");
                }
                babylonMesh.morphTargetManager = new BABYLON.MorphTargetManager();
                for (var index = 0; index < primitive.targets.length; index++) {
                    var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                    babylonMesh.morphTargetManager.addTarget(new BABYLON.MorphTarget("morphTarget" + index, weight));
                    // TODO: tell the target whether it has positions, normals, tangents
                }
            };
            GLTFLoader.prototype._loadMorphTargetsAsync = function (context, primitive, babylonMesh, babylonGeometry) {
                if (!primitive.targets) {
                    return Promise.resolve();
                }
                var promises = new Array();
                var morphTargetManager = babylonMesh.morphTargetManager;
                for (var index = 0; index < morphTargetManager.numTargets; index++) {
                    var babylonMorphTarget = morphTargetManager.getTarget(index);
                    promises.push(this._loadMorphTargetVertexDataAsync(context + "/targets/" + index, babylonGeometry, primitive.targets[index], babylonMorphTarget));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadMorphTargetVertexDataAsync = function (context, babylonGeometry, attributes, babylonMorphTarget) {
                var _this = this;
                var promises = new Array();
                var loadAttribute = function (attribute, kind, setData) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    var babylonVertexBuffer = babylonGeometry.getVertexBuffer(kind);
                    if (!babylonVertexBuffer) {
                        return;
                    }
                    var accessor = GLTFLoader._GetProperty(context + "/" + attribute, _this._gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadFloatAccessorAsync("#/accessors/" + accessor._index, accessor).then(function (data) {
                        setData(babylonVertexBuffer, data);
                    }));
                };
                loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind, function (babylonVertexBuffer, data) {
                    babylonVertexBuffer.forEach(data.length, function (value, index) {
                        data[index] += value;
                    });
                    babylonMorphTarget.setPositions(data);
                });
                loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind, function (babylonVertexBuffer, data) {
                    babylonVertexBuffer.forEach(data.length, function (value, index) {
                        data[index] += value;
                    });
                    babylonMorphTarget.setNormals(data);
                });
                loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind, function (babylonVertexBuffer, data) {
                    var dataIndex = 0;
                    babylonVertexBuffer.forEach(data.length / 3 * 4, function (value, index) {
                        // Tangent data for morph targets is stored as xyz delta.
                        // The vertexData.tangent is stored as xyzw.
                        // So we need to skip every fourth vertexData.tangent.
                        if (((index + 1) % 4) !== 0) {
                            data[dataIndex++] += value;
                        }
                    });
                    babylonMorphTarget.setTangents(data);
                });
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader._LoadTransform = function (node, babylonNode) {
                var position = BABYLON.Vector3.Zero();
                var rotation = BABYLON.Quaternion.Identity();
                var scaling = BABYLON.Vector3.One();
                if (node.matrix) {
                    var matrix = BABYLON.Matrix.FromArray(node.matrix);
                    matrix.decompose(scaling, rotation, position);
                }
                else {
                    if (node.translation)
                        position = BABYLON.Vector3.FromArray(node.translation);
                    if (node.rotation)
                        rotation = BABYLON.Quaternion.FromArray(node.rotation);
                    if (node.scale)
                        scaling = BABYLON.Vector3.FromArray(node.scale);
                }
                babylonNode.position = position;
                babylonNode.rotationQuaternion = rotation;
                babylonNode.scaling = scaling;
            };
            GLTFLoader.prototype._loadSkinAsync = function (context, node, mesh, skin) {
                var _this = this;
                var assignSkeleton = function (skeleton) {
                    _this._forEachPrimitive(node, function (babylonMesh) {
                        babylonMesh.skeleton = skeleton;
                    });
                    // Ignore the TRS of skinned nodes.
                    // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                    node._babylonMesh.parent = _this._rootBabylonMesh;
                    node._babylonMesh.position = BABYLON.Vector3.Zero();
                    node._babylonMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
                    node._babylonMesh.scaling = BABYLON.Vector3.One();
                };
                if (skin._loaded) {
                    return skin._loaded.then(function () {
                        assignSkeleton(skin._babylonSkeleton);
                    });
                }
                var skeletonId = "skeleton" + skin._index;
                var babylonSkeleton = new BABYLON.Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
                skin._babylonSkeleton = babylonSkeleton;
                this._loadBones(context, skin);
                assignSkeleton(babylonSkeleton);
                return (skin._loaded = this._loadSkinInverseBindMatricesDataAsync(context, skin).then(function (inverseBindMatricesData) {
                    _this._updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
                }));
            };
            GLTFLoader.prototype._loadBones = function (context, skin) {
                var babylonBones = {};
                for (var _i = 0, _a = skin.joints; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var node = GLTFLoader._GetProperty(context + "/joints/" + index, this._gltf.nodes, index);
                    this._loadBone(node, skin, babylonBones);
                }
            };
            GLTFLoader.prototype._loadBone = function (node, skin, babylonBones) {
                var babylonBone = babylonBones[node._index];
                if (babylonBone) {
                    return babylonBone;
                }
                var babylonParentBone = null;
                if (node._parent._babylonMesh !== this._rootBabylonMesh) {
                    babylonParentBone = this._loadBone(node._parent, skin, babylonBones);
                }
                var boneIndex = skin.joints.indexOf(node._index);
                babylonBone = new BABYLON.Bone(node.name || "joint" + node._index, skin._babylonSkeleton, babylonParentBone, this._getNodeMatrix(node), null, null, boneIndex);
                babylonBones[node._index] = babylonBone;
                node._babylonBones = node._babylonBones || [];
                node._babylonBones.push(babylonBone);
                return babylonBone;
            };
            GLTFLoader.prototype._loadSkinInverseBindMatricesDataAsync = function (context, skin) {
                if (skin.inverseBindMatrices == undefined) {
                    return Promise.resolve(null);
                }
                var accessor = GLTFLoader._GetProperty(context + "/inverseBindMatrices", this._gltf.accessors, skin.inverseBindMatrices);
                return this._loadFloatAccessorAsync("#/accessors/" + accessor._index, accessor);
            };
            GLTFLoader.prototype._updateBoneMatrices = function (babylonSkeleton, inverseBindMatricesData) {
                for (var _i = 0, _a = babylonSkeleton.bones; _i < _a.length; _i++) {
                    var babylonBone = _a[_i];
                    var baseMatrix = BABYLON.Matrix.Identity();
                    var boneIndex = babylonBone._index;
                    if (inverseBindMatricesData && boneIndex !== -1) {
                        BABYLON.Matrix.FromArrayToRef(inverseBindMatricesData, boneIndex * 16, baseMatrix);
                        baseMatrix.invertToRef(baseMatrix);
                    }
                    var babylonParentBone = babylonBone.getParent();
                    if (babylonParentBone) {
                        baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
                    }
                    babylonBone.updateMatrix(baseMatrix, false, false);
                    babylonBone._updateDifferenceMatrix(undefined, false);
                }
            };
            GLTFLoader.prototype._getNodeMatrix = function (node) {
                return node.matrix ?
                    BABYLON.Matrix.FromArray(node.matrix) :
                    BABYLON.Matrix.Compose(node.scale ? BABYLON.Vector3.FromArray(node.scale) : BABYLON.Vector3.One(), node.rotation ? BABYLON.Quaternion.FromArray(node.rotation) : BABYLON.Quaternion.Identity(), node.translation ? BABYLON.Vector3.FromArray(node.translation) : BABYLON.Vector3.Zero());
            };
            GLTFLoader.prototype._loadCamera = function (context, camera, babylonMesh) {
                var babylonCamera = new BABYLON.FreeCamera(camera.name || "camera" + camera._index, BABYLON.Vector3.Zero(), this._babylonScene, false);
                babylonCamera.parent = babylonMesh;
                babylonCamera.rotation = new BABYLON.Vector3(0, Math.PI, 0);
                switch (camera.type) {
                    case "perspective" /* PERSPECTIVE */: {
                        var perspective = camera.perspective;
                        if (!perspective) {
                            throw new Error(context + ": Camera perspective properties are missing");
                        }
                        babylonCamera.fov = perspective.yfov;
                        babylonCamera.minZ = perspective.znear;
                        babylonCamera.maxZ = perspective.zfar || Number.MAX_VALUE;
                        break;
                    }
                    case "orthographic" /* ORTHOGRAPHIC */: {
                        if (!camera.orthographic) {
                            throw new Error(context + ": Camera orthographic properties are missing");
                        }
                        babylonCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        babylonCamera.orthoLeft = -camera.orthographic.xmag;
                        babylonCamera.orthoRight = camera.orthographic.xmag;
                        babylonCamera.orthoBottom = -camera.orthographic.ymag;
                        babylonCamera.orthoTop = camera.orthographic.ymag;
                        babylonCamera.minZ = camera.orthographic.znear;
                        babylonCamera.maxZ = camera.orthographic.zfar;
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid camera type (" + camera.type + ")");
                    }
                }
                this.onCameraLoadedObservable.notifyObservers(babylonCamera);
            };
            GLTFLoader.prototype._loadAnimationsAsync = function () {
                var animations = this._gltf.animations;
                if (!animations) {
                    return Promise.resolve();
                }
                var promises = new Array();
                for (var index = 0; index < animations.length; index++) {
                    var animation = animations[index];
                    promises.push(this._loadAnimationAsync("#/animations/" + index, animation));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadAnimationAsync = function (context, animation) {
                var _this = this;
                var babylonAnimationGroup = new BABYLON.AnimationGroup(animation.name || "animation" + animation._index, this._babylonScene);
                animation._babylonAnimationGroup = babylonAnimationGroup;
                var promises = new Array();
                GLTF2._ArrayItem.Assign(animation.channels);
                GLTF2._ArrayItem.Assign(animation.samplers);
                for (var _i = 0, _a = animation.channels; _i < _a.length; _i++) {
                    var channel = _a[_i];
                    promises.push(this._loadAnimationChannelAsync(context + "/channels/" + channel._index, context, animation, channel, babylonAnimationGroup));
                }
                return Promise.all(promises).then(function () {
                    babylonAnimationGroup.normalize(_this._normalizeAnimationGroupsToBeginAtZero ? 0 : null);
                });
            };
            GLTFLoader.prototype._loadAnimationChannelAsync = function (context, animationContext, animation, channel, babylonAnimationGroup) {
                var _this = this;
                var targetNode = GLTFLoader._GetProperty(context + "/target/node", this._gltf.nodes, channel.target.node);
                // Ignore animations that have no animation targets.
                if ((channel.target.path === "weights" /* WEIGHTS */ && !targetNode._numMorphTargets) ||
                    (channel.target.path !== "weights" /* WEIGHTS */ && !targetNode._babylonMesh)) {
                    return Promise.resolve();
                }
                // Ignore animations targeting TRS of skinned nodes.
                // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                if (targetNode.skin != undefined && channel.target.path !== "weights" /* WEIGHTS */) {
                    return Promise.resolve();
                }
                var sampler = GLTFLoader._GetProperty(context + "/sampler", animation.samplers, channel.sampler);
                return this._loadAnimationSamplerAsync(animationContext + "/samplers/" + channel.sampler, sampler).then(function (data) {
                    var targetPath;
                    var animationType;
                    switch (channel.target.path) {
                        case "translation" /* TRANSLATION */: {
                            targetPath = "position";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                            break;
                        }
                        case "rotation" /* ROTATION */: {
                            targetPath = "rotationQuaternion";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            break;
                        }
                        case "scale" /* SCALE */: {
                            targetPath = "scaling";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                            break;
                        }
                        case "weights" /* WEIGHTS */: {
                            targetPath = "influence";
                            animationType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                            break;
                        }
                        default: {
                            throw new Error(context + ": Invalid target path (" + channel.target.path + ")");
                        }
                    }
                    var outputBufferOffset = 0;
                    var getNextOutputValue;
                    switch (targetPath) {
                        case "position": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "rotationQuaternion": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Quaternion.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 4;
                                return value;
                            };
                            break;
                        }
                        case "scaling": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(data.output, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "influence": {
                            getNextOutputValue = function () {
                                var value = new Array(targetNode._numMorphTargets);
                                for (var i = 0; i < targetNode._numMorphTargets; i++) {
                                    value[i] = data.output[outputBufferOffset++];
                                }
                                return value;
                            };
                            break;
                        }
                    }
                    var getNextKey;
                    switch (data.interpolation) {
                        case "STEP" /* STEP */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                value: getNextOutputValue(),
                                interpolation: BABYLON.AnimationKeyInterpolation.STEP
                            }); };
                            break;
                        }
                        case "LINEAR" /* LINEAR */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                value: getNextOutputValue()
                            }); };
                            break;
                        }
                        case "CUBICSPLINE" /* CUBICSPLINE */: {
                            getNextKey = function (frameIndex) { return ({
                                frame: data.input[frameIndex],
                                inTangent: getNextOutputValue(),
                                value: getNextOutputValue(),
                                outTangent: getNextOutputValue()
                            }); };
                            break;
                        }
                    }
                    var keys = new Array(data.input.length);
                    for (var frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                        keys[frameIndex] = getNextKey(frameIndex);
                    }
                    if (targetPath === "influence") {
                        var _loop_1 = function (targetIndex) {
                            var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                            var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                            babylonAnimation.setKeys(keys.map(function (key) { return ({
                                frame: key.frame,
                                inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                                value: key.value[targetIndex],
                                outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                            }); }));
                            _this._forEachPrimitive(targetNode, function (babylonMesh) {
                                var morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                                var babylonAnimationClone = babylonAnimation.clone();
                                morphTarget.animations.push(babylonAnimationClone);
                                babylonAnimationGroup.addTargetedAnimation(babylonAnimationClone, morphTarget);
                            });
                        };
                        for (var targetIndex = 0; targetIndex < targetNode._numMorphTargets; targetIndex++) {
                            _loop_1(targetIndex);
                        }
                    }
                    else {
                        var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                        var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys);
                        if (targetNode._babylonBones) {
                            var babylonAnimationTargets = [targetNode._babylonMesh].concat(targetNode._babylonBones);
                            for (var _i = 0, babylonAnimationTargets_1 = babylonAnimationTargets; _i < babylonAnimationTargets_1.length; _i++) {
                                var babylonAnimationTarget = babylonAnimationTargets_1[_i];
                                babylonAnimationTarget.animations.push(babylonAnimation);
                            }
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimation, babylonAnimationTargets);
                        }
                        else {
                            targetNode._babylonMesh.animations.push(babylonAnimation);
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimation, targetNode._babylonMesh);
                        }
                    }
                });
            };
            GLTFLoader.prototype._loadAnimationSamplerAsync = function (context, sampler) {
                if (sampler._data) {
                    return sampler._data;
                }
                var interpolation = sampler.interpolation || "LINEAR" /* LINEAR */;
                switch (interpolation) {
                    case "STEP" /* STEP */:
                    case "LINEAR" /* LINEAR */:
                    case "CUBICSPLINE" /* CUBICSPLINE */: {
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid interpolation (" + sampler.interpolation + ")");
                    }
                }
                var inputAccessor = GLTFLoader._GetProperty(context + "/input", this._gltf.accessors, sampler.input);
                var outputAccessor = GLTFLoader._GetProperty(context + "/output", this._gltf.accessors, sampler.output);
                sampler._data = Promise.all([
                    this._loadFloatAccessorAsync("#/accessors/" + inputAccessor._index, inputAccessor),
                    this._loadFloatAccessorAsync("#/accessors/" + outputAccessor._index, outputAccessor)
                ]).then(function (_a) {
                    var inputData = _a[0], outputData = _a[1];
                    return {
                        input: inputData,
                        interpolation: interpolation,
                        output: outputData,
                    };
                });
                return sampler._data;
            };
            GLTFLoader.prototype._loadBufferAsync = function (context, buffer) {
                if (buffer._data) {
                    return buffer._data;
                }
                if (!buffer.uri) {
                    throw new Error(context + ": Uri is missing");
                }
                buffer._data = this._loadUriAsync(context, buffer.uri);
                return buffer._data;
            };
            /** @hidden */
            GLTFLoader.prototype._loadBufferViewAsync = function (context, bufferView) {
                if (bufferView._data) {
                    return bufferView._data;
                }
                var buffer = GLTFLoader._GetProperty(context + "/buffer", this._gltf.buffers, bufferView.buffer);
                bufferView._data = this._loadBufferAsync("#/buffers/" + buffer._index, buffer).then(function (data) {
                    try {
                        return new Uint8Array(data.buffer, data.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                    }
                    catch (e) {
                        throw new Error(context + ": " + e.message);
                    }
                });
                return bufferView._data;
            };
            GLTFLoader.prototype._loadIndicesAccessorAsync = function (context, accessor) {
                if (accessor.type !== "SCALAR" /* SCALAR */) {
                    throw new Error(context + ": Invalid type " + accessor.type);
                }
                if (accessor.componentType !== 5121 /* UNSIGNED_BYTE */ &&
                    accessor.componentType !== 5123 /* UNSIGNED_SHORT */ &&
                    accessor.componentType !== 5125 /* UNSIGNED_INT */) {
                    throw new Error(context + ": Invalid component type " + accessor.componentType);
                }
                if (accessor._data) {
                    return accessor._data;
                }
                var bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                accessor._data = this._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(function (data) {
                    return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, accessor.count);
                });
                return accessor._data;
            };
            GLTFLoader.prototype._loadFloatAccessorAsync = function (context, accessor) {
                // TODO: support normalized and stride
                var _this = this;
                if (accessor.componentType !== 5126 /* FLOAT */) {
                    throw new Error("Invalid component type " + accessor.componentType);
                }
                if (accessor._data) {
                    return accessor._data;
                }
                var numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
                var length = numComponents * accessor.count;
                if (accessor.bufferView == undefined) {
                    accessor._data = Promise.resolve(new Float32Array(length));
                }
                else {
                    var bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                    accessor._data = this._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(function (data) {
                        return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, length);
                    });
                }
                if (accessor.sparse) {
                    var sparse_1 = accessor.sparse;
                    accessor._data = accessor._data.then(function (data) {
                        var indicesBufferView = GLTFLoader._GetProperty(context + "/sparse/indices/bufferView", _this._gltf.bufferViews, sparse_1.indices.bufferView);
                        var valuesBufferView = GLTFLoader._GetProperty(context + "/sparse/values/bufferView", _this._gltf.bufferViews, sparse_1.values.bufferView);
                        return Promise.all([
                            _this._loadBufferViewAsync("#/bufferViews/" + indicesBufferView._index, indicesBufferView),
                            _this._loadBufferViewAsync("#/bufferViews/" + valuesBufferView._index, valuesBufferView)
                        ]).then(function (_a) {
                            var indicesData = _a[0], valuesData = _a[1];
                            var indices = GLTFLoader._GetTypedArray(context + "/sparse/indices", sparse_1.indices.componentType, indicesData, sparse_1.indices.byteOffset, sparse_1.count);
                            var values = GLTFLoader._GetTypedArray(context + "/sparse/values", accessor.componentType, valuesData, sparse_1.values.byteOffset, numComponents * sparse_1.count);
                            var valuesIndex = 0;
                            for (var indicesIndex = 0; indicesIndex < indices.length; indicesIndex++) {
                                var dataIndex = indices[indicesIndex] * numComponents;
                                for (var componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                                    data[dataIndex++] = values[valuesIndex++];
                                }
                            }
                            return data;
                        });
                    });
                }
                return accessor._data;
            };
            /** @hidden */
            GLTFLoader.prototype._loadVertexBufferViewAsync = function (context, bufferView, kind) {
                var _this = this;
                if (bufferView._babylonBuffer) {
                    return bufferView._babylonBuffer;
                }
                bufferView._babylonBuffer = this._loadBufferViewAsync(context, bufferView).then(function (data) {
                    return new BABYLON.Buffer(_this._babylonScene.getEngine(), data, false);
                });
                return bufferView._babylonBuffer;
            };
            GLTFLoader.prototype._loadVertexAccessorAsync = function (context, accessor, kind) {
                var _this = this;
                if (accessor._babylonVertexBuffer) {
                    return accessor._babylonVertexBuffer;
                }
                if (accessor.sparse) {
                    accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(context, accessor).then(function (data) {
                        return new BABYLON.VertexBuffer(_this._babylonScene.getEngine(), data, kind, false);
                    });
                }
                else {
                    var bufferView_1 = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                    accessor._babylonVertexBuffer = this._loadVertexBufferViewAsync("#/bufferViews/" + bufferView_1._index, bufferView_1, kind).then(function (buffer) {
                        var size = GLTFLoader._GetNumComponents(context, accessor.type);
                        return new BABYLON.VertexBuffer(_this._babylonScene.getEngine(), buffer, kind, false, false, bufferView_1.byteStride, false, accessor.byteOffset, size, accessor.componentType, accessor.normalized, true);
                    });
                }
                return accessor._babylonVertexBuffer;
            };
            GLTFLoader.prototype._getDefaultMaterial = function (drawMode) {
                var babylonMaterial = this._defaultBabylonMaterials[drawMode];
                if (!babylonMaterial) {
                    babylonMaterial = this._createMaterial("__gltf_default", drawMode);
                    babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                    babylonMaterial.metallic = 1;
                    babylonMaterial.roughness = 1;
                    this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                }
                return babylonMaterial;
            };
            GLTFLoader.prototype._loadMaterialMetallicRoughnessPropertiesAsync = function (context, material, babylonMaterial) {
                var promises = new Array();
                // Ensure metallic workflow
                babylonMaterial.metallic = 1;
                babylonMaterial.roughness = 1;
                var properties = material.pbrMetallicRoughness;
                if (properties) {
                    if (properties.baseColorFactor) {
                        babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.baseColorFactor);
                        babylonMaterial.alpha = properties.baseColorFactor[3];
                    }
                    else {
                        babylonMaterial.albedoColor = BABYLON.Color3.White();
                    }
                    babylonMaterial.metallic = properties.metallicFactor == undefined ? 1 : properties.metallicFactor;
                    babylonMaterial.roughness = properties.roughnessFactor == undefined ? 1 : properties.roughnessFactor;
                    if (properties.baseColorTexture) {
                        promises.push(this._loadTextureAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                            babylonMaterial.albedoTexture = texture;
                        }));
                    }
                    if (properties.metallicRoughnessTexture) {
                        promises.push(this._loadTextureAsync(context + "/metallicRoughnessTexture", properties.metallicRoughnessTexture, function (texture) {
                            babylonMaterial.metallicTexture = texture;
                        }));
                        babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                        babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                        babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                    }
                }
                this._loadMaterialAlphaProperties(context, material, babylonMaterial);
                return Promise.all(promises).then(function () { });
            };
            /** @hidden */
            GLTFLoader.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                var promise = GLTF2.GLTFLoaderExtension._LoadMaterialAsync(this, context, material, babylonMesh, babylonDrawMode, assign);
                if (promise) {
                    return promise;
                }
                material._babylonData = material._babylonData || {};
                var babylonData = material._babylonData[babylonDrawMode];
                if (!babylonData) {
                    var promises = new Array();
                    var name_3 = material.name || "materialSG_" + material._index;
                    var babylonMaterial = this._createMaterial(name_3, babylonDrawMode);
                    promises.push(this._loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                    promises.push(this._loadMaterialMetallicRoughnessPropertiesAsync(context, material, babylonMaterial));
                    this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                    babylonData = {
                        material: babylonMaterial,
                        meshes: [],
                        loaded: Promise.all(promises).then(function () { })
                    };
                    material._babylonData[babylonDrawMode] = babylonData;
                }
                babylonData.meshes.push(babylonMesh);
                assign(babylonData.material);
                return babylonData.loaded;
            };
            /** @hidden */
            GLTFLoader.prototype._createMaterial = function (name, drawMode) {
                var babylonMaterial = new BABYLON.PBRMaterial(name, this._babylonScene);
                babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? BABYLON.Material.CounterClockWiseSideOrientation : BABYLON.Material.ClockWiseSideOrientation;
                babylonMaterial.fillMode = drawMode;
                babylonMaterial.enableSpecularAntiAliasing = true;
                babylonMaterial.useRadianceOverAlpha = !this.transparencyAsCoverage;
                babylonMaterial.useSpecularOverAlpha = !this.transparencyAsCoverage;
                return babylonMaterial;
            };
            /** @hidden */
            GLTFLoader.prototype._loadMaterialBasePropertiesAsync = function (context, material, babylonMaterial) {
                var promises = new Array();
                babylonMaterial.emissiveColor = material.emissiveFactor ? BABYLON.Color3.FromArray(material.emissiveFactor) : new BABYLON.Color3(0, 0, 0);
                if (material.doubleSided) {
                    babylonMaterial.backFaceCulling = false;
                    babylonMaterial.twoSidedLighting = true;
                }
                if (material.normalTexture) {
                    promises.push(this._loadTextureAsync(context + "/normalTexture", material.normalTexture, function (texture) {
                        babylonMaterial.bumpTexture = texture;
                    }));
                    babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                    babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                    if (material.normalTexture.scale != undefined) {
                        babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                    }
                }
                if (material.occlusionTexture) {
                    promises.push(this._loadTextureAsync(context + "/occlusionTexture", material.occlusionTexture, function (texture) {
                        babylonMaterial.ambientTexture = texture;
                    }));
                    babylonMaterial.useAmbientInGrayScale = true;
                    if (material.occlusionTexture.strength != undefined) {
                        babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                    }
                }
                if (material.emissiveTexture) {
                    promises.push(this._loadTextureAsync(context + "/emissiveTexture", material.emissiveTexture, function (texture) {
                        babylonMaterial.emissiveTexture = texture;
                    }));
                }
                return Promise.all(promises).then(function () { });
            };
            /** @hidden */
            GLTFLoader.prototype._loadMaterialAlphaProperties = function (context, material, babylonMaterial) {
                var alphaMode = material.alphaMode || "OPAQUE" /* OPAQUE */;
                switch (alphaMode) {
                    case "OPAQUE" /* OPAQUE */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                        break;
                    }
                    case "MASK" /* MASK */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
                        babylonMaterial.alphaCutOff = (material.alphaCutoff == undefined ? 0.5 : material.alphaCutoff);
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                        }
                        break;
                    }
                    case "BLEND" /* BLEND */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                            babylonMaterial.useAlphaFromAlbedoTexture = true;
                        }
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid alpha mode (" + material.alphaMode + ")");
                    }
                }
            };
            /** @hidden */
            GLTFLoader.prototype._loadTextureAsync = function (context, textureInfo, assign) {
                var _this = this;
                var texture = GLTFLoader._GetProperty(context + "/index", this._gltf.textures, textureInfo.index);
                context = "#/textures/" + textureInfo.index;
                var promises = new Array();
                var sampler = (texture.sampler == undefined ? this._defaultSampler : GLTFLoader._GetProperty(context + "/sampler", this._gltf.samplers, texture.sampler));
                var samplerData = this._loadSampler("#/samplers/" + sampler._index, sampler);
                var deferred = new BABYLON.Deferred();
                var babylonTexture = new BABYLON.Texture(null, this._babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, function () {
                    if (!_this._disposed) {
                        deferred.resolve();
                    }
                }, function (message, exception) {
                    if (!_this._disposed) {
                        deferred.reject(new Error(context + ": " + ((exception && exception.message) ? exception.message : message || "Failed to load texture")));
                    }
                });
                promises.push(deferred.promise);
                babylonTexture.name = texture.name || "texture" + texture._index;
                babylonTexture.wrapU = samplerData.wrapU;
                babylonTexture.wrapV = samplerData.wrapV;
                babylonTexture.coordinatesIndex = textureInfo.texCoord || 0;
                var image = GLTFLoader._GetProperty(context + "/source", this._gltf.images, texture.source);
                promises.push(this._loadImageAsync("#/images/" + image._index, image).then(function (objectURL) {
                    babylonTexture.updateURL(objectURL);
                }));
                assign(babylonTexture);
                this.onTextureLoadedObservable.notifyObservers(babylonTexture);
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadSampler = function (context, sampler) {
                if (!sampler._data) {
                    sampler._data = {
                        noMipMaps: (sampler.minFilter === 9728 /* NEAREST */ || sampler.minFilter === 9729 /* LINEAR */),
                        samplingMode: GLTFLoader._GetTextureSamplingMode(context, sampler.magFilter, sampler.minFilter),
                        wrapU: GLTFLoader._GetTextureWrapMode(context, sampler.wrapS),
                        wrapV: GLTFLoader._GetTextureWrapMode(context, sampler.wrapT)
                    };
                }
                ;
                return sampler._data;
            };
            GLTFLoader.prototype._loadImageAsync = function (context, image) {
                if (image._objectURL) {
                    return image._objectURL;
                }
                var promise;
                if (image.uri) {
                    promise = this._loadUriAsync(context, image.uri);
                }
                else {
                    var bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, image.bufferView);
                    promise = this._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView);
                }
                image._objectURL = promise.then(function (data) {
                    return URL.createObjectURL(new Blob([data], { type: image.mimeType }));
                });
                return image._objectURL;
            };
            /** @hidden */
            GLTFLoader.prototype._loadUriAsync = function (context, uri) {
                var _this = this;
                var promise = GLTF2.GLTFLoaderExtension._LoadUriAsync(this, context, uri);
                if (promise) {
                    return promise;
                }
                if (!GLTFLoader._ValidateUri(uri)) {
                    throw new Error(context + ": Uri '" + uri + "' is invalid");
                }
                if (BABYLON.Tools.IsBase64(uri)) {
                    return Promise.resolve(new Uint8Array(BABYLON.Tools.DecodeBase64(uri)));
                }
                return this.preprocessUrlAsync(this._rootUrl + uri).then(function (url) {
                    return new Promise(function (resolve, reject) {
                        if (!_this._disposed) {
                            var request_1 = BABYLON.Tools.LoadFile(url, function (data) {
                                if (!_this._disposed) {
                                    resolve(new Uint8Array(data));
                                }
                            }, function (event) {
                                if (!_this._disposed) {
                                    try {
                                        if (request_1 && _this._state === BABYLON.GLTFLoaderState.LOADING) {
                                            request_1._lengthComputable = event.lengthComputable;
                                            request_1._loaded = event.loaded;
                                            request_1._total = event.total;
                                            _this._onProgress();
                                        }
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                }
                            }, _this._babylonScene.database, true, function (request, exception) {
                                if (!_this._disposed) {
                                    reject(new BABYLON.LoadFileError(context + ": Failed to load '" + uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""), request));
                                }
                            });
                            _this._requests.push(request_1);
                        }
                    });
                });
            };
            GLTFLoader.prototype._onProgress = function () {
                if (!this._progressCallback) {
                    return;
                }
                var lengthComputable = true;
                var loaded = 0;
                var total = 0;
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    if (request._lengthComputable === undefined || request._loaded === undefined || request._total === undefined) {
                        return;
                    }
                    lengthComputable = lengthComputable && request._lengthComputable;
                    loaded += request._loaded;
                    total += request._total;
                }
                this._progressCallback(new BABYLON.SceneLoaderProgressEvent(lengthComputable, loaded, lengthComputable ? total : 0));
            };
            /** @hidden */
            GLTFLoader._GetProperty = function (context, array, index) {
                if (!array || index == undefined || !array[index]) {
                    throw new Error(context + ": Failed to find index (" + index + ")");
                }
                return array[index];
            };
            GLTFLoader._GetTextureWrapMode = function (context, mode) {
                // Set defaults if undefined
                mode = mode == undefined ? 10497 /* REPEAT */ : mode;
                switch (mode) {
                    case 33071 /* CLAMP_TO_EDGE */: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case 33648 /* MIRRORED_REPEAT */: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case 10497 /* REPEAT */: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default:
                        BABYLON.Tools.Warn(context + ": Invalid texture wrap mode (" + mode + ")");
                        return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            GLTFLoader._GetTextureSamplingMode = function (context, magFilter, minFilter) {
                // Set defaults if undefined
                magFilter = magFilter == undefined ? 9729 /* LINEAR */ : magFilter;
                minFilter = minFilter == undefined ? 9987 /* LINEAR_MIPMAP_LINEAR */ : minFilter;
                if (magFilter === 9729 /* LINEAR */) {
                    switch (minFilter) {
                        case 9728 /* NEAREST */: return BABYLON.Texture.LINEAR_NEAREST;
                        case 9729 /* LINEAR */: return BABYLON.Texture.LINEAR_LINEAR;
                        case 9984 /* NEAREST_MIPMAP_NEAREST */: return BABYLON.Texture.LINEAR_NEAREST_MIPNEAREST;
                        case 9985 /* LINEAR_MIPMAP_NEAREST */: return BABYLON.Texture.LINEAR_LINEAR_MIPNEAREST;
                        case 9986 /* NEAREST_MIPMAP_LINEAR */: return BABYLON.Texture.LINEAR_NEAREST_MIPLINEAR;
                        case 9987 /* LINEAR_MIPMAP_LINEAR */: return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn(context + ": Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                    }
                }
                else {
                    if (magFilter !== 9728 /* NEAREST */) {
                        BABYLON.Tools.Warn(context + ": Invalid texture magnification filter (" + magFilter + ")");
                    }
                    switch (minFilter) {
                        case 9728 /* NEAREST */: return BABYLON.Texture.NEAREST_NEAREST;
                        case 9729 /* LINEAR */: return BABYLON.Texture.NEAREST_LINEAR;
                        case 9984 /* NEAREST_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                        case 9985 /* LINEAR_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_LINEAR_MIPNEAREST;
                        case 9986 /* NEAREST_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_NEAREST_MIPLINEAR;
                        case 9987 /* LINEAR_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn(context + ": Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                    }
                }
            };
            GLTFLoader._GetTypedArray = function (context, componentType, bufferView, byteOffset, length) {
                var buffer = bufferView.buffer;
                byteOffset = bufferView.byteOffset + (byteOffset || 0);
                try {
                    switch (componentType) {
                        case 5120 /* BYTE */: return new Int8Array(buffer, byteOffset, length);
                        case 5121 /* UNSIGNED_BYTE */: return new Uint8Array(buffer, byteOffset, length);
                        case 5122 /* SHORT */: return new Int16Array(buffer, byteOffset, length);
                        case 5123 /* UNSIGNED_SHORT */: return new Uint16Array(buffer, byteOffset, length);
                        case 5125 /* UNSIGNED_INT */: return new Uint32Array(buffer, byteOffset, length);
                        case 5126 /* FLOAT */: return new Float32Array(buffer, byteOffset, length);
                        default: throw new Error("Invalid component type " + componentType);
                    }
                }
                catch (e) {
                    throw new Error(context + ": " + e);
                }
            };
            GLTFLoader._GetNumComponents = function (context, type) {
                switch (type) {
                    case "SCALAR": return 1;
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                }
                throw new Error(context + ": Invalid type (" + type + ")");
            };
            GLTFLoader._ValidateUri = function (uri) {
                return (BABYLON.Tools.IsBase64(uri) || uri.indexOf("..") === -1);
            };
            GLTFLoader._GetDrawMode = function (context, mode) {
                if (mode == undefined) {
                    mode = 4 /* TRIANGLES */;
                }
                switch (mode) {
                    case 0 /* POINTS */: return BABYLON.Material.PointListDrawMode;
                    case 1 /* LINES */: return BABYLON.Material.LineListDrawMode;
                    case 2 /* LINE_LOOP */: return BABYLON.Material.LineLoopDrawMode;
                    case 3 /* LINE_STRIP */: return BABYLON.Material.LineStripDrawMode;
                    case 4 /* TRIANGLES */: return BABYLON.Material.TriangleFillMode;
                    case 5 /* TRIANGLE_STRIP */: return BABYLON.Material.TriangleStripDrawMode;
                    case 6 /* TRIANGLE_FAN */: return BABYLON.Material.TriangleFanDrawMode;
                }
                throw new Error(context + ": Invalid mesh primitive mode (" + mode + ")");
            };
            GLTFLoader.prototype._compileMaterialsAsync = function () {
                var promises = new Array();
                if (this._gltf.materials) {
                    for (var _i = 0, _a = this._gltf.materials; _i < _a.length; _i++) {
                        var material = _a[_i];
                        if (material._babylonData) {
                            for (var babylonDrawMode in material._babylonData) {
                                var babylonData = material._babylonData[babylonDrawMode];
                                for (var _b = 0, _c = babylonData.meshes; _b < _c.length; _b++) {
                                    var babylonMesh = _c[_b];
                                    // Ensure nonUniformScaling is set if necessary.
                                    babylonMesh.computeWorldMatrix(true);
                                    var babylonMaterial = babylonData.material;
                                    promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                                    if (this.useClipPlane) {
                                        promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
                                    }
                                }
                            }
                        }
                    }
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._compileShadowGeneratorsAsync = function () {
                var promises = new Array();
                var lights = this._babylonScene.lights;
                for (var _i = 0, lights_1 = lights; _i < lights_1.length; _i++) {
                    var light = lights_1[_i];
                    var generator = light.getShadowGenerator();
                    if (generator) {
                        promises.push(generator.forceCompilationAsync());
                    }
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._clear = function () {
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    request.abort();
                }
                this._requests.length = 0;
                if (this._gltf && this._gltf.images) {
                    for (var _b = 0, _c = this._gltf.images; _b < _c.length; _b++) {
                        var image = _c[_b];
                        if (image._objectURL) {
                            image._objectURL.then(function (value) {
                                URL.revokeObjectURL(value);
                            });
                            image._objectURL = undefined;
                        }
                    }
                }
                delete this._gltf;
                delete this._babylonScene;
                this._completePromises.length = 0;
                for (var name_4 in this._extensions) {
                    this._extensions[name_4].dispose();
                }
                this._extensions = {};
                delete this._rootBabylonMesh;
                delete this._progressCallback;
                this.onMeshLoadedObservable.clear();
                this.onTextureLoadedObservable.clear();
                this.onMaterialLoadedObservable.clear();
                this.onCameraLoadedObservable.clear();
            };
            /** @hidden */
            GLTFLoader.prototype._applyExtensions = function (actionAsync) {
                for (var _i = 0, _a = GLTFLoader._ExtensionNames; _i < _a.length; _i++) {
                    var name_5 = _a[_i];
                    var extension = this._extensions[name_5];
                    if (extension.enabled) {
                        var promise = actionAsync(extension);
                        if (promise) {
                            return promise;
                        }
                    }
                }
                return null;
            };
            GLTFLoader._ExtensionNames = new Array();
            GLTFLoader._ExtensionFactories = {};
            return GLTFLoader;
        }());
        GLTF2.GLTFLoader = GLTFLoader;
        BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = function () { return new GLTFLoader(); };
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Abstract class that can be implemented to extend existing glTF loader behavior.
         */
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension(loader) {
                this.enabled = true;
                this._loader = loader;
            }
            GLTFLoaderExtension.prototype.dispose = function () {
                delete this._loader;
            };
            // #region Overridable Methods
            /** Override this method to modify the default behavior for loading scenes. */
            GLTFLoaderExtension.prototype._loadSceneAsync = function (context, node) { return null; };
            /** Override this method to modify the default behavior for loading nodes. */
            GLTFLoaderExtension.prototype._loadNodeAsync = function (context, node) { return null; };
            /** Override this method to modify the default behavior for loading mesh primitive vertex data. */
            GLTFLoaderExtension.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) { return null; };
            /** Override this method to modify the default behavior for loading materials. */
            GLTFLoaderExtension.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) { return null; };
            /** Override this method to modify the default behavior for loading uris. */
            GLTFLoaderExtension.prototype._loadUriAsync = function (context, uri) { return null; };
            // #endregion
            /** Helper method called by a loader extension to load an glTF extension. */
            GLTFLoaderExtension.prototype._loadExtensionAsync = function (context, property, actionAsync) {
                if (!property.extensions) {
                    return null;
                }
                var extensions = property.extensions;
                var extension = extensions[this.name];
                if (!extension) {
                    return null;
                }
                // Clear out the extension before executing the action to avoid recursing into the same property.
                delete extensions[this.name];
                try {
                    return actionAsync(context + "/extensions/" + this.name, extension);
                }
                finally {
                    // Restore the extension after executing the action.
                    extensions[this.name] = extension;
                }
            };
            /** Helper method called by the loader to allow extensions to override loading scenes. */
            GLTFLoaderExtension._LoadSceneAsync = function (loader, context, scene) {
                return loader._applyExtensions(function (extension) { return extension._loadSceneAsync(context, scene); });
            };
            /** Helper method called by the loader to allow extensions to override loading nodes. */
            GLTFLoaderExtension._LoadNodeAsync = function (loader, context, node) {
                return loader._applyExtensions(function (extension) { return extension._loadNodeAsync(context, node); });
            };
            /** Helper method called by the loader to allow extensions to override loading mesh primitive vertex data. */
            GLTFLoaderExtension._LoadVertexDataAsync = function (loader, context, primitive, babylonMesh) {
                return loader._applyExtensions(function (extension) { return extension._loadVertexDataAsync(context, primitive, babylonMesh); });
            };
            /** Helper method called by the loader to allow extensions to override loading materials. */
            GLTFLoaderExtension._LoadMaterialAsync = function (loader, context, material, babylonMesh, babylonDrawMode, assign) {
                return loader._applyExtensions(function (extension) { return extension._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign); });
            };
            /** Helper method called by the loader to allow extensions to override loading uris. */
            GLTFLoaderExtension._LoadUriAsync = function (loader, context, uri) {
                return loader._applyExtensions(function (extension) { return extension._loadUriAsync(context, uri); });
            };
            return GLTFLoaderExtension;
        }());
        GLTF2.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "MSFT_lod";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod)
             */
            var MSFT_lod = /** @class */ (function (_super) {
                __extends(MSFT_lod, _super);
                function MSFT_lod() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    /**
                     * Maximum number of LODs to load, starting from the lowest LOD.
                     */
                    _this.maxLODsToLoad = Number.MAX_VALUE;
                    _this._loadingNodeLOD = null;
                    _this._loadNodeSignals = {};
                    _this._loadingMaterialLOD = null;
                    _this._loadMaterialSignals = {};
                    return _this;
                }
                MSFT_lod.prototype._loadNodeAsync = function (context, node) {
                    var _this = this;
                    return this._loadExtensionAsync(context, node, function (extensionContext, extension) {
                        var firstPromise;
                        var nodeLODs = _this._getLODs(extensionContext, node, _this._loader._gltf.nodes, extension.ids);
                        var _loop_1 = function (indexLOD) {
                            var nodeLOD = nodeLODs[indexLOD];
                            if (indexLOD !== 0) {
                                _this._loadingNodeLOD = nodeLOD;
                                if (!_this._loadNodeSignals[nodeLOD._index]) {
                                    _this._loadNodeSignals[nodeLOD._index] = new BABYLON.Deferred();
                                }
                            }
                            var promise = _this._loader._loadNodeAsync("#/nodes/" + nodeLOD._index, nodeLOD).then(function () {
                                if (indexLOD !== 0) {
                                    var previousNodeLOD = nodeLODs[indexLOD - 1];
                                    if (previousNodeLOD._babylonMesh) {
                                        previousNodeLOD._babylonMesh.dispose(false, true);
                                        delete previousNodeLOD._babylonMesh;
                                    }
                                }
                                if (indexLOD !== nodeLODs.length - 1) {
                                    var nodeIndex = nodeLODs[indexLOD + 1]._index;
                                    if (_this._loadNodeSignals[nodeIndex]) {
                                        _this._loadNodeSignals[nodeIndex].resolve();
                                        delete _this._loadNodeSignals[nodeIndex];
                                    }
                                }
                            });
                            if (indexLOD === 0) {
                                firstPromise = promise;
                            }
                            else {
                                _this._loader._completePromises.push(promise);
                                _this._loadingNodeLOD = null;
                            }
                        };
                        for (var indexLOD = 0; indexLOD < nodeLODs.length; indexLOD++) {
                            _loop_1(indexLOD);
                        }
                        return firstPromise;
                    });
                };
                MSFT_lod.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                    var _this = this;
                    // Don't load material LODs if already loading a node LOD.
                    if (this._loadingNodeLOD) {
                        return null;
                    }
                    return this._loadExtensionAsync(context, material, function (extensionContext, extension) {
                        var firstPromise;
                        var materialLODs = _this._getLODs(extensionContext, material, _this._loader._gltf.materials, extension.ids);
                        var _loop_2 = function (indexLOD) {
                            var materialLOD = materialLODs[indexLOD];
                            if (indexLOD !== 0) {
                                _this._loadingMaterialLOD = materialLOD;
                                if (!_this._loadMaterialSignals[materialLOD._index]) {
                                    _this._loadMaterialSignals[materialLOD._index] = new BABYLON.Deferred();
                                }
                            }
                            var promise = _this._loader._loadMaterialAsync("#/materials/" + materialLOD._index, materialLOD, babylonMesh, babylonDrawMode, indexLOD === 0 ? assign : function () { }).then(function () {
                                if (indexLOD !== 0) {
                                    var babylonDataLOD = materialLOD._babylonData;
                                    assign(babylonDataLOD[babylonDrawMode].material);
                                    var previousBabylonDataLOD = materialLODs[indexLOD - 1]._babylonData;
                                    if (previousBabylonDataLOD[babylonDrawMode]) {
                                        previousBabylonDataLOD[babylonDrawMode].material.dispose();
                                        delete previousBabylonDataLOD[babylonDrawMode];
                                    }
                                }
                                if (indexLOD !== materialLODs.length - 1) {
                                    var materialIndex = materialLODs[indexLOD + 1]._index;
                                    if (_this._loadMaterialSignals[materialIndex]) {
                                        _this._loadMaterialSignals[materialIndex].resolve();
                                        delete _this._loadMaterialSignals[materialIndex];
                                    }
                                }
                            });
                            if (indexLOD === 0) {
                                firstPromise = promise;
                            }
                            else {
                                _this._loader._completePromises.push(promise);
                                _this._loadingMaterialLOD = null;
                            }
                        };
                        for (var indexLOD = 0; indexLOD < materialLODs.length; indexLOD++) {
                            _loop_2(indexLOD);
                        }
                        return firstPromise;
                    });
                };
                MSFT_lod.prototype._loadUriAsync = function (context, uri) {
                    var _this = this;
                    // Defer the loading of uris if loading a material or node LOD.
                    if (this._loadingMaterialLOD) {
                        var index = this._loadingMaterialLOD._index;
                        return this._loadMaterialSignals[index].promise.then(function () {
                            return _this._loader._loadUriAsync(context, uri);
                        });
                    }
                    else if (this._loadingNodeLOD) {
                        var index = this._loadingNodeLOD._index;
                        return this._loadNodeSignals[index].promise.then(function () {
                            return _this._loader._loadUriAsync(context, uri);
                        });
                    }
                    return null;
                };
                /**
                 * Gets an array of LOD properties from lowest to highest.
                 */
                MSFT_lod.prototype._getLODs = function (context, property, array, ids) {
                    if (this.maxLODsToLoad <= 0) {
                        throw new Error("maxLODsToLoad must be greater than zero");
                    }
                    var properties = new Array();
                    for (var i = ids.length - 1; i >= 0; i--) {
                        properties.push(GLTF2.GLTFLoader._GetProperty(context + "/ids/" + ids[i], array, ids[i]));
                        if (properties.length === this.maxLODsToLoad) {
                            return properties;
                        }
                    }
                    properties.push(property);
                    return properties;
                };
                return MSFT_lod;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFT_lod = MSFT_lod;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new MSFT_lod(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_lod.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "MSFT_minecraftMesh";
            /** @hidden */
            var MSFT_minecraftMesh = /** @class */ (function (_super) {
                __extends(MSFT_minecraftMesh, _super);
                function MSFT_minecraftMesh(loader) {
                    var _this = _super.call(this, loader) || this;
                    _this.name = NAME;
                    _this._onMaterialLoaded = function (material) {
                        if (material.needAlphaBlending()) {
                            material.forceDepthWrite = true;
                            material.separateCullingPass = true;
                        }
                        material.backFaceCulling = material.forceDepthWrite;
                        material.twoSidedLighting = true;
                    };
                    var meshes = loader._gltf.meshes;
                    if (meshes && meshes.length) {
                        for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
                            var mesh = meshes_1[_i];
                            if (mesh && mesh.extras && mesh.extras.MSFT_minecraftMesh) {
                                _this._loader.onMaterialLoadedObservable.add(_this._onMaterialLoaded);
                                break;
                            }
                        }
                    }
                    return _this;
                }
                return MSFT_minecraftMesh;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFT_minecraftMesh = MSFT_minecraftMesh;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new MSFT_minecraftMesh(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_minecraftMesh.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "MSFT_sRGBFactors";
            /** @hidden */
            var MSFT_sRGBFactors = /** @class */ (function (_super) {
                __extends(MSFT_sRGBFactors, _super);
                function MSFT_sRGBFactors(loader) {
                    var _this = _super.call(this, loader) || this;
                    _this.name = NAME;
                    _this._onMaterialLoaded = function (material) {
                        if (!material.albedoTexture) {
                            material.albedoColor.toLinearSpaceToRef(material.albedoColor);
                        }
                        if (!material.reflectivityTexture) {
                            material.reflectivityColor.toLinearSpaceToRef(material.reflectivityColor);
                        }
                    };
                    var materials = loader._gltf.materials;
                    if (materials && materials.length) {
                        for (var _i = 0, materials_1 = materials; _i < materials_1.length; _i++) {
                            var material = materials_1[_i];
                            if (material && material.extras && material.extras.MSFT_sRGBFactors) {
                                _this._loader.onMaterialLoadedObservable.add(_this._onMaterialLoaded);
                                break;
                            }
                        }
                    }
                    return _this;
                }
                return MSFT_sRGBFactors;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFT_sRGBFactors = MSFT_sRGBFactors;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new MSFT_sRGBFactors(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_sRGBFactors.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_draco_mesh_compression";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression)
             */
            var KHR_draco_mesh_compression = /** @class */ (function (_super) {
                __extends(KHR_draco_mesh_compression, _super);
                function KHR_draco_mesh_compression(loader) {
                    var _this = _super.call(this, loader) || this;
                    _this.name = NAME;
                    _this._dracoCompression = null;
                    // Disable extension if decoder is not available.
                    if (!BABYLON.DracoCompression.DecoderAvailable) {
                        _this.enabled = false;
                    }
                    return _this;
                }
                KHR_draco_mesh_compression.prototype.dispose = function () {
                    if (this._dracoCompression) {
                        this._dracoCompression.dispose();
                    }
                    _super.prototype.dispose.call(this);
                };
                KHR_draco_mesh_compression.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
                    var _this = this;
                    return this._loadExtensionAsync(context, primitive, function (extensionContext, extension) {
                        if (primitive.mode != undefined) {
                            if (primitive.mode !== 5 /* TRIANGLE_STRIP */ &&
                                primitive.mode !== 4 /* TRIANGLES */) {
                                throw new Error(context + ": Unsupported mode " + primitive.mode);
                            }
                            // TODO: handle triangle strips
                            if (primitive.mode === 5 /* TRIANGLE_STRIP */) {
                                throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
                            }
                        }
                        var attributes = {};
                        var loadAttribute = function (name, kind) {
                            var uniqueId = extension.attributes[name];
                            if (uniqueId == undefined) {
                                return;
                            }
                            babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                            if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                                babylonMesh._delayInfo.push(kind);
                            }
                            attributes[kind] = uniqueId;
                        };
                        loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind);
                        loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind);
                        loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind);
                        loadAttribute("TEXCOORD_0", BABYLON.VertexBuffer.UVKind);
                        loadAttribute("TEXCOORD_1", BABYLON.VertexBuffer.UV2Kind);
                        loadAttribute("JOINTS_0", BABYLON.VertexBuffer.MatricesIndicesKind);
                        loadAttribute("WEIGHTS_0", BABYLON.VertexBuffer.MatricesWeightsKind);
                        loadAttribute("COLOR_0", BABYLON.VertexBuffer.ColorKind);
                        var bufferView = GLTF2.GLTFLoader._GetProperty(extensionContext, _this._loader._gltf.bufferViews, extension.bufferView);
                        if (!bufferView._dracoBabylonGeometry) {
                            bufferView._dracoBabylonGeometry = _this._loader._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(function (data) {
                                if (!_this._dracoCompression) {
                                    _this._dracoCompression = new BABYLON.DracoCompression();
                                }
                                return _this._dracoCompression.decodeMeshAsync(data, attributes).then(function (babylonVertexData) {
                                    var babylonGeometry = new BABYLON.Geometry(babylonMesh.name, _this._loader._babylonScene);
                                    babylonVertexData.applyToGeometry(babylonGeometry);
                                    return babylonGeometry;
                                }).catch(function (error) {
                                    throw new Error(context + ": " + error.message);
                                });
                            });
                        }
                        return bufferView._dracoBabylonGeometry;
                    });
                };
                return KHR_draco_mesh_compression;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_draco_mesh_compression = KHR_draco_mesh_compression;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_draco_mesh_compression(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_draco_mesh_compression.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_materials_pbrSpecularGlossiness";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness)
             */
            var KHR_materials_pbrSpecularGlossiness = /** @class */ (function (_super) {
                __extends(KHR_materials_pbrSpecularGlossiness, _super);
                function KHR_materials_pbrSpecularGlossiness() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    return _this;
                }
                KHR_materials_pbrSpecularGlossiness.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                    var _this = this;
                    return this._loadExtensionAsync(context, material, function (extensionContext, extension) {
                        material._babylonData = material._babylonData || {};
                        var babylonData = material._babylonData[babylonDrawMode];
                        if (!babylonData) {
                            var promises = new Array();
                            var name_1 = material.name || "materialSG_" + material._index;
                            var babylonMaterial = _this._loader._createMaterial(name_1, babylonDrawMode);
                            promises.push(_this._loader._loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                            promises.push(_this._loadSpecularGlossinessPropertiesAsync(extensionContext, material, extension, babylonMaterial));
                            _this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                            babylonData = {
                                material: babylonMaterial,
                                meshes: [],
                                loaded: Promise.all(promises).then(function () { })
                            };
                            material._babylonData[babylonDrawMode] = babylonData;
                        }
                        babylonData.meshes.push(babylonMesh);
                        assign(babylonData.material);
                        return babylonData.loaded;
                    });
                };
                KHR_materials_pbrSpecularGlossiness.prototype._loadSpecularGlossinessPropertiesAsync = function (context, material, properties, babylonMaterial) {
                    var promises = new Array();
                    if (properties.diffuseFactor) {
                        babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.diffuseFactor);
                        babylonMaterial.alpha = properties.diffuseFactor[3];
                    }
                    else {
                        babylonMaterial.albedoColor = BABYLON.Color3.White();
                    }
                    babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : BABYLON.Color3.White();
                    babylonMaterial.microSurface = properties.glossinessFactor == undefined ? 1 : properties.glossinessFactor;
                    if (properties.diffuseTexture) {
                        promises.push(this._loader._loadTextureAsync(context + "/diffuseTexture", properties.diffuseTexture, function (texture) {
                            babylonMaterial.albedoTexture = texture;
                        }));
                    }
                    if (properties.specularGlossinessTexture) {
                        promises.push(this._loader._loadTextureAsync(context + "/specularGlossinessTexture", properties.specularGlossinessTexture, function (texture) {
                            babylonMaterial.reflectivityTexture = texture;
                        }));
                        babylonMaterial.reflectivityTexture.hasAlpha = true;
                        babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    }
                    this._loader._loadMaterialAlphaProperties(context, material, babylonMaterial);
                    return Promise.all(promises).then(function () { });
                };
                return KHR_materials_pbrSpecularGlossiness;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_materials_pbrSpecularGlossiness = KHR_materials_pbrSpecularGlossiness;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_materials_pbrSpecularGlossiness(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_pbrSpecularGlossiness.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_materials_unlit";
            /**
             * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit)
             */
            var KHR_materials_unlit = /** @class */ (function (_super) {
                __extends(KHR_materials_unlit, _super);
                function KHR_materials_unlit() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    return _this;
                }
                KHR_materials_unlit.prototype._loadMaterialAsync = function (context, material, babylonMesh, babylonDrawMode, assign) {
                    var _this = this;
                    return this._loadExtensionAsync(context, material, function () {
                        material._babylonData = material._babylonData || {};
                        var babylonData = material._babylonData[babylonDrawMode];
                        if (!babylonData) {
                            var name_1 = material.name || "materialUnlit_" + material._index;
                            var babylonMaterial = _this._loader._createMaterial(name_1, babylonDrawMode);
                            babylonMaterial.unlit = true;
                            var promise = _this._loadUnlitPropertiesAsync(context, material, babylonMaterial);
                            _this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                            babylonData = {
                                material: babylonMaterial,
                                meshes: [],
                                loaded: promise
                            };
                            material._babylonData[babylonDrawMode] = babylonData;
                        }
                        babylonData.meshes.push(babylonMesh);
                        assign(babylonData.material);
                        return babylonData.loaded;
                    });
                };
                KHR_materials_unlit.prototype._loadUnlitPropertiesAsync = function (context, material, babylonMaterial) {
                    var promises = new Array();
                    // Ensure metallic workflow
                    babylonMaterial.metallic = 1;
                    babylonMaterial.roughness = 1;
                    var properties = material.pbrMetallicRoughness;
                    if (properties) {
                        if (properties.baseColorFactor) {
                            babylonMaterial.albedoColor = BABYLON.Color3.FromArray(properties.baseColorFactor);
                            babylonMaterial.alpha = properties.baseColorFactor[3];
                        }
                        else {
                            babylonMaterial.albedoColor = BABYLON.Color3.White();
                        }
                        if (properties.baseColorTexture) {
                            promises.push(this._loader._loadTextureAsync(context + "/baseColorTexture", properties.baseColorTexture, function (texture) {
                                babylonMaterial.albedoTexture = texture;
                            }));
                        }
                    }
                    if (material.doubleSided) {
                        babylonMaterial.backFaceCulling = false;
                        babylonMaterial.twoSidedLighting = true;
                    }
                    this._loader._loadMaterialAlphaProperties(context, material, babylonMaterial);
                    return Promise.all(promises).then(function () { });
                };
                return KHR_materials_unlit;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_materials_unlit = KHR_materials_unlit;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_materials_unlit(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_unlit.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var NAME = "KHR_lights";
            var LightType;
            (function (LightType) {
                LightType["AMBIENT"] = "ambient";
                LightType["DIRECTIONAL"] = "directional";
                LightType["POINT"] = "point";
                LightType["SPOT"] = "spot";
            })(LightType || (LightType = {}));
            /**
             * [Specification](https://github.com/MiiBond/glTF/tree/khr_lights_v1/extensions/Khronos/KHR_lights) (Experimental)
             */
            var KHR_lights = /** @class */ (function (_super) {
                __extends(KHR_lights, _super);
                function KHR_lights() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.name = NAME;
                    return _this;
                }
                KHR_lights.prototype._loadSceneAsync = function (context, scene) {
                    var _this = this;
                    return this._loadExtensionAsync(context, scene, function (extensionContext, extension) {
                        var promise = _this._loader._loadSceneAsync(extensionContext, scene);
                        var light = GLTF2.GLTFLoader._GetProperty(extensionContext, _this._lights, extension.light);
                        if (light.type !== LightType.AMBIENT) {
                            throw new Error(extensionContext + ": Only ambient lights are allowed on a scene");
                        }
                        _this._loader._babylonScene.ambientColor = light.color ? BABYLON.Color3.FromArray(light.color) : BABYLON.Color3.Black();
                        return promise;
                    });
                };
                KHR_lights.prototype._loadNodeAsync = function (context, node) {
                    var _this = this;
                    return this._loadExtensionAsync(context, node, function (extensionContext, extension) {
                        var promise = _this._loader._loadNodeAsync(extensionContext, node);
                        var babylonLight;
                        var light = GLTF2.GLTFLoader._GetProperty(extensionContext, _this._lights, extension.light);
                        var name = node._babylonMesh.name;
                        switch (light.type) {
                            case LightType.AMBIENT: {
                                throw new Error(extensionContext + ": Ambient lights are not allowed on a node");
                            }
                            case LightType.DIRECTIONAL: {
                                babylonLight = new BABYLON.DirectionalLight(name, BABYLON.Vector3.Forward(), _this._loader._babylonScene);
                                break;
                            }
                            case LightType.POINT: {
                                babylonLight = new BABYLON.PointLight(name, BABYLON.Vector3.Zero(), _this._loader._babylonScene);
                                break;
                            }
                            case LightType.SPOT: {
                                var spotLight = light;
                                // TODO: support inner and outer cone angles
                                //const innerConeAngle = spotLight.innerConeAngle || 0;
                                var outerConeAngle = spotLight.outerConeAngle || Math.PI / 4;
                                babylonLight = new BABYLON.SpotLight(name, BABYLON.Vector3.Zero(), BABYLON.Vector3.Forward(), outerConeAngle, 2, _this._loader._babylonScene);
                                break;
                            }
                            default: {
                                throw new Error(extensionContext + ": Invalid light type (" + light.type + ")");
                            }
                        }
                        babylonLight.diffuse = light.color ? BABYLON.Color3.FromArray(light.color) : BABYLON.Color3.White();
                        babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                        babylonLight.parent = node._babylonMesh;
                        return promise;
                    });
                };
                Object.defineProperty(KHR_lights.prototype, "_lights", {
                    get: function () {
                        var extensions = this._loader._gltf.extensions;
                        if (!extensions || !extensions[this.name]) {
                            throw new Error("#/extensions: '" + this.name + "' not found");
                        }
                        var extension = extensions[this.name];
                        return extension.lights;
                    },
                    enumerable: true,
                    configurable: true
                });
                return KHR_lights;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHR_lights = KHR_lights;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHR_lights(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_lights.js.map
