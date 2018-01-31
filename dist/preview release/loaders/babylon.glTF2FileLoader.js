/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
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
    var GLTFLoaderState;
    (function (GLTFLoaderState) {
        GLTFLoaderState[GLTFLoaderState["Loading"] = 0] = "Loading";
        GLTFLoaderState[GLTFLoaderState["Ready"] = 1] = "Ready";
        GLTFLoaderState[GLTFLoaderState["Complete"] = 2] = "Complete";
    })(GLTFLoaderState = BABYLON.GLTFLoaderState || (BABYLON.GLTFLoaderState = {}));
    var GLTFFileLoader = /** @class */ (function () {
        function GLTFFileLoader() {
            // #region Common options
            /**
             * Raised when the asset has been parsed.
             * The data.json property stores the glTF JSON.
             * The data.bin property stores the BIN chunk from a glTF binary or null if the input is not a glTF binary.
             */
            this.onParsedObservable = new BABYLON.Observable();
            // #endregion
            // #region V2 options
            /**
             * The coordinate system mode (AUTO, FORCE_RIGHT_HANDED).
             */
            this.coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
            /**
             * The animation start mode (NONE, FIRST, ALL).
             */
            this.animationStartMode = GLTFLoaderAnimationStartMode.FIRST;
            /**
             * Set to true to compile materials before raising the success callback.
             */
            this.compileMaterials = false;
            /**
             * Set to true to also compile materials with clip planes.
             */
            this.useClipPlane = false;
            /**
             * Set to true to compile shadow generators before raising the success callback.
             */
            this.compileShadowGenerators = false;
            /**
             * Raised when the loader creates a mesh after parsing the glTF properties of the mesh.
             */
            this.onMeshLoadedObservable = new BABYLON.Observable();
            /**
             * Raised when the loader creates a texture after parsing the glTF properties of the texture.
             */
            this.onTextureLoadedObservable = new BABYLON.Observable();
            /**
             * Raised when the loader creates a material after parsing the glTF properties of the material.
             */
            this.onMaterialLoadedObservable = new BABYLON.Observable();
            /**
             * Raised when the asset is completely loaded, immediately before the loader is disposed.
             * For assets with LODs, raised when all of the LODs are complete.
             * For assets without LODs, raised when the model is complete, immediately after onSuccess.
             */
            this.onCompleteObservable = new BABYLON.Observable();
            /**
            * Raised when the loader is disposed.
            */
            this.onDisposeObservable = new BABYLON.Observable();
            // #endregion
            this._loader = null;
            this.name = "gltf";
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        Object.defineProperty(GLTFFileLoader.prototype, "onParsed", {
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
            set: function (callback) {
                if (this._onMaterialLoadedObserver) {
                    this.onMaterialLoadedObservable.remove(this._onMaterialLoadedObserver);
                }
                this._onMaterialLoadedObserver = this.onMaterialLoadedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "onComplete", {
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
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "loaderState", {
            /**
             * The loader state or null if not active.
             */
            get: function () {
                return this._loader ? this._loader.state : null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTFFileLoader.prototype, "loaderExtensions", {
            /**
             * The loader extensions or null if not active.
             */
            get: function () {
                return this._loader ? this._loader.extensions : null;
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
            this.onParsedObservable.clear();
            this.onMeshLoadedObservable.clear();
            this.onTextureLoadedObservable.clear();
            this.onMaterialLoadedObservable.clear();
            this.onCompleteObservable.clear();
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        };
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onProgress);
            });
        };
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
            var _this = this;
            return Promise.resolve().then(function () {
                var loaderData = _this._parse(data);
                _this._loader = _this._getLoader(loaderData);
                return _this._loader.loadAsync(scene, loaderData, rootUrl, onProgress);
            });
        };
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
                    container.removeAllFromScene();
                    return container;
                });
            });
        };
        GLTFFileLoader.prototype.canDirectLoad = function (data) {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        };
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
            loader.onMeshLoadedObservable.add(function (mesh) { return _this.onMeshLoadedObservable.notifyObservers(mesh); });
            loader.onTextureLoadedObservable.add(function (texture) { return _this.onTextureLoadedObservable.notifyObservers(texture); });
            loader.onMaterialLoadedObservable.add(function (material) { return _this.onMaterialLoadedObservable.notifyObservers(material); });
            loader.onCompleteObservable.add(function () { return _this.onCompleteObservable.notifyObservers(_this); });
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
        GLTFFileLoader.IncrementalLoading = true;
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
        var ArrayItem = /** @class */ (function () {
            function ArrayItem() {
            }
            ArrayItem.Assign = function (values) {
                if (values) {
                    for (var index = 0; index < values.length; index++) {
                        values[index]._index = index;
                    }
                }
            };
            return ArrayItem;
        }());
        GLTF2.ArrayItem = ArrayItem;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtilities.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFLoader = /** @class */ (function () {
            function GLTFLoader() {
                this._completePromises = new Array();
                this._disposed = false;
                this._state = null;
                this._extensions = {};
                this._defaultSampler = {};
                this._requests = new Array();
                this.coordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode.AUTO;
                this.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.FIRST;
                this.compileMaterials = false;
                this.useClipPlane = false;
                this.compileShadowGenerators = false;
                this.onDisposeObservable = new BABYLON.Observable();
                this.onMeshLoadedObservable = new BABYLON.Observable();
                this.onTextureLoadedObservable = new BABYLON.Observable();
                this.onMaterialLoadedObservable = new BABYLON.Observable();
                this.onCompleteObservable = new BABYLON.Observable();
                for (var _i = 0, _a = GLTFLoader._Names; _i < _a.length; _i++) {
                    var name_1 = _a[_i];
                    var extension = GLTFLoader._Factories[name_1](this);
                    this._extensions[name_1] = extension;
                }
            }
            GLTFLoader._Register = function (name, factory) {
                if (GLTFLoader._Factories[name]) {
                    BABYLON.Tools.Error("Extension with the name '" + name + "' already exists");
                    return;
                }
                GLTFLoader._Factories[name] = factory;
                // Keep the order of registration so that extensions registered first are called first.
                GLTFLoader._Names.push(name);
            };
            Object.defineProperty(GLTFLoader.prototype, "state", {
                get: function () {
                    return this._state;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(GLTFLoader.prototype, "extensions", {
                get: function () {
                    return this.extensions;
                },
                enumerable: true,
                configurable: true
            });
            GLTFLoader.prototype.dispose = function () {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                this._abortRequests();
                this._releaseResources();
                this.onDisposeObservable.notifyObservers(this);
            };
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
                                throw new Error("Failed to find node " + name);
                            }
                            return node;
                        });
                    }
                    return _this._loadAsync(nodes, scene, data, rootUrl, onProgress).then(function () {
                        return {
                            meshes: _this._getMeshes(),
                            particleSystems: [],
                            skeletons: _this._getSkeletons(),
                        };
                    });
                });
            };
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onProgress) {
                return this._loadAsync(null, scene, data, rootUrl, onProgress);
            };
            GLTFLoader.prototype._loadAsync = function (nodes, scene, data, rootUrl, onProgress) {
                var _this = this;
                return Promise.resolve().then(function () {
                    _this._babylonScene = scene;
                    _this._rootUrl = rootUrl;
                    _this._progressCallback = onProgress;
                    _this._state = BABYLON.GLTFLoaderState.Loading;
                    _this._loadData(data);
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
                    return Promise.all(promises).then(function () {
                        _this._state = BABYLON.GLTFLoaderState.Ready;
                        _this._startAnimations();
                        BABYLON.Tools.SetImmediate(function () {
                            Promise.all(_this._completePromises).then(function () {
                                _this._releaseResources();
                                _this._state = BABYLON.GLTFLoaderState.Complete;
                                _this.onCompleteObservable.notifyObservers(_this);
                            }).catch(function (error) {
                                BABYLON.Tools.Error("glTF Loader: " + error.message);
                                _this.dispose();
                            });
                        });
                    }).catch(function (error) {
                        BABYLON.Tools.Error("glTF Loader: " + error.message);
                        _this.dispose();
                        throw error;
                    });
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
                GLTF2.ArrayItem.Assign(this._gltf.accessors);
                GLTF2.ArrayItem.Assign(this._gltf.animations);
                GLTF2.ArrayItem.Assign(this._gltf.buffers);
                GLTF2.ArrayItem.Assign(this._gltf.bufferViews);
                GLTF2.ArrayItem.Assign(this._gltf.cameras);
                GLTF2.ArrayItem.Assign(this._gltf.images);
                GLTF2.ArrayItem.Assign(this._gltf.materials);
                GLTF2.ArrayItem.Assign(this._gltf.meshes);
                GLTF2.ArrayItem.Assign(this._gltf.nodes);
                GLTF2.ArrayItem.Assign(this._gltf.samplers);
                GLTF2.ArrayItem.Assign(this._gltf.scenes);
                GLTF2.ArrayItem.Assign(this._gltf.skins);
                GLTF2.ArrayItem.Assign(this._gltf.textures);
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
            GLTFLoader.prototype._createRootNode = function () {
                this._rootBabylonMesh = new BABYLON.Mesh("__root__", this._babylonScene);
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
                        throw new Error("Invalid coordinate system mode " + this.coordinateSystemMode);
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
            GLTFLoader.prototype._startAnimations = function () {
                var animations = this._gltf.animations;
                if (!animations) {
                    return;
                }
                switch (this.animationStartMode) {
                    case BABYLON.GLTFLoaderAnimationStartMode.NONE: {
                        // do nothing
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.FIRST: {
                        var animation = animations[0];
                        animation._babylonAnimationGroup.start(true);
                        break;
                    }
                    case BABYLON.GLTFLoaderAnimationStartMode.ALL: {
                        for (var _i = 0, animations_1 = animations; _i < animations_1.length; _i++) {
                            var animation = animations_1[_i];
                            animation._babylonAnimationGroup.start(true);
                        }
                        break;
                    }
                    default: {
                        BABYLON.Tools.Error("Invalid animation start mode " + this.animationStartMode);
                        return;
                    }
                }
            };
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
                node._babylonAnimationTargets = node._babylonAnimationTargets || [];
                node._babylonAnimationTargets.push(babylonMesh);
                GLTFLoader._LoadTransform(node, babylonMesh);
                if (node.mesh != undefined) {
                    var mesh = GLTFLoader._GetProperty(context + "/mesh", this._gltf.meshes, node.mesh);
                    promises.push(this._loadMeshAsync("#/meshes/" + mesh._index, node, mesh));
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
            GLTFLoader.prototype._loadMeshAsync = function (context, node, mesh) {
                // TODO: instancing
                var promises = new Array();
                var primitives = mesh.primitives;
                if (!primitives || primitives.length === 0) {
                    throw new Error(context + ": Primitives are missing");
                }
                GLTF2.ArrayItem.Assign(primitives);
                for (var _i = 0, primitives_1 = primitives; _i < primitives_1.length; _i++) {
                    var primitive = primitives_1[_i];
                    promises.push(this._loadPrimitiveAsync(context + "/primitives/" + primitive._index, node, mesh, primitive));
                }
                if (node.skin != undefined) {
                    var skin = GLTFLoader._GetProperty(context + "/skin", this._gltf.skins, node.skin);
                    promises.push(this._loadSkinAsync("#/skins/" + skin._index, node, mesh, skin));
                }
                return Promise.all(promises).then(function () {
                    if (node._primitiveBabylonMeshes) {
                        for (var _i = 0, _a = node._primitiveBabylonMeshes; _i < _a.length; _i++) {
                            var primitiveBabylonMesh = _a[_i];
                            primitiveBabylonMesh._refreshBoundingInfo(true);
                        }
                    }
                });
            };
            GLTFLoader.prototype._loadPrimitiveAsync = function (context, node, mesh, primitive) {
                var _this = this;
                var promises = new Array();
                var babylonMesh = new BABYLON.Mesh((mesh.name || node._babylonMesh.name) + "_" + primitive._index, this._babylonScene, node._babylonMesh);
                babylonMesh.setEnabled(false);
                node._primitiveBabylonMeshes = node._primitiveBabylonMeshes || [];
                node._primitiveBabylonMeshes[primitive._index] = babylonMesh;
                this._createMorphTargets(context, node, mesh, primitive, babylonMesh);
                promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh).then(function (babylonVertexData) {
                    new BABYLON.Geometry(babylonMesh.name, _this._babylonScene, babylonVertexData, false, babylonMesh);
                    return _this._loadMorphTargetsAsync(context, primitive, babylonMesh, babylonVertexData);
                }));
                if (primitive.material == undefined) {
                    babylonMesh.material = this._getDefaultMaterial();
                }
                else {
                    var material = GLTFLoader._GetProperty(context + "/material", this._gltf.materials, primitive.material);
                    promises.push(this._loadMaterialAsync("#/materials/" + material._index, material, babylonMesh));
                }
                return Promise.all(promises).then(function () {
                    babylonMesh.setEnabled(true);
                });
            };
            GLTFLoader.prototype._loadVertexDataAsync = function (context, primitive, babylonMesh) {
                var _this = this;
                var attributes = primitive.attributes;
                if (!attributes) {
                    throw new Error(context + ": Attributes are missing");
                }
                if (primitive.mode && primitive.mode !== 4 /* TRIANGLES */) {
                    // TODO: handle other primitive modes
                    throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
                }
                var promises = new Array();
                var babylonVertexData = new BABYLON.VertexData();
                if (primitive.indices == undefined) {
                    var positionAccessorIndex = attributes["POSITION"];
                    if (positionAccessorIndex != undefined) {
                        var accessor = GLTFLoader._GetProperty(context + "/attributes/POSITION", this._gltf.accessors, positionAccessorIndex);
                        babylonVertexData.indices = new Uint32Array(accessor.count);
                        for (var i = 0; i < babylonVertexData.indices.length; i++) {
                            babylonVertexData.indices[i] = i;
                        }
                    }
                }
                else {
                    var indicesAccessor = GLTFLoader._GetProperty(context + "/indices", this._gltf.accessors, primitive.indices);
                    promises.push(this._loadAccessorAsync("#/accessors/" + indicesAccessor._index, indicesAccessor).then(function (data) {
                        babylonVertexData.indices = data;
                    }));
                }
                var loadAttribute = function (attribute, kind) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                    if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                        babylonMesh._delayInfo.push(kind);
                    }
                    var accessor = GLTFLoader._GetProperty(context + "/attributes/" + attribute, _this._gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadAccessorAsync("#/accessors/" + accessor._index, accessor).then(function (data) {
                        var attributeData = GLTFLoader._ConvertToFloat32Array(context, accessor, data);
                        if (attribute === "COLOR_0") {
                            // Assume vertex color has alpha on the mesh. The alphaMode of the material controls whether the material should use alpha or not.
                            babylonMesh.hasVertexAlpha = true;
                            if (accessor.type === "VEC3") {
                                attributeData = GLTFLoader._ConvertVec3ToVec4(context, attributeData);
                            }
                        }
                        babylonVertexData.set(attributeData, kind);
                    }));
                };
                loadAttribute("POSITION", BABYLON.VertexBuffer.PositionKind);
                loadAttribute("NORMAL", BABYLON.VertexBuffer.NormalKind);
                loadAttribute("TANGENT", BABYLON.VertexBuffer.TangentKind);
                loadAttribute("TEXCOORD_0", BABYLON.VertexBuffer.UVKind);
                loadAttribute("TEXCOORD_1", BABYLON.VertexBuffer.UV2Kind);
                loadAttribute("JOINTS_0", BABYLON.VertexBuffer.MatricesIndicesKind);
                loadAttribute("WEIGHTS_0", BABYLON.VertexBuffer.MatricesWeightsKind);
                loadAttribute("COLOR_0", BABYLON.VertexBuffer.ColorKind);
                return Promise.all(promises).then(function () {
                    return babylonVertexData;
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
            GLTFLoader.prototype._loadMorphTargetsAsync = function (context, primitive, babylonMesh, babylonVertexData) {
                if (!primitive.targets) {
                    return Promise.resolve();
                }
                var promises = new Array();
                var morphTargetManager = babylonMesh.morphTargetManager;
                for (var index = 0; index < morphTargetManager.numTargets; index++) {
                    var babylonMorphTarget = morphTargetManager.getTarget(index);
                    promises.push(this._loadMorphTargetVertexDataAsync(context + "/targets/" + index, babylonVertexData, primitive.targets[index], babylonMorphTarget));
                }
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadMorphTargetVertexDataAsync = function (context, babylonVertexData, attributes, babylonMorphTarget) {
                var _this = this;
                var promises = new Array();
                var loadAttribute = function (attribute, setData) {
                    if (attributes[attribute] == undefined) {
                        return;
                    }
                    var accessor = GLTFLoader._GetProperty(context + "/" + attribute, _this._gltf.accessors, attributes[attribute]);
                    promises.push(_this._loadAccessorAsync("#/accessors/" + accessor._index, accessor).then(function (data) {
                        setData(data);
                    }));
                };
                loadAttribute("POSITION", function (data) {
                    if (babylonVertexData.positions) {
                        for (var i = 0; i < data.length; i++) {
                            data[i] += babylonVertexData.positions[i];
                        }
                        babylonMorphTarget.setPositions(data);
                    }
                });
                loadAttribute("NORMAL", function (data) {
                    if (babylonVertexData.normals) {
                        for (var i = 0; i < data.length; i++) {
                            data[i] += babylonVertexData.normals[i];
                        }
                        babylonMorphTarget.setNormals(data);
                    }
                });
                loadAttribute("TANGENT", function (data) {
                    if (babylonVertexData.tangents) {
                        // Tangent data for morph targets is stored as xyz delta.
                        // The vertexData.tangent is stored as xyzw.
                        // So we need to skip every fourth vertexData.tangent.
                        for (var i = 0, j = 0; i < data.length; i++) {
                            data[i] += babylonVertexData.tangents[j++];
                            if ((i + 1) % 3 == 0) {
                                j++;
                            }
                        }
                        babylonMorphTarget.setTangents(data);
                    }
                });
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader._ConvertToFloat32Array = function (context, accessor, data) {
                if (accessor.componentType == 5126 /* FLOAT */) {
                    return data;
                }
                var factor = 1;
                if (accessor.normalized) {
                    switch (accessor.componentType) {
                        case 5121 /* UNSIGNED_BYTE */: {
                            factor = 1 / 255;
                            break;
                        }
                        case 5123 /* UNSIGNED_SHORT */: {
                            factor = 1 / 65535;
                            break;
                        }
                        default: {
                            throw new Error(context + ": Invalid component type " + accessor.componentType);
                        }
                    }
                }
                var result = new Float32Array(accessor.count * GLTFLoader._GetNumComponents(context, accessor.type));
                for (var i = 0; i < result.length; i++) {
                    result[i] = data[i] * factor;
                }
                return result;
            };
            GLTFLoader._ConvertVec3ToVec4 = function (context, data) {
                var result = new Float32Array(data.length / 3 * 4);
                var offset = 0;
                for (var i = 0; i < result.length; i++) {
                    if ((i + 1) % 4 === 0) {
                        result[i] = 1;
                    }
                    else {
                        result[i] = data[offset++];
                    }
                }
                return result;
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
                var assignSkeleton = function () {
                    for (var _i = 0, _a = node._primitiveBabylonMeshes; _i < _a.length; _i++) {
                        var babylonMesh = _a[_i];
                        babylonMesh.skeleton = skin._babylonSkeleton;
                    }
                    node._babylonMesh.parent = _this._rootBabylonMesh;
                    node._babylonMesh.position = BABYLON.Vector3.Zero();
                    node._babylonMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
                    node._babylonMesh.scaling = BABYLON.Vector3.One();
                };
                if (skin._loaded) {
                    assignSkeleton();
                    return skin._loaded;
                }
                // TODO: split into two parts so that bones are created before inverseBindMatricesData is loaded (for compiling materials).
                return (skin._loaded = this._loadSkinInverseBindMatricesDataAsync(context, skin).then(function (inverseBindMatricesData) {
                    var skeletonId = "skeleton" + skin._index;
                    var babylonSkeleton = new BABYLON.Skeleton(skin.name || skeletonId, skeletonId, _this._babylonScene);
                    skin._babylonSkeleton = babylonSkeleton;
                    _this._loadBones(context, skin, inverseBindMatricesData);
                    assignSkeleton();
                }));
            };
            GLTFLoader.prototype._loadSkinInverseBindMatricesDataAsync = function (context, skin) {
                if (skin.inverseBindMatrices == undefined) {
                    return Promise.resolve(null);
                }
                var accessor = GLTFLoader._GetProperty(context + "/inverseBindMatrices", this._gltf.accessors, skin.inverseBindMatrices);
                return this._loadAccessorAsync("#/accessors/" + accessor._index, accessor).then(function (data) {
                    return data;
                });
            };
            GLTFLoader.prototype._createBone = function (node, skin, parent, localMatrix, baseMatrix, index) {
                var babylonBone = new BABYLON.Bone(node.name || "joint" + node._index, skin._babylonSkeleton, parent, localMatrix, null, baseMatrix, index);
                node._babylonAnimationTargets = node._babylonAnimationTargets || [];
                node._babylonAnimationTargets.push(babylonBone);
                return babylonBone;
            };
            GLTFLoader.prototype._loadBones = function (context, skin, inverseBindMatricesData) {
                var babylonBones = {};
                for (var _i = 0, _a = skin.joints; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var node = GLTFLoader._GetProperty(context + "/joints/" + index, this._gltf.nodes, index);
                    this._loadBone(node, skin, inverseBindMatricesData, babylonBones);
                }
            };
            GLTFLoader.prototype._loadBone = function (node, skin, inverseBindMatricesData, babylonBones) {
                var babylonBone = babylonBones[node._index];
                if (babylonBone) {
                    return babylonBone;
                }
                var boneIndex = skin.joints.indexOf(node._index);
                var baseMatrix = BABYLON.Matrix.Identity();
                if (inverseBindMatricesData && boneIndex !== -1) {
                    baseMatrix = BABYLON.Matrix.FromArray(inverseBindMatricesData, boneIndex * 16);
                    baseMatrix.invertToRef(baseMatrix);
                }
                var babylonParentBone = null;
                if (node._parent._babylonMesh !== this._rootBabylonMesh) {
                    babylonParentBone = this._loadBone(node._parent, skin, inverseBindMatricesData, babylonBones);
                    baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
                }
                babylonBone = this._createBone(node, skin, babylonParentBone, this._getNodeMatrix(node), baseMatrix, boneIndex);
                babylonBones[node._index] = babylonBone;
                return babylonBone;
            };
            GLTFLoader.prototype._getNodeMatrix = function (node) {
                return node.matrix ?
                    BABYLON.Matrix.FromArray(node.matrix) :
                    BABYLON.Matrix.Compose(node.scale ? BABYLON.Vector3.FromArray(node.scale) : BABYLON.Vector3.One(), node.rotation ? BABYLON.Quaternion.FromArray(node.rotation) : BABYLON.Quaternion.Identity(), node.translation ? BABYLON.Vector3.FromArray(node.translation) : BABYLON.Vector3.Zero());
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
                var babylonAnimationGroup = new BABYLON.AnimationGroup(animation.name || "animation" + animation._index, this._babylonScene);
                animation._babylonAnimationGroup = babylonAnimationGroup;
                var promises = new Array();
                GLTF2.ArrayItem.Assign(animation.channels);
                GLTF2.ArrayItem.Assign(animation.samplers);
                for (var _i = 0, _a = animation.channels; _i < _a.length; _i++) {
                    var channel = _a[_i];
                    promises.push(this._loadAnimationChannelAsync(context + "/channels/" + channel._index, context, animation, channel, babylonAnimationGroup));
                }
                return Promise.all(promises).then(function () {
                    babylonAnimationGroup.normalize();
                });
            };
            GLTFLoader.prototype._loadAnimationChannelAsync = function (context, animationContext, animation, channel, babylonAnimationGroup) {
                var targetNode = GLTFLoader._GetProperty(context + "/target/node", this._gltf.nodes, channel.target.node);
                if (!targetNode._babylonMesh) {
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
                            throw new Error(context + ": Invalid target path " + channel.target.path);
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
                    var keys;
                    if (data.input.length === 1) {
                        var key = getNextKey(0);
                        keys = [
                            { frame: key.frame, value: key.value },
                            { frame: key.frame + 1, value: key.value }
                        ];
                    }
                    else {
                        keys = new Array(data.input.length);
                        for (var frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                            keys[frameIndex] = getNextKey(frameIndex);
                        }
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
                            for (var _i = 0, _a = targetNode._primitiveBabylonMeshes; _i < _a.length; _i++) {
                                var babylonMesh = _a[_i];
                                var morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                                babylonAnimationGroup.addTargetedAnimation(babylonAnimation, morphTarget);
                            }
                        };
                        for (var targetIndex = 0; targetIndex < targetNode._numMorphTargets; targetIndex++) {
                            _loop_1(targetIndex);
                        }
                    }
                    else {
                        var animationName = babylonAnimationGroup.name + "_channel" + babylonAnimationGroup.targetedAnimations.length;
                        var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys);
                        if (targetNode._babylonAnimationTargets) {
                            for (var _i = 0, _a = targetNode._babylonAnimationTargets; _i < _a.length; _i++) {
                                var target = _a[_i];
                                babylonAnimationGroup.addTargetedAnimation(babylonAnimation, target);
                            }
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
                        throw new Error(context + ": Invalid interpolation " + sampler.interpolation);
                    }
                }
                var inputData;
                var outputData;
                var inputAccessor = GLTFLoader._GetProperty(context + "/input", this._gltf.accessors, sampler.input);
                var outputAccessor = GLTFLoader._GetProperty(context + "/output", this._gltf.accessors, sampler.output);
                sampler._data = Promise.all([
                    this._loadAccessorAsync("#/accessors/" + inputAccessor._index, inputAccessor).then(function (data) {
                        inputData = data;
                    }),
                    this._loadAccessorAsync("#/accessors/" + outputAccessor._index, outputAccessor).then(function (data) {
                        outputData = data;
                    })
                ]).then(function () {
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
            GLTFLoader.prototype._loadBufferViewAsync = function (context, bufferView) {
                if (bufferView._data) {
                    return bufferView._data;
                }
                var buffer = GLTFLoader._GetProperty(context + "/buffer", this._gltf.buffers, bufferView.buffer);
                bufferView._data = this._loadBufferAsync("#/buffers/" + buffer._index, buffer).then(function (bufferData) {
                    try {
                        return new Uint8Array(bufferData.buffer, bufferData.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                    }
                    catch (e) {
                        throw new Error(context + ": " + e.message);
                    }
                });
                return bufferView._data;
            };
            GLTFLoader.prototype._loadAccessorAsync = function (context, accessor) {
                var _this = this;
                if (accessor.sparse) {
                    throw new Error(context + ": Sparse accessors are not currently supported");
                }
                if (accessor._data) {
                    return accessor._data;
                }
                var bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                accessor._data = this._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(function (bufferViewData) {
                    var numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
                    var byteOffset = accessor.byteOffset || 0;
                    var byteStride = bufferView.byteStride;
                    if (byteStride === 0) {
                        BABYLON.Tools.Warn(context + ": Byte stride of 0 is not valid");
                    }
                    try {
                        switch (accessor.componentType) {
                            case 5120 /* BYTE */: {
                                return _this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            }
                            case 5121 /* UNSIGNED_BYTE */: {
                                return _this._buildArrayBuffer(Uint8Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            }
                            case 5122 /* SHORT */: {
                                return _this._buildArrayBuffer(Int16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            }
                            case 5123 /* UNSIGNED_SHORT */: {
                                return _this._buildArrayBuffer(Uint16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            }
                            case 5125 /* UNSIGNED_INT */: {
                                return _this._buildArrayBuffer(Uint32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            }
                            case 5126 /* FLOAT */: {
                                return _this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            }
                            default: {
                                throw new Error(context + ": Invalid component type " + accessor.componentType);
                            }
                        }
                    }
                    catch (e) {
                        throw new Error(context + ": " + e);
                    }
                });
                return accessor._data;
            };
            GLTFLoader.prototype._buildArrayBuffer = function (typedArray, data, byteOffset, count, numComponents, byteStride) {
                byteOffset += data.byteOffset;
                var targetLength = count * numComponents;
                if (!byteStride || byteStride === numComponents * typedArray.BYTES_PER_ELEMENT) {
                    return new typedArray(data.buffer, byteOffset, targetLength);
                }
                var elementStride = byteStride / typedArray.BYTES_PER_ELEMENT;
                var sourceBuffer = new typedArray(data.buffer, byteOffset, elementStride * count);
                var targetBuffer = new typedArray(targetLength);
                var sourceIndex = 0;
                var targetIndex = 0;
                while (targetIndex < targetLength) {
                    for (var componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                        targetBuffer[targetIndex] = sourceBuffer[sourceIndex + componentIndex];
                        targetIndex++;
                    }
                    sourceIndex += elementStride;
                }
                return targetBuffer;
            };
            GLTFLoader.prototype._getDefaultMaterial = function () {
                var id = "__gltf_default";
                var babylonMaterial = this._babylonScene.getMaterialByName(id);
                if (!babylonMaterial) {
                    babylonMaterial = new BABYLON.PBRMaterial(id, this._babylonScene);
                    babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                    babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? BABYLON.Material.CounterClockWiseSideOrientation : BABYLON.Material.ClockWiseSideOrientation;
                    babylonMaterial.metallic = 1;
                    babylonMaterial.roughness = 1;
                    this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                }
                return babylonMaterial;
            };
            GLTFLoader.prototype._loadMaterialMetallicRoughnessPropertiesAsync = function (context, material) {
                var promises = new Array();
                var babylonMaterial = material._babylonMaterial;
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
                this._loadMaterialAlphaProperties(context, material);
                return Promise.all(promises).then(function () { });
            };
            GLTFLoader.prototype._loadMaterialAsync = function (context, material, babylonMesh) {
                var promise = GLTF2.GLTFLoaderExtension._LoadMaterialAsync(this, context, material, babylonMesh);
                if (promise) {
                    return promise;
                }
                material._babylonMeshes = material._babylonMeshes || [];
                material._babylonMeshes.push(babylonMesh);
                if (material._loaded) {
                    babylonMesh.material = material._babylonMaterial;
                    return material._loaded;
                }
                var promises = new Array();
                var babylonMaterial = this._createMaterial(material);
                material._babylonMaterial = babylonMaterial;
                promises.push(this._loadMaterialBasePropertiesAsync(context, material));
                promises.push(this._loadMaterialMetallicRoughnessPropertiesAsync(context, material));
                this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                babylonMesh.material = babylonMaterial;
                return (material._loaded = Promise.all(promises).then(function () { }));
            };
            GLTFLoader.prototype._createMaterial = function (material) {
                var babylonMaterial = new BABYLON.PBRMaterial(material.name || "material" + material._index, this._babylonScene);
                babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? BABYLON.Material.CounterClockWiseSideOrientation : BABYLON.Material.ClockWiseSideOrientation;
                return babylonMaterial;
            };
            GLTFLoader.prototype._loadMaterialBasePropertiesAsync = function (context, material) {
                var promises = new Array();
                var babylonMaterial = material._babylonMaterial;
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
            GLTFLoader.prototype._loadMaterialAlphaProperties = function (context, material) {
                var babylonMaterial = material._babylonMaterial;
                var alphaMode = material.alphaMode || "OPAQUE" /* OPAQUE */;
                switch (alphaMode) {
                    case "OPAQUE" /* OPAQUE */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                        break;
                    }
                    case "MASK" /* MASK */: {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
                        babylonMaterial.alphaCutOff = (material.alphaCutoff == undefined ? 0.5 : material.alphaCutoff);
                        if (babylonMaterial.alpha) {
                            if (babylonMaterial.alpha === 0) {
                                babylonMaterial.alphaCutOff = 1;
                            }
                            else {
                                babylonMaterial.alphaCutOff /= babylonMaterial.alpha;
                            }
                            babylonMaterial.alpha = 1;
                        }
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
                        throw new Error(context + ": Invalid alpha mode " + material.alphaMode);
                    }
                }
            };
            GLTFLoader.prototype._loadTextureAsync = function (context, textureInfo, assign) {
                var texture = GLTFLoader._GetProperty(context + "/index", this._gltf.textures, textureInfo.index);
                context = "#/textures/" + textureInfo.index;
                var promises = new Array();
                var sampler = (texture.sampler == undefined ? this._defaultSampler : GLTFLoader._GetProperty(context + "/sampler", this._gltf.samplers, texture.sampler));
                var samplerData = this._loadSampler("#/samplers/" + sampler._index, sampler);
                var deferred = new BABYLON.Deferred();
                var babylonTexture = new BABYLON.Texture(null, this._babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, function () {
                    deferred.resolve();
                }, function (message, exception) {
                    deferred.reject(new Error(context + ": " + (exception && exception.message) ? exception.message : message || "Failed to load texture"));
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
                return new Promise(function (resolve, reject) {
                    var request = BABYLON.Tools.LoadFile(_this._rootUrl + uri, function (data) {
                        resolve(new Uint8Array(data));
                    }, function (event) {
                        try {
                            if (request && _this._state === BABYLON.GLTFLoaderState.Loading) {
                                request._lengthComputable = event.lengthComputable;
                                request._loaded = event.loaded;
                                request._total = event.total;
                                _this._onProgress();
                            }
                        }
                        catch (e) {
                            reject(e);
                        }
                    }, _this._babylonScene.database, true, function (request, exception) {
                        reject(new BABYLON.LoadFileError(context + ": Failed to load '" + uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""), request));
                    });
                    _this._requests.push(request);
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
            GLTFLoader._GetProperty = function (context, array, index) {
                if (!array || index == undefined || !array[index]) {
                    throw new Error(context + ": Failed to find index " + index);
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
                        BABYLON.Tools.Warn(context + ": Invalid texture wrap mode " + mode);
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
                            BABYLON.Tools.Warn(context + ": Invalid texture minification filter " + minFilter);
                            return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                    }
                }
                else {
                    if (magFilter !== 9728 /* NEAREST */) {
                        BABYLON.Tools.Warn(context + ": Invalid texture magnification filter " + magFilter);
                    }
                    switch (minFilter) {
                        case 9728 /* NEAREST */: return BABYLON.Texture.NEAREST_NEAREST;
                        case 9729 /* LINEAR */: return BABYLON.Texture.NEAREST_LINEAR;
                        case 9984 /* NEAREST_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                        case 9985 /* LINEAR_MIPMAP_NEAREST */: return BABYLON.Texture.NEAREST_LINEAR_MIPNEAREST;
                        case 9986 /* NEAREST_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_NEAREST_MIPLINEAR;
                        case 9987 /* LINEAR_MIPMAP_LINEAR */: return BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn(context + ": Invalid texture minification filter " + minFilter);
                            return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                    }
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
                throw new Error(context + ": Invalid type " + type);
            };
            GLTFLoader._ValidateUri = function (uri) {
                return (BABYLON.Tools.IsBase64(uri) || uri.indexOf("..") === -1);
            };
            GLTFLoader.prototype._compileMaterialsAsync = function () {
                var promises = new Array();
                if (this._gltf.materials) {
                    for (var _i = 0, _a = this._gltf.materials; _i < _a.length; _i++) {
                        var material = _a[_i];
                        var babylonMaterial = material._babylonMaterial;
                        var babylonMeshes = material._babylonMeshes;
                        if (babylonMaterial && babylonMeshes) {
                            for (var _b = 0, babylonMeshes_1 = babylonMeshes; _b < babylonMeshes_1.length; _b++) {
                                var babylonMesh = babylonMeshes_1[_b];
                                promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                                if (this.useClipPlane) {
                                    promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
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
            GLTFLoader.prototype._abortRequests = function () {
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    request.abort();
                }
                this._requests.length = 0;
            };
            GLTFLoader.prototype._releaseResources = function () {
                if (this._gltf.images) {
                    for (var _i = 0, _a = this._gltf.images; _i < _a.length; _i++) {
                        var image = _a[_i];
                        if (image._objectURL) {
                            image._objectURL.then(function (value) {
                                URL.revokeObjectURL(value);
                            });
                            image._objectURL = undefined;
                        }
                    }
                }
            };
            GLTFLoader.prototype._applyExtensions = function (actionAsync) {
                for (var _i = 0, _a = GLTFLoader._Names; _i < _a.length; _i++) {
                    var name_2 = _a[_i];
                    var extension = this._extensions[name_2];
                    if (extension.enabled) {
                        var promise = actionAsync(extension);
                        if (promise) {
                            return promise;
                        }
                    }
                }
                return null;
            };
            GLTFLoader._Names = new Array();
            GLTFLoader._Factories = {};
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
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension(loader) {
                this.enabled = true;
                this._loader = loader;
            }
            // #region Overridable Methods
            /** Override this method to modify the default behavior for loading scenes. */
            GLTFLoaderExtension.prototype._loadSceneAsync = function (context, node) { return null; };
            /** Override this method to modify the default behavior for loading nodes. */
            GLTFLoaderExtension.prototype._loadNodeAsync = function (context, node) { return null; };
            /** Override this method to modify the default behavior for loading materials. */
            GLTFLoaderExtension.prototype._loadMaterialAsync = function (context, material, babylonMesh) { return null; };
            /** Override this method to modify the default behavior for loading uris. */
            GLTFLoaderExtension.prototype._loadUriAsync = function (context, uri) { return null; };
            // #endregion
            /** Helper method called by a loader extension to load an glTF extension. */
            GLTFLoaderExtension.prototype._loadExtensionAsync = function (context, property, actionAsync) {
                var _this = this;
                if (!property.extensions) {
                    return null;
                }
                var extensions = property.extensions;
                var extension = extensions[this._name];
                if (!extension) {
                    return null;
                }
                // Clear out the extension before executing the action to avoid recursing into the same property.
                delete extensions[this._name];
                return actionAsync(context + "extensions/" + this._name, extension).then(function () {
                    // Restore the extension after completing the action.
                    extensions[_this._name] = extension;
                });
            };
            /** Helper method called by the loader to allow extensions to override loading scenes. */
            GLTFLoaderExtension._LoadSceneAsync = function (loader, context, scene) {
                return loader._applyExtensions(function (extension) { return extension._loadSceneAsync(context, scene); });
            };
            /** Helper method called by the loader to allow extensions to override loading nodes. */
            GLTFLoaderExtension._LoadNodeAsync = function (loader, context, node) {
                return loader._applyExtensions(function (extension) { return extension._loadNodeAsync(context, node); });
            };
            /** Helper method called by the loader to allow extensions to override loading materials. */
            GLTFLoaderExtension._LoadMaterialAsync = function (loader, context, material, babylonMesh) {
                return loader._applyExtensions(function (extension) { return extension._loadMaterialAsync(context, material, babylonMesh); });
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
            // https://github.com/sbtron/glTF/tree/MSFT_lod/extensions/Vendor/MSFT_lod
            var NAME = "MSFT_lod";
            var MSFTLOD = /** @class */ (function (_super) {
                __extends(MSFTLOD, _super);
                function MSFTLOD() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this._loadingNodeLOD = null;
                    _this._loadNodeSignals = {};
                    _this._loadingMaterialLOD = null;
                    _this._loadMaterialSignals = {};
                    return _this;
                }
                Object.defineProperty(MSFTLOD.prototype, "_name", {
                    get: function () {
                        return NAME;
                    },
                    enumerable: true,
                    configurable: true
                });
                MSFTLOD.prototype._loadNodeAsync = function (context, node) {
                    var _this = this;
                    return this._loadExtensionAsync(context, node, function (context, extension) {
                        var firstPromise;
                        var nodeLODs = MSFTLOD._GetLODs(context, node, _this._loader._gltf.nodes, extension.ids);
                        var _loop_1 = function (indexLOD) {
                            var nodeLOD = nodeLODs[indexLOD];
                            if (indexLOD !== 0) {
                                _this._loadingNodeLOD = nodeLOD;
                                _this._loadNodeSignals[nodeLOD._index] = new BABYLON.Deferred();
                            }
                            var promise = _this._loader._loadNodeAsync("#/nodes/" + nodeLOD._index, nodeLOD).then(function () {
                                if (indexLOD !== 0) {
                                    var previousNodeLOD = nodeLODs[indexLOD - 1];
                                    previousNodeLOD._babylonMesh.setEnabled(false);
                                }
                                if (indexLOD !== nodeLODs.length - 1) {
                                    var nodeIndex = nodeLODs[indexLOD + 1]._index;
                                    _this._loadNodeSignals[nodeIndex].resolve();
                                    delete _this._loadNodeSignals[nodeIndex];
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
                MSFTLOD.prototype._loadMaterialAsync = function (context, material, babylonMesh) {
                    var _this = this;
                    return this._loadExtensionAsync(context, material, function (context, extension) {
                        var firstPromise;
                        var materialLODs = MSFTLOD._GetLODs(context, material, _this._loader._gltf.materials, extension.ids);
                        var _loop_2 = function (indexLOD) {
                            var materialLOD = materialLODs[indexLOD];
                            if (indexLOD !== 0) {
                                _this._loadingMaterialLOD = materialLOD;
                                _this._loadMaterialSignals[materialLOD._index] = new BABYLON.Deferred();
                            }
                            var promise = _this._loader._loadMaterialAsync("#/materials/" + materialLOD._index, materialLOD, babylonMesh).then(function () {
                                if (indexLOD !== materialLODs.length - 1) {
                                    var materialIndex = materialLODs[indexLOD + 1]._index;
                                    _this._loadMaterialSignals[materialIndex].resolve();
                                    delete _this._loadMaterialSignals[materialIndex];
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
                MSFTLOD.prototype._loadUriAsync = function (context, uri) {
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
                MSFTLOD._GetLODs = function (context, property, array, ids) {
                    var properties = [property];
                    for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                        var id = ids_1[_i];
                        properties.push(GLTF2.GLTFLoader._GetProperty(context + "/ids/" + id, array, id));
                    }
                    return properties.reverse();
                };
                return MSFTLOD;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFTLOD = MSFTLOD;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new MSFTLOD(loader); });
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
            // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
            var NAME = "KHR_materials_pbrSpecularGlossiness";
            var KHRMaterialsPbrSpecularGlossiness = /** @class */ (function (_super) {
                __extends(KHRMaterialsPbrSpecularGlossiness, _super);
                function KHRMaterialsPbrSpecularGlossiness() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Object.defineProperty(KHRMaterialsPbrSpecularGlossiness.prototype, "_name", {
                    get: function () {
                        return NAME;
                    },
                    enumerable: true,
                    configurable: true
                });
                KHRMaterialsPbrSpecularGlossiness.prototype._loadMaterialAsync = function (context, material, babylonMesh) {
                    var _this = this;
                    return this._loadExtensionAsync(context, material, function (context, extension) {
                        material._babylonMeshes = material._babylonMeshes || [];
                        material._babylonMeshes.push(babylonMesh);
                        if (material._loaded) {
                            babylonMesh.material = material._babylonMaterial;
                            return material._loaded;
                        }
                        var promises = new Array();
                        var babylonMaterial = _this._loader._createMaterial(material);
                        material._babylonMaterial = babylonMaterial;
                        promises.push(_this._loader._loadMaterialBasePropertiesAsync(context, material));
                        promises.push(_this._loadSpecularGlossinessPropertiesAsync(_this._loader, context, material, extension));
                        _this._loader.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                        babylonMesh.material = babylonMaterial;
                        return (material._loaded = Promise.all(promises).then(function () { }));
                    });
                };
                KHRMaterialsPbrSpecularGlossiness.prototype._loadSpecularGlossinessPropertiesAsync = function (loader, context, material, properties) {
                    var promises = new Array();
                    var babylonMaterial = material._babylonMaterial;
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
                        promises.push(loader._loadTextureAsync(context + "/diffuseTexture", properties.diffuseTexture, function (texture) {
                            babylonMaterial.albedoTexture = texture;
                        }));
                    }
                    if (properties.specularGlossinessTexture) {
                        promises.push(loader._loadTextureAsync(context + "/specularGlossinessTexture", properties.specularGlossinessTexture, function (texture) {
                            babylonMaterial.reflectivityTexture = texture;
                        }));
                        babylonMaterial.reflectivityTexture.hasAlpha = true;
                        babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    }
                    loader._loadMaterialAlphaProperties(context, material);
                    return Promise.all(promises).then(function () { });
                };
                return KHRMaterialsPbrSpecularGlossiness;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHRMaterialsPbrSpecularGlossiness = KHRMaterialsPbrSpecularGlossiness;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHRMaterialsPbrSpecularGlossiness(loader); });
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
            // https://github.com/MiiBond/glTF/tree/khr_lights_v1/extensions/Khronos/KHR_lights
            var NAME = "KHR_lights";
            var LightType;
            (function (LightType) {
                LightType["AMBIENT"] = "ambient";
                LightType["DIRECTIONAL"] = "directional";
                LightType["POINT"] = "point";
                LightType["SPOT"] = "spot";
            })(LightType || (LightType = {}));
            var KHRLights = /** @class */ (function (_super) {
                __extends(KHRLights, _super);
                function KHRLights() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Object.defineProperty(KHRLights.prototype, "_name", {
                    get: function () {
                        return NAME;
                    },
                    enumerable: true,
                    configurable: true
                });
                KHRLights.prototype._loadSceneAsync = function (context, scene) {
                    var _this = this;
                    return this._loadExtensionAsync(context, scene, function (context, extension) {
                        var promise = _this._loader._loadSceneAsync(context, scene);
                        var light = GLTF2.GLTFLoader._GetProperty(context, _this._lights, extension.light);
                        if (light.type !== LightType.AMBIENT) {
                            throw new Error(context + ": Only ambient lights are allowed on a scene");
                        }
                        _this._loader._babylonScene.ambientColor = light.color ? BABYLON.Color3.FromArray(light.color) : BABYLON.Color3.Black();
                        return promise;
                    });
                };
                KHRLights.prototype._loadNodeAsync = function (context, node) {
                    var _this = this;
                    return this._loadExtensionAsync(context, node, function (context, extension) {
                        var promise = _this._loader._loadNodeAsync(context, node);
                        var babylonLight;
                        var light = GLTF2.GLTFLoader._GetProperty(context, _this._lights, extension.light);
                        var name = node._babylonMesh.name;
                        switch (light.type) {
                            case LightType.AMBIENT: {
                                throw new Error(context + ": Ambient lights are not allowed on a node");
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
                                throw new Error(context + ": Invalid light type " + light.type);
                            }
                        }
                        babylonLight.diffuse = light.color ? BABYLON.Color3.FromArray(light.color) : BABYLON.Color3.White();
                        babylonLight.intensity = light.intensity == undefined ? 1 : light.intensity;
                        babylonLight.parent = node._babylonMesh;
                        return promise;
                    });
                };
                Object.defineProperty(KHRLights.prototype, "_lights", {
                    get: function () {
                        var extensions = this._loader._gltf.extensions;
                        if (!extensions || !extensions[this._name]) {
                            throw new Error("#/extensions: " + this._name + " not found");
                        }
                        var extension = extensions[this._name];
                        return extension.lights;
                    },
                    enumerable: true,
                    configurable: true
                });
                return KHRLights;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHRLights = KHRLights;
            GLTF2.GLTFLoader._Register(NAME, function (loader) { return new KHRLights(loader); });
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_lights.js.map
