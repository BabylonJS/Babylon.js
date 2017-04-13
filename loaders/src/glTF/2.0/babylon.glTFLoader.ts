/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../../../../dist/preview release/loaders/babylon.glTFFileLoader.d.ts"/>

module BABYLON.GLTF2 {
    /**
    * Values
    */
    var glTFAnimationPaths = ["translation", "rotation", "scale"];
    var babylonAnimationPaths = ["position", "rotationQuaternion", "scaling"];

    /**
    * Utils
    */
    var normalizeUVs = (buffer: any): void => {
        if (!buffer) {
            return;
        }

        for (var i = 0; i < buffer.length / 2; i++) {
            buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
        }
    };

    var createStringId = (index: number): string => {
        return "node" + index;
    };

    /**
    * Returns the animation path (glTF -> Babylon)
    */
    var getAnimationPath = (path: string): string => {
        var index = glTFAnimationPaths.indexOf(path);

        if (index !== -1) {
            return babylonAnimationPaths[index];
        }

        return path;
    };

    /**
    * Loads and creates animations
    */
    var loadAnimations = (runtime: IGLTFRuntime): void => {
        var animations = runtime.gltf.animations;
        if (!animations) {
            return;
        }

        for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
            var animation = animations[animationIndex];
            if (!animation || !animation.channels || !animation.samplers) {
                continue;
            }

            var lastAnimation: Animation = null;

            for (var channelIndex = 0; channelIndex < animation.channels.length; channelIndex++) {
                var channel = animation.channels[channelIndex];
                if (!channel) {
                    continue;
                }

                var sampler = animation.samplers[channel.sampler];
                if (!sampler) {
                    continue;
                }

                var inputData = sampler.input;
                var outputData = sampler.output;

                var bufferInput = GLTFUtils.GetBufferFromAccessor(runtime, runtime.gltf.accessors[inputData]);
                var bufferOutput = GLTFUtils.GetBufferFromAccessor(runtime, runtime.gltf.accessors[outputData]);

                var targetID = channel.target.node;
                var targetNode: any = runtime.babylonScene.getNodeByID(createStringId(targetID));

                if (targetNode === null) {
                    Tools.Warn("Creating animation index " + animationIndex + " but cannot find node index " + targetID + " to attach to");
                    continue;
                }

                var isBone = targetNode instanceof Bone;

                // Get target path (position, rotation or scaling)
                var targetPath = channel.target.path;
                var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);

                if (targetPathIndex !== -1) {
                    targetPath = babylonAnimationPaths[targetPathIndex];
                }

                // Determine animation type
                var animationType = Animation.ANIMATIONTYPE_MATRIX;

                if (!isBone) {
                    if (targetPath === "rotationQuaternion") {
                        animationType = Animation.ANIMATIONTYPE_QUATERNION;
                        targetNode.rotationQuaternion = new Quaternion();
                    }
                    else {
                        animationType = Animation.ANIMATIONTYPE_VECTOR3;
                    }
                }

                // Create animation and key frames
                var babylonAnimation: Animation = null;
                var keys = [];
                var arrayOffset = 0;
                var modifyKey = false;

                if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                    babylonAnimation = lastAnimation;
                    modifyKey = true;
                }

                if (!modifyKey) {
                    var animationName = animation.name || "anim" + animationIndex;
                    babylonAnimation = new Animation(animationName, isBone ? "_matrix" : targetPath, 1, animationType, Animation.ANIMATIONLOOPMODE_CYCLE);
                }

                // For each frame
                for (var j = 0; j < bufferInput.length; j++) {
                    var value: any = null;

                    if (targetPath === "rotationQuaternion") { // VEC4
                        value = Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                        arrayOffset += 4;
                    }
                    else { // Position and scaling are VEC3
                        value = Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                        arrayOffset += 3;
                    }

                    if (isBone) {
                        var bone = <Bone>targetNode;
                        var translation = Vector3.Zero();
                        var rotationQuaternion = new Quaternion();
                        var scaling = Vector3.Zero();

                        // Warning on decompose
                        var mat = bone.getBaseMatrix();

                        if (modifyKey) {
                            mat = lastAnimation.getKeys()[j].value;
                        }

                        mat.decompose(scaling, rotationQuaternion, translation);

                        if (targetPath === "position") {
                            translation = value;
                        }
                        else if (targetPath === "rotationQuaternion") {
                            rotationQuaternion = value;
                        }
                        else {
                            scaling = value;
                        }

                        value = Matrix.Compose(scaling, rotationQuaternion, translation);
                    }

                    if (!modifyKey) {
                        keys.push({
                            frame: bufferInput[j],
                            value: value
                        });
                    }
                    else {
                        lastAnimation.getKeys()[j].value = value;
                    }
                }

                // Finish
                if (!modifyKey) {
                    babylonAnimation.setKeys(keys);
                    targetNode.animations.push(babylonAnimation);
                }

                lastAnimation = babylonAnimation;

                runtime.babylonScene.stopAnimation(targetNode);
                runtime.babylonScene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
            }
        }
    };

    /**
    * Returns the bones transformation matrix
    */
    var configureBoneTransformation = (node: IGLTFNode): Matrix => {
        var mat: Matrix = null;

        if (node.translation || node.rotation || node.scale) {
            var scale = Vector3.FromArray(node.scale || [1, 1, 1]);
            var rotation = Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
            var position = Vector3.FromArray(node.translation || [0, 0, 0]);

            mat = Matrix.Compose(scale, rotation, position);
        }
        else {
            mat = node.matrix ? Matrix.FromArray(node.matrix) : Matrix.Identity();
        }

        return mat;
    };

    /**
    * Returns the parent bone
    */
    var getParentBone = (runtime: IGLTFRuntime, skin: IGLTFSkin, index: number, newSkeleton: Skeleton): Bone => {
        // Try to find
        var nodeStringID = createStringId(index);
        for (var i = 0; i < newSkeleton.bones.length; i++) {
            if (newSkeleton.bones[i].id === nodeStringID) {
                return newSkeleton.bones[i].getParent();
            }
        }

        // Not found, search in gltf nodes
        var joints = skin.joints;
        for (var j = 0; j < joints.length; j++) {
            var parentID = joints[j];
            var parent = runtime.gltf.nodes[parentID];

            var children = parent.children;
            for (var i = 0; i < children.length; i++) {
                var childID = children[i];
                var child = runtime.gltf.nodes[childID];
                if (!nodeIsInJoints(skin, childID)) {
                    continue;
                }

                if (childID === index)
                {
                    var mat = configureBoneTransformation(parent);
                    var bone = new Bone(parent.name || createStringId(parentID), newSkeleton, getParentBone(runtime, skin, parentID, newSkeleton), mat);
                    bone.id = createStringId(parentID);
                    return bone;
                }
            }
        }

        return null;
    }

    /**
    * Returns the appropriate root node
    */
    var getNodeToRoot = (nodesToRoot: INodeToRoot[], index: number): Bone => {
        for (var i = 0; i < nodesToRoot.length; i++) {
            var nodeToRoot = nodesToRoot[i];

            if (nodeToRoot.node.children) {
                for (var j = 0; j < nodeToRoot.node.children.length; j++) {
                    var child = nodeToRoot.node.children[j];
                    if (child === index) {
                        return nodeToRoot.bone;
                    }
                }
            }
        }

        return null;
    };

    /**
    * Returns the node with the node index
    */
    var getJointNode = (runtime: IGLTFRuntime, index: number): IJointNode => {
        var node = runtime.gltf.nodes[index];
        if (node) {
            return {
                node: node,
                index: index
            };
        }

        return null;
    }

    /**
    * Checks if a nodes is in joints
    */
    var nodeIsInJoints = (skin: IGLTFSkin, index: number): boolean => {
        for (var i = 0; i < skin.joints.length; i++) {
            if (skin.joints[i] === index) {
                return true;
            }
        }

        return false;
    }

    /**
    * Fills the nodes to root for bones and builds hierarchy
    */
    var getNodesToRoot = (runtime: IGLTFRuntime, newSkeleton: Skeleton, skin: IGLTFSkin, nodesToRoot: INodeToRoot[]): void => {
        // Creates nodes for root
        for (var i = 0; i < runtime.gltf.nodes.length; i++) {
            var node = runtime.gltf.nodes[i];

            if (nodeIsInJoints(skin, i)) {
                continue;
            }

            // Create node to root bone
            var mat = configureBoneTransformation(node);
            var bone = new Bone(node.name || createStringId(i), newSkeleton, null, mat);
            bone.id = createStringId(i);
            nodesToRoot.push({ bone: bone, node: node, index: i });
        }

        // Parenting
        for (var i = 0; i < nodesToRoot.length; i++) {
            var nodeToRoot = nodesToRoot[i];
            var children = nodeToRoot.node.children;

            if (children) {
                for (var j = 0; j < children.length; j++) {
                    var child: INodeToRoot = null;

                    for (var k = 0; k < nodesToRoot.length; k++) {
                        if (nodesToRoot[k].index === children[j]) {
                            child = nodesToRoot[k];
                            break;
                        }
                    }

                    if (child) {
                        (<any>child.bone)._parent = nodeToRoot.bone;
                        nodeToRoot.bone.children.push(child.bone);
                    }
                }
            }
        }
    };

    /**
    * Imports a skeleton
    */
    var importSkeleton = (runtime: IGLTFRuntime, skinNode: IGLTFNode, skin: IGLTFSkin): Skeleton => {
        var name = skin.name || "skin" + skinNode.skin;

        var babylonSkeleton = <Skeleton>skin.babylonSkeleton;
        if (!babylonSkeleton) {
            babylonSkeleton = new Skeleton(name, "skin" + skinNode.skin, runtime.babylonScene);
        }

        if (!skin.babylonSkeleton) {
            return babylonSkeleton;
        }

        // Matrices
        var accessor = runtime.gltf.accessors[skin.inverseBindMatrices];
        var buffer = GLTFUtils.GetBufferFromAccessor(runtime, accessor);

        // Find the root bones
        var nodesToRoot: INodeToRoot[] = [];
        var nodesToRootToAdd: Bone[] = [];

        getNodesToRoot(runtime, babylonSkeleton, skin, nodesToRoot);
        babylonSkeleton.bones = [];

        // Joints
        for (var i = 0; i < skin.joints.length; i++) {
            var jointNode = getJointNode(runtime, skin.joints[i]);
            var node = jointNode.node;

            if (!node) {
                Tools.Warn("Joint index " + skin.joints[i] + " does not exist");
                continue;
            }

            var index = jointNode.index;
            var stringID = createStringId(index);

            // Optimize, if the bone already exists...
            var existingBone = runtime.babylonScene.getBoneByID(stringID);
            if (existingBone) {
                babylonSkeleton.bones.push(existingBone);
                continue;
            }

            // Search for parent bone
            var foundBone = false;
            var parentBone: Bone = null;

            for (var j = 0; j < i; j++) {
                var joint: IGLTFNode = getJointNode(runtime, skin.joints[j]).node;

                if (!joint) {
                    Tools.Warn("Joint index " + skin.joints[j] + " does not exist when looking for parent");
                    continue;
                }

                var children = joint.children;
                foundBone = false;

                for (var k = 0; k < children.length; k++) {
                    if (children[k] === index) {
                        parentBone = getParentBone(runtime, skin, skin.joints[j], babylonSkeleton);
                        foundBone = true;
                        break;
                    }
                }

                if (foundBone) {
                    break;
                }
            }

            // Create bone
            var mat = configureBoneTransformation(node);

            if (!parentBone && nodesToRoot.length > 0) {
                parentBone = getNodeToRoot(nodesToRoot, index);

                if (parentBone) {
                    if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                        nodesToRootToAdd.push(parentBone);
                    }
                }
            }

            var bone = new Bone(node.name || stringID, babylonSkeleton, parentBone, mat);
            bone.id = stringID;
        }

        // Polish
        var bones = babylonSkeleton.bones;
        babylonSkeleton.bones = [];
        
        for (var i = 0; i < skin.joints.length; i++) {
            var jointNode = getJointNode(runtime, skin.joints[i]);

            if (!jointNode) {
                continue;
            }

            var jointNodeStringId = createStringId(jointNode.index);
            for (var j = 0; j < bones.length; j++) {
                if (bones[j].id === jointNodeStringId) {
                    babylonSkeleton.bones.push(bones[j]);
                    break;
                }
            }
        }

        babylonSkeleton.prepare();

        // Finish
        for (var i = 0; i < nodesToRootToAdd.length; i++) {
            babylonSkeleton.bones.push(nodesToRootToAdd[i]);
        }

        return babylonSkeleton;
    };

    /**
     * Gets a material
     */
    var getMaterial = (runtime: IGLTFRuntime, index?: number): PBRMaterial => {
        if (index === undefined) {
            return GLTFUtils.GetDefaultMaterial(runtime);
        }

        var materials = runtime.gltf.materials;
        if (!materials || index < 0 || index >= materials.length) {
            Tools.Error("Invalid material index");
            return GLTFUtils.GetDefaultMaterial(runtime);
        }

        var material = runtime.gltf.materials[index].babylonMaterial;
        if (!material)
        {
            return GLTFUtils.GetDefaultMaterial(runtime);
        }

        return material;
    }

    /**
    * Imports a mesh and its geometries
    */
    var importMesh = (runtime: IGLTFRuntime, node: IGLTFNode, mesh: IGLTFMesh): Mesh => {
        var name = mesh.name || node.name || "mesh" + node.mesh;

        var babylonMesh = <Mesh>node.babylonNode;
        if (!babylonMesh) {
            babylonMesh = new Mesh(name, runtime.babylonScene);
        }

        if (!node.babylonNode) {
            return babylonMesh;
        }

        var multiMat = new MultiMaterial(name, runtime.babylonScene);

        if (!babylonMesh.material) {
            babylonMesh.material = multiMat;
        }

        var vertexData = new VertexData();
        var geometry = new Geometry(name, runtime.babylonScene, vertexData, false, babylonMesh);

        var verticesStarts = [];
        var verticesCounts = [];
        var indexStarts = [];
        var indexCounts = [];

        // Positions, normals and UVs
        for (var index = 0; index < mesh.primitives.length; index++) {
            // Temporary vertex data
            var tempVertexData = new VertexData();

            var primitive = mesh.primitives[index];
            if (primitive.mode !== EMeshPrimitiveMode.TRIANGLES) {
                // continue;
            }

            var attributes = primitive.attributes;
            var accessor: IGLTFAccessor = null;
            var buffer: any = null;

            // Set positions, normal and uvs
            for (var semantic in attributes) {

                // Link accessor and buffer view
                accessor = runtime.gltf.accessors[attributes[semantic]];
                buffer = GLTFUtils.GetBufferFromAccessor(runtime, accessor);

                if (semantic === "NORMAL") {
                    tempVertexData.normals = new Float32Array(buffer.length);
                    (<Float32Array>tempVertexData.normals).set(buffer);
                }
                else if (semantic === "POSITION") {
                    tempVertexData.positions = new Float32Array(buffer.length);
                    (<Float32Array>tempVertexData.positions).set(buffer);
                    verticesCounts.push(tempVertexData.positions.length);
                }
                else if (semantic === "TANGENT") {
                    tempVertexData.tangents = new Float32Array(buffer.length);
                    (<Float32Array>tempVertexData.tangents).set(buffer);
                }
                else if (semantic.indexOf("TEXCOORD_") !== -1) {
                    var channel = Number(semantic.split("_")[1]);
                    var uvKind = VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                    var uvs = new Float32Array(buffer.length);
                    (<Float32Array>uvs).set(buffer);
                    normalizeUVs(uvs);
                    tempVertexData.set(uvs, uvKind);
                }
                else if (semantic === "JOINT") {
                    tempVertexData.matricesIndices = new Float32Array(buffer.length);
                    (<Float32Array>tempVertexData.matricesIndices).set(buffer);
                }
                else if (semantic === "WEIGHT") {
                    tempVertexData.matricesWeights = new Float32Array(buffer.length);
                    (<Float32Array>tempVertexData.matricesWeights).set(buffer);
                }
                else if (semantic === "COLOR_0") {
                    tempVertexData.colors = new Float32Array(buffer.length);
                    (<Float32Array>tempVertexData.colors).set(buffer);
                }
                else {
                    Tools.Warn("Ignoring unrecognized semantic '" + semantic + "'");
                }
            }

            // Indices
            accessor = runtime.gltf.accessors[primitive.indices];
            if (accessor) {
                buffer = GLTFUtils.GetBufferFromAccessor(runtime, accessor);

                tempVertexData.indices = new Int32Array(buffer.length);
                (<Float32Array>tempVertexData.indices).set(buffer);
                indexCounts.push(tempVertexData.indices.length);
            }
            else {
                // Set indices on the fly
                var indices: number[] = [];
                for (var j = 0; j < tempVertexData.positions.length / 3; j++) {
                    indices.push(j);
                }

                tempVertexData.indices = new Int32Array(indices);
                indexCounts.push(tempVertexData.indices.length);
            }

            vertexData.merge(tempVertexData);
            tempVertexData = undefined;

            // Sub material
            var material = getMaterial(runtime, primitive.material);
            multiMat.subMaterials.push(material);

            // Update vertices start and index start
            verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
            indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
        }

        // Apply geometry
        geometry.setAllVerticesData(vertexData, false);
        babylonMesh.computeWorldMatrix(true);

        // Apply submeshes
        babylonMesh.subMeshes = [];
        for (var index = 0; index < mesh.primitives.length; index++) {
            if (mesh.primitives[index].mode !== EMeshPrimitiveMode.TRIANGLES) {
                //continue;
            }

            var subMesh = new SubMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], babylonMesh, babylonMesh, true);
        }

        // Finish
        return babylonMesh;
    };

    /**
    * Configures node transformation
    */
    var configureNode = (babylonNode: Mesh | TargetCamera, node: IGLTFNode): void => {
        var position = Vector3.Zero();
        var rotation = Quaternion.Identity();
        var scaling = new Vector3(1, 1, 1);

        if (node.matrix) {
            var mat = Matrix.FromArray(node.matrix);
            mat.decompose(scaling, rotation, position);
        }
        else {
            if (node.translation) {
                position = Vector3.FromArray(node.translation);
            }

            if (node.rotation) {
                rotation = Quaternion.FromArray(node.rotation);
            }

            if (node.scale) {
                scaling = Vector3.FromArray(node.scale);
            }
        }

        babylonNode.position = position;
        babylonNode.rotationQuaternion = rotation;

        if (babylonNode instanceof Mesh) {
            var mesh = <Mesh>babylonNode;
            mesh.scaling = scaling;
        }
    };

    /**
    * Imports a node
    */
    var importNode = (runtime: IGLTFRuntime, node: IGLTFNode): Node => {
        var babylonNode: Mesh | TargetCamera = null;

        if (runtime.importOnlyMeshes && (node.skin !== undefined || node.mesh !== undefined)) {
            if (runtime.importMeshesNames.length > 0 && runtime.importMeshesNames.indexOf(node.name) === -1) {
                return null;
            }
        }

        // Meshes
        if (node.skin !== undefined) {
            if (node.mesh !== undefined) {
                var skin = runtime.gltf.skins[node.skin];

                var newMesh = importMesh(runtime, node, runtime.gltf.meshes[node.mesh]);
                var newSkeleton = importSkeleton(runtime, node, skin);

                if (newSkeleton)
                {
                    newMesh.skeleton = newSkeleton;
                    skin.babylonSkeleton = newSkeleton;
                }

                babylonNode = newMesh;
            }
        }
        else if (node.mesh !== undefined) {
            babylonNode = importMesh(runtime, node, runtime.gltf.meshes[node.mesh]);
        }
        // Cameras
        else if (node.camera !== undefined && !node.babylonNode && !runtime.importOnlyMeshes) {
            var camera = runtime.gltf.cameras[node.camera];

            if (camera !== undefined) {
                if (camera.type === "orthographic") {
                    var orthographicCamera = camera.orthographic;
                    var orthoCamera = new FreeCamera(node.name || "camera" + node.camera, Vector3.Zero(), runtime.babylonScene);

                    orthoCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
                    orthoCamera.attachControl(runtime.babylonScene.getEngine().getRenderingCanvas());

                    babylonNode = orthoCamera;
                }
                else if (camera.type === "perspective") {
                    var perspectiveCamera = camera.perspective;
                    var persCamera = new FreeCamera(node.name || "camera" + node.camera, Vector3.Zero(), runtime.babylonScene);

                    persCamera.attachControl(runtime.babylonScene.getEngine().getRenderingCanvas());

                    if (!perspectiveCamera.aspectRatio) {
                        perspectiveCamera.aspectRatio = runtime.babylonScene.getEngine().getRenderWidth() / runtime.babylonScene.getEngine().getRenderHeight();
                    }

                    if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                        persCamera.maxZ = perspectiveCamera.zfar;
                        persCamera.minZ = perspectiveCamera.znear;
                    }

                    babylonNode = persCamera;
                }
            }
        }

        // Empty node
        if (node.babylonNode) {
            return node.babylonNode;
        }
        else if (babylonNode === null) {
            var dummy = new Mesh(node.name || "mesh" + node.mesh, runtime.babylonScene);
            node.babylonNode = dummy;
            babylonNode = dummy;
        }

        if (babylonNode !== null) {
            configureNode(babylonNode, node);
            babylonNode.updateCache(true);
            node.babylonNode = babylonNode;
        }

        return babylonNode;
    };

    /**
    * Traverses nodes and creates them
    */
    var traverseNodes = (runtime: IGLTFRuntime, index: number, parent: Node, meshIncluded?: boolean): void => {
        var node = runtime.gltf.nodes[index];
        var newNode: Node = null;

        if (runtime.importOnlyMeshes && !meshIncluded) {
            if (runtime.importMeshesNames.indexOf(node.name) !== -1 || runtime.importMeshesNames.length === 0) {
                meshIncluded = true;
            }
            else {
                meshIncluded = false;
            }
        }
        else {
            meshIncluded = true;
        }

        if (meshIncluded) {
            newNode = importNode(runtime, node);

            if (newNode !== null) {
                newNode.id = createStringId(index);
                newNode.parent = parent;
            }
        }

        if (node.children) {
            for (var i = 0; i < node.children.length; i++) {
                traverseNodes(runtime, node.children[i], newNode, meshIncluded);
            }
        }
    };

    var importScene = (runtime: IGLTFRuntime): void => {
        var scene = runtime.gltf.scene || 0;
        var scenes = runtime.gltf.scenes;

        if (scenes) {
            var nodes = scenes[scene].nodes;
            for (var i = 0; i < nodes.length; i++) {
                traverseNodes(runtime, nodes[i], null);
            }
        }
        else {
            for (var i = 0; i < runtime.gltf.nodes.length; i++) {
                traverseNodes(runtime, i, null);
            }
        }
    }

    /**
    * do stuff after buffers are loaded (e.g. hook up materials, load animations, etc.)
    */
    var postLoad = (runtime: IGLTFRuntime): void => {
        importScene(runtime);

        // Set animations
        loadAnimations(runtime);

        for (var i = 0; i < runtime.babylonScene.skeletons.length; i++) {
            var skeleton = runtime.babylonScene.skeletons[i];
            runtime.babylonScene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
        }
    };

    var importMaterials = (runtime: IGLTFRuntime): void => {
        if (runtime.gltf.materials) {
            for (var i = 0; i < runtime.gltf.materials.length; i++) {
                GLTFLoaderExtension.LoadMaterial(runtime, i);
            }
        }
    };

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

    /**
    * glTF File Loader Plugin
    */
    export class GLTFLoader implements IGLTFLoader {
        public static Extensions: { [name: string]: GLTFLoaderExtension } = {};

        public static RegisterExtension(extension: GLTFLoaderExtension): void {
            if (GLTFLoader.Extensions[extension.name]) {
                Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                return;
            }

            GLTFLoader.Extensions[extension.name] = extension;
        }

        public static LoadMaterial(runtime: IGLTFRuntime, index: number): IGLTFMaterial {
            var material = runtime.gltf.materials[index];
            if (!material) return null;

            material.babylonMaterial = new PBRMaterial(material.name || "mat" + index, runtime.babylonScene);
            material.babylonMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            material.babylonMaterial.useScalarInLinearSpace = true;
            return material;
        }

        public static LoadMetallicRoughnessMaterialProperties = (runtime: IGLTFRuntime, material: IGLTFMaterial): void => {
            var properties = material.pbrMetallicRoughness;
            if (!properties) return;

            material.babylonMaterial.albedoColor = properties.baseColorFactor ? Color3.FromArray(properties.baseColorFactor) : new Color3(1, 1, 1);
            material.babylonMaterial.metallic = properties.metallicFactor === undefined ? 1 : properties.metallicFactor;
            material.babylonMaterial.roughness = properties.roughnessFactor === undefined ? 1 : properties.roughnessFactor;

            if (properties.baseColorTexture) {
                GLTFLoader.LoadTextureAsync(runtime, properties.baseColorTexture,
                    texture => {
                        material.babylonMaterial.albedoTexture = texture;
                        GLTFLoader.LoadAlphaProperties(runtime, material);
                    },
                    () => {
                        Tools.Warn("Failed to load base color texture");
                    });
            }

            if (properties.metallicRoughnessTexture) {
                GLTFLoader.LoadTextureAsync(runtime, properties.metallicRoughnessTexture,
                    texture => {
                        material.babylonMaterial.metallicTexture = texture;
                        material.babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                        material.babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                        material.babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                    },
                    () => {
                        Tools.Warn("Failed to load metallic roughness texture");
                    });
            }
        }

        public static LoadCommonMaterialProperties(runtime: IGLTFRuntime, material: IGLTFMaterial): void {
            if (material.normalTexture) {
                GLTFLoader.LoadTextureAsync(runtime, material.normalTexture, babylonTexture => {
                    material.babylonMaterial.bumpTexture = babylonTexture;
                    if (material.normalTexture.scale !== undefined) {
                        material.babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                    }
                }, () => Tools.Warn("Failed to load normal texture"));
            }

            if (material.occlusionTexture) {
                GLTFLoader.LoadTextureAsync(runtime, material.occlusionTexture, babylonTexture => {
                    material.babylonMaterial.ambientTexture = babylonTexture;
                    material.babylonMaterial.useAmbientInGrayScale = true;
                    if (material.occlusionTexture.strength !== undefined) {
                        material.babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                    }
                }, () => Tools.Warn("Failed to load occlusion texture"));
            }

            material.babylonMaterial.useEmissiveAsIllumination = (material.emissiveFactor || material.emissiveTexture) ? true : false;
            material.babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.emissiveTexture) {
                GLTFLoader.LoadTextureAsync(runtime, material.emissiveTexture, babylonTexture => {
                    material.babylonMaterial.emissiveTexture = babylonTexture;
                }, () => Tools.Warn("Failed to load emissive texture"));
            }

            if (material.doubleSided) {
                material.babylonMaterial.backFaceCulling = false;
                material.babylonMaterial.twoSidedLighting = true;
            }
        }

        public static LoadAlphaProperties(runtime: IGLTFRuntime, material: IGLTFMaterial): void {
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

        public static LoadTextureAsync(runtime: IGLTFRuntime, textureInfo: IGLTFTextureInfo, onSuccess: (babylonTexture: Texture) => void, onError: () => void): void {
            var texture = runtime.gltf.textures[textureInfo.index];

            if (!texture || texture.source === undefined) {
                onError();
                return;
            }

            if (texture.babylonTexture) {
                onSuccess(texture.babylonTexture);
                return;
            }

            var source = runtime.gltf.images[texture.source];

            if (source.uri === undefined) {
                var bufferView: IGLTFBufferView = runtime.gltf.bufferViews[source.bufferView];
                var buffer = GLTFUtils.GetBufferFromBufferView(runtime, bufferView, 0, bufferView.byteLength, EComponentType.UNSIGNED_BYTE);
                GLTFLoader.CreateTextureAsync(runtime, textureInfo, buffer, source.mimeType, onSuccess, onError);
            }
            else if (GLTFUtils.IsBase64(source.uri)) {
                GLTFLoader.CreateTextureAsync(runtime, textureInfo, new Uint8Array(GLTFUtils.DecodeBase64(source.uri)), source.mimeType, onSuccess, onError);
            }
            else {
                Tools.LoadFile(runtime.rootUrl + source.uri, data => {
                    GLTFLoader.CreateTextureAsync(runtime, textureInfo, new Uint8Array(data), source.mimeType, onSuccess, onError);
                }, null, null, true, onError);
            }
        }

        public static CreateTextureAsync(runtime: IGLTFRuntime, textureInfo: IGLTFTextureInfo, buffer: ArrayBufferView, mimeType: string, onSuccess: (babylonTexture: Texture) => void, onError: () => void): void {
            var texture = runtime.gltf.textures[textureInfo.index];

            if (!texture || texture.source === undefined) {
                onError();
                return;
            }

            if (texture.babylonTexture) {
                onSuccess(texture.babylonTexture);
                return;
            }

            var sampler: IGLTFSampler = texture.sampler ? runtime.gltf.samplers[texture.sampler] : {};

            var createMipMaps =
                (sampler.minFilter === ETextureMinFilter.NEAREST_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureMinFilter.NEAREST_MIPMAP_LINEAR) ||
                (sampler.minFilter === ETextureMinFilter.LINEAR_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureMinFilter.LINEAR_MIPMAP_LINEAR);

            var samplingMode = Texture.BILINEAR_SAMPLINGMODE;

            var blob = new Blob([buffer], { type: mimeType });
            var blobURL = URL.createObjectURL(blob);
            var revokeBlobURL = () => URL.revokeObjectURL(blobURL);
            texture.babylonTexture = new Texture(blobURL, runtime.babylonScene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
            texture.babylonTexture.coordinatesIndex = textureInfo.texCoord === undefined ? 0 : textureInfo.texCoord;
            texture.babylonTexture.wrapU = GLTFUtils.GetWrapMode(sampler.wrapS);
            texture.babylonTexture.wrapV = GLTFUtils.GetWrapMode(sampler.wrapT);
            texture.babylonTexture.name = texture.name;

            onSuccess(texture.babylonTexture);
        }

        /**
        * Import meshes
        */
        public importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError?: () => void): boolean {
            scene.useRightHandedSystem = true;

            var runtime = this._createRuntime(scene, data, rootUrl, true);
            if (!runtime) {
                if (onError) onError();
                return;
            }

            if (meshesNames === "") {
                runtime.importMeshesNames = [];
            }
            else if (typeof meshesNames === "string") {
                runtime.importMeshesNames = [meshesNames];
            }
            else if (meshesNames && !(meshesNames instanceof Array)) {
                runtime.importMeshesNames = [meshesNames];
            }
            else {
                runtime.importMeshesNames = [];
                Tools.Warn("Argument meshesNames must be of type string or string[]");
            }

            // Load scene
            importScene(runtime);

            var meshes = [];
            var skeletons = [];

            // Fill arrays of meshes and skeletons
            for (var i = 0; i < runtime.gltf.nodes.length; i++) {
                var node = runtime.gltf.nodes[i];

                if (node.babylonNode instanceof AbstractMesh) {
                    meshes.push(<AbstractMesh>node.babylonNode);
                }
            }

            for (var i = 0; i < runtime.gltf.skins.length; i++) {
                var skin = runtime.gltf.skins[i];

                if (skin.babylonSkeleton instanceof Skeleton) {
                    skeletons.push(skin.babylonSkeleton);
                }
            }

            // Load buffers, materials, etc.
            this._loadBuffersAsync(runtime, () => {
                importMaterials(runtime);
                postLoad(runtime);

                if (!BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                    onSuccess(meshes, null, skeletons);
                }
            }, onError);

            if (BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                onSuccess(meshes, null, skeletons);
            }

            return true;
        }

        /**
        * Load scene
        */
        public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onError: () => void): boolean {
            scene.useRightHandedSystem = true;

            var runtime = this._createRuntime(scene, data, rootUrl, false);
            if (!runtime) {
                if (onError) onError();
                return false;
            }

            importScene(runtime);

            this._loadBuffersAsync(runtime, () => {
                importMaterials(runtime);
                postLoad(runtime);

                if (!BABYLON.GLTFFileLoader.IncrementalLoading) {
                    onSuccess();
                }
            }, onError);

            if (BABYLON.GLTFFileLoader.IncrementalLoading) {
                onSuccess();
            }

            return true;
        }

        private _loadBuffersAsync(runtime: IGLTFRuntime, onSuccess: () => void, onError: () => void): void {
            if (runtime.gltf.buffers.length == 0) {
                onSuccess();
                return;
            }

            var loadedCount = 0;
            runtime.gltf.buffers.forEach((buffer, index) => {
                this._loadBufferAsync(runtime, index, () => {
                    if (++loadedCount >= runtime.gltf.buffers.length) {
                        onSuccess();
                    }
                }, onError);
            });
        }

        private _loadBufferAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): void {
            var buffer = runtime.gltf.buffers[index];

            if (buffer.uri === undefined) {
                // buffer.loadedBufferView should already be set
                onSuccess();
            }
            else if (GLTFUtils.IsBase64(buffer.uri)) {
                var data = GLTFUtils.DecodeBase64(buffer.uri);
                setTimeout(() => {
                    buffer.loadedBufferView = new Uint8Array(data);
                    onSuccess();
                });
            }
            else {
                Tools.LoadFile(runtime.rootUrl + buffer.uri, data => {
                    buffer.loadedBufferView = new Uint8Array(data);
                    onSuccess();
                }, null, null, true, onError);
            }
        }

        private _createRuntime(scene: Scene, data: IGLTFLoaderData, rootUrl: string, importOnlyMeshes: boolean): IGLTFRuntime {
            var runtime: IGLTFRuntime = {
                gltf: <IGLTF>data.json,

                babylonScene: scene,
                rootUrl: rootUrl,

                importOnlyMeshes: importOnlyMeshes,
            }

            var binaryBuffer: IGLTFBuffer;
            var buffers = runtime.gltf.buffers;
            if (buffers.length > 0 && buffers[0].uri === undefined) {
                binaryBuffer = buffers[0];
            }

            if (data.bin) {
                if (!binaryBuffer) {
                    Tools.Error("Unexpected BIN chunk");
                    return null;
                }

                if (binaryBuffer.byteLength != data.bin.byteLength) {
                    Tools.Error("Binary buffer length from JSON does not match chunk length");
                    return null;
                }

                binaryBuffer.loadedBufferView = data.bin;
            }

            GLTFLoaderExtension.PostCreateRuntime(runtime);
            return runtime;
        }
    }

    BABYLON.GLTFFileLoader.GLTFLoaderV2 = new GLTFLoader();
}
