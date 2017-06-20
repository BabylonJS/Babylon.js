/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    export class GLTFLoader implements IGLTFLoader {
        private _gltf: IGLTF;
        private _pendingCount: number;
        private _onLoaded: () => void;
        private _errors: string[];
        private _babylonScene: Scene;
        private _rootUrl: string;
        private _defaultMaterial: PBRMaterial;

        public static Extensions: { [name: string]: GLTFLoaderExtension } = {};

        public static RegisterExtension(extension: GLTFLoaderExtension): void {
            if (GLTFLoader.Extensions[extension.name]) {
                Tools.Error("Extension with the same name '" + extension.name + "' already exists");
                return;
            }

            this.Extensions[extension.name] = extension;
        }

        public static LoadMaterial(index: number): IGLTFMaterial {
            return (<GLTFLoader>BABYLON.GLTFFileLoader.GLTFLoaderV2)._loadMaterial(index);
        }

        public static LoadCoreMaterial(index: number): Material {
            return (<GLTFLoader>BABYLON.GLTFFileLoader.GLTFLoaderV2)._loadCoreMaterial(index);
        }

        public static LoadCommonMaterialProperties(material: IGLTFMaterial): void {
            return (<GLTFLoader>BABYLON.GLTFFileLoader.GLTFLoaderV2)._loadCommonMaterialProperties(material);
        }

        public static LoadAlphaProperties(material: IGLTFMaterial): void {
            return (<GLTFLoader>BABYLON.GLTFFileLoader.GLTFLoaderV2)._loadAlphaProperties(material);
        }

        public static LoadTexture(textureInfo: IGLTFTextureInfo): Texture {
            return (<GLTFLoader>BABYLON.GLTFFileLoader.GLTFLoaderV2)._loadTexture(textureInfo);
        }

        public importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError: () => void): void {
            this._loadAsync(meshesNames, scene, data, rootUrl, () => {
                var meshes = [];
                for (var i = 0; i < this._gltf.nodes.length; i++) {
                    var node = this._gltf.nodes[i];
                    if (node.babylonNode instanceof AbstractMesh) {
                        meshes.push(<AbstractMesh>node.babylonNode);
                    }
                }

                var skeletons = [];
                for (var i = 0; i < this._gltf.skins.length; i++) {
                    var skin = this._gltf.skins[i];
                    if (skin.babylonSkeleton instanceof Skeleton) {
                        skeletons.push(skin.babylonSkeleton);
                    }
                }

                onSuccess(meshes, null, skeletons);
            }, onError);
        }

        public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onError: () => void): void {
            this._loadAsync(null, scene, data, rootUrl, onSuccess, onError);
        }

        private _loadAsync(nodeNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onError: () => void): void {
            scene.useRightHandedSystem = true;

            this._clear();

            this._loadData(data);
            this._babylonScene = scene;
            this._rootUrl = rootUrl;

            this._onLoaded = () => {
                this._showMeshes();
                this._startFirstAnimation();

                if (this._errors.length === 0) {
                    onSuccess();
                }
                else {
                    this._errors.forEach(error => Tools.Error(error));
                    onError();
                }

                this._clear();
            };

            this._addPendingData(this);
            this._loadScene(nodeNames);
            this._loadAnimations();
            this._removePendingData(this);
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

        private _showMeshes(): void {
            var nodes = this._gltf.nodes;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.babylonNode instanceof Mesh) {
                    node.babylonNode.isVisible = true;
                }
            }
        }

        private _startFirstAnimation(): void {
            var animations = this._gltf.animations;
            if (!animations) {
                return;
            }

            var animation = animations[0];
            for (var i = 0; i < animation.targets.length; i++) {
                this._babylonScene.beginAnimation(animation.targets[i], 0, Number.MAX_VALUE, true);
            }
        }

        private _clear(): void {
            this._gltf = undefined;
            this._pendingCount = 0;
            this._onLoaded = undefined;
            this._errors = [];
            this._babylonScene = undefined;
            this._rootUrl = undefined;
            this._defaultMaterial = undefined;

            // Revoke object urls created during load
            if (this._gltf && this._gltf.textures) {
                for (var i = 0; i < this._gltf.textures.length; i++) {
                    var texture = this._gltf.textures[i];
                    if (texture.blobURL) {
                        URL.revokeObjectURL(texture.blobURL);
                    }
                }
            }
        }

        private _loadScene(nodeNames: string[]): void {
            var scene = this._gltf.scenes[this._gltf.scene || 0];

            this._traverseScene(nodeNames, scene, node => this._loadSkin(node));
            this._traverseScene(nodeNames, scene, (node, parentNode) => this._loadMesh(node, parentNode));
        }

        private _loadSkin(node: IGLTFNode): boolean {
            if (node.babylonNode) {
                return false;
            }

            if (node.skin !== undefined) {
                var skin = this._gltf.skins[node.skin];
                var skeletonId = "skeleton" + node.skin;
                skin.babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);

                for (var i = 0; i < skin.joints.length; i++) {
                    var jointIndex = skin.joints[i];
                    var jointNode = this._gltf.nodes[jointIndex];
                    jointNode.babylonNode = new Bone(jointNode.name || "bone" + jointIndex, skin.babylonSkeleton);
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
                    this._traverseNode(null, skin.skeleton, (node, parent) => this._updateBone(node, parent, skin, <Float32Array>data));
                });
            }

            return true;
        }

        private _updateBone(node: IGLTFNode, parentNode: IGLTFNode, skin: IGLTFSkin, inverseBindMatrixData: Float32Array): boolean {
            var jointIndex = skin.joints.indexOf(node.index);
            if (jointIndex === -1) {
                // TODO: handle non-joint in between two joints
                throw new Error("Not implemented");
            }

            var babylonBone = <Bone>node.babylonNode;

            // TODO: explain the math
            var matrix = Matrix.FromArray(inverseBindMatrixData, jointIndex * 16);
            matrix.invertToRef(matrix);
            if (parentNode) {
                babylonBone.setParent(<Bone>parentNode.babylonNode, false);
                matrix.multiplyToRef(babylonBone.getParent().getInvertedAbsoluteTransform(), matrix);
            }

            babylonBone.updateMatrix(matrix);
            return true;
        }

        private _loadMesh(node: IGLTFNode, parentNode: IGLTFNode): boolean {
            if (node.babylonNode) {
                if (node.babylonNode instanceof Bone) {
                    if (node.mesh !== undefined) {
                        // TODO: handle mesh attached to bone
                        throw new Error("Not implemented");
                    }
                }

                return false;
            }

            var babylonMesh = new Mesh(node.name || "mesh" + node.index, this._babylonScene);
            babylonMesh.isVisible = false;

            this._loadTransform(node, babylonMesh);

            if (node.mesh !== undefined) {
                var mesh = this._gltf.meshes[node.mesh];
                this._loadMeshData(node, mesh, babylonMesh);
            }

            babylonMesh.parent = parentNode ? parentNode.babylonNode : null;
            node.babylonNode = babylonMesh;

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
            babylonMesh.subMeshes = [];

            var multiMaterial = new MultiMaterial(babylonMesh.name, this._babylonScene);
            babylonMesh.material = multiMaterial;

            var geometry = new Geometry(babylonMesh.name, this._babylonScene, null, false, babylonMesh);
            var vertexData = new VertexData();
            vertexData.positions = [];
            vertexData.indices = [];

            var primitivesLoaded = 0;
            var numPrimitives = mesh.primitives.length;
            for (var i = 0; i < numPrimitives; i++) {
                var primitive = mesh.primitives[i];
                if (primitive.mode && primitive.mode !== EMeshPrimitiveMode.TRIANGLES) {
                    // TODO: handle other primitive modes
                    throw new Error("Not implemented");
                }

                this._createMorphTargets(node, mesh, primitive, babylonMesh);

                this._loadVertexDataAsync(primitive, subVertexData => {
                    this._loadMorphTargetsData(mesh, primitive, subVertexData, babylonMesh);

                    var subMesh = new SubMesh(multiMaterial.subMaterials.length, vertexData.positions.length, subVertexData.positions.length, vertexData.indices.length, subVertexData.indices.length, babylonMesh);
                    var subMaterial = primitive.material === undefined ? this._getDefaultMaterial() : GLTFLoaderExtension.LoadMaterial(primitive.material);
                    multiMaterial.subMaterials.push(subMaterial);
                    vertexData.merge(subVertexData);

                    if (++primitivesLoaded === numPrimitives) {
                        geometry.setAllVerticesData(vertexData, false);
                    }
                });
            }
        }

        private _loadVertexDataAsync(primitive: IGLTFMeshPrimitive, onSuccess: (vertexData: VertexData) => void): void {
            var attributes = primitive.attributes;
            if (!attributes) {
                this._errors.push("Primitive has no attributes");
                return;
            }

            var vertexData = new VertexData();

            var loadedAttributes = 0;
            var numAttributes = Object.keys(attributes).length;
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

                    if (++loadedAttributes === numAttributes) {
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
                                values.forEach((v, i) => values[i] += vertexData.normals[i]);
                                babylonMorphTarget.setNormals(values);
                                break;
                            case "POSITION":
                                values.forEach((v, i) => values[i] += vertexData.positions[i]);
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

        private _traverseScene(nodeNames: string[], scene: IGLTFScene, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean): void {
            var nodes = scene.nodes;

            if (nodes) {
                for (var i = 0; i < nodes.length; i++) {
                    this._traverseNode(nodeNames, nodes[i], action);
                }
            }
        }

        private _traverseNode(nodeNames: string[], index: number, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode = null): void {
            var node = this._gltf.nodes[index];

            if (nodeNames) {
                if (nodeNames.indexOf(node.name)) {
                    // load all children
                    nodeNames = null;
                }
                else {
                    // skip this node tree
                    return;
                }
            }

            node.index = index;

            if (!action(node, parentNode)) {
                return;
            }

            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    this._traverseNode(nodeNames, node.children[i], action, node);
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

            var targetNode = this._gltf.nodes[channel.target.node].babylonNode;
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
                        var numTargets = (<Mesh>targetNode).morphTargetManager.numTargets;
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
                    var targetMesh = <Mesh>targetNode;

                    for (var targetIndex = 0; targetIndex < targetMesh.morphTargetManager.numTargets; targetIndex++) {
                        var morphTarget = targetMesh.morphTargetManager.getTarget(targetIndex);
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

                    targetNode.animations.push(babylonAnimation);
                    animation.targets.push(targetNode);
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
            this._addPendingData(buffer);

            if (buffer.loadedData) {
                setTimeout(() => {
                    onSuccess(buffer.loadedData);
                    this._removePendingData(buffer);
                });
            }
            else if (GLTFUtils.IsBase64(buffer.uri)) {
                var data = GLTFUtils.DecodeBase64(buffer.uri);
                buffer.loadedData = new Uint8Array(data);
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
                }, null, null, true, request => {
                    this._errors.push("Failed to load file '" + buffer.uri + "': " + request.statusText + "(" + request.status + ")");
                    this._removePendingData(buffer);
                });
            }
        }

        private _loadBufferViewAsync(bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType, onSuccess: (data: ArrayBufferView) => void): void {
            byteOffset += (bufferView.byteOffset || 0);

            this._loadBufferAsync(bufferView.buffer, bufferData => {
                if (byteOffset + byteLength > bufferData.byteLength) {
                    this._errors.push("Buffer access is out of range");
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
                        this._errors.push("Invalid component type (" + componentType + ")");
                        return;
                }

                onSuccess(bufferViewData);
            });
        }

        private _loadAccessorAsync(accessor: IGLTFAccessor, onSuccess: (data: ArrayBufferView) => void): void {
            var bufferView = this._gltf.bufferViews[accessor.bufferView];
            var byteOffset = accessor.byteOffset || 0;
            var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
            this._loadBufferViewAsync(bufferView, byteOffset, byteLength, accessor.componentType, onSuccess);
        }

        private _addPendingData(data: any) {
            this._pendingCount++;
        }

        private _removePendingData(data: any) {
            if (--this._pendingCount === 0) {
                this._onLoaded();
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

        private _loadMaterial(index: number): IGLTFMaterial {
            var materials = this._gltf.materials;
            var material = materials ? materials[index] : null;
            if (!material) {
                Tools.Warn("Material index (" + index + ") does not exist");
                return null;
            }

            material.babylonMaterial = new PBRMaterial(material.name || "mat" + index, this._babylonScene);
            material.babylonMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            material.babylonMaterial.useScalarInLinearSpace = true;
            return material;
        }

        private _loadCoreMaterial(index: number): Material {
            var material = this._loadMaterial(index);
            if (!material) {
                return null;
            }

            this._loadCommonMaterialProperties(material);

            // Ensure metallic workflow
            material.babylonMaterial.metallic = 1;
            material.babylonMaterial.roughness = 1;

            var properties = material.pbrMetallicRoughness;
            if (!properties) {
                return;
            }

            material.babylonMaterial.albedoColor = properties.baseColorFactor ? Color3.FromArray(properties.baseColorFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.metallic = properties.metallicFactor === undefined ? 1 : properties.metallicFactor;
            material.babylonMaterial.roughness = properties.roughnessFactor === undefined ? 1 : properties.roughnessFactor;

            if (properties.baseColorTexture) {
                material.babylonMaterial.albedoTexture = this._loadTexture(properties.baseColorTexture);
                this._loadAlphaProperties(material);
            }

            if (properties.metallicRoughnessTexture) {
                material.babylonMaterial.metallicTexture = this._loadTexture(properties.metallicRoughnessTexture);
                material.babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                material.babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                material.babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
            }

            return material.babylonMaterial;
        }

        private _loadCommonMaterialProperties(material: IGLTFMaterial): void {
            material.babylonMaterial.useEmissiveAsIllumination = (material.emissiveFactor || material.emissiveTexture) ? true : false;
            material.babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.doubleSided) {
                material.babylonMaterial.backFaceCulling = false;
                material.babylonMaterial.twoSidedLighting = true;
            }

            if (material.normalTexture) {
                material.babylonMaterial.bumpTexture = this._loadTexture(material.normalTexture);
                if (material.normalTexture.scale !== undefined) {
                    material.babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                }
            }

            if (material.occlusionTexture) {
                material.babylonMaterial.ambientTexture = this._loadTexture(material.occlusionTexture);
                material.babylonMaterial.useAmbientInGrayScale = true;
                if (material.occlusionTexture.strength !== undefined) {
                    material.babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                }
            }

            if (material.emissiveTexture) {
                material.babylonMaterial.emissiveTexture = this._loadTexture(material.emissiveTexture);
            }
        }

        private _loadAlphaProperties(material: IGLTFMaterial): void {
            var alphaMode = material.alphaMode || "OPAQUE";
            switch (alphaMode) {
                case "OPAQUE":
                    // default is opaque
                    break;
                case "MASK":
                    material.babylonMaterial.albedoTexture.hasAlpha = true;
                    material.babylonMaterial.useAlphaFromAlbedoTexture = false;
                    material.babylonMaterial.alphaMode = Engine.ALPHA_DISABLE;
                    break;
                case "BLEND":
                    material.babylonMaterial.albedoTexture.hasAlpha = true;
                    material.babylonMaterial.useAlphaFromAlbedoTexture = true;
                    material.babylonMaterial.alphaMode = Engine.ALPHA_COMBINE;
                    break;
                default:
                    Tools.Error("Invalid alpha mode '" + material.alphaMode + "'");
            }
        }

        private _loadTexture(textureInfo: IGLTFTextureInfo): Texture {
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
            var url: string;

            if (!source.uri) {
                var bufferView = this._gltf.bufferViews[source.bufferView];
                this._loadBufferViewAsync(bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE, data => {
                    texture.blobURL = URL.createObjectURL(new Blob([data], { type: source.mimeType }));
                    texture.babylonTextures[texCoord].updateURL(texture.blobURL);
                });
            }
            else if (GLTFUtils.IsBase64(source.uri)) {
                var data = new Uint8Array(GLTFUtils.DecodeBase64(source.uri));
                texture.blobURL = URL.createObjectURL(new Blob([data], { type: source.mimeType }));
                url = texture.blobURL;
            }
            else {
                url = this._rootUrl + source.uri;
            }

            var sampler = (texture.sampler === undefined ? <IGLTFSampler>{} : this._gltf.samplers[texture.sampler]);
            var noMipMaps = (sampler.minFilter === ETextureMinFilter.NEAREST || sampler.minFilter === ETextureMinFilter.LINEAR);
            var samplingMode = GLTFUtils.GetTextureFilterMode(sampler.minFilter);

            this._addPendingData(texture);
            var babylonTexture = new Texture(url, this._babylonScene, noMipMaps, false, samplingMode, () => {
                this._removePendingData(texture);
            }, () => {
                this._errors.push("Failed to load texture '" + source.uri + "'");
                this._removePendingData(texture);
            });

            babylonTexture.coordinatesIndex = texCoord;
            babylonTexture.wrapU = GLTFUtils.GetWrapMode(sampler.wrapS);
            babylonTexture.wrapV = GLTFUtils.GetWrapMode(sampler.wrapT);
            babylonTexture.name = texture.name;

            // Cache the texture
            texture.babylonTextures = texture.babylonTextures || [];
            texture.babylonTextures[texCoord] = babylonTexture;

            return babylonTexture;
        }
    }

    BABYLON.GLTFFileLoader.GLTFLoaderV2 = new GLTFLoader();
}
