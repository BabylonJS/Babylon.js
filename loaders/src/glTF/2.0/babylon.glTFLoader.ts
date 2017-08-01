/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export class GLTFLoader implements IGLTFLoader, IDisposable {
        private _parent: GLTFFileLoader;
        private _gltf: IGLTF;
        private _babylonScene: Scene;
        private _rootUrl: string;
        private _defaultMaterial: PBRMaterial;
        private _successCallback: () => void;
        private _progressCallback: (event: ProgressEvent) => void;
        private _errorCallback: (message: string) => void;
        private _renderReady: boolean = false;
        private _disposed: boolean = false;
        private _objectURLs: string[] = new Array<string>();

        // Observable with boolean indicating success or error.
        private _renderReadyObservable = new Observable<GLTFLoader>();

        // Count of pending work that needs to complete before the asset is rendered.
        private _renderPendingCount: number = 0;

        // Count of pending work that needs to complete before the loader is cleared.
        private _loaderPendingCount: number = 0;

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

        public get gltf(): IGLTF {
            return this._gltf;
        }

        public get babylonScene(): Scene {
            return this._babylonScene;
        }

        public executeWhenRenderReady(func: () => void) {
            if (this._renderReady) {
                func();
            }
            else {
                this._renderReadyObservable.add(func);
            }
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
            this._objectURLs.forEach(url => URL.revokeObjectURL(url));
            this._objectURLs.length = 0;

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
        }

        private _onError(message: string): void {
            this._errorCallback(message);
            this.dispose();
        }

        private _onProgress(event: ProgressEvent): void {
            this._progressCallback(event);
        }

        private _onRenderReady(): void {
            switch (this._parent.coordinateSystemMode) {
                case GLTFLoaderCoordinateSystemMode.AUTO:
                    if (!this._babylonScene.useRightHandedSystem) {
                        this._addRightHandToLeftHandRootTransform();
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
                    break;
            }

            this._showMeshes();
            this._startAnimations();
            this._successCallback();
            this._renderReadyObservable.notifyObservers(this);
        }

        private _onLoaderComplete(): void {
            this.dispose();

            if (this._parent.onComplete) {
                this._parent.onComplete();
            }
        }

        private _loadData(data: IGLTFLoaderData): void {
            this._gltf = <IGLTF>data.json;

            var binaryBuffer: IGLTFBuffer;
            var buffers = this._gltf.buffers;
            if (buffers.length > 0 && buffers[0].uri === undefined) {
                binaryBuffer = buffers[0];
            }

            if (data.bin) {
                if (binaryBuffer) {
                    if (binaryBuffer.byteLength != data.bin.byteLength) {
                        Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                    }
                }
                else {
                    Tools.Warn("Unexpected BIN chunk");
                }

                binaryBuffer.loadedData = data.bin;
            }
        }

        private _addRightHandToLeftHandRootTransform(): void {
            var rootMesh = new Mesh("root", this._babylonScene);
            rootMesh.scaling = new Vector3(1, 1, -1);
            rootMesh.rotation.y = Math.PI;

            var nodes = this._gltf.nodes;
            for (var i = 0; i < nodes.length; i++) {
                var mesh = nodes[i].babylonMesh;
                if (mesh && !mesh.parent) {
                    mesh.parent = rootMesh;
                }
            }
        }

        private _getMeshes(): Mesh[] {
            var meshes = [];

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

        private _showMeshes(): void {
            this._getMeshes().forEach(mesh => mesh.isVisible = true);
        }

        private _startAnimations(): void {
            this._getAnimationTargets().forEach(target => this._babylonScene.beginAnimation(target, 0, Number.MAX_VALUE, true));
        }

        private _loadScene(nodeNames: any): void {
            var scene = this._gltf.scenes[this._gltf.scene || 0];
            var nodeIndices = scene.nodes;

            this._traverseNodes(nodeIndices, (node, index, parentNode) => {
                node.index = index;
                node.parent = parentNode;
                return true;
            });

            var materials = this._gltf.materials;
            if (materials) {
                materials.forEach((material, index) => material.index = index);
            }

            if (nodeNames) {
                if (!(nodeNames instanceof Array)) {
                    nodeNames = [nodeNames];
                }

                var filteredNodeIndices = new Array<number>();
                this._traverseNodes(nodeIndices, node => {
                    if (nodeNames.indexOf(node.name) === -1) {
                        return true;
                    }

                    filteredNodeIndices.push(node.index);
                    return false;
                });

                nodeIndices = filteredNodeIndices;
            }

            this._traverseNodes(nodeIndices, node => this._loadSkin(node));
            this._traverseNodes(nodeIndices, node => this._loadMesh(node));
        }

        private _loadSkin(node: IGLTFNode): boolean {
            if (node.skin !== undefined) {
                var skin = this._gltf.skins[node.skin];
                var skeletonId = "skeleton" + node.skin;
                skin.babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
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
                this._loadAccessorAsync(accessor, data => {
                    this._traverseNode(skin.skeleton, (node, index, parent) => this._updateBone(node, parent, skin, <Float32Array>data));
                });
            }

            return true;
        }

        private _updateBone(node: IGLTFNode, parentNode: IGLTFNode, skin: IGLTFSkin, inverseBindMatrixData: Float32Array): boolean {
            var jointIndex = skin.joints.indexOf(node.index);
            if (jointIndex === -1) {
                this._createBone(node, skin);
            }

            var babylonBone = node.babylonSkinToBones[skin.index];

            // TODO: explain the math
            var matrix = jointIndex === -1 ? Matrix.Identity() : Matrix.FromArray(inverseBindMatrixData, jointIndex * 16);
            matrix.invertToRef(matrix);
            if (parentNode) {
                babylonBone.setParent(parentNode.babylonSkinToBones[skin.index], false);
                matrix.multiplyToRef(babylonBone.getParent().getInvertedAbsoluteTransform(), matrix);
            }

            babylonBone.updateMatrix(matrix);
            return true;
        }

        private _createBone(node: IGLTFNode, skin: IGLTFSkin): Bone {
            var babylonBone = new Bone(node.name || "bone" + node.index, skin.babylonSkeleton);

            node.babylonSkinToBones = node.babylonSkinToBones || {};
            node.babylonSkinToBones[skin.index] = babylonBone;

            node.babylonAnimationTargets = node.babylonAnimationTargets || [];
            node.babylonAnimationTargets.push(babylonBone);

            return babylonBone;
        }

        private _loadMesh(node: IGLTFNode): boolean {
            var babylonMesh = new Mesh(node.name || "mesh" + node.index, this._babylonScene);
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
        }

        private _loadMeshData(node: IGLTFNode, mesh: IGLTFMesh, babylonMesh: Mesh): void {
            babylonMesh.name = mesh.name || babylonMesh.name;

            var babylonMultiMaterial = new MultiMaterial(babylonMesh.name, this._babylonScene);
            babylonMesh.material = babylonMultiMaterial;

            var geometry = new Geometry(babylonMesh.name, this._babylonScene, null, false, babylonMesh);
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

                this._createMorphTargets(node, mesh, primitive, babylonMesh);

                this._loadVertexDataAsync(primitive, subVertexData => {
                    this._loadMorphTargetsData(mesh, primitive, subVertexData, babylonMesh);

                    subMeshInfos.push({
                        materialIndex: i,
                        verticesStart: vertexData.positions.length,
                        verticesCount: subVertexData.positions.length,
                        indicesStart: vertexData.indices.length,
                        indicesCount: subVertexData.indices.length,
                        loadMaterial: () => {
                            if (primitive.material === undefined) {
                                babylonMultiMaterial.subMaterials[i] = this._getDefaultMaterial();
                            }
                            else {
                                var material = this._gltf.materials[primitive.material];
                                this.loadMaterial(material, (babylonMaterial, isNew) => {
                                    if (isNew && this._parent.onMaterialLoaded) {
                                        this._parent.onMaterialLoaded(babylonMaterial);
                                    }

                                    // Note: Removing force compilation from loader as this will be delegated to users as they
                                    // may want to add more options to the material before compiling it
                                    //this.addPendingData(material);
                                    //babylonMaterial.forceCompilation(babylonMesh, babylonMaterial => {
                                        babylonMultiMaterial.subMaterials[i] = babylonMaterial;
                                    //    this.removePendingData(material);
                                    //});
                                });
                            }
                        }
                    });

                    vertexData.merge(subVertexData);

                    if (++loadedPrimitives === totalPrimitives) {
                        geometry.setAllVerticesData(vertexData, false);

                        subMeshInfos.forEach(info => info.loadMaterial());

                        // TODO: optimize this so that sub meshes can be created without being overwritten after setting vertex data.
                        // Sub meshes must be cleared and created after setting vertex data because of mesh._createGlobalSubMesh.
                        babylonMesh.subMeshes = [];
                        subMeshInfos.forEach(info => new SubMesh(info.materialIndex, info.verticesStart, info.verticesCount, info.indicesStart, info.indicesCount, babylonMesh));
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
            for (let semantic in attributes) {
                var accessor = this._gltf.accessors[attributes[semantic]];
                this._loadAccessorAsync(accessor, data => {
                    switch (semantic) {
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
                            Tools.Warn("Ignoring unrecognized semantic '" + semantic + "'");
                            break;
                    }

                    if (++loadedAttributes === totalAttributes) {
                        var indicesAccessor = this._gltf.accessors[primitive.indices];
                        if (indicesAccessor) {
                            this._loadAccessorAsync(indicesAccessor, data => {
                                vertexData.indices = <IndicesArray>data;
                                onSuccess(vertexData);
                            });
                        }
                        else {
                            vertexData.indices = new Uint32Array(vertexData.positions.length / 3);
                            vertexData.indices.forEach((v, i) => vertexData.indices[i] = i);
                            onSuccess(vertexData);
                        }
                    }
                });
            }
        }

        private _createMorphTargets(node: IGLTFNode, mesh: IGLTFMesh, primitive: IGLTFMeshPrimitive, babylonMesh: Mesh) {
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
                for (let semantic in attributes) {
                    var accessor = this._gltf.accessors[attributes[semantic]];
                    this._loadAccessorAsync(accessor, data => {
                        if (accessor.name) {
                            babylonMorphTarget.name = accessor.name;
                        }

                        // glTF stores morph target information as deltas while babylon.js expects the final data.
                        // As a result we have to add the original data to the delta to calculate the final data.
                        var values = <Float32Array>data;
                        switch (semantic) {
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
                                Tools.Warn("Ignoring unrecognized semantic '" + semantic + "'");
                                break;
                        }
                    });
                }
            }
        }

        private _loadTransform(node: IGLTFNode, babylonMesh: Mesh): void {
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

            babylonMesh.position = position;
            babylonMesh.rotationQuaternion = rotation;
            babylonMesh.scaling = scaling;
        }

        private _traverseNodes(indices: number[], action: (node: IGLTFNode, index: number, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode = null): void {
            for (var i = 0; i < indices.length; i++) {
                this._traverseNode(indices[i], action, parentNode);
            }
        }

        private _traverseNode(index: number, action: (node: IGLTFNode, index: number, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode = null): void {
            var node = this._gltf.nodes[index];

            if (!action(node, index, parentNode)) {
                return;
            }

            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    this._traverseNode(node.children[i], action, node);
                }
            }
        }

        private _loadAnimations(): void {
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
        }

        private _loadAnimationChannel(animation: IGLTFAnimation, animationIndex: number, channelIndex: number): void {
            var channel = animation.channels[channelIndex];
            var samplerIndex = channel.sampler;
            var sampler = animation.samplers[samplerIndex];

            var targetNode = this._gltf.nodes[channel.target.node];
            if (!targetNode) {
                Tools.Warn("Animation channel target node (" + channel.target.node + ") does not exist");
                return;
            }

            var targetPath = {
                "translation": "position",
                "rotation": "rotationQuaternion",
                "scale": "scaling",
                "weights": "influence"
            }[channel.target.path];
            if (!targetPath) {
                Tools.Warn("Animation channel target path '" + channel.target.path + "' is not valid");
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

            this._loadAccessorAsync(this._gltf.accessors[sampler.input], data =>
            {
                inputData = <Float32Array>data;
                checkSuccess();
            });

            this._loadAccessorAsync(this._gltf.accessors[sampler.output], data =>
            {
                outputData = <Float32Array>data;
                checkSuccess();
            });
        }

        private _loadBufferAsync(index: number, onSuccess: (data: ArrayBufferView) => void): void {
            var buffer = this._gltf.buffers[index];
            this.addPendingData(buffer);

            if (buffer.loadedData) {
                setTimeout(() => {
                    onSuccess(buffer.loadedData);
                    this.removePendingData(buffer);
                });
            }
            else if (GLTFUtils.IsBase64(buffer.uri)) {
                var data = GLTFUtils.DecodeBase64(buffer.uri);
                buffer.loadedData = new Uint8Array(data);
                setTimeout(() => {
                    onSuccess(buffer.loadedData);
                    this.removePendingData(buffer);
                });
            }
            else if (buffer.loadedObservable) {
                buffer.loadedObservable.add(buffer => {
                    onSuccess(buffer.loadedData);
                    this.removePendingData(buffer);
                });
            }
            else {
                buffer.loadedObservable = new Observable<IGLTFBuffer>();
                buffer.loadedObservable.add(buffer => {
                    onSuccess(buffer.loadedData);
                    this.removePendingData(buffer);
                });

                Tools.LoadFile(this._rootUrl + buffer.uri, data => {
                    buffer.loadedData = new Uint8Array(data);
                    buffer.loadedObservable.notifyObservers(buffer);
                    buffer.loadedObservable = null;
                }, event => {
                    if (!this._disposed) {
                        this._onProgress(event);
                    }
                }, this._babylonScene.database, true, request => {
                    if (!this._disposed) {
                        this._onError("Failed to load file '" + buffer.uri + "': " + request.status + " " + request.statusText);
                        this.removePendingData(buffer);
                    }
                });
            }
        }

        private _loadBufferViewAsync(bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType, onSuccess: (data: ArrayBufferView) => void): void {
            byteOffset += (bufferView.byteOffset || 0);

            this._loadBufferAsync(bufferView.buffer, bufferData => {
                if (byteOffset + byteLength > bufferData.byteLength) {
                    this._onError("Buffer access is out of range");
                    return;
                }

                var buffer = bufferData.buffer;
                byteOffset += bufferData.byteOffset;

                var bufferViewData;
                switch (componentType) {
                    case EComponentType.BYTE:
                        bufferViewData = new Int8Array(buffer, byteOffset, byteLength);
                        break;
                    case EComponentType.UNSIGNED_BYTE:
                        bufferViewData = new Uint8Array(buffer, byteOffset, byteLength);
                        break;
                    case EComponentType.SHORT:
                        bufferViewData = new Int16Array(buffer, byteOffset, byteLength);
                        break;
                    case EComponentType.UNSIGNED_SHORT:
                        bufferViewData = new Uint16Array(buffer, byteOffset, byteLength);
                        break;
                    case EComponentType.UNSIGNED_INT:
                        bufferViewData = new Uint32Array(buffer, byteOffset, byteLength);
                        break;
                    case EComponentType.FLOAT:
                        bufferViewData = new Float32Array(buffer, byteOffset, byteLength);
                        break;
                    default:
                        this._onError("Invalid component type (" + componentType + ")");
                        return;
                }

                onSuccess(bufferViewData);
            });
        }

        private _loadAccessorAsync(accessor: IGLTFAccessor, onSuccess: (data: ArrayBufferView) => void): void {
            var bufferView = this._gltf.bufferViews[accessor.bufferView];
            var byteOffset = accessor.byteOffset || 0;
            var byteLength = accessor.count * this._getByteStrideFromType(accessor);
            this._loadBufferViewAsync(bufferView, byteOffset, byteLength, accessor.componentType, onSuccess);
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

        public addPendingData(data: any) {
            if (!this._renderReady) {
                this._renderPendingCount++;
            }

            this.addLoaderPendingData(data);
        }

        public removePendingData(data: any) {
            if (!this._renderReady) {
                if (--this._renderPendingCount === 0) {
                    this._renderReady = true;
                    this._onRenderReady();
                }
            }

            this.removeLoaderPendingData(data);
        }

        public addLoaderPendingData(data: any) {
            this._loaderPendingCount++;
        }

        public removeLoaderPendingData(data: any) {
            if (--this._loaderPendingCount === 0) {
                this._onLoaderComplete();
            }
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
        }

        public loadMaterial(material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): void {
            if (material.babylonMaterial) {
                assign(material.babylonMaterial, false);
                return;
            }

            if (GLTFLoaderExtension.LoadMaterial(this, material, assign)) {
                return;
            }

            this.createPbrMaterial(material);
            this.loadMaterialBaseProperties(material);
            this._loadMaterialMetallicRoughnessProperties(material);
            assign(material.babylonMaterial, true);
        }

        public createPbrMaterial(material: IGLTFMaterial): void {
            var babylonMaterial = new PBRMaterial(material.name || "mat" + material.index, this._babylonScene);
            babylonMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            material.babylonMaterial = babylonMaterial;
        }

        public loadMaterialBaseProperties(material: IGLTFMaterial): void {
            var babylonMaterial = material.babylonMaterial as PBRMaterial;

            babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            if (material.normalTexture) {
                babylonMaterial.bumpTexture = this.loadTexture(material.normalTexture);
                babylonMaterial.invertNormalMapX = true;
                babylonMaterial.invertNormalMapY = true;
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
        }

        public loadMaterialAlphaProperties(material: IGLTFMaterial, colorFactor?: number[]): void {
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
                    Tools.Warn("Invalid alpha mode '" + material.alphaMode + "'");
                    break;
            }
        }

        public loadTexture(textureInfo: IGLTFTextureInfo): Texture {
            var texture = this._gltf.textures[textureInfo.index];
            var texCoord = textureInfo.texCoord || 0;

            if (!texture || texture.source === undefined) {
                return null;
            }

            // check the cache first
            var babylonTexture: Texture;
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
            var sampler = (texture.sampler === undefined ? <IGLTFSampler>{} : this._gltf.samplers[texture.sampler]);
            var noMipMaps = (sampler.minFilter === ETextureMinFilter.NEAREST || sampler.minFilter === ETextureMinFilter.LINEAR);
            var samplingMode = GLTFUtils.GetTextureSamplingMode(sampler.magFilter, sampler.minFilter);

            this.addPendingData(texture);
            babylonTexture = new Texture(null, this._babylonScene, noMipMaps, false, samplingMode, () => {
                if (!this._disposed) {
                    this.removePendingData(texture);
                }
            }, () => {
                if (!this._disposed) {
                    this._onError("Failed to load texture '" + source.uri + "'");
                    this.removePendingData(texture);
                }
            });

            var setTextureData = data => {
                var url = URL.createObjectURL(new Blob([data], { type: source.mimeType }));
                this._objectURLs.push(url);
                babylonTexture.updateURL(url);
            };

            if (!source.uri) {
                var bufferView = this._gltf.bufferViews[source.bufferView];
                this._loadBufferViewAsync(bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE, setTextureData);
            }
            else if (GLTFUtils.IsBase64(source.uri)) {
                setTextureData(new Uint8Array(GLTFUtils.DecodeBase64(source.uri)));
            }
            else {
                Tools.LoadFile(this._rootUrl + source.uri, setTextureData, event => {
                    if (!this._disposed) {
                        this._onProgress(event);
                    }
                }, this._babylonScene.database, true, request => {
                    this._onError("Failed to load file '" + source.uri + "': " + request.status + " " + request.statusText);
                });
            }

            babylonTexture.coordinatesIndex = texCoord;
            babylonTexture.wrapU = GLTFUtils.GetTextureWrapMode(sampler.wrapS);
            babylonTexture.wrapV = GLTFUtils.GetTextureWrapMode(sampler.wrapT);
            babylonTexture.name = texture.name || "texture" + textureInfo.index;

            // Cache the texture
            texture.babylonTextures = texture.babylonTextures || [];
            texture.babylonTextures[texCoord] = babylonTexture;

            if (this._parent.onTextureLoaded) {
                this._parent.onTextureLoaded(babylonTexture);
            }

            return babylonTexture;
        }
    }

    BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = parent => new GLTFLoader(parent);
}
