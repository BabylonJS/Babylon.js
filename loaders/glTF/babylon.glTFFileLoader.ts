module BABYLON {
    /**
    * Tokenizer. Used for shaders compatibility
    * Automatically map world, view, projection, worldViewProjection, attributes and so on
    */
    enum ETokenType {
        IDENTIFIER = 1,

        UNKNOWN = 2,
        END_OF_INPUT = 3
    }

    class Tokenizer {
        private _toParse: string;
        private _pos: number = 0;
        private _maxPos: number;

        public currentToken: ETokenType;
        public currentIdentifier: string;
        public currentString: string;
        public isLetterOrDigitPattern: RegExp = /^[a-zA-Z0-9]+$/;

        constructor(toParse: string) {
            this._toParse = toParse;
            this._maxPos = toParse.length;
        }

        public getNextToken(): ETokenType {
            if (this.isEnd()) return ETokenType.END_OF_INPUT;

            this.currentString = this.read();
            this.currentToken = ETokenType.UNKNOWN;

            if (this.currentString === "_" || this.isLetterOrDigitPattern.test(this.currentString)) {
                this.currentToken = ETokenType.IDENTIFIER;
                this.currentIdentifier = this.currentString;
                while (!this.isEnd() && (this.isLetterOrDigitPattern.test(this.currentString = this.peek()) || this.currentString === "_")) {
                    this.currentIdentifier += this.currentString;
                    this.forward();
                }
            }

            return this.currentToken;
        }

        public peek(): string {
            return this._toParse[this._pos];
        }

        public read(): string {
            return this._toParse[this._pos++];
        }

        public forward(): void {
            this._pos++;
        }

        public isEnd(): boolean {
            return this._pos >= this._maxPos;
        }
    }

    /**
    * Values
    */
    var glTFTransforms = ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"];
    var babylonTransforms = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"];

    var glTFAnimationPaths = ["translation", "rotation", "scale"];
    var babylonAnimationPaths = ["position", "rotationQuaternion", "scaling"];

    /**
    * Parse
    */
    var parseBuffers = (parsedBuffers: any, gltfRuntime: IGLTFRuntime) => {
        for (var buf in parsedBuffers) {
            var parsedBuffer = parsedBuffers[buf];
            gltfRuntime.buffers[buf] = parsedBuffer;
            gltfRuntime.buffersCount++;
        }
    };

    var parseShaders = (parsedShaders: any, gltfRuntime: IGLTFRuntime) => {
        for (var sha in parsedShaders) {
            var parsedShader = parsedShaders[sha];
            gltfRuntime.shaders[sha] = parsedShader;
            gltfRuntime.shaderscount++;
        }
    };

    var parseObject = (parsedObjects: any, runtimeProperty: string, gltfRuntime: IGLTFRuntime) => {
        for (var object in parsedObjects) {
            var parsedObject = parsedObjects[object];
            gltfRuntime[runtimeProperty][object] = parsedObject;
        }
    };

    /**
    * Utils
    */
    var normalizeUVs = (buffer: any) => {
        if (!buffer) {
            return;
        }

        for (var i = 0; i < buffer.length / 2; i++) {
            buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
        }
    };

    var replaceInString = (str: string, searchValue: string, replaceValue: string) => {
        while (str.indexOf(searchValue) !== -1) {
            str = str.replace(searchValue, replaceValue);
        }

        return str;
    };

    var getAttribute = (attributeParameter: IGLTFTechniqueParameter) => {
        if (attributeParameter.semantic === "NORMAL") {
            return "normal";
        } else if (attributeParameter.semantic === "POSITION") {
            return "position";
        } else if (attributeParameter.semantic === "JOINT") {
            return "matricesIndices";
        } else if (attributeParameter.semantic === "WEIGHT") {
            return "matricesWeights";
        } else if (attributeParameter.semantic === "COLOR") {
            return "color";
        } else if (attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
            var channel = Number(attributeParameter.semantic.split("_")[1]);
            return "uv" + (channel === 0 ? "" : channel + 1);
        }
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
    var loadAnimations = (gltfRuntime: IGLTFRuntime) => {
        for (var anim in gltfRuntime.animations) {
            var animation: IGLTFAnimation = gltfRuntime.animations[anim];

            var lastAnimation: Animation = null;

            for (var i = 0; i < animation.channels.length; i++) {
                // Get parameters and load buffers
                var channel = animation.channels[i];
                var sampler: IGLTFAnimationSampler = animation.samplers[channel.sampler];

                if (!sampler) {
                    continue;
                }

                var inputData = animation.parameters[sampler.input];
                var outputData = animation.parameters[sampler.output];

                var bufferInput = GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
                var bufferOutput = GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);

                var targetID = channel.target.id;
                var targetNode: any = gltfRuntime.scene.getNodeByID(targetID);

                if (targetNode === null) {
                    Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetID + " to attach to");
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
                    babylonAnimation = new Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, Animation.ANIMATIONLOOPMODE_CYCLE);
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
                            // Y is Up
                            if (GLTFFileLoader.MakeYUP) {
                                rotationQuaternion = rotationQuaternion.multiply(new Quaternion(-0.707107, 0, 0, 0.707107));
                            }
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

                gltfRuntime.scene.stopAnimation(targetNode);
                gltfRuntime.scene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
            }
        }
    };

    /**
    * Returns the bones transformation matrix
    */
    var configureBoneTransformation = (node: IGLTFNode): Matrix => {
        var mat: Matrix = null;
        if (node.translation && node.rotation && node.scale) {
            var scale = Vector3.FromArray(node.scale);
            var rotation = Quaternion.FromArray(node.rotation);
            var position = Vector3.FromArray(node.translation);

            // Y is Up
            if (GLTFFileLoader.MakeYUP) {
                rotation = rotation.multiply(new Quaternion(-0.707107, 0, 0, 0.707107));
            }

            mat = Matrix.Compose(scale, rotation, position);
        }
        else {
            mat = Matrix.FromArray(node.matrix);
        }

        return mat;
    };

    /**
    * Returns the parent bone
    */
    var getParentBone = (gltfRuntime: IGLTFRuntime, skins: IGLTFSkins, jointName: string, newSkeleton: Skeleton): Bone => {
        // Try to find
        for (var i = 0; i < newSkeleton.bones.length; i++) {
            if (newSkeleton.bones[i].id === jointName) {
                return newSkeleton.bones[i];
            }
        }

        // Not found, search in gltf nodes
        var nodes = gltfRuntime.nodes;
        for (var nde in nodes) {
            var node: IGLTFNode = nodes[nde];

            if (!node.jointName) {
                continue;
            }

            var children = node.children;
            for (var i = 0; i < children.length; i++) {
                var child: IGLTFNode = gltfRuntime.nodes[children[i]];
                if (!child.jointName) {
                    continue;
                }

                if (child.jointName === jointName) {
                    var mat = configureBoneTransformation(node);
                    var bone = new Bone(node.name, newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
                    bone.id = nde;
                    return bone;
                }
            }
        }

        return null;
    }

    /**
    * Returns the appropriate root node
    */
    var getNodeToRoot = (nodesToRoot: INodeToRoot[], id: string): Bone => {
        for (var i = 0; i < nodesToRoot.length; i++) {
            var nodeToRoot = nodesToRoot[i];

            for (var j = 0; j < nodeToRoot.node.children.length; j++) {
                var child = nodeToRoot.node.children[j];
                if (child === id) {
                    return nodeToRoot.bone;
                }
            }
        }

        return null;
    };

    /**
    * Returns the node with the joint name
    */
    var getJointNode = (gltfRuntime: IGLTFRuntime, jointName: string): IJointNode => {
        var nodes = gltfRuntime.nodes;
        var node: IGLTFNode = nodes[jointName];
        if (node) {
            return {
                node: node,
                id: jointName
            };
        }

        for (var nde in nodes) {
            node = nodes[nde];
            if (node.jointName === jointName) {
                return {
                    node: node,
                    id: nde
                };
            }
        }

        return null;
    }

    /**
    * Checks if a nodes is in joints
    */
    var nodeIsInJoints = (skins: IGLTFSkins, id: string): boolean => {
        for (var i = 0; i < skins.jointNames.length; i++) {
            if (skins.jointNames[i] === id) {
                return true;
            }
        }

        return false;
    }

    /**
    * Fills the nodes to root for bones and builds hierarchy
    */
    var getNodesToRoot = (gltfRuntime: IGLTFRuntime, newSkeleton: Skeleton, skins: IGLTFSkins, nodesToRoot: INodeToRoot[]) => {
        // Creates nodes for root
        for (var nde in gltfRuntime.nodes) {
            var node: IGLTFNode = gltfRuntime.nodes[nde];
            var id = nde;

            if (!node.jointName || nodeIsInJoints(skins, node.jointName)) {
                continue;
            }

            // Create node to root bone
            var mat = configureBoneTransformation(node);
            var bone = new Bone(node.name, newSkeleton, null, mat);
            bone.id = id;
            nodesToRoot.push({ bone: bone, node: node, id: id });
        }

        // Parenting
        for (var i = 0; i < nodesToRoot.length; i++) {
            var nodeToRoot = nodesToRoot[i];
            var children = nodeToRoot.node.children;

            for (var j = 0; j < children.length; j++) {
                var child: INodeToRoot = null;

                for (var k = 0; k < nodesToRoot.length; k++) {
                    if (nodesToRoot[k].id === children[j]) {
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
    };

    var printMat = (m: Float32Array) => {
        console.log(
            m[0] + "\t" + m[1] + "\t" + m[2] + "\t" + m[3] + "\n" +
            m[4] + "\t" + m[5] + "\t" + m[6] + "\t" + m[7] + "\n" +
            m[8] + "\t" + m[9] + "\t" + m[10] + "\t" + m[11] + "\n" +
            m[12] + "\t" + m[13] + "\t" + m[14] + "\t" + m[15] + "\n"
        );
    }

    /**
    * Imports a skeleton
    */
    var importSkeleton = (gltfRuntime: IGLTFRuntime, skins: IGLTFSkins, mesh: Mesh, newSkeleton: Skeleton, id: string): Skeleton => {

        if (!newSkeleton) {
            newSkeleton = new Skeleton(skins.name, "", gltfRuntime.scene);
        }

        if (!skins.babylonSkeleton) {
            return newSkeleton;
        }

        // Matrices
        var accessor = gltfRuntime.accessors[skins.inverseBindMatrices];
        var buffer = GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);

        var bindShapeMatrix = Matrix.FromArray(skins.bindShapeMatrix);

        // Find the root bones
        var nodesToRoot: INodeToRoot[] = [];
        var nodesToRootToAdd: Bone[] = [];

        getNodesToRoot(gltfRuntime, newSkeleton, skins, nodesToRoot);
        newSkeleton.bones = [];

        if (nodesToRoot.length === 0) {
            newSkeleton.needInitialSkinMatrix = true;
        }

        // Joints
        for (var i = 0; i < skins.jointNames.length; i++) {
            var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
            var node = jointNode.node;

            if (!node) {
                Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
                continue;
            }

            var id = jointNode.id;

            // Optimize, if the bone already exists...
            var existingBone = gltfRuntime.scene.getBoneByID(id);
            if (existingBone) {
                newSkeleton.bones.push(existingBone);
                continue;
            }

            // Check if node already exists
            var foundBone = false;
            for (var j = 0; j < newSkeleton.bones.length; j++) {
                if (newSkeleton.bones[j].id === id) {
                    foundBone = true;
                    break;
                }
            }

            if (foundBone) {
                continue;
            }

            // Search for parent bone
            var parentBone: Bone = null;
            for (var j = 0; j < i; j++) {
                var joint: IGLTFNode = getJointNode(gltfRuntime, skins.jointNames[j]).node;

                if (!joint) {
                    Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
                    continue;
                }

                var children = joint.children;
                foundBone = false;

                for (var k = 0; k < children.length; k++) {
                    if (children[k] === id) {
                        parentBone = getParentBone(gltfRuntime, skins, skins.jointNames[j], newSkeleton);
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
                parentBone = getNodeToRoot(nodesToRoot, id);

                if (parentBone) {
                    if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                        nodesToRootToAdd.push(parentBone);
                    }
                }
            }

            if (!parentBone && nodesToRoot.length === 0) {
                var inverseBindMatrix = Matrix.FromArray(buffer, i * 16);
                var invertMesh = Matrix.Invert(mesh.getWorldMatrix());
                mat = mat.multiply(mesh.getWorldMatrix());
            }

            var bone = new Bone(node.name, newSkeleton, parentBone, mat);
            bone.id = id;
        }

        // Polish
        var bones = newSkeleton.bones;
        newSkeleton.bones = [];

        for (var i = 0; i < skins.jointNames.length; i++) {
            var jointNode: IJointNode = getJointNode(gltfRuntime, skins.jointNames[i]);

            if (!jointNode) {
                continue;
            }

            for (var j = 0; j < bones.length; j++) {
                if (bones[j].id === jointNode.id) {
                    newSkeleton.bones.push(bones[j]);
                    break;
                }
            }
        }

        // Finish
        newSkeleton.prepare();

        for (var i = 0; i < nodesToRootToAdd.length; i++) {
            newSkeleton.bones.push(nodesToRootToAdd[i]);
        }

        return newSkeleton;
    };

    /**
    * Imports a mesh and its geometries
    */
    var importMesh = (gltfRuntime: IGLTFRuntime, node: IGLTFNode, meshes: string[], id: string, newMesh: Mesh): Mesh => {
        if (!newMesh) {
            newMesh = new Mesh(node.name, gltfRuntime.scene);
            newMesh.id = id;
        }

        if (!node.babylonNode) {
            return newMesh;
        }
        var multiMat = new MultiMaterial("multimat" + id, gltfRuntime.scene);
        newMesh.material = multiMat;

        var vertexData = new VertexData();
        var geometry = new Geometry(id, gltfRuntime.scene, vertexData, false, newMesh);

        var verticesStarts = [];
        var verticesCounts = [];
        var indexStarts = [];
        var indexCounts = [];

        for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
            var meshID = meshes[meshIndex];
            var mesh: IGLTFMesh = gltfRuntime.meshes[meshID];

            if (!mesh) {
                continue;
            }

            // Positions, normals and UVs
            for (var i = 0; i < mesh.primitives.length; i++) {
                // Temporary vertex data
                var tempVertexData = new VertexData();

                var primitive = mesh.primitives[i];
                if (primitive.mode !== 4) {
                    //continue;
                }

                var attributes = primitive.attributes;
                var accessor: IGLTFAccessor = null;
                var buffer: any = null;

                // Set positions, normal and uvs
                for (var semantic in attributes) {

                    // Link accessor and buffer view
                    accessor = gltfRuntime.accessors[attributes[semantic]];
                    buffer = GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);

                    if (semantic === "NORMAL") {
                        tempVertexData.normals = new Float32Array(buffer.length);
                        (<Float32Array>tempVertexData.normals).set(buffer);
                    }
                    else if (semantic === "POSITION") {
                        if (GLTFFileLoader.HomogeneousCoordinates) {
                            tempVertexData.positions = new Float32Array(buffer.length - buffer.length / 4);

                            for (var j = 0; j < buffer.length; j += 4) {
                                tempVertexData.positions[j] = buffer[j];
                                tempVertexData.positions[j + 1] = buffer[j + 1];
                                tempVertexData.positions[j + 2] = buffer[j + 2];
                            }
                        }
                        else {
                            tempVertexData.positions = new Float32Array(buffer.length);
                            (<Float32Array>tempVertexData.positions).set(buffer);
                        }

                        verticesCounts.push(tempVertexData.positions.length);
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
                    else if (semantic === "COLOR") {
                        tempVertexData.colors = new Float32Array(buffer.length);
                        (<Float32Array>tempVertexData.colors).set(buffer);
                    }
                }

                // Indices
                accessor = gltfRuntime.accessors[primitive.indices];
                buffer = GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);

                tempVertexData.indices = new Int32Array(buffer.length);
                (<Float32Array>tempVertexData.indices).set(buffer);
                indexCounts.push(tempVertexData.indices.length);

                vertexData.merge(tempVertexData);
                tempVertexData = undefined;

                // Sub material
                var material = gltfRuntime.scene.getMaterialByID(primitive.material);
                multiMat.subMaterials.push(material === null ? gltfRuntime.scene.defaultMaterial : material);

                // Update vertices start and index start
                verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
                indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
            }
        }

        // Apply geometry
        geometry.setAllVerticesData(vertexData, false);

        newMesh.computeWorldMatrix(true);

        // Apply submeshes
        newMesh.subMeshes = [];
        var index = 0;
        for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
            var meshID = meshes[meshIndex];
            var mesh: IGLTFMesh = gltfRuntime.meshes[meshID];

            if (!mesh) {
                continue;
            }

            for (var i = 0; i < mesh.primitives.length; i++) {
                if (mesh.primitives[i].mode !== 4) {
                    //continue;
                }

                var subMesh = new SubMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
                index++;
            }
        }

        // Finish
        return newMesh;
    };

    /**
    * Configure node transformation from position, rotation and scaling
    */
    var configureNode = (newNode: any, position: Vector3, rotation: Quaternion, scaling: Vector3) => {
        if (newNode.position) {
            newNode.position = position;
        }

        if (newNode.rotationQuaternion || newNode.rotation) {
            newNode.rotationQuaternion = rotation;
        }

        if (newNode.scaling) {
            newNode.scaling = scaling;
        }
    };

    /**
    * Configures node from transformation matrix
    */
    var configureNodeFromMatrix = (newNode: any, node: IGLTFNode) => {
        if (node.matrix) {
            var position = new Vector3(0, 0, 0);
            var rotation = new Quaternion();
            var scaling = new Vector3(0, 0, 0);
            var mat = Matrix.FromArray(node.matrix);
            mat.decompose(scaling, rotation, position);

            // Y is Up
            if (GLTFFileLoader.MakeYUP) {
                rotation = rotation.multiply(new Quaternion(-0.707107, 0, 0, 0.707107));
            }

            configureNode(newNode, position, rotation, scaling);

            if (newNode instanceof TargetCamera) {
                (<TargetCamera>newNode).setTarget(Vector3.Zero());
            }
        }
        else {
            configureNode(newNode, Vector3.FromArray(node.translation), Quaternion.FromArray(node.rotation), Vector3.FromArray(node.scale));
        }
    };

    /**
    * Imports a node
    */
    var importNode = (gltfRuntime: IGLTFRuntime, node: IGLTFNode, id: string): Node => {
        var lastNode: Node = null;

        if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
            if (gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name) === -1) {
                return null;
            }
        }

        // Meshes
        if (node.skin) {
            if (node.meshes) {
                var skin: IGLTFSkins = gltfRuntime.skins[node.skin];

                var newMesh = importMesh(gltfRuntime, node, node.meshes, id, <Mesh>node.babylonNode);
                newMesh.skeleton = gltfRuntime.scene.getLastSkeletonByID(node.skin);

                if (newMesh.skeleton === null) {
                    newMesh.skeleton = importSkeleton(gltfRuntime, skin, newMesh, skin.babylonSkeleton, node.skin);

                    if (!skin.babylonSkeleton) {
                        skin.babylonSkeleton = newMesh.skeleton;
                    }
                }

                if (newMesh.skeleton !== null) {
                    newMesh.useBones = true;
                }

                lastNode = newMesh;
            }
        }
        else if (node.meshes) {
            /**
            * Improve meshes property
            */
            var newMesh = importMesh(gltfRuntime, node, node.mesh ? [node.mesh] : node.meshes, id, <Mesh>node.babylonNode);
            lastNode = newMesh;
        }
        // Lights
        else if (node.light && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
            var light: IGLTFLight = gltfRuntime.lights[node.light];

            if (light) {
                if (light.type === "ambient") {
                    var ambienLight: IGLTFAmbienLight = light[light.type];
                    var hemiLight = new HemisphericLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                    hemiLight.name = node.name;

                    if (ambienLight.color) {
                        hemiLight.diffuse = Color3.FromArray(ambienLight.color);
                    }

                    lastNode = hemiLight;
                }
                else if (light.type === "directional") {
                    var directionalLight: IGLTFDirectionalLight = light[light.type];
                    var dirLight = new DirectionalLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                    dirLight.name = node.name;

                    if (directionalLight.color) {
                        dirLight.diffuse = Color3.FromArray(directionalLight.color);
                    }

                    lastNode = dirLight;
                }
                else if (light.type === "point") {
                    var pointLight: IGLTFPointLight = light[light.type];
                    var ptLight = new PointLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                    ptLight.name = node.name;

                    if (pointLight.color) {
                        ptLight.diffuse = Color3.FromArray(pointLight.color);
                    }

                    lastNode = ptLight;
                }
                else if (light.type === "spot") {
                    var spotLight: IGLTFSpotLight = light[light.type];
                    var spLight = new SpotLight(node.light, Vector3.Zero(), Vector3.Zero(), 0, 0, gltfRuntime.scene);
                    spLight.name = node.name;

                    if (spotLight.color) {
                        spLight.diffuse = Color3.FromArray(spotLight.color);
                    }

                    if (spotLight.fallOfAngle) {
                        spLight.angle = spotLight.fallOfAngle;
                    }

                    if (spotLight.fallOffExponent) {
                        spLight.exponent = spotLight.fallOffExponent;
                    }

                    lastNode = spLight;
                }
            }
        }
        // Cameras
        else if (node.camera && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
            var camera: IGLTFCamera = gltfRuntime.cameras[node.camera];

            if (camera) {
                if (camera.type === "orthographic") {
                    var orthographicCamera: IGLTFCameraOrthographic = camera[camera.type];
                    var orthoCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene);

                    orthoCamera.name = node.name;
                    orthoCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
                    orthoCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());

                    lastNode = orthoCamera;
                }
                else if (camera.type === "perspective") {
                    var perspectiveCamera: IGLTFCameraPerspective = camera[camera.type];
                    var persCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene);

                    persCamera.name = node.name;
                    persCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());

                    if (!perspectiveCamera.aspectRatio) {
                        perspectiveCamera.aspectRatio = gltfRuntime.scene.getEngine().getRenderWidth() / gltfRuntime.scene.getEngine().getRenderHeight();
                    }

                    if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                        persCamera.maxZ = perspectiveCamera.zfar;
                        persCamera.minZ = perspectiveCamera.znear;
                    }

                    lastNode = persCamera;
                }
            }
        }

        // Empty node
        if (!node.jointName) {
            if (node.babylonNode) {
                return node.babylonNode;
            }
            else if (lastNode === null) {
                var dummy = new Mesh(node.name, gltfRuntime.scene);
                node.babylonNode = dummy;
                lastNode = dummy;
            }
        }

        if (lastNode !== null) {
            if (node.matrix) {
                configureNodeFromMatrix(lastNode, node);
            }
            else {
                configureNode(lastNode, Vector3.FromArray(node.translation), Quaternion.RotationAxis(Vector3.FromArray(node.rotation).normalize(), node.rotation[3]), Vector3.FromArray(node.scale));
            }

            lastNode.updateCache(true);

            node.babylonNode = lastNode;
        }

        return lastNode;
    };

    /**
    * Traverses nodes and creates them
    */
    var traverseNodes = (gltfRuntime: IGLTFRuntime, id: string, parent: Node, meshIncluded?: boolean) => {
        var node: IGLTFNode = gltfRuntime.nodes[id];
        var newNode: Node = null;

        if (gltfRuntime.importOnlyMeshes && !meshIncluded) {
            if (gltfRuntime.importMeshesNames.indexOf(node.name) !== -1 || gltfRuntime.importMeshesNames.length === 0) {
                meshIncluded = true;
            }
            else {
                meshIncluded = false;
            }
        }
        else {
            meshIncluded = true;
        }

        if (!node.jointName && meshIncluded) {
            newNode = importNode(gltfRuntime, node, id);

            if (newNode !== null) {
                newNode.id = id;
                newNode.parent = parent;
            }
        }

        for (var i = 0; i < node.children.length; i++) {
            traverseNodes(gltfRuntime, node.children[i], newNode, meshIncluded);
        }
    };

    /**
    * Buffers loaded, create nodes
    */
    var onBuffersLoaded = (gltfRuntime: IGLTFRuntime) => {
        // Nodes
        var currentScene: IGLTFScene = <IGLTFScene>gltfRuntime.currentScene;

        for (var i = 0; i < currentScene.nodes.length; i++) {
            traverseNodes(gltfRuntime, currentScene.nodes[i], null);
        }

        // Set animations
        loadAnimations(gltfRuntime);

        for (var i = 0; i < gltfRuntime.scene.skeletons.length; i++) {
            var skeleton = gltfRuntime.scene.skeletons[i];
            gltfRuntime.scene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
        }
    };

    /**
    * onBind shaderrs callback to set uniforms and matrices
    */
    var onBindShaderMaterial = (mesh: Mesh, gltfRuntime: IGLTFRuntime, unTreatedUniforms: Object, shaderMaterial: ShaderMaterial, technique: IGLTFTechnique, material: IGLTFMaterial, onSuccess: (shaderMaterial: ShaderMaterial) => void) => {
        for (var unif in unTreatedUniforms) {
            var uniform: IGLTFTechniqueParameter = unTreatedUniforms[unif];
            var type = uniform.type;

            if (type === EParameterType.FLOAT_MAT2 || type === EParameterType.FLOAT_MAT3 || type === EParameterType.FLOAT_MAT4) {
                if (uniform.semantic && !uniform.source && !uniform.node) {
                    GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
                }
                else if (uniform.semantic && (uniform.source || uniform.node)) {
                    var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node);
                    if (source === null) {
                        source = gltfRuntime.scene.getNodeByID(uniform.source || uniform.node);
                    }
                    if (source === null) {
                        continue;
                    }

                    GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
                }
            }
            else {
                var value = material.values[technique.uniforms[unif]];
                if (!value) {
                    continue;
                }

                if (type === EParameterType.SAMPLER_2D) {
                    var texture: Texture = gltfRuntime.textures[value].babylonTexture;

                    if (texture === null) {
                        continue;
                    }

                    shaderMaterial.getEffect().setTexture(unif, texture);
                }
                else {
                    GLTFUtils.SetUniform(shaderMaterial.getEffect(), unif, value, type);
                }
            }
        }

        onSuccess(shaderMaterial);
    };

    /**
    * Prepare uniforms to send the only one time
    * Loads the appropriate textures
    */
    var prepareShaderMaterialUniforms = (gltfRuntime: IGLTFRuntime, shaderMaterial: ShaderMaterial, technique: IGLTFTechnique, material: IGLTFMaterial, unTreatedUniforms: Object) => {
        var materialValues = material.values;
        var techniqueUniforms = technique.uniforms;

        /**
        * Prepare values here (not matrices)
        */
        for (var unif in unTreatedUniforms) {
            var uniform: IGLTFTechniqueParameter = unTreatedUniforms[unif];
            var type = uniform.type;
            var value = materialValues[techniqueUniforms[unif]] || uniform.value;

            if (!value) {
                continue;
            }

            var onLoadTexture = (texture: Texture) => {
                if (uniform.value) {
                    // Static uniform
                    shaderMaterial.setTexture(unif, texture);
                    delete unTreatedUniforms[unif];
                }
            };

            // Texture (sampler2D)
            if (type === EParameterType.SAMPLER_2D) {
                GLTFFileLoaderExtension.LoadTextureAsync(gltfRuntime, <string>value, onLoadTexture, () => onLoadTexture(null));
            }
            // Others
            else {
                if (uniform.value && GLTFUtils.SetUniform(shaderMaterial, unif, value, type)) {
                    // Static uniform
                    delete unTreatedUniforms[unif];
                }
            }
        }
    };

    /**
    * Shader compilation failed
    */
    var onShaderCompileError = (program: IGLTFProgram, shaderMaterial: ShaderMaterial, onError: () => void) => {
        return (effect: Effect, error: string) => {
            Tools.Error("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
            shaderMaterial.dispose(true);
            onError();
        };
    };

    /**
    * Shader compilation success
    */
    var onShaderCompileSuccess = (gltfRuntime: IGLTFRuntime, shaderMaterial: ShaderMaterial, technique: IGLTFTechnique, material: IGLTFMaterial, unTreatedUniforms: Object, onSuccess: (shaderMaterial: ShaderMaterial) => void) => {
        return (_: Effect) => {
            prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);

            shaderMaterial.onBind = (mesh: Mesh) => {
                onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
            };
        };
    };

    /**
    * Returns the appropriate uniform if already handled by babylon
    */
    var parseShaderUniforms = (tokenizer: Tokenizer, technique: IGLTFTechnique, unTreatedUniforms: Object): string => {
        for (var unif in technique.uniforms) {
            var uniform = technique.uniforms[unif];
            var uniformParameter: IGLTFTechniqueParameter = technique.parameters[uniform];

            if (tokenizer.currentIdentifier === unif) {
                if (uniformParameter.semantic && !uniformParameter.source && !uniformParameter.node) {
                    var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);

                    if (transformIndex !== -1) {
                        delete unTreatedUniforms[unif];
                        return babylonTransforms[transformIndex];
                    }
                }
            }
        }

        return tokenizer.currentIdentifier;
    };

    /**
    * All shaders loaded. Create materials one by one
    */
    var importMaterials = (gltfRuntime: IGLTFRuntime) => {
        // Create materials
        for (var mat in gltfRuntime.materials) {
            GLTFFileLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, (material: Material) => { }, () => { });
        }
    };

    /**
    * Implementation of the base glTF spec
    */
    export class GLTFFileLoaderBase {
        public static CreateRuntime(parsedData: any, scene: Scene, rootUrl: string): IGLTFRuntime {
            var gltfRuntime: IGLTFRuntime = {
                accessors: {},
                buffers: {},
                bufferViews: {},
                meshes: {},
                lights: {},
                cameras: {},
                nodes: {},
                images: {},
                textures: {},
                shaders: {},
                programs: {},
                samplers: {},
                techniques: {},
                materials: {},
                animations: {},
                skins: {},
                currentScene: {},
                extensionsUsed: [],

                buffersCount: 0,
                shaderscount: 0,

                scene: scene,
                rootUrl: rootUrl,

                loadedBufferCount: 0,
                loadedBufferViews: {},

                loadedShaderCount: 0,

                importOnlyMeshes: false,

                dummyNodes: []
            }

            // Parse
            if (parsedData.extensionsUsed) {
                parseObject(parsedData.extensionsUsed, "extensionsUsed", gltfRuntime);
            }

            if (parsedData.buffers) {
                parseBuffers(parsedData.buffers, gltfRuntime);
            }

            if (parsedData.bufferViews) {
                parseObject(parsedData.bufferViews, "bufferViews", gltfRuntime);
            }

            if (parsedData.accessors) {
                parseObject(parsedData.accessors, "accessors", gltfRuntime);
            }

            if (parsedData.meshes) {
                parseObject(parsedData.meshes, "meshes", gltfRuntime);
            }

            if (parsedData.lights) {
                parseObject(parsedData.lights, "lights", gltfRuntime);
            }

            if (parsedData.cameras) {
                parseObject(parsedData.cameras, "cameras", gltfRuntime);
            }

            if (parsedData.nodes) {
                parseObject(parsedData.nodes, "nodes", gltfRuntime);
            }

            if (parsedData.images) {
                parseObject(parsedData.images, "images", gltfRuntime);
            }

            if (parsedData.textures) {
                parseObject(parsedData.textures, "textures", gltfRuntime);
            }

            if (parsedData.shaders) {
                parseShaders(parsedData.shaders, gltfRuntime);
            }

            if (parsedData.programs) {
                parseObject(parsedData.programs, "programs", gltfRuntime);
            }

            if (parsedData.samplers) {
                parseObject(parsedData.samplers, "samplers", gltfRuntime);
            }

            if (parsedData.techniques) {
                parseObject(parsedData.techniques, "techniques", gltfRuntime);
            }

            if (parsedData.materials) {
                parseObject(parsedData.materials, "materials", gltfRuntime);
            }

            if (parsedData.animations) {
                parseObject(parsedData.animations, "animations", gltfRuntime);
            }

            if (parsedData.skins) {
                parseObject(parsedData.skins, "skins", gltfRuntime);
            }

            if (parsedData.scene && parsedData.scenes) {
                gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
            }

            return gltfRuntime;
        }

        public static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): void {
            var buffer: IGLTFBuffer = gltfRuntime.buffers[id];

            if (GLTFUtils.IsBase64(buffer.uri)) {
                onSuccess(new Uint8Array(GLTFUtils.DecodeBase64(buffer.uri)));
            }
            else {
                Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, data => onSuccess(new Uint8Array(data)), null, null, true, onError);
            }
        }

        public static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): void {
            var texture: IGLTFTexture = gltfRuntime.textures[id];

            if (!texture || !texture.source) {
                onError();
                return;
            }

            if (texture.babylonTexture) {
                onSuccess(null);
                return;
            }

            var source: IGLTFImage = gltfRuntime.images[texture.source];

            if (GLTFUtils.IsBase64(source.uri)) {
                onSuccess(new Uint8Array(GLTFUtils.DecodeBase64(source.uri)));
            }
            else {
                Tools.LoadFile(gltfRuntime.rootUrl + source.uri, data => onSuccess(new Uint8Array(data)), null, null, true, onError);
            }
        }

        public static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: () => void): void {
            var texture: IGLTFTexture = gltfRuntime.textures[id];

            if (texture.babylonTexture) {
                onSuccess(texture.babylonTexture);
                return;
            }

            var sampler: IGLTFSampler = gltfRuntime.samplers[texture.sampler];

            var createMipMaps =
                (sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                (sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_LINEAR);

            var samplingMode = Texture.BILINEAR_SAMPLINGMODE;

            var blob = new Blob([buffer]);
            var blobURL = URL.createObjectURL(blob);
            var revokeBlobURL = () => URL.revokeObjectURL(blobURL);
            var newTexture = new Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
            newTexture.wrapU = GLTFUtils.GetWrapMode(sampler.wrapS);
            newTexture.wrapV = GLTFUtils.GetWrapMode(sampler.wrapT);
            newTexture.name = id;

            texture.babylonTexture = newTexture;
            onSuccess(newTexture);
        }

        public static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: () => void): void {
            var shader: IGLTFShader = gltfRuntime.shaders[id];

            if (GLTFUtils.IsBase64(shader.uri)) {
                var shaderString = atob(shader.uri.split(",")[1]);
                onSuccess(shaderString);
            }
            else {
                Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, null, null, false, onError);
            }
        }

        public static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): void {
            var material: IGLTFMaterial = gltfRuntime.materials[id];
            var technique: IGLTFTechnique = gltfRuntime.techniques[material.technique];

            var program: IGLTFProgram = gltfRuntime.programs[technique.program];
            var states: IGLTFTechniqueStates = technique.states;

            var vertexShader: string = Effect.ShadersStore[program.vertexShader + "VertexShader"];
            var pixelShader: string = Effect.ShadersStore[program.fragmentShader + "PixelShader"];
            var newVertexShader = "";
            var newPixelShader = "";

            var vertexTokenizer = new Tokenizer(vertexShader);
            var pixelTokenizer = new Tokenizer(pixelShader);

            var unTreatedUniforms: Object = {};
            var uniforms = [];
            var attributes = [];
            var samplers = [];

            // Fill uniform, sampler2D and attributes
            for (var unif in technique.uniforms) {
                var uniform = technique.uniforms[unif];
                var uniformParameter: IGLTFTechniqueParameter = technique.parameters[uniform];

                unTreatedUniforms[unif] = uniformParameter;

                if (uniformParameter.semantic && !uniformParameter.node && !uniformParameter.source) {
                    var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                    if (transformIndex !== -1) {
                        uniforms.push(babylonTransforms[transformIndex]);
                        delete unTreatedUniforms[unif];
                    }
                    else {
                        uniforms.push(unif);
                    }
                }
                else if (uniformParameter.type === EParameterType.SAMPLER_2D) {
                    samplers.push(unif);
                }
                else {
                    uniforms.push(unif);
                }
            }

            for (var attr in technique.attributes) {
                var attribute = technique.attributes[attr];
                var attributeParameter: IGLTFTechniqueParameter = technique.parameters[attribute];

                if (attributeParameter.semantic) {
                    attributes.push(getAttribute(attributeParameter));
                }
            }

            // Configure vertex shader
            while (!vertexTokenizer.isEnd() && vertexTokenizer.getNextToken()) {
                var tokenType = vertexTokenizer.currentToken;

                if (tokenType !== ETokenType.IDENTIFIER) {
                    newVertexShader += vertexTokenizer.currentString;
                    continue;
                }

                var foundAttribute = false;

                for (var attr in technique.attributes) {
                    var attribute = technique.attributes[attr];
                    var attributeParameter: IGLTFTechniqueParameter = technique.parameters[attribute];

                    if (vertexTokenizer.currentIdentifier === attr && attributeParameter.semantic) {
                        newVertexShader += getAttribute(attributeParameter);
                        foundAttribute = true;
                        break;
                    }
                }

                if (foundAttribute) {
                    continue;
                }

                newVertexShader += parseShaderUniforms(vertexTokenizer, technique, unTreatedUniforms);
            }

            // Configure pixel shader
            while (!pixelTokenizer.isEnd() && pixelTokenizer.getNextToken()) {
                var tokenType = pixelTokenizer.currentToken;

                if (tokenType !== ETokenType.IDENTIFIER) {
                    newPixelShader += pixelTokenizer.currentString;
                    continue;
                }

                newPixelShader += parseShaderUniforms(pixelTokenizer, technique, unTreatedUniforms);
            }

            // Create shader material
            var shaderPath = {
                vertex: program.vertexShader + id,
                fragment: program.fragmentShader + id
            };

            var options = {
                attributes: attributes,
                uniforms: uniforms,
                samplers: samplers,
                needAlphaBlending: states.functions && states.functions.blendEquationSeparate
            };

            Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
            Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;

            var shaderMaterial = new ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
            shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
            shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
            shaderMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;

            if (states.functions) {
                var functions = states.functions;
                if (functions.cullFace && functions.cullFace[0] !== ECullingType.BACK) {
                    shaderMaterial.backFaceCulling = false;
                }

                var blendFunc = functions.blendFuncSeparate;
                if (blendFunc) {
                    if (blendFunc[0] === EBlendingFunction.SRC_ALPHA && blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_ALPHA && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = Engine.ALPHA_COMBINE;
                    }
                    else if (blendFunc[0] === EBlendingFunction.ONE && blendFunc[1] === EBlendingFunction.ONE && blendFunc[2] === EBlendingFunction.ZERO && blendFunc[3] === EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = Engine.ALPHA_ONEONE;
                    }
                    else if (blendFunc[0] === EBlendingFunction.SRC_ALPHA && blendFunc[1] === EBlendingFunction.ONE && blendFunc[2] === EBlendingFunction.ZERO && blendFunc[3] === EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = Engine.ALPHA_ADD;
                    }
                    else if (blendFunc[0] === EBlendingFunction.ZERO && blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = Engine.ALPHA_SUBTRACT;
                    }
                    else if (blendFunc[0] === EBlendingFunction.DST_COLOR && blendFunc[1] === EBlendingFunction.ZERO && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = Engine.ALPHA_MULTIPLY;
                    }
                    else if (blendFunc[0] === EBlendingFunction.SRC_ALPHA && blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = Engine.ALPHA_MAXIMIZED;
                    }
                }
            }
        }
    }

    /**
    * glTF File Loader Plugin
    */
    export class GLTFFileLoader implements ISceneLoaderPluginAsync {
        /**
        * Public members
        */
        public extensions: ISceneLoaderPluginExtensions = {
            ".gltf": { isBinary: false },
            ".glb": { isBinary: true }
        };

        /**
        * Private members
        */
        // None

        /**
        * Static members
        */
        public static MakeYUP: boolean = false;
        public static HomogeneousCoordinates: boolean = false;

        public static Extensions: { [name: string]: GLTFFileLoaderExtension } = {};

        public static RegisterExtension(extension: GLTFFileLoaderExtension): void {
            if (GLTFFileLoader.Extensions[extension.name]) {
                Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                return;
            }

            GLTFFileLoader.Extensions[extension.name] = extension;
        }

        /**
        * Import meshes
        */
        public importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError?: () => void): boolean {
            scene.useRightHandedSystem = true;

            var gltfRuntime = GLTFFileLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, gltfRuntime => {
                gltfRuntime.importOnlyMeshes = true;

                if (meshesNames === "") {
                    gltfRuntime.importMeshesNames = [];
                }
                else if (typeof meshesNames === "string") {
                    gltfRuntime.importMeshesNames = [meshesNames];
                }
                else if (meshesNames && !(meshesNames instanceof Array)) {
                    gltfRuntime.importMeshesNames = [meshesNames];
                }
                else {
                    gltfRuntime.importMeshesNames = [];
                    Tools.Warn("Argument meshesNames must be of type string or string[]");
                }

                // Create nodes
                this._createNodes(gltfRuntime);

                var meshes = [];
                var skeletons = [];

                // Fill arrays of meshes and skeletons
                for (var nde in gltfRuntime.nodes) {
                    var node: IGLTFNode = gltfRuntime.nodes[nde];

                    if (node.babylonNode instanceof AbstractMesh) {
                        meshes.push(<AbstractMesh>node.babylonNode);
                    }
                }

                for (var skl in gltfRuntime.skins) {
                    var skin: IGLTFSkins = gltfRuntime.skins[skl];

                    if (skin.babylonSkeleton instanceof Skeleton) {
                        skeletons.push(skin.babylonSkeleton);
                    }
                }

                // Load buffers, shaders, materials, etc.
                this._loadBuffersAsync(gltfRuntime, () => {
                    this._loadShadersAsync(gltfRuntime, () => {
                        importMaterials(gltfRuntime);
                        onBuffersLoaded(gltfRuntime);
                    });
                });

                if (onSuccess) {
                    onSuccess(meshes, null, skeletons);
                }
            }, onError);

            return true;
        }

        /**
        * Load scene
        */
        public loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: () => void, onError: () => void): boolean {
            scene.useRightHandedSystem = true;

            GLTFFileLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, gltfRuntime => {
                // Create nodes
                this._createNodes(gltfRuntime);

                // Load buffers, shaders, materials, etc.
                this._loadBuffersAsync(gltfRuntime, () => {
                    this._loadShadersAsync(gltfRuntime, () => {
                        importMaterials(gltfRuntime);
                        onBuffersLoaded(gltfRuntime);
                    });
                });

                onSuccess();
            }, onError);

            return true;
        }

        private _loadShadersAsync(gltfRuntime: IGLTFRuntime, onload: () => void): void {
            var hasShaders = false;

            var processShader = (sha: string, shader: IGLTFShader) => {
                GLTFFileLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, shaderString => {
                    gltfRuntime.loadedShaderCount++;

                    if (shaderString) {
                        Effect.ShadersStore[sha + (shader.type === EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = shaderString;
                    }

                    if (gltfRuntime.loadedShaderCount === gltfRuntime.shaderscount) {
                        onload();
                    }
                }, () => {
                    Tools.Error("Error when loading shader program named " + sha + " located at " + shader.uri);
                });
            };

            for (var sha in gltfRuntime.shaders) {
                hasShaders = true;

                var shader: IGLTFShader = gltfRuntime.shaders[sha];
                if (shader) {
                    processShader.bind(this, sha, shader)();
                }
                else {
                    Tools.Error("No shader named: " + sha);
                }
            }

            if (!hasShaders) {
                onload();
            }
        };

        private _loadBuffersAsync(gltfRuntime: IGLTFRuntime, onload: () => void): void {
            var hasBuffers = false;

            var processBuffer = (buf: string, buffer: IGLTFBuffer) => {
                GLTFFileLoaderExtension.LoadBufferAsync(gltfRuntime, buf, bufferView => {
                    gltfRuntime.loadedBufferCount++;

                    if (bufferView) {
                        if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                            Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                        }

                        gltfRuntime.loadedBufferViews[buf] = bufferView;
                    }

                    if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                        onload();
                    }
                }, () => {
                    Tools.Error("Error when loading buffer named " + buf + " located at " + buffer.uri);
                });
            };

            for (var buf in gltfRuntime.buffers) {
                hasBuffers = true;

                var buffer: IGLTFBuffer = gltfRuntime.buffers[buf];
                if (buffer) {
                    processBuffer.bind(this, buf, buffer)();
                }
                else {
                    Tools.Error("No buffer named: " + buf);
                }
            }

            if (!hasBuffers) {
                onload();
            }
        }

        // Creates nodes before loading buffers and shaders
        private _createNodes(gltfRuntime: IGLTFRuntime): void {
            var currentScene = <IGLTFScene>gltfRuntime.currentScene;

            for (var i = 0; i < currentScene.nodes.length; i++) {
                traverseNodes(gltfRuntime, currentScene.nodes[i], null);
            }
        }
    };

    BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
}
