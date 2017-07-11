/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTFFileLoader = (function () {
        function GLTFFileLoader() {
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onError) {
            var loaderData = GLTFFileLoader._parse(data);
            var loader = this._getLoader(loaderData);
            if (!loader) {
                onError();
                return;
            }
            loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onSuccess, onError);
        };
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onError) {
            var loaderData = GLTFFileLoader._parse(data);
            var loader = this._getLoader(loaderData);
            if (!loader) {
                onError();
                return;
            }
            return loader.loadAsync(scene, loaderData, rootUrl, onSuccess, onError);
        };
        GLTFFileLoader.prototype.canDirectLoad = function (data) {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        };
        GLTFFileLoader._parse = function (data) {
            if (data instanceof ArrayBuffer) {
                return GLTFFileLoader._parseBinary(data);
            }
            return {
                json: JSON.parse(data),
                bin: null
            };
        };
        GLTFFileLoader.prototype._getLoader = function (loaderData) {
            var loaderVersion = { major: 2, minor: 0 };
            var asset = loaderData.json.asset || {};
            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                BABYLON.Tools.Error("Invalid version");
                return null;
            }
            var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
            if (minVersion) {
                if (GLTFFileLoader._compareVersion(minVersion, loaderVersion) > 0) {
                    BABYLON.Tools.Error("Incompatible version");
                    return null;
                }
            }
            var createLoader = {
                1: GLTFFileLoader.CreateGLTFLoaderV1,
                2: GLTFFileLoader.CreateGLTFLoaderV2
            };
            var loader = createLoader[version.major](this);
            if (loader === null) {
                BABYLON.Tools.Error("Unsupported version");
                return null;
            }
            return loader;
        };
        GLTFFileLoader._parseBinary = function (data) {
            var Binary = {
                Magic: 0x46546C67
            };
            var binaryReader = new BinaryReader(data);
            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                BABYLON.Tools.Error("Unexpected magic: " + magic);
                return null;
            }
            var version = binaryReader.readUint32();
            switch (version) {
                case 1: return GLTFFileLoader._parseV1(binaryReader);
                case 2: return GLTFFileLoader._parseV2(binaryReader);
            }
            BABYLON.Tools.Error("Unsupported version: " + version);
            return null;
        };
        GLTFFileLoader._parseV1 = function (binaryReader) {
            var ContentFormat = {
                JSON: 0
            };
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                BABYLON.Tools.Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
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
                    BABYLON.Tools.Error("Unexpected content format: " + contentFormat);
                    return null;
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
                BABYLON.Tools.Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
                return null;
            }
            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                BABYLON.Tools.Error("First chunk format is not JSON");
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
                        BABYLON.Tools.Error("Unexpected JSON chunk");
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
        return GLTFFileLoader;
    }());
    // V1 options
    GLTFFileLoader.HomogeneousCoordinates = false;
    GLTFFileLoader.IncrementalLoading = true;
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
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onError) {
                var _this = this;
                this._loadAsync(meshesNames, scene, data, rootUrl, function () {
                    var meshes = [];
                    if (_this._gltf.nodes) {
                        for (var i = 0; i < _this._gltf.nodes.length; i++) {
                            var node = _this._gltf.nodes[i];
                            if (node.babylonMesh) {
                                meshes.push(node.babylonMesh);
                            }
                        }
                    }
                    var skeletons = [];
                    if (_this._gltf.skins) {
                        for (var i = 0; i < _this._gltf.skins.length; i++) {
                            var skin = _this._gltf.skins[i];
                            if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                                skeletons.push(skin.babylonSkeleton);
                            }
                        }
                    }
                    onSuccess(meshes, null, skeletons);
                }, onError);
            };
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onError) {
                this._loadAsync(null, scene, data, rootUrl, onSuccess, onError);
            };
            GLTFLoader.prototype._loadAsync = function (nodeNames, scene, data, rootUrl, onSuccess, onError) {
                scene.useRightHandedSystem = true;
                this._clear();
                this._loadData(data);
                this._babylonScene = scene;
                this._rootUrl = rootUrl;
                this._onSuccess = onSuccess;
                this._onError = onError;
                this.addPendingData(this);
                this._loadScene(nodeNames);
                this._loadAnimations();
                this.removePendingData(this);
            };
            GLTFLoader.prototype._onRenderReady = function () {
                this._showMeshes();
                this._startAnimations();
                if (this._errors.length === 0) {
                    this._onSuccess();
                }
                else {
                    this._errors.forEach(function (error) { return BABYLON.Tools.Error(error); });
                    this._errors = [];
                    this._onError();
                }
            };
            GLTFLoader.prototype._onLoaderComplete = function () {
                this._errors.forEach(function (error) { return BABYLON.Tools.Error(error); });
                this._errors = [];
                this._clear();
                if (this._parent.onComplete) {
                    this._parent.onComplete();
                }
            };
            GLTFLoader.prototype._loadData = function (data) {
                this._gltf = data.json;
                var binaryBuffer;
                var buffers = this._gltf.buffers;
                if (buffers.length > 0 && buffers[0].uri === undefined) {
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
            GLTFLoader.prototype._showMeshes = function () {
                var nodes = this._gltf.nodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    if (node.babylonMesh) {
                        node.babylonMesh.isVisible = true;
                    }
                }
            };
            GLTFLoader.prototype._startAnimations = function () {
                var animations = this._gltf.animations;
                if (!animations) {
                    return;
                }
                for (var i = 0; i < animations.length; i++) {
                    var animation = animations[i];
                    for (var j = 0; j < animation.targets.length; j++) {
                        this._babylonScene.beginAnimation(animation.targets[j], 0, Number.MAX_VALUE, true);
                    }
                }
            };
            GLTFLoader.prototype._clear = function () {
                // Revoke object urls created during load
                if (this._gltf && this._gltf.textures) {
                    for (var i = 0; i < this._gltf.textures.length; i++) {
                        var texture = this._gltf.textures[i];
                        if (texture.blobURL) {
                            URL.revokeObjectURL(texture.blobURL);
                        }
                    }
                }
                this._gltf = undefined;
                this._errors = [];
                this._babylonScene = undefined;
                this._rootUrl = undefined;
                this._defaultMaterial = undefined;
                this._onSuccess = undefined;
                this._onError = undefined;
                this._renderReady = false;
                this._renderPendingCount = 0;
                this._loaderPendingCount = 0;
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
                this._traverseNodes(nodeIndices, function (node) { return _this._loadSkin(node); });
                this._traverseNodes(nodeIndices, function (node) { return _this._loadMesh(node); });
            };
            GLTFLoader.prototype._loadSkin = function (node) {
                var _this = this;
                if (node.skin !== undefined) {
                    var skin = this._gltf.skins[node.skin];
                    var skeletonId = "skeleton" + node.skin;
                    skin.babylonSkeleton = new BABYLON.Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
                    skin.index = node.skin;
                    for (var i = 0; i < skin.joints.length; i++) {
                        this._createBone(this._gltf.nodes[skin.joints[i]], skin);
                    }
                    if (skin.skeleton === undefined) {
                        // TODO: handle when skeleton is not defined
                        throw new Error("Not implemented");
                    }
                    if (skin.inverseBindMatrices === undefined) {
                        // TODO: handle when inverse bind matrices are not defined
                        throw new Error("Not implemented");
                    }
                    var accessor = this._gltf.accessors[skin.inverseBindMatrices];
                    this._loadAccessorAsync(accessor, function (data) {
                        _this._traverseNode(skin.skeleton, function (node, index, parent) { return _this._updateBone(node, parent, skin, data); });
                    });
                }
                return true;
            };
            GLTFLoader.prototype._updateBone = function (node, parentNode, skin, inverseBindMatrixData) {
                var jointIndex = skin.joints.indexOf(node.index);
                if (jointIndex === -1) {
                    this._createBone(node, skin);
                }
                var babylonBone = node.babylonSkinToBones[skin.index];
                // TODO: explain the math
                var matrix = jointIndex === -1 ? BABYLON.Matrix.Identity() : BABYLON.Matrix.FromArray(inverseBindMatrixData, jointIndex * 16);
                matrix.invertToRef(matrix);
                if (parentNode) {
                    babylonBone.setParent(parentNode.babylonSkinToBones[skin.index], false);
                    matrix.multiplyToRef(babylonBone.getParent().getInvertedAbsoluteTransform(), matrix);
                }
                babylonBone.updateMatrix(matrix);
                return true;
            };
            GLTFLoader.prototype._createBone = function (node, skin) {
                var babylonBone = new BABYLON.Bone(node.name || "bone" + node.index, skin.babylonSkeleton);
                node.babylonSkinToBones = node.babylonSkinToBones || {};
                node.babylonSkinToBones[skin.index] = babylonBone;
                node.babylonAnimationTargets = node.babylonAnimationTargets || [];
                node.babylonAnimationTargets.push(babylonBone);
                return babylonBone;
            };
            GLTFLoader.prototype._loadMesh = function (node) {
                var babylonMesh = new BABYLON.Mesh(node.name || "mesh" + node.index, this._babylonScene);
                babylonMesh.isVisible = false;
                this._loadTransform(node, babylonMesh);
                if (node.mesh !== undefined) {
                    var mesh = this._gltf.meshes[node.mesh];
                    this._loadMeshData(node, mesh, babylonMesh);
                }
                babylonMesh.parent = node.parent ? node.parent.babylonMesh : null;
                node.babylonMesh = babylonMesh;
                node.babylonAnimationTargets = node.babylonAnimationTargets || [];
                node.babylonAnimationTargets.push(node.babylonMesh);
                if (node.skin !== undefined) {
                    var skin = this._gltf.skins[node.skin];
                    babylonMesh.skeleton = skin.babylonSkeleton;
                }
                if (node.camera !== undefined) {
                    // TODO: handle cameras
                }
                return true;
            };
            GLTFLoader.prototype._loadMeshData = function (node, mesh, babylonMesh) {
                var _this = this;
                babylonMesh.name = mesh.name || babylonMesh.name;
                var babylonMultiMaterial = new BABYLON.MultiMaterial(babylonMesh.name, this._babylonScene);
                babylonMesh.material = babylonMultiMaterial;
                var geometry = new BABYLON.Geometry(babylonMesh.name, this._babylonScene, null, false, babylonMesh);
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
                    this_1._createMorphTargets(node, mesh, primitive, babylonMesh);
                    this_1._loadVertexDataAsync(primitive, function (subVertexData) {
                        _this._loadMorphTargetsData(mesh, primitive, subVertexData, babylonMesh);
                        subMeshInfos.push({
                            materialIndex: i,
                            verticesStart: vertexData.positions.length,
                            verticesCount: subVertexData.positions.length,
                            indicesStart: vertexData.indices.length,
                            indicesCount: subVertexData.indices.length
                        });
                        vertexData.merge(subVertexData);
                        if (primitive.material === undefined) {
                            babylonMultiMaterial.subMaterials[i] = _this._getDefaultMaterial();
                        }
                        else {
                            _this.loadMaterial(primitive.material, function (babylonSubMaterial) {
                                if (_this._renderReady) {
                                    babylonSubMaterial.forceCompilation(babylonMesh, function (babylonSubMaterial) {
                                        _this._assignMaterial(babylonMultiMaterial, i, babylonSubMaterial);
                                    });
                                }
                                else {
                                    _this._assignMaterial(babylonMultiMaterial, i, babylonSubMaterial);
                                }
                            });
                        }
                        if (++loadedPrimitives === totalPrimitives) {
                            geometry.setAllVerticesData(vertexData, false);
                            // TODO: optimize this so that sub meshes can be created without being overwritten after setting vertex data.
                            // Sub meshes must be cleared and created after setting vertex data because of mesh._createGlobalSubMesh.
                            babylonMesh.subMeshes = [];
                            subMeshInfos.forEach(function (info) { return new BABYLON.SubMesh(info.materialIndex, info.verticesStart, info.verticesCount, info.indicesStart, info.indicesCount, babylonMesh); });
                        }
                    });
                };
                var this_1 = this;
                for (var i = 0; i < totalPrimitives; i++) {
                    _loop_1(i);
                }
            };
            GLTFLoader.prototype._assignMaterial = function (multiMaterial, index, subMaterial) {
                multiMaterial.subMaterials[index] = subMaterial;
                if (this._parent.onMaterialLoaded) {
                    this._parent.onMaterialLoaded(subMaterial);
                }
            };
            GLTFLoader.prototype._loadVertexDataAsync = function (primitive, onSuccess) {
                var _this = this;
                var attributes = primitive.attributes;
                if (!attributes) {
                    this._errors.push("Primitive has no attributes");
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
            GLTFLoader.prototype._loadTransform = function (node, babylonMesh) {
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
                babylonMesh.position = position;
                babylonMesh.rotationQuaternion = rotation;
                babylonMesh.scaling = scaling;
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
                    }, null, null, true, function (request) {
                        _this._errors.push("Failed to load file '" + buffer.uri + "': " + request.statusText + "(" + request.status + ")");
                        _this.removePendingData(buffer);
                    });
                }
            };
            GLTFLoader.prototype._loadBufferViewAsync = function (bufferView, byteOffset, byteLength, componentType, onSuccess) {
                var _this = this;
                byteOffset += (bufferView.byteOffset || 0);
                this._loadBufferAsync(bufferView.buffer, function (bufferData) {
                    if (byteOffset + byteLength > bufferData.byteLength) {
                        _this._errors.push("Buffer access is out of range");
                        return;
                    }
                    var buffer = bufferData.buffer;
                    byteOffset += bufferData.byteOffset;
                    var bufferViewData;
                    switch (componentType) {
                        case GLTF2.EComponentType.BYTE:
                            bufferViewData = new Int8Array(buffer, byteOffset, byteLength);
                            break;
                        case GLTF2.EComponentType.UNSIGNED_BYTE:
                            bufferViewData = new Uint8Array(buffer, byteOffset, byteLength);
                            break;
                        case GLTF2.EComponentType.SHORT:
                            bufferViewData = new Int16Array(buffer, byteOffset, byteLength);
                            break;
                        case GLTF2.EComponentType.UNSIGNED_SHORT:
                            bufferViewData = new Uint16Array(buffer, byteOffset, byteLength);
                            break;
                        case GLTF2.EComponentType.UNSIGNED_INT:
                            bufferViewData = new Uint32Array(buffer, byteOffset, byteLength);
                            break;
                        case GLTF2.EComponentType.FLOAT:
                            bufferViewData = new Float32Array(buffer, byteOffset, byteLength);
                            break;
                        default:
                            _this._errors.push("Invalid component type (" + componentType + ")");
                            return;
                    }
                    onSuccess(bufferViewData);
                });
            };
            GLTFLoader.prototype._loadAccessorAsync = function (accessor, onSuccess) {
                var bufferView = this._gltf.bufferViews[accessor.bufferView];
                var byteOffset = accessor.byteOffset || 0;
                var byteLength = accessor.count * GLTF2.GLTFUtils.GetByteStrideFromType(accessor);
                this._loadBufferViewAsync(bufferView, byteOffset, byteLength, accessor.componentType, onSuccess);
            };
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
            GLTFLoader.prototype.addLoaderPendingData = function (data) {
                this._loaderPendingCount++;
            };
            GLTFLoader.prototype.removeLoaderPendingData = function (data) {
                if (--this._loaderPendingCount === 0) {
                    this._onLoaderComplete();
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
                    this.loadMaterialAlphaProperties(material);
                }
                if (properties.metallicRoughnessTexture) {
                    babylonMaterial.metallicTexture = this.loadTexture(properties.metallicRoughnessTexture);
                    babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                    babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                    babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                }
            };
            GLTFLoader.prototype.loadMaterial = function (index, assign) {
                var material = this._gltf.materials[index];
                material.index = index;
                if (material.babylonMaterial) {
                    assign(material.babylonMaterial);
                    return;
                }
                if (GLTF2.GLTFLoaderExtension.LoadMaterial(this, material, assign)) {
                    return;
                }
                this.createPbrMaterial(material);
                this.loadMaterialBaseProperties(material);
                this._loadMaterialMetallicRoughnessProperties(material);
                assign(material.babylonMaterial);
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
            GLTFLoader.prototype.loadMaterialAlphaProperties = function (material) {
                var babylonMaterial = material.babylonMaterial;
                var alphaMode = material.alphaMode || "OPAQUE";
                switch (alphaMode) {
                    case "OPAQUE":
                        // default is opaque
                        break;
                    case "MASK":
                        babylonMaterial.albedoTexture.hasAlpha = true;
                        babylonMaterial.useAlphaFromAlbedoTexture = false;
                        break;
                    case "BLEND":
                        babylonMaterial.albedoTexture.hasAlpha = true;
                        babylonMaterial.useAlphaFromAlbedoTexture = true;
                        break;
                    default:
                        BABYLON.Tools.Warn("Invalid alpha mode '" + material.alphaMode + "'");
                        break;
                }
            };
            GLTFLoader.prototype.loadTexture = function (textureInfo) {
                var _this = this;
                var texture = this._gltf.textures[textureInfo.index];
                var texCoord = textureInfo.texCoord || 0;
                if (!texture || texture.source === undefined) {
                    return null;
                }
                // check the cache first
                var babylonTexture;
                if (texture.babylonTextures) {
                    babylonTexture = texture.babylonTextures[texCoord];
                    if (!babylonTexture) {
                        for (var i = 0; i < texture.babylonTextures.length; i++) {
                            babylonTexture = texture.babylonTextures[i];
                            if (babylonTexture) {
                                babylonTexture = babylonTexture.clone();
                                babylonTexture.coordinatesIndex = texCoord;
                                break;
                            }
                        }
                    }
                    return babylonTexture;
                }
                var source = this._gltf.images[texture.source];
                var url;
                if (!source.uri) {
                    var bufferView = this._gltf.bufferViews[source.bufferView];
                    this._loadBufferViewAsync(bufferView, 0, bufferView.byteLength, GLTF2.EComponentType.UNSIGNED_BYTE, function (data) {
                        texture.blobURL = URL.createObjectURL(new Blob([data], { type: source.mimeType }));
                        texture.babylonTextures[texCoord].updateURL(texture.blobURL);
                    });
                }
                else if (GLTF2.GLTFUtils.IsBase64(source.uri)) {
                    var data = new Uint8Array(GLTF2.GLTFUtils.DecodeBase64(source.uri));
                    texture.blobURL = URL.createObjectURL(new Blob([data], { type: source.mimeType }));
                    url = texture.blobURL;
                }
                else {
                    url = this._rootUrl + source.uri;
                }
                var sampler = (texture.sampler === undefined ? {} : this._gltf.samplers[texture.sampler]);
                var noMipMaps = (sampler.minFilter === GLTF2.ETextureMinFilter.NEAREST || sampler.minFilter === GLTF2.ETextureMinFilter.LINEAR);
                var samplingMode = GLTF2.GLTFUtils.GetTextureFilterMode(sampler.minFilter);
                this.addPendingData(texture);
                var babylonTexture = new BABYLON.Texture(url, this._babylonScene, noMipMaps, false, samplingMode, function () {
                    _this.removePendingData(texture);
                }, function () {
                    _this._errors.push("Failed to load texture '" + source.uri + "'");
                    _this.removePendingData(texture);
                });
                babylonTexture.coordinatesIndex = texCoord;
                babylonTexture.wrapU = GLTF2.GLTFUtils.GetWrapMode(sampler.wrapS);
                babylonTexture.wrapV = GLTF2.GLTFUtils.GetWrapMode(sampler.wrapT);
                babylonTexture.name = texture.name || "texture" + textureInfo.index;
                // Cache the texture
                texture.babylonTextures = texture.babylonTextures || [];
                texture.babylonTextures[texCoord] = babylonTexture;
                if (this._parent.onTextureLoaded) {
                    this._parent.onTextureLoaded(babylonTexture);
                }
                return babylonTexture;
            };
            return GLTFLoader;
        }());
        GLTFLoader.Extensions = {};
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
            /**
            * Returns the wrap mode of the texture
            * @param mode: the mode value
            */
            GLTFUtils.GetWrapMode = function (mode) {
                switch (mode) {
                    case GLTF2.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default: return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            /**
             * Returns the byte stride giving an accessor
             * @param accessor: the GLTF accessor objet
             */
            GLTFUtils.GetByteStrideFromType = function (accessor) {
                // Needs this function since "byteStride" isn't requiered in glTF format
                var type = accessor.type;
                switch (type) {
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                    default: return 1;
                }
            };
            /**
             * Returns the texture filter mode giving a mode value
             * @param mode: the filter mode value
             */
            GLTFUtils.GetTextureFilterMode = function (mode) {
                switch (mode) {
                    case GLTF2.ETextureMinFilter.LINEAR:
                    case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_NEAREST:
                    case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
                    case GLTF2.ETextureMinFilter.NEAREST:
                    case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_SAMPLINGMODE;
                    default: return BABYLON.Texture.BILINEAR_SAMPLINGMODE;
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
            return GLTFLoaderExtension;
        }());
        //
        // Utilities
        //
        GLTFLoaderExtension._Extensions = [];
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
                    loader.addLoaderPendingData(material);
                    // Start with the lowest quality LOD.
                    var materialLODs = [material.index].concat(properties.ids);
                    this.loadMaterialLOD(loader, material, materialLODs, materialLODs.length - 1, assign);
                    return true;
                };
                MSFTLOD.prototype.loadMaterialLOD = function (loader, material, materialLODs, lod, assign) {
                    var _this = this;
                    loader.loadMaterial(materialLODs[lod], function (babylonMaterial) {
                        babylonMaterial.name += ".LOD" + lod;
                        assign(babylonMaterial);
                        // Loading is complete if this is the highest quality LOD.
                        if (lod === 0) {
                            loader.removeLoaderPendingData(material);
                            return;
                        }
                        // Load the next LOD when all of the textures are loaded.
                        BABYLON.BaseTexture.WhenAllReady(babylonMaterial.getActiveTextures(), function () {
                            _this.loadMaterialLOD(loader, material, materialLODs, lod - 1, assign);
                        });
                    });
                };
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
                    assign(material.babylonMaterial);
                    return true;
                };
                KHRMaterialsPbrSpecularGlossiness.prototype._loadSpecularGlossinessProperties = function (loader, material, properties) {
                    var babylonMaterial = material.babylonMaterial;
                    babylonMaterial.albedoColor = properties.diffuseFactor ? BABYLON.Color3.FromArray(properties.diffuseFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;
                    if (properties.diffuseTexture) {
                        babylonMaterial.albedoTexture = loader.loadTexture(properties.diffuseTexture);
                        loader.loadMaterialAlphaProperties(material);
                    }
                    if (properties.specularGlossinessTexture) {
                        babylonMaterial.reflectivityTexture = loader.loadTexture(properties.specularGlossinessTexture);
                        babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    }
                };
                return KHRMaterialsPbrSpecularGlossiness;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHRMaterialsPbrSpecularGlossiness = KHRMaterialsPbrSpecularGlossiness;
            GLTF2.GLTFLoader.RegisterExtension(new KHRMaterialsPbrSpecularGlossiness());
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_pbrSpecularGlossiness.js.map
