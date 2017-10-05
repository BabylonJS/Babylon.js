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
            try {
                this._loadData(data);
                this._babylonScene = scene;
                this._rootUrl = rootUrl;

                this._successCallback = onSuccess;
                this._progressCallback = onProgress;
                this._errorCallback = onError;

                this._addPendingData(this);
                this._loadScene(nodeNames);
                this._loadAnimations();
                this._removePendingData(this);
            }
            catch (e) {
                this._onError(e.message);
            }
        }

        public _onError(message: string): void {
            if (this._disposed) {
                return;
            }

            Tools.Error("glTF Loader Error: " + message);

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
            var skeletons = [];

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
            var targets = [];

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

        private _loadScene(nodeNames: any): void {
            var scene = this._getArrayItem(this._gltf.scenes, this._gltf.scene || 0, "Scene");
            if (!scene) {
                return;
            }

            this._rootNode = { name: "__root__" };

            switch (this._parent.coordinateSystemMode) {
                case GLTFLoaderCoordinateSystemMode.AUTO:
                    if (!this._babylonScene.useRightHandedSystem) {
                        this._rootNode.rotation = [0, 1, 0, 0];
                        this._rootNode.scale = [1, 1, -1];
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

            this._loadNode(this._rootNode);

            var nodeIndices = scene.nodes;

            this._traverseNodes(nodeIndices, (node, index, parentNode) => {
                node.index = index;
                node.parent = parentNode;
                return true;
            }, this._rootNode);

            var materials = this._gltf.materials;
            if (materials) {
                materials.forEach((material, index) => material.index = index);
            }

            var skins = this._gltf.skins;
            if (skins) {
                skins.forEach((skin, index) => skin.index = index);
            }

            if (nodeNames) {
                if (!(nodeNames instanceof Array)) {
                    nodeNames = [nodeNames];
                }

                var filteredNodeIndices = new Array<number>();
                this._traverseNodes(nodeIndices, node => {
                    if (nodeNames.indexOf(node.name) !== -1) {
                        filteredNodeIndices.push(node.index);
                        return false;
                    }

                    return true;
                }, this._rootNode);

                nodeIndices = filteredNodeIndices;
            }

            for (var i = 0; i < nodeIndices.length; i++) {
                var node = this._getArrayItem(this._gltf.nodes, nodeIndices[i], "Node");
                if (!node) {
                    return;
                }

                this._loadNode(node);
            }

            // Disable the root mesh until the asset is ready to render.
            this._rootNode.babylonMesh.setEnabled(false);
        }

        public _loadNode(node: IGLTFNode): void {
            if (GLTFLoaderExtension.LoadNode(this, node)) {
                return;
            }

            node.babylonMesh = new Mesh(node.name || "mesh" + node.index, this._babylonScene);

            this._loadTransform(node);

            if (node.mesh !== undefined) {
                var mesh = this._getArrayItem(this._gltf.meshes, node.mesh, "Mesh");
                if (!mesh) {
                    return;
                }

                this._loadMesh(node, mesh);
            }

            node.babylonMesh.parent = node.parent ? node.parent.babylonMesh : null;

            node.babylonAnimationTargets = node.babylonAnimationTargets || [];
            node.babylonAnimationTargets.push(node.babylonMesh);

            if (node.skin !== undefined) {
                var skin = this._getArrayItem(this._gltf.skins, node.skin, "Skin");
                if (!skin) {
                    return;
                }

                node.babylonMesh.skeleton = this._loadSkin(skin);
            }

            if (node.camera !== undefined) {
                // TODO: handle cameras
            }

            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    var childNode = this._getArrayItem(this._gltf.nodes, node.children[i], "Node");
                    if (!childNode) {
                        return;
                    }

                    this._loadNode(childNode);
                }
            }
        }

        private _loadMesh(node: IGLTFNode, mesh: IGLTFMesh): void {
            node.babylonMesh.name = mesh.name || node.babylonMesh.name;

            var babylonMultiMaterial = new MultiMaterial(node.babylonMesh.name, this._babylonScene);
            node.babylonMesh.material = babylonMultiMaterial;

            var geometry = new Geometry(node.babylonMesh.name, this._babylonScene, null, false, node.babylonMesh);
            var vertexData = new VertexData();
            vertexData.positions = [];
            vertexData.indices = [];

            var subMeshInfos: { materialIndex: number, verticesStart: number, verticesCount: number, indicesStart: number, indicesCount: number, loadMaterial: () => void }[] = [];

            var loadedPrimitives = 0;
            var totalPrimitives = mesh.primitives.length;
            for (let i = 0; i < totalPrimitives; i++) {
                let primitive = mesh.primitives[i];
                if (primitive.mode && primitive.mode !== EMeshPrimitiveMode.TRIANGLES) {
                    // TODO: handle other primitive modes
                    throw new Error("Not implemented");
                }

                this._createMorphTargets(node, mesh, primitive, node.babylonMesh);

                this._loadVertexDataAsync(primitive, subVertexData => {
                    this._loadMorphTargetsData(mesh, primitive, subVertexData, node.babylonMesh);

                    subMeshInfos.push({
                        materialIndex: i,
                        verticesStart: vertexData.positions.length,
                        verticesCount: subVertexData.positions.length,
                        indicesStart: vertexData.indices.length,
                        indicesCount: subVertexData.indices.length,
                        loadMaterial: () => {
                            if (primitive.material == null) {
                                babylonMultiMaterial.subMaterials[i] = this._getDefaultMaterial();
                                return;
                            }

                            var material = this._getArrayItem(this._gltf.materials, primitive.material, "Material");
                            if (!material) {
                                return;
                            }

                            this._loadMaterial(material, (babylonMaterial, isNew) => {
                                if (isNew && this._parent.onMaterialLoaded) {
                                    this._parent.onMaterialLoaded(babylonMaterial);
                                }

                                if (this._parent.onBeforeMaterialReadyAsync) {
                                    this._addLoaderPendingData(material);
                                    this._parent.onBeforeMaterialReadyAsync(babylonMaterial, node.babylonMesh, babylonMultiMaterial.subMaterials[i] != null, () => {
                                        babylonMultiMaterial.subMaterials[i] = babylonMaterial;
                                        this._removeLoaderPendingData(material);
                                    });
                                } else {
                                    babylonMultiMaterial.subMaterials[i] = babylonMaterial;
                                }
                            });
                        }
                    });

                    vertexData.merge(subVertexData);

                    if (++loadedPrimitives === totalPrimitives) {
                        geometry.setAllVerticesData(vertexData, false);

                        subMeshInfos.forEach(info => info.loadMaterial());

                        // TODO: optimize this so that sub meshes can be created without being overwritten after setting vertex data.
                        // Sub meshes must be cleared and created after setting vertex data because of mesh._createGlobalSubMesh.
                        node.babylonMesh.subMeshes = [];
                        subMeshInfos.forEach(info => new SubMesh(info.materialIndex, info.verticesStart, info.verticesCount, info.indicesStart, info.indicesCount, node.babylonMesh));
                    }
                });
            }
        }

        private _loadVertexDataAsync(primitive: IGLTFMeshPrimitive, onSuccess: (vertexData: VertexData) => void): void {
            var attributes = primitive.attributes;
            if (!attributes) {
                this._onError("Primitive has no attributes");
                return;
            }

            var vertexData = new VertexData();

            var loadedAttributes = 0;
            var totalAttributes = Object.keys(attributes).length;
            for (let attribute in attributes) {
                var accessor = this._getArrayItem(this._gltf.accessors, attributes[attribute], "Mesh primitive attribute '" + attribute + "' accessor");
                if (!accessor) {
                    return;
                }

                this._loadAccessorAsync(accessor, data => {
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

                    if (++loadedAttributes === totalAttributes) {
                        if (primitive.indices == null) {
                            vertexData.indices = new Uint32Array(vertexData.positions.length / 3);
                            vertexData.indices.forEach((v, i) => vertexData.indices[i] = i);
                            onSuccess(vertexData);
                        }
                        else {
                            var indicesAccessor = this._getArrayItem(this._gltf.accessors, primitive.indices, "Mesh primitive 'indices' accessor");
                            if (!indicesAccessor) {
                                return;
                            }

                            this._loadAccessorAsync(indicesAccessor, data => {
                                vertexData.indices = <IndicesArray>data;
                                onSuccess(vertexData);
                            });
                        }
                    }
                });
            }
        }

        private _createMorphTargets(node: IGLTFNode, mesh: IGLTFMesh, primitive: IGLTFMeshPrimitive, babylonMesh: Mesh): void {
            var targets = primitive.targets;
            if (!targets) {
                return;
            }

            if (!babylonMesh.morphTargetManager) {
                babylonMesh.morphTargetManager = new MorphTargetManager();
            }

            for (var index = 0; index < targets.length; index++) {
                var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                babylonMesh.morphTargetManager.addTarget(new MorphTarget("morphTarget" + index, weight));
            }
        }

        private _loadMorphTargetsData(mesh: IGLTFMesh, primitive: IGLTFMeshPrimitive, vertexData: VertexData, babylonMesh: Mesh): void {
            var targets = primitive.targets;
            if (!targets) {
                return;
            }

            for (var index = 0; index < targets.length; index++) {
                let babylonMorphTarget = babylonMesh.morphTargetManager.getTarget(index);
                var attributes = targets[index];
                for (let attribute in attributes) {
                    var accessor = this._getArrayItem(this._gltf.accessors, attributes[attribute], "Mesh primitive morph target attribute '" + attribute + "' accessor");
                    if (!accessor) {
                        return;
                    }

                    this._loadAccessorAsync(accessor, data => {
                        if (accessor.name) {
                            babylonMorphTarget.name = accessor.name;
                        }

                        // glTF stores morph target information as deltas while babylon.js expects the final data.
                        // As a result we have to add the original data to the delta to calculate the final data.
                        var values = <Float32Array>data;
                        switch (attribute) {
                            case "NORMAL":
                                GLTFUtils.ForEach(values, (v, i) => values[i] += vertexData.normals[i]);
                                babylonMorphTarget.setNormals(values);
                                break;
                            case "POSITION":
                                GLTFUtils.ForEach(values, (v, i) => values[i] += vertexData.positions[i]);
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
                                Tools.Warn("Ignoring unrecognized attribute '" + attribute + "'");
                                break;
                        }
                    });
                }
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

        private _loadSkin(skin: IGLTFSkin): Skeleton {
            var skeletonId = "skeleton" + skin.index;
            skin.babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);

            if (skin.inverseBindMatrices == null) {
                this._loadBones(skin, null);
            }
            else {
                var accessor = this._getArrayItem(this._gltf.accessors, skin.inverseBindMatrices, "Skin (" + skin.index + ") inverse bind matrices attribute accessor");
                if (!accessor) {
                    return;
                }

                this._loadAccessorAsync(accessor, data => {
                    this._loadBones(skin, <Float32Array>data);
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

        private _loadBones(skin: IGLTFSkin, inverseBindMatrixData: Float32Array): void {
            var babylonBones: { [index: number]: Bone } = {};
            for (var i = 0; i < skin.joints.length; i++) {
                var node = this._getArrayItem(this._gltf.nodes, skin.joints[i], "Skin (" + skin.index + ") joint");
                if (!node) {
                    return;
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
            if (node.index != skin.skeleton && node.parent) {
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

        private _traverseNodes(indices: number[], action: (node: IGLTFNode, index: number, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode = null): void {
            for (var i = 0; i < indices.length; i++) {
                this._traverseNode(indices[i], action, parentNode);
            }
        }

        public _traverseNode(index: number, action: (node: IGLTFNode, index: number, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode = null): void {
            if (GLTFLoaderExtension.TraverseNode(this, index, action, parentNode)) {
                return;
            }

            var node = this._getArrayItem(this._gltf.nodes, index, "Node");
            if (!node) {
                return;
            }

            if (!action(node, index, parentNode)) {
                return;
            }

            if (node.children) {
                this._traverseNodes(node.children, action, node);
            }
        }

        private _loadAnimations(): void {
            var animations = this._gltf.animations;
            if (!animations) {
                return;
            }

            for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                var animation = animations[animationIndex];
                for (var channelIndex = 0; channelIndex < animation.channels.length; channelIndex++) {
                    this._loadAnimationChannel(animation, animationIndex, channelIndex);
                }
            }
        }

        private _loadAnimationChannel(animation: IGLTFAnimation, animationIndex: number, channelIndex: number): void {
            var channel = animation.channels[channelIndex];
            var samplerIndex = channel.sampler;
            var sampler = animation.samplers[samplerIndex];

            var targetNode = this._getArrayItem(this._gltf.nodes, channel.target.node, "Animation channel target");
            if (!targetNode) {
                return;
            }

            var targetPath = {
                "translation": "position",
                "rotation": "rotationQuaternion",
                "scale": "scaling",
                "weights": "influence"
            }[channel.target.path];
            if (!targetPath) {
                this._onError("Invalid animation channel target path '" + channel.target.path + "'");
                return;
            }

            var animationType = {
                "position": Animation.ANIMATIONTYPE_VECTOR3,
                "rotationQuaternion": Animation.ANIMATIONTYPE_QUATERNION,
                "scaling": Animation.ANIMATIONTYPE_VECTOR3,
                "influence": Animation.ANIMATIONTYPE_FLOAT,
            }[targetPath];

            var inputData: Float32Array;
            var outputData: Float32Array;

            var checkSuccess = () => {
                if (!inputData || !outputData) {
                    return;
                }

                var outputBufferOffset = 0;
                var getNextOutputValue: () => any = {
                    "position": () => {
                        var value = Vector3.FromArray(outputData, outputBufferOffset);
                        outputBufferOffset += 3;
                        return value;
                    },
                    "rotationQuaternion": () => {
                        var value = Quaternion.FromArray(outputData, outputBufferOffset);
                        outputBufferOffset += 4;
                        return value;
                    },
                    "scaling": () => {
                        var value = Vector3.FromArray(outputData, outputBufferOffset);
                        outputBufferOffset += 3;
                        return value;
                    },
                    "influence": () => {
                        var numTargets = targetNode.babylonMesh.morphTargetManager.numTargets;
                        var value = new Array(numTargets);
                        for (var i = 0; i < numTargets; i++) {
                            value[i] = outputData[outputBufferOffset++];
                        }
                        return value;
                    },
                }[targetPath];

                var getNextKey: (frameIndex) => any = {
                    "LINEAR": frameIndex => ({
                        frame: inputData[frameIndex],
                        value: getNextOutputValue()
                    }),
                    "CUBICSPLINE": frameIndex => ({
                        frame: inputData[frameIndex],
                        inTangent: getNextOutputValue(),
                        value: getNextOutputValue(),
                        outTangent: getNextOutputValue()
                    }),
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
                    var animationName = animation.name || "anim" + animationIndex;
                    var babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                    babylonAnimation.setKeys(keys);

                    for (var i = 0; i < targetNode.babylonAnimationTargets.length; i++) {
                        var target = targetNode.babylonAnimationTargets[i];
                        target.animations.push(babylonAnimation.clone());
                        animation.targets.push(target);
                    }
                }
            };

            var inputAccessor = this._getArrayItem(this._gltf.accessors, sampler.input, "Animation sampler input accessor");
            if (!inputAccessor) {
                return;
            }

            this._loadAccessorAsync(inputAccessor, data => {
                inputData = <Float32Array>data;
                checkSuccess();
            });

            var outputAccessor = this._getArrayItem(this._gltf.accessors, sampler.output, "Animation sampler output accessor");
            if (!outputAccessor) {
                return;
            }

            this._loadAccessorAsync(outputAccessor, data => {
                outputData = <Float32Array>data;
                checkSuccess();
            });
        }

        private _validateUri(uri: string): boolean {
            if (!uri) {
                this._onError("Uri is missing");
                return false;
            }

            return true;
        }

        private _loadBufferAsync(buffer: IGLTFBuffer, onSuccess: (data: ArrayBufferView) => void): void {
            this._addPendingData(buffer);

            if (buffer.loadedData) {
                setTimeout(() => {
                    onSuccess(buffer.loadedData);
                    this._removePendingData(buffer);
                });
            }
            else if (buffer.loadedObservable) {
                buffer.loadedObservable.add(buffer => {
                    onSuccess(buffer.loadedData);
                    this._removePendingData(buffer);
                });
            }
            else if (this._validateUri(buffer.uri)) {
                if (GLTFUtils.IsBase64(buffer.uri)) {
                    var data = GLTFUtils.DecodeBase64(buffer.uri);
                    buffer.loadedData = new Uint8Array(data);
                    setTimeout(() => {
                        onSuccess(buffer.loadedData);
                        this._removePendingData(buffer);
                    });
                }
                else {
                    buffer.loadedObservable = new Observable<IGLTFBuffer>();
                    buffer.loadedObservable.add(buffer => {
                        onSuccess(buffer.loadedData);
                        this._removePendingData(buffer);
                    });

                    Tools.LoadFile(this._rootUrl + buffer.uri, data => {
                        buffer.loadedData = new Uint8Array(data);
                        buffer.loadedObservable.notifyObservers(buffer);
                        buffer.loadedObservable = null;
                    }, event => {
                        this._onProgress(event);
                    }, this._babylonScene.database, true, request => {
                        this._onError("Failed to load file '" + buffer.uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""));
                    });
                }
            }
        }

        private _buildInt8ArrayBuffer(buffer: ArrayBuffer, byteOffset: number, byteLength: number, byteStride: number, bytePerComponent: number): Int8Array {
            if (!byteStride) {
                return new Int8Array(buffer, byteOffset, byteLength);
            }

            let sourceBuffer = new Int8Array(buffer, byteOffset);
            let targetBuffer = new Int8Array(byteLength);

            this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride, targetBuffer.length);

            return targetBuffer;
        }

        private _buildUint8ArrayBuffer(buffer: ArrayBuffer, byteOffset: number, byteLength: number, byteStride: number, bytePerComponent: number): Uint8Array {
            if (!byteStride) {
                return new Uint8Array(buffer, byteOffset, byteLength);
            }

            let sourceBuffer = new Uint8Array(buffer, byteOffset);
            let targetBuffer = new Uint8Array(byteLength);

            this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride, targetBuffer.length);

            return targetBuffer;
        }

        private _buildInt16ArrayBuffer(buffer: ArrayBuffer, byteOffset: number, byteLength: number, byteStride: number, bytePerComponent: number): Int16Array {
            if (!byteStride) {
                return new Int16Array(buffer, byteOffset, byteLength);
            }

            let sourceBuffer = new Int16Array(buffer, byteOffset);
            let targetBuffer = new Int16Array(byteLength);

            this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 2, targetBuffer.length);

            return targetBuffer;
        }

        private _buildUint16ArrayBuffer(buffer: ArrayBuffer, byteOffset: number, byteLength: number, byteStride: number, bytePerComponent: number): Uint16Array {
            if (!byteStride) {
                return new Uint16Array(buffer, byteOffset, byteLength);
            }

            let sourceBuffer = new Uint16Array(buffer, byteOffset);
            let targetBuffer = new Uint16Array(byteLength);

            this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 2, targetBuffer.length);

            return targetBuffer;
        }

        private _buildUint32ArrayBuffer(buffer: ArrayBuffer, byteOffset: number, byteLength: number, byteStride: number, bytePerComponent: number): Uint32Array {
            if (!byteStride) {
                return new Uint32Array(buffer, byteOffset, byteLength);
            }

            let sourceBuffer = new Uint32Array(buffer, byteOffset);
            let targetBuffer = new Uint32Array(byteLength);

            this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 4, targetBuffer.length);

            return targetBuffer;
        }

        private _buildFloat32ArrayBuffer(buffer: ArrayBuffer, byteOffset: number, byteLength: number, byteStride: number, bytePerComponent: number): Float32Array {
            if (!byteStride) {
                return new Float32Array(buffer, byteOffset, byteLength);
            }

            let sourceBuffer = new Float32Array(buffer, byteOffset);
            let targetBuffer = new Float32Array(byteLength);

            this._extractInterleavedData(sourceBuffer, targetBuffer, bytePerComponent, byteStride / 4, targetBuffer.length);

            return targetBuffer;
        }

        private _extractInterleavedData(sourceBuffer: ArrayBufferView, targetBuffer: ArrayBufferView, bytePerComponent: number, stride: number, length: number): void {
            let tempIndex = 0;
            let sourceIndex = 0;
            let storageSize = bytePerComponent;

            while (tempIndex < length) {
                for (var cursor = 0; cursor < storageSize; cursor++) {
                    targetBuffer[tempIndex] = sourceBuffer[sourceIndex + cursor]
                    tempIndex++;
                }
                sourceIndex += stride;
            }
        }

        private _loadBufferViewAsync(bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, bytePerComponent: number, componentType: EComponentType, onSuccess: (data: ArrayBufferView) => void): void {
            byteOffset += (bufferView.byteOffset || 0);

            var buffer = this._getArrayItem(this._gltf.buffers, bufferView.buffer, "Buffer");
            if (!buffer) {
                return;
            }

            this._loadBufferAsync(buffer, bufferData => {
                if (byteOffset + byteLength > bufferData.byteLength) {
                    this._onError("Buffer access is out of range");
                    return;
                }

                var buffer = bufferData.buffer;
                byteOffset += bufferData.byteOffset;

                var bufferViewData;
                switch (componentType) {
                    case EComponentType.BYTE:
                        bufferViewData = this._buildInt8ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                        break;
                    case EComponentType.UNSIGNED_BYTE:
                        bufferViewData = this._buildUint8ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                        break;
                    case EComponentType.SHORT:
                        bufferViewData = this._buildInt16ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                        break;
                    case EComponentType.UNSIGNED_SHORT:
                        bufferViewData = this._buildUint16ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                        break;
                    case EComponentType.UNSIGNED_INT:
                        bufferViewData = this._buildUint32ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                        break;
                    case EComponentType.FLOAT:
                        bufferViewData = this._buildFloat32ArrayBuffer(buffer, byteOffset, byteLength, bufferView.byteStride, bytePerComponent);
                        break;
                    default:
                        this._onError("Invalid component type (" + componentType + ")");
                        return;
                }

                onSuccess(bufferViewData);
            });
        }

        private _loadAccessorAsync(accessor: IGLTFAccessor, onSuccess: (data: ArrayBufferView) => void): void {
            var bufferView = this._getArrayItem(this._gltf.bufferViews, accessor.bufferView, "Buffer view");
            if (!bufferView) {
                return;
            }

            var byteOffset = accessor.byteOffset || 0;
            let bytePerComponent = this._getByteStrideFromType(accessor);
            var byteLength = accessor.count * bytePerComponent;
            this._loadBufferViewAsync(bufferView, byteOffset, byteLength, bytePerComponent, accessor.componentType, onSuccess);
        }

        private _getByteStrideFromType(accessor: IGLTFAccessor): number {
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

        private _loadMaterialMetallicRoughnessProperties(material: IGLTFMaterial): void {
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
                babylonMaterial.albedoTexture = this._loadTexture(properties.baseColorTexture);
            }

            if (properties.metallicRoughnessTexture) {
                babylonMaterial.metallicTexture = this._loadTexture(properties.metallicRoughnessTexture);
                babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
            }

            this._loadMaterialAlphaProperties(material, properties.baseColorFactor);
        }

        public _loadMaterial(material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): void {
            if (material.babylonMaterial) {
                assign(material.babylonMaterial, false);
                return;
            }

            if (GLTFLoaderExtension.LoadMaterial(this, material, assign)) {
                return;
            }

            this._createPbrMaterial(material);
            this._loadMaterialBaseProperties(material);
            this._loadMaterialMetallicRoughnessProperties(material);
            assign(material.babylonMaterial, true);
        }

        public _createPbrMaterial(material: IGLTFMaterial): void {
            var babylonMaterial = new PBRMaterial(material.name || "mat" + material.index, this._babylonScene);
            babylonMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            material.babylonMaterial = babylonMaterial;
        }

        public _loadMaterialBaseProperties(material: IGLTFMaterial): void {
            var babylonMaterial = material.babylonMaterial as PBRMaterial;

            babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            if (material.normalTexture) {
                babylonMaterial.bumpTexture = this._loadTexture(material.normalTexture);
                babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                if (material.normalTexture.scale !== undefined) {
                    babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                }
            }

            if (material.occlusionTexture) {
                babylonMaterial.ambientTexture = this._loadTexture(material.occlusionTexture);
                babylonMaterial.useAmbientInGrayScale = true;
                if (material.occlusionTexture.strength !== undefined) {
                    babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                }
            }

            if (material.emissiveTexture) {
                babylonMaterial.emissiveTexture = this._loadTexture(material.emissiveTexture);
            }
        }

        public _loadMaterialAlphaProperties(material: IGLTFMaterial, colorFactor?: number[]): void {
            var babylonMaterial = material.babylonMaterial as PBRMaterial;

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
                    this._onError("Invalid alpha mode '" + material.alphaMode + "'");
                    return;
            }

            babylonMaterial.alphaCutOff = material.alphaCutoff == null ? 0.5 : material.alphaCutoff;
        }

        public _loadTexture(textureInfo: IGLTFTextureInfo): Texture {
            var texture = this._getArrayItem(this._gltf.textures, textureInfo.index, "Texture");
            if (!texture) {
                return null;
            }

            var texCoord = textureInfo.texCoord || 0;

            var source = this._getArrayItem(this._gltf.images, texture.source, "Texture (" + textureInfo.index + ") source");
            if (!source) {
                return null;
            }

            var sampler = (texture.sampler == null ? <IGLTFSampler>{} : this._getArrayItem(this._gltf.samplers, texture.sampler, "Texture (" + textureInfo.index + ") sampler"));
            if (!sampler) {
                return;
            }

            var noMipMaps = (sampler.minFilter === ETextureMinFilter.NEAREST || sampler.minFilter === ETextureMinFilter.LINEAR);
            var samplingMode = GLTFUtils.GetTextureSamplingMode(sampler.magFilter, sampler.minFilter);

            this._addPendingData(texture);
            var babylonTexture = new Texture(null, this._babylonScene, noMipMaps, false, samplingMode, () => {
                if (!this._disposed) {
                    this._removePendingData(texture);
                }
            }, () => {
                if (!this._disposed) {
                    this._onError("Failed to load texture '" + source.uri + "'");
                    this._removePendingData(texture);
                }
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

                var setTextureData = data => {
                    texture.url = URL.createObjectURL(new Blob([data], { type: source.mimeType }));
                    texture.dataReadyObservable.notifyObservers(texture);
                };

                if (!source.uri) {
                    var bufferView = this._getArrayItem(this._gltf.bufferViews, source.bufferView, "Texture (" + textureInfo.index + ") source (" + texture.source + ") buffer view");
                    if (!bufferView) {
                        return;
                    }

                    this._loadBufferViewAsync(bufferView, 0, bufferView.byteLength, 1, EComponentType.UNSIGNED_BYTE, setTextureData);
                }
                else if (GLTFUtils.IsBase64(source.uri)) {
                    setTextureData(new Uint8Array(GLTFUtils.DecodeBase64(source.uri)));
                }
                else {
                    Tools.LoadFile(this._rootUrl + source.uri, setTextureData, event => {
                        this._onProgress(event);
                    }, this._babylonScene.database, true, request => {
                        this._onError("Failed to load file '" + source.uri + "': " + request.status + " " + request.statusText);
                    });
                }
            }

            babylonTexture.coordinatesIndex = texCoord;
            babylonTexture.wrapU = GLTFUtils.GetTextureWrapMode(sampler.wrapS);
            babylonTexture.wrapV = GLTFUtils.GetTextureWrapMode(sampler.wrapT);
            babylonTexture.name = texture.name || "texture" + textureInfo.index;

            if (this._parent.onTextureLoaded) {
                this._parent.onTextureLoaded(babylonTexture);
            }

            return babylonTexture;
        }

        public _getArrayItem<T>(array: ArrayLike<T>, index: number, name: string): T {
            if (!array || !array[index]) {
                this._onError(name + " index (" + index + ") was not found");
                return null;
            }

            return array[index];
        }
    }

    BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = parent => new GLTFLoader(parent);
}
