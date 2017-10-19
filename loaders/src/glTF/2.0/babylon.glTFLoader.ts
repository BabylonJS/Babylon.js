/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    class GLTFLoaderTracker {
        private _pendingCount = 0;
        private _callback: () => void;

        constructor(onComplete: () => void) {
            this._callback = onComplete;
        }

        public _addPendingData(data: any): void {
            this._pendingCount++;
        }

        public _removePendingData(data: any): void {
            if (--this._pendingCount === 0) {
                this._callback();
            }
        }
    }

    interface TypedArray extends ArrayBufferView {
        [index: number]: number;
    }

    interface TypedArrayConstructor<T extends TypedArray> {
        readonly prototype: T;
        new(length: number): T;
        new(array: ArrayLike<number>): T;
        new(buffer: ArrayBuffer, byteOffset?: number, length?: number): T;

        readonly BYTES_PER_ELEMENT: number;
    }

    export class GLTFLoader implements IGLTFLoader, IDisposable {
        public _gltf: IGLTF;
        public _babylonScene: Scene;

        private _parent: GLTFFileLoader;
        private _rootUrl: string;
        private _defaultMaterial: PBRMaterial;
        private _rootNode: IGLTFNode;
        private _successCallback: () => void;
        private _progressCallback: (event: ProgressEvent) => void;
        private _errorCallback: (message: string) => void;
        private _renderReady = false;
        private _disposed = false;

        private _renderReadyObservable = new Observable<GLTFLoader>();

        // Count of pending work that needs to complete before the asset is rendered.
        private _renderPendingCount = 0;

        // Count of pending work that needs to complete before the loader is disposed.
        private _loaderPendingCount = 0;

        private _loaderTrackers = new Array<GLTFLoaderTracker>();

        public static Extensions: { [name: string]: GLTFLoaderExtension } = {};

        public static RegisterExtension(extension: GLTFLoaderExtension): void {
            if (GLTFLoader.Extensions[extension.name]) {
                Tools.Error("Extension with the same name '" + extension.name + "' already exists");
                return;
            }

            GLTFLoader.Extensions[extension.name] = extension;

            // Keep the order of registration so that extensions registered first are called first.
            GLTFLoaderExtension._Extensions.push(extension);
        }

        public constructor(parent: GLTFFileLoader) {
            this._parent = parent;
        }

        public dispose(): void {
            if (this._disposed) {
                return;
            }

            this._disposed = true;

            // Revoke object urls created during load
            if (this._gltf.textures) {
                this._gltf.textures.forEach(texture => {
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
        }

        public importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            this._loadAsync(meshesNames, scene, data, rootUrl, () => {
                onSuccess(this._getMeshes(), null, this._getSkeletons());
            }, onProgress, onError);
        }

        public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            this._loadAsync(null, scene, data, rootUrl, onSuccess, onProgress, onError);
        }

        private _loadAsync(nodeNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            this._tryCatchOnError(() => {
                this._loadData(data);
                this._babylonScene = scene;
                this._rootUrl = rootUrl;

                this._successCallback = onSuccess;
                this._progressCallback = onProgress;
                this._errorCallback = onError;

                GLTFUtils.AssignIndices(this._gltf.accessors);
                GLTFUtils.AssignIndices(this._gltf.animations);
                GLTFUtils.AssignIndices(this._gltf.buffers);
                GLTFUtils.AssignIndices(this._gltf.bufferViews);
                GLTFUtils.AssignIndices(this._gltf.images);
                GLTFUtils.AssignIndices(this._gltf.materials);
                GLTFUtils.AssignIndices(this._gltf.meshes);
                GLTFUtils.AssignIndices(this._gltf.nodes);
                GLTFUtils.AssignIndices(this._gltf.scenes);
                GLTFUtils.AssignIndices(this._gltf.skins);
                GLTFUtils.AssignIndices(this._gltf.textures);

                this._addPendingData(this);
                this._loadDefaultScene(nodeNames);
                this._loadAnimations();
                this._removePendingData(this);
            });
        }

        private _onError(message: string): void {
            if (this._disposed) {
                return;
            }

            Tools.Error("glTF Loader: " + message);

            if (this._errorCallback) {
                this._errorCallback(message);
            }

            this.dispose();
        }

        private _onProgress(event: ProgressEvent): void {
            if (this._disposed) {
                return;
            }

            if (this._progressCallback) {
                this._progressCallback(event);
            }
        }

        public _executeWhenRenderReady(func: () => void): void {
            if (this._renderReady) {
                func();
            }
            else {
                this._renderReadyObservable.add(func);
            }
        }

        private _onRenderReady(): void {
            this._rootNode.babylonMesh.setEnabled(true);

            this._startAnimations();
            this._successCallback();
            this._renderReadyObservable.notifyObservers(this);

            if (this._parent.onReady) {
                this._parent.onReady();
            }
        }

        private _onComplete(): void {
            if (this._parent.onComplete) {
                this._parent.onComplete();
            }

            this.dispose();
        }

        private _loadData(data: IGLTFLoaderData): void {
            this._gltf = <IGLTF>data.json;

            if (data.bin) {
                var buffers = this._gltf.buffers;
                if (buffers && buffers[0] && !buffers[0].uri) {
                    var binaryBuffer = buffers[0];
                    if (binaryBuffer.byteLength != data.bin.byteLength) {
                        Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                    }

                    binaryBuffer.loadedData = data.bin;
                }
                else {
                    Tools.Warn("Unexpected BIN chunk");
                }
            }
        }

        private _getMeshes(): Mesh[] {
            var meshes = [this._rootNode.babylonMesh];

            var nodes = this._gltf.nodes;
            if (nodes) {
                nodes.forEach(node => {
                    if (node.babylonMesh) {
                        meshes.push(node.babylonMesh);
                    }
                });
            }

            return meshes;
        }

        private _getSkeletons(): Skeleton[] {
            var skeletons = new Array<Skeleton>();

            var skins = this._gltf.skins;
            if (skins) {
                skins.forEach(skin => {
                    if (skin.babylonSkeleton instanceof Skeleton) {
                        skeletons.push(skin.babylonSkeleton);
                    }
                });
            }

            return skeletons;
        }

        private _getAnimationTargets(): any[] {
            var targets = new Array();

            var animations = this._gltf.animations;
            if (animations) {
                animations.forEach(animation => {
                    targets.push(...animation.targets);
                });
            }

            return targets;
        }

        private _startAnimations(): void {
            this._getAnimationTargets().forEach(target => this._babylonScene.beginAnimation(target, 0, Number.MAX_VALUE, true));
        }

        private _loadDefaultScene(nodeNames: any): void {
            var scene = GLTFUtils.GetArrayItem(this._gltf.scenes, this._gltf.scene || 0);
            if (!scene) {
                throw new Error("Failed to find scene " + (this._gltf.scene || 0));
            }

            this._loadScene("#/scenes/" + scene.index, scene, nodeNames);
        }

        private _loadScene(context: string, scene: IGLTFScene, nodeNames: any): void {
            this._rootNode = { babylonMesh: new Mesh("__root__", this._babylonScene) };

            switch (this._parent.coordinateSystemMode) {
                case GLTFLoaderCoordinateSystemMode.AUTO:
                    if (!this._babylonScene.useRightHandedSystem) {
                        this._rootNode.babylonMesh.rotation = new Vector3(0, Math.PI, 0);
                        this._rootNode.babylonMesh.scaling = new Vector3(1, 1, -1);
                    }
                    break;
                case GLTFLoaderCoordinateSystemMode.PASS_THROUGH:
                    // do nothing
                    break;
                case GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED:
                    this._babylonScene.useRightHandedSystem = true;
                    break;
                default:
                    Tools.Error("Invalid coordinate system mode (" + this._parent.coordinateSystemMode + ")");
                    return;
            }

            var nodeIndices = scene.nodes;

            this._traverseNodes(context, nodeIndices, (node, parentNode) => {
                node.parent = parentNode;
                return true;
            }, this._rootNode);

            if (nodeNames) {
                if (!(nodeNames instanceof Array)) {
                    nodeNames = [nodeNames];
                }

                var filteredNodeIndices = new Array<number>();
                this._traverseNodes(context, nodeIndices, node => {
                    if (nodeNames.indexOf(node.name) !== -1) {
                        filteredNodeIndices.push(node.index);
                        return false;
                    }

                    return true;
                }, this._rootNode);

                nodeIndices = filteredNodeIndices;
            }

            for (var i = 0; i < nodeIndices.length; i++) {
                var node = GLTFUtils.GetArrayItem(this._gltf.nodes, nodeIndices[i]);
                if (!node) {
                    throw new Error(context + ": Failed to find node " + nodeIndices[i]);
                }

                this._loadNode("#/nodes/" + nodeIndices[i], node);
            }

            // Disable the root mesh until the asset is ready to render.
            this._rootNode.babylonMesh.setEnabled(false);
        }

        public _loadNode(context: string, node: IGLTFNode): void {
            if (GLTFLoaderExtension.LoadNode(this, context, node)) {
                return;
            }

            node.babylonMesh = new Mesh(node.name || "mesh" + node.index, this._babylonScene);

            this._loadTransform(node);

            if (node.mesh != null) {
                var mesh = GLTFUtils.GetArrayItem(this._gltf.meshes, node.mesh);
                if (!mesh) {
                    throw new Error(context + ": Failed to find mesh " + node.mesh);
                }

                this._loadMesh("#/meshes/" + node.mesh, node, mesh);
            }

            node.babylonMesh.parent = node.parent ? node.parent.babylonMesh : null;

            node.babylonAnimationTargets = node.babylonAnimationTargets || [];
            node.babylonAnimationTargets.push(node.babylonMesh);

            if (node.skin != null) {
                var skin = GLTFUtils.GetArrayItem(this._gltf.skins, node.skin);
                if (!skin) {
                    throw new Error(context + ": Failed to find skin " + node.skin);
                }

                node.babylonMesh.skeleton = this._loadSkin("#/skins/" + node.skin, skin);
            }

            if (node.camera != null) {
                // TODO: handle cameras
            }

            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    var childNode = GLTFUtils.GetArrayItem(this._gltf.nodes, node.children[i]);
                    if (!childNode) {
                        throw new Error(context + ": Failed to find child node " + node.children[i]);
                    }

                    this._loadNode("#/nodes/" + node.children[i], childNode);
                }
            }
        }

        private _loadMesh(context: string, node: IGLTFNode, mesh: IGLTFMesh): void {
            node.babylonMesh.name = node.babylonMesh.name || mesh.name;

            if (!mesh.primitives || mesh.primitives.length === 0) {
                throw new Error(context + ": Primitives are missing");
            }

            this._createMorphTargets(context, node, mesh);

            this._loadAllVertexDataAsync(context, mesh, () => {
                this._loadMorphTargets(context, node, mesh);

                var primitives = mesh.primitives;

                var vertexData = new VertexData();
                for (var primitive of primitives) {
                    vertexData.merge(primitive.vertexData);
                }

                new Geometry(node.babylonMesh.name, this._babylonScene, vertexData, false, node.babylonMesh);

                // TODO: optimize this so that sub meshes can be created without being overwritten after setting vertex data.
                // Sub meshes must be cleared and created after setting vertex data because of mesh._createGlobalSubMesh.
                node.babylonMesh.subMeshes = [];

                var verticesStart = 0;
                var indicesStart = 0;
                for (var index = 0; index < primitives.length; index++) {
                    var vertexData = primitives[index].vertexData;
                    var verticesCount = vertexData.positions.length;
                    var indicesCount = vertexData.indices.length;
                    SubMesh.AddToMesh(index, verticesStart, verticesCount, indicesStart, indicesCount, node.babylonMesh);
                    verticesStart += verticesCount;
                    indicesStart += indicesCount;
                };

                var multiMaterial = new MultiMaterial(node.babylonMesh.name, this._babylonScene);
                node.babylonMesh.material = multiMaterial;
                var subMaterials = multiMaterial.subMaterials;
                for (var index = 0; index < primitives.length; index++) {
                    var primitive = primitives[index];

                    if (primitive.material == null) {
                        subMaterials[index] = this._getDefaultMaterial();
                    }
                    else {
                        var material = GLTFUtils.GetArrayItem(this._gltf.materials, primitive.material);
                        if (!material) {
                            throw new Error(context + ": Failed to find material " + primitive.material);
                        }

                        var capturedIndex = index;
                        this._loadMaterial("#/materials/" + material.index, material, (babylonMaterial, isNew) => {
                            if (isNew && this._parent.onMaterialLoaded) {
                                this._parent.onMaterialLoaded(babylonMaterial);
                            }

                            if (this._parent.onBeforeMaterialReadyAsync) {
                                this._addLoaderPendingData(material);
                                this._parent.onBeforeMaterialReadyAsync(babylonMaterial, node.babylonMesh, subMaterials[capturedIndex] != null, () => {
                                    subMaterials[capturedIndex] = babylonMaterial;
                                    this._removeLoaderPendingData(material);
                                });
                            } else {
                                subMaterials[capturedIndex] = babylonMaterial;
                            }
                        });
                    }
                };
            });
        }

        private _loadAllVertexDataAsync(context: string, mesh: IGLTFMesh, onSuccess: () => void): void {
            var primitives = mesh.primitives;
            var numRemainingPrimitives = primitives.length;
            for (var index = 0; index < primitives.length; index++) {
                let primitive = primitives[index];
                this._loadVertexDataAsync(context + "/primitive/" + index, mesh, primitive, vertexData => {
                    primitive.vertexData = vertexData;
                    if (--numRemainingPrimitives === 0) {
                        onSuccess();
                    }
                });
            }
        }

        private _loadVertexDataAsync(context: string, mesh: IGLTFMesh, primitive: IGLTFMeshPrimitive, onSuccess: (vertexData: VertexData) => void): void {
            var attributes = primitive.attributes;
            if (!attributes) {
                throw new Error(context + ": Attributes are missing");
            }

            if (primitive.mode && primitive.mode !== EMeshPrimitiveMode.TRIANGLES) {
                // TODO: handle other primitive modes
                throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
            }

            var vertexData = new VertexData();

            var numRemainingAttributes = Object.keys(attributes).length;
            for (let attribute in attributes) {
                var accessor = GLTFUtils.GetArrayItem(this._gltf.accessors, attributes[attribute]);
                if (!accessor) {
                    throw new Error(context + ": Failed to find attribute '" + attribute + "' accessor " + attributes[attribute]);
                }

                this._loadAccessorAsync("#/accessors/" + accessor.index, accessor, data => {
                    switch (attribute) {
                        case "NORMAL":
                            vertexData.normals = <Float32Array>data;
                            break;
                        case "POSITION":
                            vertexData.positions = <Float32Array>data;
                            break;
                        case "TANGENT":
                            vertexData.tangents = <Float32Array>data;
                            break;
                        case "TEXCOORD_0":
                            vertexData.uvs = <Float32Array>data;
                            break;
                        case "TEXCOORD_1":
                            vertexData.uvs2 = <Float32Array>data;
                            break;
                        case "JOINTS_0":
                            vertexData.matricesIndices = new Float32Array(Array.prototype.slice.apply(data));
                            break;
                        case "WEIGHTS_0":
                            vertexData.matricesWeights = <Float32Array>data;
                            break;
                        case "COLOR_0":
                            vertexData.colors = <Float32Array>data;
                            break;
                        default:
                            Tools.Warn("Ignoring unrecognized attribute '" + attribute + "'");
                            break;
                    }

                    if (--numRemainingAttributes === 0) {
                        if (primitive.indices == null) {
                            vertexData.indices = new Uint32Array(vertexData.positions.length / 3);
                            vertexData.indices.forEach((v, i) => vertexData.indices[i] = i);
                            onSuccess(vertexData);
                        }
                        else {
                            var indicesAccessor = GLTFUtils.GetArrayItem(this._gltf.accessors, primitive.indices);
                            if (!indicesAccessor) {
                                throw new Error(context + ": Failed to find indices accessor " + primitive.indices);
                            }

                            this._loadAccessorAsync("#/accessors/" + indicesAccessor.index, indicesAccessor, data => {
                                vertexData.indices = <IndicesArray>data;
                                onSuccess(vertexData);
                            });
                        }
                    }
                });
            }
        }

        private _createMorphTargets(context: string, node: IGLTFNode, mesh: IGLTFMesh): void {
            var primitives = mesh.primitives;

            var targets = primitives[0].targets;
            if (!targets) {
                return;
            }

            for (var primitive of primitives) {
                if (!primitive.targets || primitive.targets.length != targets.length) {
                    throw new Error(context + ": All primitives are required to list the same number of targets");
                }
            }

            var morphTargetManager = new MorphTargetManager();
            node.babylonMesh.morphTargetManager = morphTargetManager;
            for (var index = 0; index < targets.length; index++) {
                var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                morphTargetManager.addTarget(new MorphTarget("morphTarget" + index, weight));
            }
        }

        private _loadMorphTargets(context: string, node: IGLTFNode, mesh: IGLTFMesh): void {
            var morphTargetManager = node.babylonMesh.morphTargetManager;
            if (!morphTargetManager) {
                return;
            }

            this._loadAllMorphTargetVertexDataAsync(context, node, mesh, () => {
                var numTargets = morphTargetManager.numTargets;
                for (var index = 0; index < numTargets; index++) {
                    var vertexData = new VertexData();
                    for (var primitive of mesh.primitives) {
                        vertexData.merge(primitive.targetsVertexData[index], { tangentLength: 3 });
                    }

                    var target = morphTargetManager.getTarget(index);
                    target.setNormals(vertexData.normals);
                    target.setPositions(vertexData.positions);
                    target.setTangents(vertexData.tangents);
                }
            });
        }

        private _loadAllMorphTargetVertexDataAsync(context: string, node: IGLTFNode, mesh: IGLTFMesh, onSuccess: () => void): void {
            var numRemainingTargets = mesh.primitives.length * node.babylonMesh.morphTargetManager.numTargets;

            for (var primitive of mesh.primitives) {
                var targets = primitive.targets;
                primitive.targetsVertexData = new Array<VertexData>(targets.length);
                for (let index = 0; index < targets.length; index++) {
                    this._loadMorphTargetVertexDataAsync(context + "/targets/" + index, primitive.vertexData, targets[index], vertexData => {
                        primitive.targetsVertexData[index] = vertexData;
                        if (--numRemainingTargets === 0) {
                            onSuccess();
                        }
                    });
                }
            }
        }

        private _loadMorphTargetVertexDataAsync(context: string, vertexData: VertexData, attributes: { [name: string]: number }, onSuccess: (vertexData: VertexData) => void): void {
            var targetVertexData = new VertexData();

            var numRemainingAttributes = Object.keys(attributes).length;
            for (let attribute in attributes) {
                var accessor = GLTFUtils.GetArrayItem(this._gltf.accessors, attributes[attribute]);
                if (!accessor) {
                    throw new Error(context + ": Failed to find attribute '" + attribute + "' accessor " + attributes[attribute]);
                }

                this._loadAccessorAsync("#/accessors/" + accessor.index, accessor, data => {
                    // glTF stores morph target information as deltas while babylon.js expects the final data.
                    // As a result we have to add the original data to the delta to calculate the final data.
                    var values = <Float32Array>data;
                    switch (attribute) {
                        case "NORMAL":
                            for (var i = 0; i < values.length; i++) {
                                values[i] += vertexData.normals[i];
                            }
                            targetVertexData.normals = values;
                            break;
                        case "POSITION":
                            for (var i = 0; i < values.length; i++) {
                                values[i] += vertexData.positions[i];
                            }
                            targetVertexData.positions = values;
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
                            targetVertexData.tangents = values;
                            break;
                        default:
                            Tools.Warn("Ignoring unrecognized attribute '" + attribute + "'");
                            break;
                    }

                    if (--numRemainingAttributes === 0) {
                        onSuccess(targetVertexData);
                    }
                });
            }
        }

        private _loadTransform(node: IGLTFNode): void {
            var position: Vector3 = Vector3.Zero();
            var rotation: Quaternion = Quaternion.Identity();
            var scaling: Vector3 = Vector3.One();

            if (node.matrix) {
                var mat = Matrix.FromArray(node.matrix);
                mat.decompose(scaling, rotation, position);
            }
            else {
                if (node.translation) position = Vector3.FromArray(node.translation);
                if (node.rotation) rotation = Quaternion.FromArray(node.rotation);
                if (node.scale) scaling = Vector3.FromArray(node.scale);
            }

            node.babylonMesh.position = position;
            node.babylonMesh.rotationQuaternion = rotation;
            node.babylonMesh.scaling = scaling;
        }

        private _loadSkin(context: string, skin: IGLTFSkin): Skeleton {
            var skeletonId = "skeleton" + skin.index;
            skin.babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);

            if (skin.inverseBindMatrices == null) {
                this._loadBones(context, skin, null);
            }
            else {
                var accessor = GLTFUtils.GetArrayItem(this._gltf.accessors, skin.inverseBindMatrices);
                if (!accessor) {
                    throw new Error(context + ": Failed to find inverse bind matrices attribute " + skin.inverseBindMatrices);
                }

                this._loadAccessorAsync("#/accessors/" + accessor.index, accessor, data => {
                    this._loadBones(context, skin, <Float32Array>data);
                });
            }

            return skin.babylonSkeleton;
        }

        private _createBone(node: IGLTFNode, skin: IGLTFSkin, parent: Bone, localMatrix: Matrix, baseMatrix: Matrix, index: number): Bone {
            var babylonBone = new Bone(node.name || "bone" + node.index, skin.babylonSkeleton, parent, localMatrix, null, baseMatrix, index);

            node.babylonBones = node.babylonBones || {};
            node.babylonBones[skin.index] = babylonBone;

            node.babylonAnimationTargets = node.babylonAnimationTargets || [];
            node.babylonAnimationTargets.push(babylonBone);

            return babylonBone;
        }

        private _loadBones(context: string, skin: IGLTFSkin, inverseBindMatrixData: Float32Array): void {
            var babylonBones: { [index: number]: Bone } = {};
            for (var i = 0; i < skin.joints.length; i++) {
                var node = GLTFUtils.GetArrayItem(this._gltf.nodes, skin.joints[i]);
                if (!node) {
                    throw new Error(context + ": Failed to find joint " + skin.joints[i]);
                }

                this._loadBone(node, skin, inverseBindMatrixData, babylonBones);
            }
        }

        private _loadBone(node: IGLTFNode, skin: IGLTFSkin, inverseBindMatrixData: Float32Array, babylonBones: { [index: number]: Bone }): Bone {
            var babylonBone = babylonBones[node.index];
            if (babylonBone) {
                return babylonBone;
            }

            var boneIndex = skin.joints.indexOf(node.index);

            var baseMatrix = Matrix.Identity();
            if (inverseBindMatrixData && boneIndex !== -1) {
                baseMatrix = Matrix.FromArray(inverseBindMatrixData, boneIndex * 16);
                baseMatrix.invertToRef(baseMatrix);
            }

            var babylonParentBone: Bone;
            if (node.index !== skin.skeleton && node.parent !== this._rootNode) {
                babylonParentBone = this._loadBone(node.parent, skin, inverseBindMatrixData, babylonBones);
                baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
            }

            babylonBone = this._createBone(node, skin, babylonParentBone, this._getNodeMatrix(node), baseMatrix, boneIndex);
            babylonBones[node.index] = babylonBone;
            return babylonBone;
        }

        private _getNodeMatrix(node: IGLTFNode): Matrix {
            return node.matrix ?
                Matrix.FromArray(node.matrix) :
                Matrix.Compose(
                    node.scale ? Vector3.FromArray(node.scale) : Vector3.One(),
                    node.rotation ? Quaternion.FromArray(node.rotation) : Quaternion.Identity(),
                    node.translation ? Vector3.FromArray(node.translation) : Vector3.Zero());
        }

        private _traverseNodes(context: string, indices: number[], action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode = null): void {
            for (var i = 0; i < indices.length; i++) {
                var node = GLTFUtils.GetArrayItem(this._gltf.nodes, indices[i]);
                if (!node) {
                    throw new Error(context + ": Failed to find node " + indices[i]);
                }

                this._traverseNode(context, node, action, parentNode);
            }
        }

        public _traverseNode(context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode = null): void {
            if (GLTFLoaderExtension.TraverseNode(this, context, node, action, parentNode)) {
                return;
            }

            if (!action(node, parentNode)) {
                return;
            }

            if (node.children) {
                this._traverseNodes(context, node.children, action, node);
            }
        }

        private _loadAnimations(): void {
            var animations = this._gltf.animations;
            if (!animations) {
                return;
            }

            for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                var animation = animations[animationIndex];
                var context = "#/animations/" + animationIndex;
                for (var channelIndex = 0; channelIndex < animation.channels.length; channelIndex++) {
                    var channel = GLTFUtils.GetArrayItem(animation.channels, channelIndex);
                    if (!channel) {
                        throw new Error(context + ": Failed to find channel " + channelIndex);
                    }

                    var sampler = GLTFUtils.GetArrayItem(animation.samplers, channel.sampler);
                    if (!sampler) {
                        throw new Error(context + ": Failed to find sampler " + channel.sampler);
                    }

                    this._loadAnimationChannel(animation,
                        context + "/channels/" + channelIndex, channel,
                        context + "/samplers/" + channel.sampler, sampler);
                }
            }
        }

        private _loadAnimationChannel(animation: IGLTFAnimation, channelContext: string, channel: IGLTFAnimationChannel, samplerContext: string, sampler: IGLTFAnimationSampler): void {
            var targetNode = GLTFUtils.GetArrayItem(this._gltf.nodes, channel.target.node);
            if (!targetNode) {
                throw new Error(channelContext + ": Failed to find target node " + channel.target.node);
            }

            var targetPath: string;
            var animationType: number;
            switch (channel.target.path) {
                case "translation":
                    targetPath = "position";
                    animationType = Animation.ANIMATIONTYPE_VECTOR3;
                    break;
                case "rotation":
                    targetPath = "rotationQuaternion";
                    animationType = Animation.ANIMATIONTYPE_QUATERNION;
                    break;
                case "scale":
                    targetPath = "scaling";
                    animationType = Animation.ANIMATIONTYPE_VECTOR3;
                    break;
                case "weights":
                    targetPath = "influence";
                    animationType = Animation.ANIMATIONTYPE_FLOAT;
                    break;
                default:
                    throw new Error(channelContext + ": Invalid target path '" + channel.target.path + "'");
            }

            var inputData: Float32Array;
            var outputData: Float32Array;

            var checkSuccess = () => {
                if (!inputData || !outputData) {
                    return;
                }

                var outputBufferOffset = 0;

                var getNextOutputValue: () => any;
                switch (targetPath) {
                    case "position":
                        getNextOutputValue = () => {
                            var value = Vector3.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    case "rotationQuaternion":
                        getNextOutputValue = () => {
                            var value = Quaternion.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 4;
                            return value;
                        };
                        break;
                    case "scaling":
                        getNextOutputValue = () => {
                            var value = Vector3.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    case "influence":
                        getNextOutputValue = () => {
                            var numTargets = targetNode.babylonMesh.morphTargetManager.numTargets;
                            var value = new Array<number>(numTargets);
                            for (var i = 0; i < numTargets; i++) {
                                value[i] = outputData[outputBufferOffset++];
                            }
                            return value;
                        };
                        break;
                }

                var getNextKey: (frameIndex: number) => any;
                switch (sampler.interpolation) {
                    case "LINEAR":
                        getNextKey = frameIndex => ({
                            frame: inputData[frameIndex],
                            value: getNextOutputValue()
                        });
                        break;
                    case "CUBICSPLINE":
                        getNextKey = frameIndex => ({
                            frame: inputData[frameIndex],
                            inTangent: getNextOutputValue(),
                            value: getNextOutputValue(),
                            outTangent: getNextOutputValue()
                        });
                        break;
                    default:
                        throw new Error(samplerContext + ": Invalid interpolation '" + sampler.interpolation + "'");
                };

                var keys = new Array(inputData.length);
                for (var frameIndex = 0; frameIndex < inputData.length; frameIndex++) {
                    keys[frameIndex] = getNextKey(frameIndex);
                }

                animation.targets = animation.targets || [];

                if (targetPath === "influence") {
                    var morphTargetManager = targetNode.babylonMesh.morphTargetManager;

                    for (var targetIndex = 0; targetIndex < morphTargetManager.numTargets; targetIndex++) {
                        var morphTarget = morphTargetManager.getTarget(targetIndex);
                        var animationName = (animation.name || "anim" + animation.index) + "_" + targetIndex;
                        var babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys.map(key => ({
                            frame: key.frame,
                            inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                            value: key.value[targetIndex],
                            outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                        })));

                        morphTarget.animations.push(babylonAnimation);
                        animation.targets.push(morphTarget);
                    }
                }
                else {
                    var animationName = animation.name || "anim" + animation.index;
                    var babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                    babylonAnimation.setKeys(keys);

                    for (var i = 0; i < targetNode.babylonAnimationTargets.length; i++) {
                        var target = targetNode.babylonAnimationTargets[i];
                        target.animations.push(babylonAnimation.clone());
                        animation.targets.push(target);
                    }
                }
            };

            var inputAccessor = GLTFUtils.GetArrayItem(this._gltf.accessors, sampler.input);
            if (!inputAccessor) {
                throw new Error(samplerContext + ": Failed to find input accessor " + sampler.input);
            }

            this._loadAccessorAsync("#/accessors/" + inputAccessor.index, inputAccessor, data => {
                inputData = <Float32Array>data;
                checkSuccess();
            });

            var outputAccessor = GLTFUtils.GetArrayItem(this._gltf.accessors, sampler.output);
            if (!outputAccessor) {
                throw new Error(samplerContext + ": Failed to find output accessor " + sampler.output);
            }

            this._loadAccessorAsync("#/accessors/" + outputAccessor.index, outputAccessor, data => {
                outputData = <Float32Array>data;
                checkSuccess();
            });
        }

        private _loadBufferAsync(context: string, buffer: IGLTFBuffer, onSuccess: (data: ArrayBufferView) => void): void {
            this._addPendingData(buffer);

            if (buffer.loadedData) {
                onSuccess(buffer.loadedData);
                this._removePendingData(buffer);
            }
            else if (buffer.loadedObservable) {
                buffer.loadedObservable.add(buffer => {
                    onSuccess(buffer.loadedData);
                    this._removePendingData(buffer);
                });
            }
            else {
                if (!buffer.uri) {
                    throw new Error(context + ": Uri is missing");
                }

                if (GLTFUtils.IsBase64(buffer.uri)) {
                    var data = GLTFUtils.DecodeBase64(buffer.uri);
                    buffer.loadedData = new Uint8Array(data);
                    onSuccess(buffer.loadedData);
                    this._removePendingData(buffer);
                }
                else {
                    if (!GLTFUtils.ValidateUri(buffer.uri)) {
                        throw new Error(context + ": Uri '" + buffer.uri + "' is invalid");
                    }

                    buffer.loadedObservable = new Observable<IGLTFBuffer>();
                    buffer.loadedObservable.add(buffer => {
                        onSuccess(buffer.loadedData);
                        this._removePendingData(buffer);
                    });

                    Tools.LoadFile(this._rootUrl + buffer.uri, data => {
                        this._tryCatchOnError(() => {
                            buffer.loadedData = new Uint8Array(data);
                            buffer.loadedObservable.notifyObservers(buffer);
                            buffer.loadedObservable = null;
                        });
                    }, event => {
                        this._tryCatchOnError(() => {
                            this._onProgress(event);
                        });
                    }, this._babylonScene.database, true, request => {
                        this._tryCatchOnError(() => {
                            throw new Error(context + ": Failed to load '" + buffer.uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""));
                        });
                    });
                }
            }
        }

        private _loadBufferViewAsync(context: string, bufferView: IGLTFBufferView, onSuccess: (data: ArrayBufferView) => void): void {
            var buffer = GLTFUtils.GetArrayItem(this._gltf.buffers, bufferView.buffer);
            if (!buffer) {
                throw new Error(context + ": Failed to find buffer " + bufferView.buffer);
            }

            this._loadBufferAsync("#/buffers/" + buffer.index, buffer, bufferData => {
                if (this._disposed) {
                    return;
                }

                try {
                    var data = new Uint8Array(bufferData.buffer, bufferData.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                }
                catch (e) {
                    throw new Error(context + ": " + e.message);
                }

                onSuccess(data);
            });
        }

        private _loadAccessorAsync(context: string, accessor: IGLTFAccessor, onSuccess: (data: ArrayBufferView) => void): void {
            if (accessor.sparse) {
                throw new Error(context + ": Sparse accessors are not currently supported");
            }

            if (accessor.normalized) {
                throw new Error(context + ": Normalized accessors are not currently supported");
            }

            var bufferView = GLTFUtils.GetArrayItem(this._gltf.bufferViews, accessor.bufferView);
            if (!bufferView) {
                throw new Error(context + ": Failed to find buffer view " + accessor.bufferView);
            }

            this._loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView, bufferViewData => {
                var numComponents = this._getNumComponentsOfType(accessor.type);
                if (numComponents === 0) {
                    throw new Error(context + ": Invalid type (" + accessor.type + ")");
                }

                var data: ArrayBufferView;
                switch (accessor.componentType) {
                    case EComponentType.BYTE:
                        data = this._buildArrayBuffer(Float32Array, context, bufferViewData, accessor.byteOffset, accessor.count, numComponents, bufferView.byteStride);
                        break;
                    case EComponentType.UNSIGNED_BYTE:
                        data = this._buildArrayBuffer(Uint8Array, context, bufferViewData, accessor.byteOffset, accessor.count, numComponents, bufferView.byteStride);
                        break;
                    case EComponentType.SHORT:
                        data = this._buildArrayBuffer(Int16Array, context, bufferViewData, accessor.byteOffset, accessor.count, numComponents, bufferView.byteStride);
                        break;
                    case EComponentType.UNSIGNED_SHORT:
                        data = this._buildArrayBuffer(Uint16Array, context, bufferViewData, accessor.byteOffset, accessor.count, numComponents, bufferView.byteStride);
                        break;
                    case EComponentType.UNSIGNED_INT:
                        data = this._buildArrayBuffer(Uint32Array, context, bufferViewData, accessor.byteOffset, accessor.count, numComponents, bufferView.byteStride);
                        break;
                    case EComponentType.FLOAT:
                        data = this._buildArrayBuffer(Float32Array, context, bufferViewData, accessor.byteOffset, accessor.count, numComponents, bufferView.byteStride);
                        break;
                    default:
                        throw new Error(context + ": Invalid component type (" + accessor.componentType + ")");
                }

                onSuccess(data);
            });
        }

        private _getNumComponentsOfType(type: string): number {
            switch (type) {
                case "SCALAR": return 1;
                case "VEC2": return 2;
                case "VEC3": return 3;
                case "VEC4": return 4;
                case "MAT2": return 4;
                case "MAT3": return 9;
                case "MAT4": return 16;
            }

            return 0;
        }

        private _buildArrayBuffer<T extends TypedArray>(typedArray: TypedArrayConstructor<T>, context: string, data: ArrayBufferView, byteOffset: number, count: number, numComponents: number, byteStride: number): T {
            try {
                var byteOffset = data.byteOffset + (byteOffset || 0);
                var targetLength = count * numComponents;

                if (byteStride == null || byteStride === numComponents * typedArray.BYTES_PER_ELEMENT) {
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
            }
            catch (e) {
                throw new Error(context + ": " + e);
            }
        }

        public _addPendingData(data: any): void {
            if (!this._renderReady) {
                this._renderPendingCount++;
            }

            this._addLoaderPendingData(data);
        }

        public _removePendingData(data: any): void {
            if (!this._renderReady) {
                if (--this._renderPendingCount === 0) {
                    this._renderReady = true;
                    this._onRenderReady();
                }
            }

            this._removeLoaderPendingData(data);
        }

        public _addLoaderPendingData(data: any): void {
            this._loaderPendingCount++;

            this._loaderTrackers.forEach(tracker => tracker._addPendingData(data));
        }

        public _removeLoaderPendingData(data: any): void {
            this._loaderTrackers.forEach(tracker => tracker._removePendingData(data));

            if (--this._loaderPendingCount === 0) {
                this._onComplete();
            }
        }

        public _whenAction(action: () => void, onComplete: () => void): void {
            var tracker = new GLTFLoaderTracker(() => {
                this._loaderTrackers.splice(this._loaderTrackers.indexOf(tracker));
                onComplete();
            });

            this._loaderTrackers.push(tracker);

            this._addLoaderPendingData(tracker);

            action();

            this._removeLoaderPendingData(tracker);
        }

        private _getDefaultMaterial(): Material {
            if (!this._defaultMaterial) {
                var id = "__gltf_default";
                var material = <PBRMaterial>this._babylonScene.getMaterialByName(id);
                if (!material) {
                    material = new PBRMaterial(id, this._babylonScene);
                    material.sideOrientation = Material.CounterClockWiseSideOrientation;
                    material.metallic = 1;
                    material.roughness = 1;
                }

                this._defaultMaterial = material;
            }

            return this._defaultMaterial;
        }

        private _loadMaterialMetallicRoughnessProperties(context: string, material: IGLTFMaterial): void {
            var babylonMaterial = material.babylonMaterial as PBRMaterial;

            // Ensure metallic workflow
            babylonMaterial.metallic = 1;
            babylonMaterial.roughness = 1;

            var properties = material.pbrMetallicRoughness;
            if (!properties) {
                return;
            }

            babylonMaterial.albedoColor = properties.baseColorFactor ? Color3.FromArray(properties.baseColorFactor) : new Color3(1, 1, 1);
            babylonMaterial.metallic = properties.metallicFactor == null ? 1 : properties.metallicFactor;
            babylonMaterial.roughness = properties.roughnessFactor == null ? 1 : properties.roughnessFactor;

            if (properties.baseColorTexture) {
                var texture = GLTFUtils.GetArrayItem(this._gltf.textures, properties.baseColorTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find base color texture " + properties.baseColorTexture.index);
                }

                babylonMaterial.albedoTexture = this._loadTexture("#/textures/" + texture.index, texture, properties.baseColorTexture.texCoord);
            }

            if (properties.metallicRoughnessTexture) {
                var texture = GLTFUtils.GetArrayItem(this._gltf.textures, properties.metallicRoughnessTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find metallic roughness texture " + properties.metallicRoughnessTexture.index);
                }

                babylonMaterial.metallicTexture = this._loadTexture("#/textures/" + texture.index, texture, properties.metallicRoughnessTexture.texCoord);
                babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
            }

            this._loadMaterialAlphaProperties(context, material, properties.baseColorFactor);
        }

        public _loadMaterial(context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): void {
            if (material.babylonMaterial) {
                assign(material.babylonMaterial, false);
                return;
            }

            if (GLTFLoaderExtension.LoadMaterial(this, context, material, assign)) {
                return;
            }

            this._createPbrMaterial(material);
            this._loadMaterialBaseProperties(context, material);
            this._loadMaterialMetallicRoughnessProperties(context, material);
            assign(material.babylonMaterial, true);
        }

        public _createPbrMaterial(material: IGLTFMaterial): void {
            var babylonMaterial = new PBRMaterial(material.name || "mat" + material.index, this._babylonScene);
            babylonMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            material.babylonMaterial = babylonMaterial;
        }

        public _loadMaterialBaseProperties(context: string, material: IGLTFMaterial): void {
            var babylonMaterial = material.babylonMaterial as PBRMaterial;

            babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            if (material.normalTexture) {
                var texture = GLTFUtils.GetArrayItem(this._gltf.textures, material.normalTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find normal texture " + material.normalTexture.index);
                }

                babylonMaterial.bumpTexture = this._loadTexture("#/textures/" + texture.index, texture, material.normalTexture.texCoord);
                babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                if (material.normalTexture.scale != null) {
                    babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                }
            }

            if (material.occlusionTexture) {
                var texture = GLTFUtils.GetArrayItem(this._gltf.textures, material.occlusionTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find occlusion texture " + material.occlusionTexture.index);
                }

                babylonMaterial.ambientTexture = this._loadTexture("#/textures/" + texture.index, texture, material.occlusionTexture.texCoord);
                babylonMaterial.useAmbientInGrayScale = true;
                if (material.occlusionTexture.strength != null) {
                    babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                }
            }

            if (material.emissiveTexture) {
                var texture = GLTFUtils.GetArrayItem(this._gltf.textures, material.emissiveTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find emissive texture " + material.emissiveTexture.index);
                }

                babylonMaterial.emissiveTexture = this._loadTexture("#/textures/" + texture.index, texture, material.emissiveTexture.texCoord);
            }
        }

        public _loadMaterialAlphaProperties(context: string, material: IGLTFMaterial, colorFactor: number[]): void {
            var babylonMaterial = material.babylonMaterial as PBRMaterial;

            var alphaMode = material.alphaMode || "OPAQUE";
            switch (alphaMode) {
                case "OPAQUE":
                    // default is opaque
                    break;
                case "MASK":
                    babylonMaterial.alphaCutOff = (material.alphaCutoff == null ? 0.5 : material.alphaCutoff);

                    if (colorFactor) {
                        if (colorFactor[3] == 0) {
                            babylonMaterial.alphaCutOff = 1;
                        }
                        else {
                            babylonMaterial.alphaCutOff /= colorFactor[3];
                        }
                    }

                    if (babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoTexture.hasAlpha = true;
                    }
                    break;
                case "BLEND":
                    if (colorFactor) {
                        babylonMaterial.alpha = colorFactor[3];
                    }

                    if (babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoTexture.hasAlpha = true;
                        babylonMaterial.useAlphaFromAlbedoTexture = true;
                    }
                    break;
                default:
                    throw new Error(context + ": Invalid alpha mode '" + material.alphaMode + "'");
            }
        }

        public _loadTexture(context: string, texture: IGLTFTexture, coordinatesIndex: number): Texture {
            var sampler = (texture.sampler == null ? <IGLTFSampler>{} : GLTFUtils.GetArrayItem(this._gltf.samplers, texture.sampler));
            if (!sampler) {
                throw new Error(context + ": Failed to find sampler " + texture.sampler);
            }

            var noMipMaps = (sampler.minFilter === ETextureMinFilter.NEAREST || sampler.minFilter === ETextureMinFilter.LINEAR);
            var samplingMode = GLTFUtils.GetTextureSamplingMode(sampler.magFilter, sampler.minFilter);

            this._addPendingData(texture);
            var babylonTexture = new Texture(null, this._babylonScene, noMipMaps, false, samplingMode, () => {
                this._tryCatchOnError(() => {
                    this._removePendingData(texture);
                });
            }, message => {
                this._tryCatchOnError(() => {
                    throw new Error(context + ": " + message);
                });
            });

            if (texture.url) {
                babylonTexture.updateURL(texture.url);
            }
            else if (texture.dataReadyObservable) {
                texture.dataReadyObservable.add(texture => {
                    babylonTexture.updateURL(texture.url);
                });
            }
            else {
                texture.dataReadyObservable = new Observable<IGLTFTexture>();
                texture.dataReadyObservable.add(texture => {
                    babylonTexture.updateURL(texture.url);
                });

                var image = GLTFUtils.GetArrayItem(this._gltf.images, texture.source);
                if (!image) {
                    throw new Error(context + ": Failed to find source " + texture.source);
                }

                this._loadImage("#/images/" + image.index, image, data => {
                    texture.url = URL.createObjectURL(new Blob([data], { type: image.mimeType }));
                    texture.dataReadyObservable.notifyObservers(texture);
                });
            }

            babylonTexture.coordinatesIndex = coordinatesIndex || 0;
            babylonTexture.wrapU = GLTFUtils.GetTextureWrapMode(sampler.wrapS);
            babylonTexture.wrapV = GLTFUtils.GetTextureWrapMode(sampler.wrapT);
            babylonTexture.name = texture.name || "texture" + texture.index;

            if (this._parent.onTextureLoaded) {
                this._parent.onTextureLoaded(babylonTexture);
            }

            return babylonTexture;
        }

        private _loadImage(context: string, image: IGLTFImage, onSuccess: (data: ArrayBufferView) => void): void {
            if (image.uri) {
                if (!GLTFUtils.ValidateUri(image.uri)) {
                    throw new Error(context + ": Uri '" + image.uri + "' is invalid");
                }

                if (GLTFUtils.IsBase64(image.uri)) {
                    onSuccess(new Uint8Array(GLTFUtils.DecodeBase64(image.uri)));
                }
                else {
                    Tools.LoadFile(this._rootUrl + image.uri, data => {
                        this._tryCatchOnError(() => {
                            onSuccess(data);
                        });
                    }, event => {
                        this._tryCatchOnError(() => {
                            this._onProgress(event);
                        });
                    }, this._babylonScene.database, true, request => {
                        this._tryCatchOnError(() => {
                            throw new Error(context + ": Failed to load '" + image.uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""));
                        });
                    });
                }
            }
            else {
                var bufferView = GLTFUtils.GetArrayItem(this._gltf.bufferViews, image.bufferView);
                if (!bufferView) {
                    throw new Error(context + ": Failed to find buffer view " + image.bufferView);
                }

                this._loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView, onSuccess);
            }
        }

        public _tryCatchOnError(handler: () => void) {
            try {
                handler();
            }
            catch (e) {
                this._onError(e.message);
            }
        }
    }

    BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = parent => new GLTFLoader(parent);
}
