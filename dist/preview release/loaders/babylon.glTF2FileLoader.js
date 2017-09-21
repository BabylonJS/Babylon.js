/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTFLoaderCoordinateSystemMode;
    (function (GLTFLoaderCoordinateSystemMode) {
        // Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene (scene.useRightHandedSystem).
        // NOTE: When scene.useRightHandedSystem is false, an additional transform will be added to the root to transform the data from right-handed to left-handed.
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["AUTO"] = 0] = "AUTO";
        // The glTF right-handed data is not transformed in any form and is loaded directly.
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["PASS_THROUGH"] = 1] = "PASS_THROUGH";
        // Sets the useRightHandedSystem flag on the scene.
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["FORCE_RIGHT_HANDED"] = 2] = "FORCE_RIGHT_HANDED";
    })(GLTFLoaderCoordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode || (BABYLON.GLTFLoaderCoordinateSystemMode = {}));
    var GLTFFileLoader = (function () {
        function GLTFFileLoader() {
            // V2 options
            this.coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
            this.name = "gltf";
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
            var loaderData = GLTFFileLoader._parse(data, onError);
            if (!loaderData) {
                return;
            }
            var loader = this._getLoader(loaderData, onError);
            if (!loader) {
                return;
            }
            loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onSuccess, onProgress, onError);
        };
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onProgress, onError) {
            var loaderData = GLTFFileLoader._parse(data, onError);
            if (!loaderData) {
                return;
            }
            var loader = this._getLoader(loaderData, onError);
            if (!loader) {
                return;
            }
            return loader.loadAsync(scene, loaderData, rootUrl, onSuccess, onProgress, onError);
        };
        GLTFFileLoader.prototype.canDirectLoad = function (data) {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        };
        GLTFFileLoader._parse = function (data, onError) {
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
        };
        GLTFFileLoader.prototype._getLoader = function (loaderData, onError) {
            var loaderVersion = { major: 2, minor: 0 };
            var asset = loaderData.json.asset || {};
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
        };
        GLTFFileLoader._parseBinary = function (data, onError) {
            var Binary = {
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
        };
        GLTFFileLoader._parseV1 = function (binaryReader, onError) {
            var ContentFormat = {
                JSON: 0
            };
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                onError("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
                return null;
            }
            var contentLength = binaryReader.readUint32();
            var contentFormat = binaryReader.readUint32();
            var content;
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
        };
        GLTFFileLoader._parseV2 = function (binaryReader, onError) {
            var ChunkFormat = {
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
            var bin = null;
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
        };
        GLTFFileLoader._parseVersion = function (version) {
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
        GLTFFileLoader._decodeBufferToText = function (view) {
            var result = "";
            var length = view.byteLength;
            for (var i = 0; i < length; ++i) {
                result += String.fromCharCode(view[i]);
            }
            return result;
        };
        // V1 options
        GLTFFileLoader.HomogeneousCoordinates = false;
        GLTFFileLoader.IncrementalLoading = true;
        return GLTFFileLoader;
    }());
    BABYLON.GLTFFileLoader = GLTFFileLoader;
    var BinaryReader = (function () {
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
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF2.EComponentType || (GLTF2.EComponentType = {}));
        var EMeshPrimitiveMode;
        (function (EMeshPrimitiveMode) {
            EMeshPrimitiveMode[EMeshPrimitiveMode["POINTS"] = 0] = "POINTS";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINES"] = 1] = "LINES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_LOOP"] = 2] = "LINE_LOOP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_STRIP"] = 3] = "LINE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLES"] = 4] = "TRIANGLES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
        })(EMeshPrimitiveMode = GLTF2.EMeshPrimitiveMode || (GLTF2.EMeshPrimitiveMode = {}));
        var ETextureMagFilter;
        (function (ETextureMagFilter) {
            ETextureMagFilter[ETextureMagFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMagFilter[ETextureMagFilter["LINEAR"] = 9729] = "LINEAR";
        })(ETextureMagFilter = GLTF2.ETextureMagFilter || (GLTF2.ETextureMagFilter = {}));
        var ETextureMinFilter;
        (function (ETextureMinFilter) {
            ETextureMinFilter[ETextureMinFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR"] = 9729] = "LINEAR";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureMinFilter = GLTF2.ETextureMinFilter || (GLTF2.ETextureMinFilter = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF2.ETextureWrapMode || (GLTF2.ETextureWrapMode = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFLoader = (function () {
            function GLTFLoader(parent) {
                this._renderReady = false;
                this._disposed = false;
                this._blockPendingTracking = false;
                // Observable with boolean indicating success or error.
                this._renderReadyObservable = new BABYLON.Observable();
                // Count of pending work that needs to complete before the asset is rendered.
                this._renderPendingCount = 0;
                // Count of pending work that needs to complete before the loader is cleared.
                this._loaderPendingCount = 0;
                this._parent = parent;
            }
            GLTFLoader.RegisterExtension = function (extension) {
                if (GLTFLoader.Extensions[extension.name]) {
                    BABYLON.Tools.Error("Extension with the same name '" + extension.name + "' already exists");
                    return;
                }
                GLTFLoader.Extensions[extension.name] = extension;
                // Keep the order of registration so that extensions registered first are called first.
                GLTF2.GLTFLoaderExtension._Extensions.push(extension);
            };
            Object.defineProperty(GLTFLoader.prototype, "gltf", {
                get: function () {
                    return this._gltf;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(GLTFLoader.prototype, "babylonScene", {
                get: function () {
                    return this._babylonScene;
                },
                enumerable: true,
                configurable: true
            });
            GLTFLoader.prototype.executeWhenRenderReady = function (func) {
                if (this._renderReady) {
                    func();
                }
                else {
                    this._renderReadyObservable.add(func);
                }
            };
            GLTFLoader.prototype.dispose = function () {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                // Revoke object urls created during load
                if (this._gltf.textures) {
                    this._gltf.textures.forEach(function (texture) {
                        if (texture.url) {
                            URL.revokeObjectURL(texture.url);
                        }
                    });
                }
                this._gltf = undefined;
                this._babylonScene = undefined;
                this._rootUrl = undefined;
                this._defaultMaterial = undefined;
                this._successCallback = undefined;
                this._errorCallback = undefined;
                this._renderReady = false;
                this._renderReadyObservable.clear();
                this._renderPendingCount = 0;
                this._loaderPendingCount = 0;
            };
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                this._loadAsync(meshesNames, scene, data, rootUrl, function () {
                    onSuccess(_this._getMeshes(), null, _this._getSkeletons());
                }, onProgress, onError);
            };
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onProgress, onError) {
                this._loadAsync(null, scene, data, rootUrl, onSuccess, onProgress, onError);
            };
            GLTFLoader.prototype._loadAsync = function (nodeNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
                this._loadData(data);
                this._babylonScene = scene;
                this._rootUrl = rootUrl;
                this._successCallback = onSuccess;
                this._progressCallback = onProgress;
                this._errorCallback = onError;
                this.addPendingData(this);
                this._loadScene(nodeNames);
                this._loadAnimations();
                this.removePendingData(this);
            };
            GLTFLoader.prototype._onError = function (message) {
                this._errorCallback(message);
                this.dispose();
            };
            GLTFLoader.prototype._onProgress = function (event) {
                this._progressCallback(event);
            };
            GLTFLoader.prototype._onRenderReady = function () {
                switch (this._parent.coordinateSystemMode) {
                    case BABYLON.GLTFLoaderCoordinateSystemMode.AUTO:
                        if (!this._babylonScene.useRightHandedSystem) {
                            this._addRightHandToLeftHandRootTransform();
                        }
                        break;
                    case BABYLON.GLTFLoaderCoordinateSystemMode.PASS_THROUGH:
                        // do nothing
                        break;
                    case BABYLON.GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED:
                        this._babylonScene.useRightHandedSystem = true;
                        break;
                    default:
                        BABYLON.Tools.Error("Invalid coordinate system mode (" + this._parent.coordinateSystemMode + ")");
                        break;
                }
                this._showMeshes();
                this._startAnimations();
                this._successCallback();
                this._renderReadyObservable.notifyObservers(this);
            };
            GLTFLoader.prototype._onLoaderComplete = function () {
                if (this._parent.onComplete) {
                    this._parent.onComplete();
                }
            };
            GLTFLoader.prototype._onLoaderFirstLODComplete = function () {
                if (this._parent.onFirstLODComplete) {
                    this._parent.onFirstLODComplete();
                }
            };
            GLTFLoader.prototype._loadData = function (data) {
                this._gltf = data.json;
                var binaryBuffer;
                var buffers = this._gltf.buffers;
                if (buffers && buffers[0].uri === undefined) {
                    binaryBuffer = buffers[0];
                }
                if (data.bin) {
                    if (binaryBuffer) {
                        if (binaryBuffer.byteLength != data.bin.byteLength) {
                            BABYLON.Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                        }
                    }
                    else {
                        BABYLON.Tools.Warn("Unexpected BIN chunk");
                    }
                    binaryBuffer.loadedData = data.bin;
                }
            };
            GLTFLoader.prototype._addRightHandToLeftHandRootTransform = function () {
                this._rootMesh = new BABYLON.Mesh("root", this._babylonScene);
                this._rootMesh.isVisible = false;
                this._rootMesh.scaling = new BABYLON.Vector3(1, 1, -1);
                this._rootMesh.rotation.y = Math.PI;
                var nodes = this._gltf.nodes;
                if (nodes) {
                    for (var i = 0; i < nodes.length; i++) {
                        var mesh = nodes[i].babylonMesh;
                        if (mesh && !mesh.parent) {
                            mesh.parent = this._rootMesh;
                        }
                    }
                }
            };
            GLTFLoader.prototype._getMeshes = function () {
                var meshes = [];
                if (this._rootMesh) {
                    meshes.push(this._rootMesh);
                }
                var nodes = this._gltf.nodes;
                if (nodes) {
                    nodes.forEach(function (node) {
                        if (node.babylonMesh) {
                            meshes.push(node.babylonMesh);
                        }
                    });
                }
                return meshes;
            };
            GLTFLoader.prototype._getSkeletons = function () {
                var skeletons = [];
                var skins = this._gltf.skins;
                if (skins) {
                    skins.forEach(function (skin) {
                        if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                            skeletons.push(skin.babylonSkeleton);
                        }
                    });
                }
                return skeletons;
            };
            GLTFLoader.prototype._getAnimationTargets = function () {
                var targets = [];
                var animations = this._gltf.animations;
                if (animations) {
                    animations.forEach(function (animation) {
                        targets.push.apply(targets, animation.targets);
                    });
                }
                return targets;
            };
            GLTFLoader.prototype._showMeshes = function () {
                this._getMeshes().forEach(function (mesh) { return mesh.isVisible = true; });
            };
            GLTFLoader.prototype._startAnimations = function () {
                var _this = this;
                this._getAnimationTargets().forEach(function (target) { return _this._babylonScene.beginAnimation(target, 0, Number.MAX_VALUE, true); });
            };
            GLTFLoader.prototype._loadScene = function (nodeNames) {
                var _this = this;
                var scene = this._gltf.scenes[this._gltf.scene || 0];
                var nodeIndices = scene.nodes;
                this._traverseNodes(nodeIndices, function (node, index, parentNode) {
                    node.index = index;
                    node.parent = parentNode;
                    return true;
                });
                var materials = this._gltf.materials;
                if (materials) {
                    materials.forEach(function (material, index) { return material.index = index; });
                }
                if (nodeNames) {
                    if (!(nodeNames instanceof Array)) {
                        nodeNames = [nodeNames];
                    }
                    var filteredNodeIndices = new Array();
                    this._traverseNodes(nodeIndices, function (node) {
                        if (nodeNames.indexOf(node.name) === -1) {
                            return true;
                        }
                        filteredNodeIndices.push(node.index);
                        return false;
                    });
                    nodeIndices = filteredNodeIndices;
                }
                this._traverseNodes(nodeIndices, function (node) { return _this._loadNode(node); });
            };
            GLTFLoader.prototype._loadNode = function (node) {
                node.babylonMesh = new BABYLON.Mesh(node.name || "mesh" + node.index, this._babylonScene);
                node.babylonMesh.isVisible = false;
                this._loadTransform(node);
                if (node.mesh !== undefined) {
                    var mesh = this._gltf.meshes[node.mesh];
                    this._loadMesh(node, mesh);
                }
                node.babylonMesh.parent = node.parent ? node.parent.babylonMesh : null;
                node.babylonAnimationTargets = node.babylonAnimationTargets || [];
                node.babylonAnimationTargets.push(node.babylonMesh);
                if (node.skin !== undefined) {
                    var skin = this._gltf.skins[node.skin];
                    skin.index = node.skin;
                    node.babylonMesh.skeleton = this._loadSkin(skin);
                }
                if (node.camera !== undefined) {
                    // TODO: handle cameras
                }
                return true;
            };
            GLTFLoader.prototype._loadMesh = function (node, mesh) {
                var _this = this;
                node.babylonMesh.name = mesh.name || node.babylonMesh.name;
                var babylonMultiMaterial = new BABYLON.MultiMaterial(node.babylonMesh.name, this._babylonScene);
                node.babylonMesh.material = babylonMultiMaterial;
                var geometry = new BABYLON.Geometry(node.babylonMesh.name, this._babylonScene, null, false, node.babylonMesh);
                var vertexData = new BABYLON.VertexData();
                vertexData.positions = [];
                vertexData.indices = [];
                var subMeshInfos = [];
                var loadedPrimitives = 0;
                var totalPrimitives = mesh.primitives.length;
                var _loop_1 = function (i) {
                    var primitive = mesh.primitives[i];
                    if (primitive.mode && primitive.mode !== GLTF2.EMeshPrimitiveMode.TRIANGLES) {
                        // TODO: handle other primitive modes
                        throw new Error("Not implemented");
                    }
                    this_1._createMorphTargets(node, mesh, primitive, node.babylonMesh);
                    this_1._loadVertexDataAsync(primitive, function (subVertexData) {
                        _this._loadMorphTargetsData(mesh, primitive, subVertexData, node.babylonMesh);
                        subMeshInfos.push({
                            materialIndex: i,
                            verticesStart: vertexData.positions.length,
                            verticesCount: subVertexData.positions.length,
                            indicesStart: vertexData.indices.length,
                            indicesCount: subVertexData.indices.length,
                            loadMaterial: function () {
                                if (primitive.material === undefined) {
                                    babylonMultiMaterial.subMaterials[i] = _this._getDefaultMaterial();
                                }
                                else {
                                    var material = _this._gltf.materials[primitive.material];
                                    _this.loadMaterial(material, function (babylonMaterial, isNew) {
                                        if (isNew && _this._parent.onMaterialLoaded) {
                                            _this._parent.onMaterialLoaded(babylonMaterial);
                                        }
                                        if (_this._parent.onBeforeMaterialReadyAsync) {
                                            _this.addLoaderPendingData(material);
                                            _this._parent.onBeforeMaterialReadyAsync(babylonMaterial, node.babylonMesh, babylonMultiMaterial.subMaterials[i] != null, function () {
                                                babylonMultiMaterial.subMaterials[i] = babylonMaterial;
                                                _this.removeLoaderPendingData(material);
                                            });
                                        }
                                        else {
                                            babylonMultiMaterial.subMaterials[i] = babylonMaterial;
                                        }
                                    });
                                }
                            }
                        });
                        vertexData.merge(subVertexData);
                        if (++loadedPrimitives === totalPrimitives) {
                            geometry.setAllVerticesData(vertexData, false);
                            subMeshInfos.forEach(function (info) { return info.loadMaterial(); });
                            // TODO: optimize this so that sub meshes can be created without being overwritten after setting vertex data.
                            // Sub meshes must be cleared and created after setting vertex data because of mesh._createGlobalSubMesh.
                            node.babylonMesh.subMeshes = [];
                            subMeshInfos.forEach(function (info) { return new BABYLON.SubMesh(info.materialIndex, info.verticesStart, info.verticesCount, info.indicesStart, info.indicesCount, node.babylonMesh); });
                        }
                    });
                };
                var this_1 = this;
                for (var i = 0; i < totalPrimitives; i++) {
                    _loop_1(i);
                }
            };
            GLTFLoader.prototype._loadVertexDataAsync = function (primitive, onSuccess) {
                var _this = this;
                var attributes = primitive.attributes;
                if (!attributes) {
                    this._onError("Primitive has no attributes");
                    return;
                }
                var vertexData = new BABYLON.VertexData();
                var loadedAttributes = 0;
                var totalAttributes = Object.keys(attributes).length;
                var _loop_2 = function (semantic) {
                    accessor = this_2._gltf.accessors[attributes[semantic]];
                    this_2._loadAccessorAsync(accessor, function (data) {
                        switch (semantic) {
                            case "NORMAL":
                                vertexData.normals = data;
                                break;
                            case "POSITION":
                                vertexData.positions = data;
                                break;
                            case "TANGENT":
                                vertexData.tangents = data;
                                break;
                            case "TEXCOORD_0":
                                vertexData.uvs = data;
                                break;
                            case "TEXCOORD_1":
                                vertexData.uvs2 = data;
                                break;
                            case "JOINTS_0":
                                vertexData.matricesIndices = new Float32Array(Array.prototype.slice.apply(data));
                                break;
                            case "WEIGHTS_0":
                                vertexData.matricesWeights = data;
                                break;
                            case "COLOR_0":
                                vertexData.colors = data;
                                break;
                            default:
                                BABYLON.Tools.Warn("Ignoring unrecognized semantic '" + semantic + "'");
                                break;
                        }
                        if (++loadedAttributes === totalAttributes) {
                            var indicesAccessor = _this._gltf.accessors[primitive.indices];
                            if (indicesAccessor) {
                                _this._loadAccessorAsync(indicesAccessor, function (data) {
                                    vertexData.indices = data;
                                    onSuccess(vertexData);
                                });
                            }
                            else {
                                vertexData.indices = new Uint32Array(vertexData.positions.length / 3);
                                vertexData.indices.forEach(function (v, i) { return vertexData.indices[i] = i; });
                                onSuccess(vertexData);
                            }
                        }
                    });
                };
                var this_2 = this, accessor;
                for (var semantic in attributes) {
                    _loop_2(semantic);
                }
            };
            GLTFLoader.prototype._createMorphTargets = function (node, mesh, primitive, babylonMesh) {
                var targets = primitive.targets;
                if (!targets) {
                    return;
                }
                if (!babylonMesh.morphTargetManager) {
                    babylonMesh.morphTargetManager = new BABYLON.MorphTargetManager();
                }
                for (var index = 0; index < targets.length; index++) {
                    var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                    babylonMesh.morphTargetManager.addTarget(new BABYLON.MorphTarget("morphTarget" + index, weight));
                }
            };
            GLTFLoader.prototype._loadMorphTargetsData = function (mesh, primitive, vertexData, babylonMesh) {
                var targets = primitive.targets;
                if (!targets) {
                    return;
                }
                var _loop_3 = function () {
                    var babylonMorphTarget = babylonMesh.morphTargetManager.getTarget(index);
                    attributes = targets[index];
                    var _loop_4 = function (semantic) {
                        accessor = this_3._gltf.accessors[attributes[semantic]];
                        this_3._loadAccessorAsync(accessor, function (data) {
                            if (accessor.name) {
                                babylonMorphTarget.name = accessor.name;
                            }
                            // glTF stores morph target information as deltas while babylon.js expects the final data.
                            // As a result we have to add the original data to the delta to calculate the final data.
                            var values = data;
                            switch (semantic) {
                                case "NORMAL":
                                    GLTF2.GLTFUtils.ForEach(values, function (v, i) { return values[i] += vertexData.normals[i]; });
                                    babylonMorphTarget.setNormals(values);
                                    break;
                                case "POSITION":
                                    GLTF2.GLTFUtils.ForEach(values, function (v, i) { return values[i] += vertexData.positions[i]; });
                                    babylonMorphTarget.setPositions(values);
                                    break;
                                case "TANGENT":
                                    // Tangent data for morph targets is stored as xyz delta.
                                    // The vertexData.tangent is stored as xyzw.
                                    // So we need to skip every fourth vertexData.tangent.
                                    for (var i = 0, j = 0; i < values.length; i++, j++) {
                                        values[i] += vertexData.tangents[j];
                                        if ((i + 1) % 3 == 0) {
                                            j++;
                                        }
                                    }
                                    babylonMorphTarget.setTangents(values);
                                    break;
                                default:
                                    BABYLON.Tools.Warn("Ignoring unrecognized semantic '" + semantic + "'");
                                    break;
                            }
                        });
                    };
                    for (var semantic in attributes) {
                        _loop_4(semantic);
                    }
                };
                var this_3 = this, attributes, accessor;
                for (var index = 0; index < targets.length; index++) {
                    _loop_3();
                }
            };
            GLTFLoader.prototype._loadTransform = function (node) {
                var position = BABYLON.Vector3.Zero();
                var rotation = BABYLON.Quaternion.Identity();
                var scaling = BABYLON.Vector3.One();
                if (node.matrix) {
                    var mat = BABYLON.Matrix.FromArray(node.matrix);
                    mat.decompose(scaling, rotation, position);
                }
                else {
                    if (node.translation)
                        position = BABYLON.Vector3.FromArray(node.translation);
                    if (node.rotation)
                        rotation = BABYLON.Quaternion.FromArray(node.rotation);
                    if (node.scale)
                        scaling = BABYLON.Vector3.FromArray(node.scale);
                }
                node.babylonMesh.position = position;
                node.babylonMesh.rotationQuaternion = rotation;
                node.babylonMesh.scaling = scaling;
            };
            GLTFLoader.prototype._loadSkin = function (skin) {
                var _this = this;
                var skeletonId = "skeleton" + skin.index;
                skin.babylonSkeleton = new BABYLON.Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
                if (skin.inverseBindMatrices === undefined) {
                    this._loadBones(skin, null);
                }
                else {
                    var accessor = this._gltf.accessors[skin.inverseBindMatrices];
                    this._loadAccessorAsync(accessor, function (data) {
                        _this._loadBones(skin, data);
                    });
                }
                return skin.babylonSkeleton;
            };
            GLTFLoader.prototype._createBone = function (node, skin, parent, localMatrix, baseMatrix, index) {
                var babylonBone = new BABYLON.Bone(node.name || "bone" + node.index, skin.babylonSkeleton, parent, localMatrix, null, baseMatrix, index);
                node.babylonBones = node.babylonBones || {};
                node.babylonBones[skin.index] = babylonBone;
                node.babylonAnimationTargets = node.babylonAnimationTargets || [];
                node.babylonAnimationTargets.push(babylonBone);
                return babylonBone;
            };
            GLTFLoader.prototype._loadBones = function (skin, inverseBindMatrixData) {
                var babylonBones = {};
                for (var i = 0; i < skin.joints.length; i++) {
                    var node = this._gltf.nodes[skin.joints[i]];
                    this._loadBone(node, skin, inverseBindMatrixData, babylonBones);
                }
            };
            GLTFLoader.prototype._loadBone = function (node, skin, inverseBindMatrixData, babylonBones) {
                var babylonBone = babylonBones[node.index];
                if (babylonBone) {
                    return babylonBone;
                }
                var boneIndex = skin.joints.indexOf(node.index);
                var baseMatrix = BABYLON.Matrix.Identity();
                if (inverseBindMatrixData && boneIndex !== -1) {
                    baseMatrix = BABYLON.Matrix.FromArray(inverseBindMatrixData, boneIndex * 16);
                    baseMatrix.invertToRef(baseMatrix);
                }
                var babylonParentBone;
                if (node.index != skin.skeleton && node.parent) {
                    babylonParentBone = this._loadBone(node.parent, skin, inverseBindMatrixData, babylonBones);
                    baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
                }
                babylonBone = this._createBone(node, skin, babylonParentBone, this._getNodeMatrix(node), baseMatrix, boneIndex);
                babylonBones[node.index] = babylonBone;
                return babylonBone;
            };
            GLTFLoader.prototype._getNodeMatrix = function (node) {
                return node.matrix ?
                    BABYLON.Matrix.FromArray(node.matrix) :
                    BABYLON.Matrix.Compose(node.scale ? BABYLON.Vector3.FromArray(node.scale) : BABYLON.Vector3.One(), node.rotation ? BABYLON.Quaternion.FromArray(node.rotation) : BABYLON.Quaternion.Identity(), node.translation ? BABYLON.Vector3.FromArray(node.translation) : BABYLON.Vector3.Zero());
            };
            GLTFLoader.prototype._traverseNodes = function (indices, action, parentNode) {
                if (parentNode === void 0) { parentNode = null; }
                for (var i = 0; i < indices.length; i++) {
                    this._traverseNode(indices[i], action, parentNode);
                }
            };
            GLTFLoader.prototype._traverseNode = function (index, action, parentNode) {
                if (parentNode === void 0) { parentNode = null; }
                var node = this._gltf.nodes[index];
                if (!action(node, index, parentNode)) {
                    return;
                }
                if (node.children) {
                    for (var i = 0; i < node.children.length; i++) {
                        this._traverseNode(node.children[i], action, node);
                    }
                }
            };
            GLTFLoader.prototype._loadAnimations = function () {
                var animations = this._gltf.animations;
                if (!animations || animations.length === 0) {
                    return;
                }
                for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                    var animation = animations[animationIndex];
                    for (var channelIndex = 0; channelIndex < animation.channels.length; channelIndex++) {
                        this._loadAnimationChannel(animation, animationIndex, channelIndex);
                    }
                }
            };
            GLTFLoader.prototype._loadAnimationChannel = function (animation, animationIndex, channelIndex) {
                var channel = animation.channels[channelIndex];
                var samplerIndex = channel.sampler;
                var sampler = animation.samplers[samplerIndex];
                var targetNode = this._gltf.nodes[channel.target.node];
                if (!targetNode) {
                    BABYLON.Tools.Warn("Animation channel target node (" + channel.target.node + ") does not exist");
                    return;
                }
                var targetPath = {
                    "translation": "position",
                    "rotation": "rotationQuaternion",
                    "scale": "scaling",
                    "weights": "influence"
                }[channel.target.path];
                if (!targetPath) {
                    BABYLON.Tools.Warn("Animation channel target path '" + channel.target.path + "' is not valid");
                    return;
                }
                var animationType = {
                    "position": BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    "rotationQuaternion": BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
                    "scaling": BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    "influence": BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                }[targetPath];
                var inputData;
                var outputData;
                var checkSuccess = function () {
                    if (!inputData || !outputData) {
                        return;
                    }
                    var outputBufferOffset = 0;
                    var getNextOutputValue = {
                        "position": function () {
                            var value = BABYLON.Vector3.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        },
                        "rotationQuaternion": function () {
                            var value = BABYLON.Quaternion.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 4;
                            return value;
                        },
                        "scaling": function () {
                            var value = BABYLON.Vector3.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        },
                        "influence": function () {
                            var numTargets = targetNode.babylonMesh.morphTargetManager.numTargets;
                            var value = new Array(numTargets);
                            for (var i = 0; i < numTargets; i++) {
                                value[i] = outputData[outputBufferOffset++];
                            }
                            return value;
                        },
                    }[targetPath];
                    var getNextKey = {
                        "LINEAR": function (frameIndex) { return ({
                            frame: inputData[frameIndex],
                            value: getNextOutputValue()
                        }); },
                        "CUBICSPLINE": function (frameIndex) { return ({
                            frame: inputData[frameIndex],
                            inTangent: getNextOutputValue(),
                            value: getNextOutputValue(),
                            outTangent: getNextOutputValue()
                        }); },
                    }[sampler.interpolation];
                    var keys = new Array(inputData.length);
                    for (var frameIndex = 0; frameIndex < inputData.length; frameIndex++) {
                        keys[frameIndex] = getNextKey(frameIndex);
                    }
                    animation.targets = animation.targets || [];
                    if (targetPath === "influence") {
                        var morphTargetManager = targetNode.babylonMesh.morphTargetManager;
                        for (var targetIndex = 0; targetIndex < morphTargetManager.numTargets; targetIndex++) {
                            var morphTarget = morphTargetManager.getTarget(targetIndex);
                            var animationName = (animation.name || "anim" + animationIndex) + "_" + targetIndex;
                            var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                            babylonAnimation.setKeys(keys.map(function (key) { return ({
                                frame: key.frame,
                                inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                                value: key.value[targetIndex],
                                outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                            }); }));
                            morphTarget.animations.push(babylonAnimation);
                            animation.targets.push(morphTarget);
                        }
                    }
                    else {
                        var animationName = animation.name || "anim" + animationIndex;
                        var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys);
                        for (var i = 0; i < targetNode.babylonAnimationTargets.length; i++) {
                            var target = targetNode.babylonAnimationTargets[i];
                            target.animations.push(babylonAnimation.clone());
                            animation.targets.push(target);
                        }
                    }
                };
                this._loadAccessorAsync(this._gltf.accessors[sampler.input], function (data) {
                    inputData = data;
                    checkSuccess();
                });
                this._loadAccessorAsync(this._gltf.accessors[sampler.output], function (data) {
                    outputData = data;
                    checkSuccess();
                });
            };
            GLTFLoader.prototype._loadBufferAsync = function (index, onSuccess) {
                var _this = this;
                var buffer = this._gltf.buffers[index];
                this.addPendingData(buffer);
                if (buffer.loadedData) {
                    setTimeout(function () {
                        onSuccess(buffer.loadedData);
                        _this.removePendingData(buffer);
                    });
                }
                else if (GLTF2.GLTFUtils.IsBase64(buffer.uri)) {
                    var data = GLTF2.GLTFUtils.DecodeBase64(buffer.uri);
                    buffer.loadedData = new Uint8Array(data);
                    setTimeout(function () {
                        onSuccess(buffer.loadedData);
                        _this.removePendingData(buffer);
                    });
                }
                else if (buffer.loadedObservable) {
                    buffer.loadedObservable.add(function (buffer) {
                        onSuccess(buffer.loadedData);
                        _this.removePendingData(buffer);
                    });
                }
                else {
                    buffer.loadedObservable = new BABYLON.Observable();
                    buffer.loadedObservable.add(function (buffer) {
                        onSuccess(buffer.loadedData);
                        _this.removePendingData(buffer);
                    });
                    BABYLON.Tools.LoadFile(this._rootUrl + buffer.uri, function (data) {
                        buffer.loadedData = new Uint8Array(data);
                        buffer.loadedObservable.notifyObservers(buffer);
                        buffer.loadedObservable = null;
                    }, function (event) {
                        if (!_this._disposed) {
                            _this._onProgress(event);
                        }
                    }, this._babylonScene.database, true, function (request) {
                        if (!_this._disposed) {
                            _this._onError("Failed to load file '" + buffer.uri + "': " + request.status + " " + request.statusText);
                            _this.removePendingData(buffer);
                        }
                    });
                }
            };
            GLTFLoader.prototype._buildInt8ArrayBuffer = function (buffer, byteOffset, byteLength, byteStride, bytePerComponent) {
                if (!byteStride) {
                    return new Int8Array(buffer, byteOffset, byteLength);
                }
                var sourceBuffer = new Int8Array(buffer, byteOffset);
                var targetBuffer = new Int8Array(byteLength);
                this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride, targetBuffer.length);
                return targetBuffer;
            };
            GLTFLoader.prototype._buildUint8ArrayBuffer = function (buffer, byteOffset, byteLength, byteStride, bytePerComponent) {
                if (!byteStride) {
                    return new Uint8Array(buffer, byteOffset, byteLength);
                }
                var sourceBuffer = new Uint8Array(buffer, byteOffset);
                var targetBuffer = new Uint8Array(byteLength);
                this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride, targetBuffer.length);
                return targetBuffer;
            };
            GLTFLoader.prototype._buildInt16ArrayBuffer = function (buffer, byteOffset, byteLength, byteStride, bytePerComponent) {
                if (!byteStride) {
                    return new Int16Array(buffer, byteOffset, byteLength);
                }
                var sourceBuffer = new Int16Array(buffer, byteOffset);
                var targetBuffer = new Int16Array(byteLength);
                this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 2, targetBuffer.length);
                return targetBuffer;
            };
            GLTFLoader.prototype._buildUint16ArrayBuffer = function (buffer, byteOffset, byteLength, byteStride, bytePerComponent) {
                if (!byteStride) {
                    return new Uint16Array(buffer, byteOffset, byteLength);
                }
                var sourceBuffer = new Uint16Array(buffer, byteOffset);
                var targetBuffer = new Uint16Array(byteLength);
                this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 2, targetBuffer.length);
                return targetBuffer;
            };
            GLTFLoader.prototype._buildUint32ArrayBuffer = function (buffer, byteOffset, byteLength, byteStride, bytePerComponent) {
                if (!byteStride) {
                    return new Uint32Array(buffer, byteOffset, byteLength);
                }
                var sourceBuffer = new Uint32Array(buffer, byteOffset);
                var targetBuffer = new Uint32Array(byteLength);
                this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 4, targetBuffer.length);
                return targetBuffer;
            };
            GLTFLoader.prototype._buildFloat32ArrayBuffer = function (buffer, byteOffset, byteLength, byteStride, bytePerComponent) {
                if (!byteStride) {
                    return new Float32Array(buffer, byteOffset, byteLength);
                }
                var sourceBuffer = new Float32Array(buffer, byteOffset);
                var targetBuffer = new Float32Array(byteLength);
                this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 4, targetBuffer.length);
                return targetBuffer;
            };
            GLTFLoader.prototype._extractInterleavedData = function (sourceBuffer, targetBuffer, bytePerComponent, stride, length) {
                var tempIndex = 0;
                var sourceIndex = 0;
                var storageSize = bytePerComponent;
                while (tempIndex < length) {
                    for (var cursor = 0; cursor < storageSize; cursor++) {
                        targetBuffer[tempIndex] = sourceBuffer[sourceIndex + cursor];
                        tempIndex++;
                    }
                    sourceIndex += stride;
                }
            };
            GLTFLoader.prototype._loadBufferViewAsync = function (bufferView, byteOffset, byteLength, bytePerComponent, componentType, onSuccess) {
                var _this = this;
                byteOffset += (bufferView.byteOffset || 0);
                this._loadBufferAsync(bufferView.buffer, function (bufferData) {
                    if (byteOffset + byteLength > bufferData.byteLength) {
                        _this._onError("Buffer access is out of range");
                        return;
                    }
                    var buffer = bufferData.buffer;
                    byteOffset += bufferData.byteOffset;
                    var bufferViewData;
                    switch (componentType) {
                        case GLTF2.EComponentType.BYTE:
                            bufferViewData = _this._buildInt8ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                            break;
                        case GLTF2.EComponentType.UNSIGNED_BYTE:
                            bufferViewData = _this._buildUint8ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                            break;
                        case GLTF2.EComponentType.SHORT:
                            bufferViewData = _this._buildInt16ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                            break;
                        case GLTF2.EComponentType.UNSIGNED_SHORT:
                            bufferViewData = _this._buildUint16ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                            break;
                        case GLTF2.EComponentType.UNSIGNED_INT:
                            bufferViewData = _this._buildUint32ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                            break;
                        case GLTF2.EComponentType.FLOAT:
                            bufferViewData = _this._buildFloat32ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                            break;
                        default:
                            _this._onError("Invalid component type (" + componentType + ")");
                            return;
                    }
                    onSuccess(bufferViewData);
                });
            };
            GLTFLoader.prototype._loadAccessorAsync = function (accessor, onSuccess) {
                var bufferView = this._gltf.bufferViews[accessor.bufferView];
                var byteOffset = accessor.byteOffset || 0;
                var bytePerComponent = this._getByteStrideFromType(accessor);
                var byteLength = accessor.count * bytePerComponent;
                this._loadBufferViewAsync(bufferView, byteOffset, byteLength, bytePerComponent, accessor.componentType, onSuccess);
            };
            GLTFLoader.prototype._getByteStrideFromType = function (accessor) {
                switch (accessor.type) {
                    case "SCALAR": return 1;
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                    default:
                        this._onError("Invalid accessor type (" + accessor.type + ")");
                        return 0;
                }
            };
            Object.defineProperty(GLTFLoader.prototype, "blockPendingTracking", {
                set: function (value) {
                    this._blockPendingTracking = value;
                },
                enumerable: true,
                configurable: true
            });
            GLTFLoader.prototype.addPendingData = function (data) {
                if (!this._renderReady) {
                    this._renderPendingCount++;
                }
                this.addLoaderPendingData(data);
            };
            GLTFLoader.prototype.removePendingData = function (data) {
                if (!this._renderReady) {
                    if (--this._renderPendingCount === 0) {
                        this._renderReady = true;
                        this._onRenderReady();
                    }
                }
                this.removeLoaderPendingData(data);
            };
            GLTFLoader.prototype.addLoaderNonBlockingPendingData = function (data) {
                if (!this._nonBlockingData) {
                    this._nonBlockingData = new Array();
                }
                this._nonBlockingData.push(data);
            };
            GLTFLoader.prototype.addLoaderPendingData = function (data) {
                if (this._blockPendingTracking) {
                    this.addLoaderNonBlockingPendingData(data);
                    return;
                }
                this._loaderPendingCount++;
            };
            GLTFLoader.prototype.removeLoaderPendingData = function (data) {
                var indexInPending = this._nonBlockingData ? this._nonBlockingData.indexOf(data) : -1;
                if (indexInPending !== -1) {
                    this._nonBlockingData.splice(indexInPending, 1);
                }
                else if (--this._loaderPendingCount === 0) {
                    this._onLoaderFirstLODComplete();
                }
                if ((!this._nonBlockingData || this._nonBlockingData.length === 0) && this._loaderPendingCount === 0) {
                    this._onLoaderComplete();
                    this.dispose();
                }
            };
            GLTFLoader.prototype._getDefaultMaterial = function () {
                if (!this._defaultMaterial) {
                    var id = "__gltf_default";
                    var material = this._babylonScene.getMaterialByName(id);
                    if (!material) {
                        material = new BABYLON.PBRMaterial(id, this._babylonScene);
                        material.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                        material.metallic = 1;
                        material.roughness = 1;
                    }
                    this._defaultMaterial = material;
                }
                return this._defaultMaterial;
            };
            GLTFLoader.prototype._loadMaterialMetallicRoughnessProperties = function (material) {
                var babylonMaterial = material.babylonMaterial;
                // Ensure metallic workflow
                babylonMaterial.metallic = 1;
                babylonMaterial.roughness = 1;
                var properties = material.pbrMetallicRoughness;
                if (!properties) {
                    return;
                }
                babylonMaterial.albedoColor = properties.baseColorFactor ? BABYLON.Color3.FromArray(properties.baseColorFactor) : new BABYLON.Color3(1, 1, 1);
                babylonMaterial.metallic = properties.metallicFactor === undefined ? 1 : properties.metallicFactor;
                babylonMaterial.roughness = properties.roughnessFactor === undefined ? 1 : properties.roughnessFactor;
                if (properties.baseColorTexture) {
                    babylonMaterial.albedoTexture = this.loadTexture(properties.baseColorTexture);
                }
                if (properties.metallicRoughnessTexture) {
                    babylonMaterial.metallicTexture = this.loadTexture(properties.metallicRoughnessTexture);
                    babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                    babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                    babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                }
                this.loadMaterialAlphaProperties(material, properties.baseColorFactor);
            };
            GLTFLoader.prototype.loadMaterial = function (material, assign) {
                if (material.babylonMaterial) {
                    assign(material.babylonMaterial, false);
                    return;
                }
                if (GLTF2.GLTFLoaderExtension.LoadMaterial(this, material, assign)) {
                    return;
                }
                this.createPbrMaterial(material);
                this.loadMaterialBaseProperties(material);
                this._loadMaterialMetallicRoughnessProperties(material);
                assign(material.babylonMaterial, true);
            };
            GLTFLoader.prototype.createPbrMaterial = function (material) {
                var babylonMaterial = new BABYLON.PBRMaterial(material.name || "mat" + material.index, this._babylonScene);
                babylonMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                material.babylonMaterial = babylonMaterial;
            };
            GLTFLoader.prototype.loadMaterialBaseProperties = function (material) {
                var babylonMaterial = material.babylonMaterial;
                babylonMaterial.emissiveColor = material.emissiveFactor ? BABYLON.Color3.FromArray(material.emissiveFactor) : new BABYLON.Color3(0, 0, 0);
                if (material.doubleSided) {
                    babylonMaterial.backFaceCulling = false;
                    babylonMaterial.twoSidedLighting = true;
                }
                if (material.normalTexture) {
                    babylonMaterial.bumpTexture = this.loadTexture(material.normalTexture);
                    babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                    babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                    if (material.normalTexture.scale !== undefined) {
                        babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                    }
                }
                if (material.occlusionTexture) {
                    babylonMaterial.ambientTexture = this.loadTexture(material.occlusionTexture);
                    babylonMaterial.useAmbientInGrayScale = true;
                    if (material.occlusionTexture.strength !== undefined) {
                        babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                    }
                }
                if (material.emissiveTexture) {
                    babylonMaterial.emissiveTexture = this.loadTexture(material.emissiveTexture);
                }
            };
            GLTFLoader.prototype.loadMaterialAlphaProperties = function (material, colorFactor) {
                var babylonMaterial = material.babylonMaterial;
                var alphaMode = material.alphaMode || "OPAQUE";
                switch (alphaMode) {
                    case "OPAQUE":
                        // default is opaque
                        break;
                    case "MASK":
                    case "BLEND":
                        if (colorFactor) {
                            babylonMaterial.alpha = colorFactor[3];
                        }
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                            babylonMaterial.useAlphaFromAlbedoTexture = (alphaMode === "BLEND");
                        }
                        break;
                    default:
                        BABYLON.Tools.Warn("Invalid alpha mode '" + material.alphaMode + "'");
                        break;
                }
                babylonMaterial.alphaCutOff = material.alphaCutoff === undefined ? 0.5 : material.alphaCutoff;
            };
            GLTFLoader.prototype.loadTexture = function (textureInfo) {
                var _this = this;
                var texture = this._gltf.textures[textureInfo.index];
                var texCoord = textureInfo.texCoord || 0;
                if (!texture || texture.source === undefined) {
                    return null;
                }
                var source = this._gltf.images[texture.source];
                var sampler = (texture.sampler === undefined ? {} : this._gltf.samplers[texture.sampler]);
                var noMipMaps = (sampler.minFilter === GLTF2.ETextureMinFilter.NEAREST || sampler.minFilter === GLTF2.ETextureMinFilter.LINEAR);
                var samplingMode = GLTF2.GLTFUtils.GetTextureSamplingMode(sampler.magFilter, sampler.minFilter);
                this.addPendingData(texture);
                var babylonTexture = new BABYLON.Texture(null, this._babylonScene, noMipMaps, false, samplingMode, function () {
                    if (!_this._disposed) {
                        _this.removePendingData(texture);
                    }
                }, function () {
                    if (!_this._disposed) {
                        _this._onError("Failed to load texture '" + source.uri + "'");
                        _this.removePendingData(texture);
                    }
                });
                if (texture.url) {
                    babylonTexture.updateURL(texture.url);
                }
                else if (texture.dataReadyObservable) {
                    texture.dataReadyObservable.add(function (texture) {
                        babylonTexture.updateURL(texture.url);
                    });
                }
                else {
                    texture.dataReadyObservable = new BABYLON.Observable();
                    texture.dataReadyObservable.add(function (texture) {
                        babylonTexture.updateURL(texture.url);
                    });
                    var setTextureData = function (data) {
                        texture.url = URL.createObjectURL(new Blob([data], { type: source.mimeType }));
                        texture.dataReadyObservable.notifyObservers(texture);
                    };
                    if (!source.uri) {
                        var bufferView = this._gltf.bufferViews[source.bufferView];
                        this._loadBufferViewAsync(bufferView, 0, bufferView.byteLength, 1, GLTF2.EComponentType.UNSIGNED_BYTE, setTextureData);
                    }
                    else if (GLTF2.GLTFUtils.IsBase64(source.uri)) {
                        setTextureData(new Uint8Array(GLTF2.GLTFUtils.DecodeBase64(source.uri)));
                    }
                    else {
                        BABYLON.Tools.LoadFile(this._rootUrl + source.uri, setTextureData, function (event) {
                            if (!_this._disposed) {
                                _this._onProgress(event);
                            }
                        }, this._babylonScene.database, true, function (request) {
                            _this._onError("Failed to load file '" + source.uri + "': " + request.status + " " + request.statusText);
                        });
                    }
                }
                babylonTexture.coordinatesIndex = texCoord;
                babylonTexture.wrapU = GLTF2.GLTFUtils.GetTextureWrapMode(sampler.wrapS);
                babylonTexture.wrapV = GLTF2.GLTFUtils.GetTextureWrapMode(sampler.wrapT);
                babylonTexture.name = texture.name || "texture" + textureInfo.index;
                if (this._parent.onTextureLoaded) {
                    this._parent.onTextureLoaded(babylonTexture);
                }
                return babylonTexture;
            };
            GLTFLoader.Extensions = {};
            return GLTFLoader;
        }());
        GLTF2.GLTFLoader = GLTFLoader;
        BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = function (parent) { return new GLTFLoader(parent); };
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
        * Utils functions for GLTF
        */
        var GLTFUtils = (function () {
            function GLTFUtils() {
            }
            /**
            * If the uri is a base64 string
            * @param uri: the uri to test
            */
            GLTFUtils.IsBase64 = function (uri) {
                return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
            };
            /**
            * Decode the base64 uri
            * @param uri: the uri to decode
            */
            GLTFUtils.DecodeBase64 = function (uri) {
                var decodedString = atob(uri.split(",")[1]);
                var bufferLength = decodedString.length;
                var bufferView = new Uint8Array(new ArrayBuffer(bufferLength));
                for (var i = 0; i < bufferLength; i++) {
                    bufferView[i] = decodedString.charCodeAt(i);
                }
                return bufferView.buffer;
            };
            GLTFUtils.ForEach = function (view, func) {
                for (var index = 0; index < view.length; index++) {
                    func(view[index], index);
                }
            };
            GLTFUtils.GetTextureWrapMode = function (mode) {
                // Set defaults if undefined
                mode = mode === undefined ? GLTF2.ETextureWrapMode.REPEAT : mode;
                switch (mode) {
                    case GLTF2.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default:
                        BABYLON.Tools.Warn("Invalid texture wrap mode (" + mode + ")");
                        return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            GLTFUtils.GetTextureSamplingMode = function (magFilter, minFilter) {
                // Set defaults if undefined
                magFilter = magFilter === undefined ? GLTF2.ETextureMagFilter.LINEAR : magFilter;
                minFilter = minFilter === undefined ? GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR : minFilter;
                if (magFilter === GLTF2.ETextureMagFilter.LINEAR) {
                    switch (minFilter) {
                        case GLTF2.ETextureMinFilter.NEAREST: return BABYLON.Texture.LINEAR_NEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR: return BABYLON.Texture.LINEAR_LINEAR;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.LINEAR_NEAREST_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return BABYLON.Texture.LINEAR_LINEAR_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return BABYLON.Texture.LINEAR_NEAREST_MIPLINEAR;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                    }
                }
                else {
                    if (magFilter !== GLTF2.ETextureMagFilter.NEAREST) {
                        BABYLON.Tools.Warn("Invalid texture magnification filter (" + magFilter + ")");
                    }
                    switch (minFilter) {
                        case GLTF2.ETextureMinFilter.NEAREST: return BABYLON.Texture.NEAREST_NEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR: return BABYLON.Texture.NEAREST_LINEAR;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_LINEAR_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return BABYLON.Texture.NEAREST_NEAREST_MIPLINEAR;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                    }
                }
            };
            /**
             * Decodes a buffer view into a string
             * @param view: the buffer view
             */
            GLTFUtils.DecodeBufferToText = function (view) {
                var result = "";
                var length = view.byteLength;
                for (var i = 0; i < length; ++i) {
                    result += String.fromCharCode(view[i]);
                }
                return result;
            };
            return GLTFUtils;
        }());
        GLTF2.GLTFUtils = GLTFUtils;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtils.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFLoaderExtension = (function () {
            function GLTFLoaderExtension() {
                this.enabled = true;
            }
            GLTFLoaderExtension.prototype.loadMaterial = function (loader, material, assign) { return false; };
            GLTFLoaderExtension.LoadMaterial = function (loader, material, assign) {
                return this._ApplyExtensions(function (extension) { return extension.loadMaterial(loader, material, assign); });
            };
            GLTFLoaderExtension._ApplyExtensions = function (action) {
                var extensions = GLTFLoaderExtension._Extensions;
                if (!extensions) {
                    return;
                }
                for (var i = 0; i < extensions.length; i++) {
                    var extension = extensions[i];
                    if (extension.enabled && action(extension)) {
                        return true;
                    }
                }
                return false;
            };
            //
            // Utilities
            //
            GLTFLoaderExtension._Extensions = [];
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
            var MSFTLOD = (function (_super) {
                __extends(MSFTLOD, _super);
                function MSFTLOD() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Object.defineProperty(MSFTLOD.prototype, "name", {
                    get: function () {
                        return "MSFT_lod";
                    },
                    enumerable: true,
                    configurable: true
                });
                MSFTLOD.prototype.loadMaterial = function (loader, material, assign) {
                    if (!material.extensions) {
                        return false;
                    }
                    var properties = material.extensions[this.name];
                    if (!properties) {
                        return false;
                    }
                    // Clear out the extension so that it won't get loaded again.
                    material.extensions[this.name] = undefined;
                    // Tell the loader not to clear its state until the highest LOD is loaded.
                    var materialLODs = [material.index].concat(properties.ids);
                    loader.addLoaderPendingData(material);
                    for (var index = 0; index < materialLODs.length; index++) {
                        loader.addLoaderNonBlockingPendingData(index);
                    }
                    // Start with the lowest quality LOD.
                    this.loadMaterialLOD(loader, material, materialLODs, materialLODs.length - 1, assign);
                    return true;
                };
                MSFTLOD.prototype.loadMaterialLOD = function (loader, material, materialLODs, lod, assign) {
                    var _this = this;
                    var materialLOD = loader.gltf.materials[materialLODs[lod]];
                    if (lod !== materialLODs.length - 1) {
                        loader.blockPendingTracking = true;
                    }
                    loader.loadMaterial(materialLOD, function (babylonMaterial, isNew) {
                        assign(babylonMaterial, isNew);
                        loader.removeLoaderPendingData(lod);
                        // Loading is considered complete if this is the lowest quality LOD.
                        if (lod === materialLODs.length - 1) {
                            loader.removeLoaderPendingData(material);
                        }
                        if (lod === 0) {
                            loader.blockPendingTracking = false;
                            return;
                        }
                        // Load the next LOD when the loader is ready to render and
                        // all active material textures of the current LOD are loaded.
                        loader.executeWhenRenderReady(function () {
                            BABYLON.BaseTexture.WhenAllReady(babylonMaterial.getActiveTextures(), function () {
                                setTimeout(function () {
                                    _this.loadMaterialLOD(loader, material, materialLODs, lod - 1, assign);
                                }, MSFTLOD.MinimalLODDelay);
                            });
                        });
                    });
                };
                /**
                 * Specify the minimal delay between LODs in ms (default = 250)
                 */
                MSFTLOD.MinimalLODDelay = 250;
                return MSFTLOD;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFTLOD = MSFTLOD;
            GLTF2.GLTFLoader.RegisterExtension(new MSFTLOD());
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
            var KHRMaterialsPbrSpecularGlossiness = (function (_super) {
                __extends(KHRMaterialsPbrSpecularGlossiness, _super);
                function KHRMaterialsPbrSpecularGlossiness() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Object.defineProperty(KHRMaterialsPbrSpecularGlossiness.prototype, "name", {
                    get: function () {
                        return "KHR_materials_pbrSpecularGlossiness";
                    },
                    enumerable: true,
                    configurable: true
                });
                KHRMaterialsPbrSpecularGlossiness.prototype.loadMaterial = function (loader, material, assign) {
                    if (!material.extensions) {
                        return false;
                    }
                    var properties = material.extensions[this.name];
                    if (!properties) {
                        return false;
                    }
                    loader.createPbrMaterial(material);
                    loader.loadMaterialBaseProperties(material);
                    this._loadSpecularGlossinessProperties(loader, material, properties);
                    assign(material.babylonMaterial, true);
                    return true;
                };
                KHRMaterialsPbrSpecularGlossiness.prototype._loadSpecularGlossinessProperties = function (loader, material, properties) {
                    var babylonMaterial = material.babylonMaterial;
                    babylonMaterial.albedoColor = properties.diffuseFactor ? BABYLON.Color3.FromArray(properties.diffuseFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;
                    if (properties.diffuseTexture) {
                        babylonMaterial.albedoTexture = loader.loadTexture(properties.diffuseTexture);
                    }
                    if (properties.specularGlossinessTexture) {
                        babylonMaterial.reflectivityTexture = loader.loadTexture(properties.specularGlossinessTexture);
                        babylonMaterial.reflectivityTexture.hasAlpha = true;
                        babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    }
                    loader.loadMaterialAlphaProperties(material, properties.diffuseFactor);
                };
                return KHRMaterialsPbrSpecularGlossiness;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHRMaterialsPbrSpecularGlossiness = KHRMaterialsPbrSpecularGlossiness;
            GLTF2.GLTFLoader.RegisterExtension(new KHRMaterialsPbrSpecularGlossiness());
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_pbrSpecularGlossiness.js.map
