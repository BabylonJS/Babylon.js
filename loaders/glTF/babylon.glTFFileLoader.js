var BABYLON;
(function (BABYLON) {
    /**
    * Enums
    */
    (function (EComponentType) {
        EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
        EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
        EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
        EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
        EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
    })(BABYLON.EComponentType || (BABYLON.EComponentType = {}));
    var EComponentType = BABYLON.EComponentType;
    (function (EShaderType) {
        EShaderType[EShaderType["FRAGMENT"] = 35632] = "FRAGMENT";
        EShaderType[EShaderType["VERTEX"] = 35633] = "VERTEX";
    })(BABYLON.EShaderType || (BABYLON.EShaderType = {}));
    var EShaderType = BABYLON.EShaderType;
    (function (EParameterType) {
        EParameterType[EParameterType["BYTE"] = 5120] = "BYTE";
        EParameterType[EParameterType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
        EParameterType[EParameterType["SHORT"] = 5122] = "SHORT";
        EParameterType[EParameterType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
        EParameterType[EParameterType["INT"] = 5124] = "INT";
        EParameterType[EParameterType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
        EParameterType[EParameterType["FLOAT"] = 5126] = "FLOAT";
        EParameterType[EParameterType["FLOAT_VEC2"] = 35664] = "FLOAT_VEC2";
        EParameterType[EParameterType["FLOAT_VEC3"] = 35665] = "FLOAT_VEC3";
        EParameterType[EParameterType["FLOAT_VEC4"] = 35666] = "FLOAT_VEC4";
        EParameterType[EParameterType["INT_VEC2"] = 35667] = "INT_VEC2";
        EParameterType[EParameterType["INT_VEC3"] = 35668] = "INT_VEC3";
        EParameterType[EParameterType["INT_VEC4"] = 35669] = "INT_VEC4";
        EParameterType[EParameterType["BOOL"] = 35670] = "BOOL";
        EParameterType[EParameterType["BOOL_VEC2"] = 35671] = "BOOL_VEC2";
        EParameterType[EParameterType["BOOL_VEC3"] = 35672] = "BOOL_VEC3";
        EParameterType[EParameterType["BOOL_VEC4"] = 35673] = "BOOL_VEC4";
        EParameterType[EParameterType["FLOAT_MAT2"] = 35674] = "FLOAT_MAT2";
        EParameterType[EParameterType["FLOAT_MAT3"] = 35675] = "FLOAT_MAT3";
        EParameterType[EParameterType["FLOAT_MAT4"] = 35676] = "FLOAT_MAT4";
        EParameterType[EParameterType["SAMPLER_2D"] = 35678] = "SAMPLER_2D";
    })(BABYLON.EParameterType || (BABYLON.EParameterType = {}));
    var EParameterType = BABYLON.EParameterType;
    (function (ETextureWrapMode) {
        ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
        ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
        ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
    })(BABYLON.ETextureWrapMode || (BABYLON.ETextureWrapMode = {}));
    var ETextureWrapMode = BABYLON.ETextureWrapMode;
    (function (ETextureFilterType) {
        ETextureFilterType[ETextureFilterType["NEAREST"] = 9728] = "NEAREST";
        ETextureFilterType[ETextureFilterType["LINEAR"] = 9728] = "LINEAR";
        ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
        ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
        ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
        ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
    })(BABYLON.ETextureFilterType || (BABYLON.ETextureFilterType = {}));
    var ETextureFilterType = BABYLON.ETextureFilterType;
    (function (ETextureFormat) {
        ETextureFormat[ETextureFormat["ALPHA"] = 6406] = "ALPHA";
        ETextureFormat[ETextureFormat["RGB"] = 6407] = "RGB";
        ETextureFormat[ETextureFormat["RGBA"] = 6408] = "RGBA";
        ETextureFormat[ETextureFormat["LUMINANCE"] = 6409] = "LUMINANCE";
        ETextureFormat[ETextureFormat["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
    })(BABYLON.ETextureFormat || (BABYLON.ETextureFormat = {}));
    var ETextureFormat = BABYLON.ETextureFormat;
    (function (ECullingType) {
        ECullingType[ECullingType["FRONT"] = 1028] = "FRONT";
        ECullingType[ECullingType["BACK"] = 1029] = "BACK";
        ECullingType[ECullingType["FRONT_AND_BACK"] = 1032] = "FRONT_AND_BACK";
    })(BABYLON.ECullingType || (BABYLON.ECullingType = {}));
    var ECullingType = BABYLON.ECullingType;
    (function (EBlendingFunction) {
        EBlendingFunction[EBlendingFunction["ZERO"] = 0] = "ZERO";
        EBlendingFunction[EBlendingFunction["ONE"] = 1] = "ONE";
        EBlendingFunction[EBlendingFunction["SRC_COLOR"] = 768] = "SRC_COLOR";
        EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_COLOR"] = 769] = "ONE_MINUS_SRC_COLOR";
        EBlendingFunction[EBlendingFunction["DST_COLOR"] = 774] = "DST_COLOR";
        EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_COLOR"] = 775] = "ONE_MINUS_DST_COLOR";
        EBlendingFunction[EBlendingFunction["SRC_ALPHA"] = 770] = "SRC_ALPHA";
        EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_ALPHA"] = 771] = "ONE_MINUS_SRC_ALPHA";
        EBlendingFunction[EBlendingFunction["DST_ALPHA"] = 772] = "DST_ALPHA";
        EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_ALPHA"] = 773] = "ONE_MINUS_DST_ALPHA";
        EBlendingFunction[EBlendingFunction["CONSTANT_COLOR"] = 32769] = "CONSTANT_COLOR";
        EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_COLOR"] = 32770] = "ONE_MINUS_CONSTANT_COLOR";
        EBlendingFunction[EBlendingFunction["CONSTANT_ALPHA"] = 32771] = "CONSTANT_ALPHA";
        EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_ALPHA"] = 32772] = "ONE_MINUS_CONSTANT_ALPHA";
        EBlendingFunction[EBlendingFunction["SRC_ALPHA_SATURATE"] = 776] = "SRC_ALPHA_SATURATE";
    })(BABYLON.EBlendingFunction || (BABYLON.EBlendingFunction = {}));
    var EBlendingFunction = BABYLON.EBlendingFunction;
})(BABYLON || (BABYLON = {}));

var BABYLON;
(function (BABYLON) {
    /**
    * Tokenizer. Used for shaders compatibility
    * Automatically map world, view, projection, worldViewProjection, attributes and so on
    */
    var ETokenType;
    (function (ETokenType) {
        ETokenType[ETokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
        ETokenType[ETokenType["UNKNOWN"] = 2] = "UNKNOWN";
        ETokenType[ETokenType["END_OF_INPUT"] = 3] = "END_OF_INPUT";
    })(ETokenType || (ETokenType = {}));
    var Tokenizer = (function () {
        function Tokenizer(toParse) {
            this._pos = 0;
            this.isLetterOrDigitPattern = /^[a-zA-Z0-9]+$/;
            this._toParse = toParse;
            this._maxPos = toParse.length;
        }
        Tokenizer.prototype.getNextToken = function () {
            if (this.isEnd())
                return ETokenType.END_OF_INPUT;
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
        };
        Tokenizer.prototype.peek = function () {
            return this._toParse[this._pos];
        };
        Tokenizer.prototype.read = function () {
            return this._toParse[this._pos++];
        };
        Tokenizer.prototype.forward = function () {
            this._pos++;
        };
        Tokenizer.prototype.isEnd = function () {
            return this._pos >= this._maxPos;
        };
        return Tokenizer;
    }());
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
    var parseBuffers = function (parsedBuffers, gltfRuntime) {
        for (var buf in parsedBuffers) {
            var parsedBuffer = parsedBuffers[buf];
            gltfRuntime.buffers[buf] = parsedBuffer;
            gltfRuntime.buffersCount++;
        }
    };
    var parseShaders = function (parsedShaders, gltfRuntime) {
        for (var sha in parsedShaders) {
            var parsedShader = parsedShaders[sha];
            gltfRuntime.shaders[sha] = parsedShader;
            gltfRuntime.shaderscount++;
        }
    };
    var parseObject = function (parsedObjects, runtimeProperty, gltfRuntime) {
        for (var object in parsedObjects) {
            var parsedObject = parsedObjects[object];
            gltfRuntime[runtimeProperty][object] = parsedObject;
        }
    };
    /**
    * Utils
    */
    var normalizeUVs = function (buffer) {
        if (!buffer) {
            return;
        }
        for (var i = 0; i < buffer.length / 2; i++) {
            buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
        }
    };
    var replaceInString = function (str, searchValue, replaceValue) {
        while (str.indexOf(searchValue) !== -1) {
            str = str.replace(searchValue, replaceValue);
        }
        return str;
    };
    var getAttribute = function (attributeParameter) {
        if (attributeParameter.semantic === "NORMAL") {
            return "normal";
        }
        else if (attributeParameter.semantic === "POSITION") {
            return "position";
        }
        else if (attributeParameter.semantic === "JOINT") {
            return "matricesIndices";
        }
        else if (attributeParameter.semantic === "WEIGHT") {
            return "matricesWeights";
        }
        else if (attributeParameter.semantic === "COLOR") {
            return "color";
        }
        else if (attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
            var channel = Number(attributeParameter.semantic.split("_")[1]);
            return "uv" + (channel === 0 ? "" : channel + 1);
        }
    };
    /**
    * Returns the animation path (glTF -> Babylon)
    */
    var getAnimationPath = function (path) {
        var index = glTFAnimationPaths.indexOf(path);
        if (index !== -1) {
            return babylonAnimationPaths[index];
        }
        return path;
    };
    /**
    * Loads and creates animations
    */
    var loadAnimations = function (gltfRuntime) {
        for (var anim in gltfRuntime.animations) {
            var animation = gltfRuntime.animations[anim];
            var lastAnimation = null;
            for (var i = 0; i < animation.channels.length; i++) {
                // Get parameters and load buffers
                var channel = animation.channels[i];
                var sampler = animation.samplers[channel.sampler];
                if (!sampler) {
                    continue;
                }
                var inputData = animation.parameters[sampler.input];
                var outputData = animation.parameters[sampler.output];
                var bufferInput = BABYLON.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
                var bufferOutput = BABYLON.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);
                var targetID = channel.target.id;
                var targetNode = gltfRuntime.scene.getNodeByID(targetID);
                if (targetNode === null) {
                    BABYLON.Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetID + " to attach to");
                    continue;
                }
                var isBone = targetNode instanceof BABYLON.Bone;
                // Get target path (position, rotation or scaling)
                var targetPath = channel.target.path;
                var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
                if (targetPathIndex !== -1) {
                    targetPath = babylonAnimationPaths[targetPathIndex];
                }
                // Determine animation type
                var animationType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
                if (!isBone) {
                    if (targetPath === "rotationQuaternion") {
                        animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                        targetNode.rotationQuaternion = new BABYLON.Quaternion();
                    }
                    else {
                        animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                    }
                }
                // Create animation and key frames
                var babylonAnimation = null;
                var keys = [];
                var arrayOffset = 0;
                var modifyKey = false;
                if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                    babylonAnimation = lastAnimation;
                    modifyKey = true;
                }
                if (!modifyKey) {
                    babylonAnimation = new BABYLON.Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                }
                // For each frame
                for (var j = 0; j < bufferInput.length; j++) {
                    var value = null;
                    if (targetPath === "rotationQuaternion") {
                        value = BABYLON.Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                        arrayOffset += 4;
                    }
                    else {
                        value = BABYLON.Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                        arrayOffset += 3;
                    }
                    if (isBone) {
                        var bone = targetNode;
                        var translation = BABYLON.Vector3.Zero();
                        var rotationQuaternion = new BABYLON.Quaternion();
                        var scaling = BABYLON.Vector3.Zero();
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
                                rotationQuaternion = rotationQuaternion.multiply(new BABYLON.Quaternion(-0.707107, 0, 0, 0.707107));
                            }
                        }
                        else {
                            scaling = value;
                        }
                        value = BABYLON.Matrix.Compose(scaling, rotationQuaternion, translation);
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
    var configureBoneTransformation = function (node) {
        var mat = null;
        if (node.translation && node.rotation && node.scale) {
            var scale = BABYLON.Vector3.FromArray(node.scale);
            var rotation = BABYLON.Quaternion.FromArray(node.rotation);
            var position = BABYLON.Vector3.FromArray(node.translation);
            // Y is Up
            if (GLTFFileLoader.MakeYUP) {
                rotation = rotation.multiply(new BABYLON.Quaternion(-0.707107, 0, 0, 0.707107));
            }
            mat = BABYLON.Matrix.Compose(scale, rotation, position);
        }
        else {
            mat = BABYLON.Matrix.FromArray(node.matrix);
        }
        return mat;
    };
    /**
    * Returns the parent bone
    */
    var getParentBone = function (gltfRuntime, skins, jointName, newSkeleton) {
        // Try to find
        for (var i = 0; i < newSkeleton.bones.length; i++) {
            if (newSkeleton.bones[i].id === jointName) {
                return newSkeleton.bones[i];
            }
        }
        // Not found, search in gltf nodes
        var nodes = gltfRuntime.nodes;
        for (var nde in nodes) {
            var node = nodes[nde];
            if (!node.jointName) {
                continue;
            }
            var children = node.children;
            for (var i = 0; i < children.length; i++) {
                var child = gltfRuntime.nodes[children[i]];
                if (!child.jointName) {
                    continue;
                }
                if (child.jointName === jointName) {
                    var mat = configureBoneTransformation(node);
                    var bone = new BABYLON.Bone(node.name, newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
                    bone.id = nde;
                    return bone;
                }
            }
        }
        return null;
    };
    /**
    * Returns the appropriate root node
    */
    var getNodeToRoot = function (nodesToRoot, id) {
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
    var getJointNode = function (gltfRuntime, jointName) {
        var nodes = gltfRuntime.nodes;
        var node = nodes[jointName];
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
    };
    /**
    * Checks if a nodes is in joints
    */
    var nodeIsInJoints = function (skins, id) {
        for (var i = 0; i < skins.jointNames.length; i++) {
            if (skins.jointNames[i] === id) {
                return true;
            }
        }
        return false;
    };
    /**
    * Fills the nodes to root for bones and builds hierarchy
    */
    var getNodesToRoot = function (gltfRuntime, newSkeleton, skins, nodesToRoot) {
        // Creates nodes for root
        for (var nde in gltfRuntime.nodes) {
            var node = gltfRuntime.nodes[nde];
            var id = nde;
            if (!node.jointName || nodeIsInJoints(skins, node.jointName)) {
                continue;
            }
            // Create node to root bone
            var mat = configureBoneTransformation(node);
            var bone = new BABYLON.Bone(node.name, newSkeleton, null, mat);
            bone.id = id;
            nodesToRoot.push({ bone: bone, node: node, id: id });
        }
        // Parenting
        for (var i = 0; i < nodesToRoot.length; i++) {
            var nodeToRoot = nodesToRoot[i];
            var children = nodeToRoot.node.children;
            for (var j = 0; j < children.length; j++) {
                var child = null;
                for (var k = 0; k < nodesToRoot.length; k++) {
                    if (nodesToRoot[k].id === children[j]) {
                        child = nodesToRoot[k];
                        break;
                    }
                }
                if (child) {
                    child.bone._parent = nodeToRoot.bone;
                    nodeToRoot.bone.children.push(child.bone);
                }
            }
        }
    };
    var printMat = function (m) {
        console.log(m[0] + "\t" + m[1] + "\t" + m[2] + "\t" + m[3] + "\n" +
            m[4] + "\t" + m[5] + "\t" + m[6] + "\t" + m[7] + "\n" +
            m[8] + "\t" + m[9] + "\t" + m[10] + "\t" + m[11] + "\n" +
            m[12] + "\t" + m[13] + "\t" + m[14] + "\t" + m[15] + "\n");
    };
    /**
    * Imports a skeleton
    */
    var importSkeleton = function (gltfRuntime, skins, mesh, newSkeleton, id) {
        if (!newSkeleton) {
            newSkeleton = new BABYLON.Skeleton(skins.name, "", gltfRuntime.scene);
        }
        if (!skins.babylonSkeleton) {
            return newSkeleton;
        }
        // Matrices
        var accessor = gltfRuntime.accessors[skins.inverseBindMatrices];
        var buffer = BABYLON.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
        var bindShapeMatrix = BABYLON.Matrix.FromArray(skins.bindShapeMatrix);
        // Find the root bones
        var nodesToRoot = [];
        var nodesToRootToAdd = [];
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
                BABYLON.Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
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
            var parentBone = null;
            for (var j = 0; j < i; j++) {
                var joint = getJointNode(gltfRuntime, skins.jointNames[j]).node;
                if (!joint) {
                    BABYLON.Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
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
                var inverseBindMatrix = BABYLON.Matrix.FromArray(buffer, i * 16);
                var invertMesh = BABYLON.Matrix.Invert(mesh.getWorldMatrix());
                mat = mat.multiply(mesh.getWorldMatrix());
            }
            var bone = new BABYLON.Bone(node.name, newSkeleton, parentBone, mat);
            bone.id = id;
        }
        // Polish
        var bones = newSkeleton.bones;
        newSkeleton.bones = [];
        for (var i = 0; i < skins.jointNames.length; i++) {
            var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
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
    var importMesh = function (gltfRuntime, node, meshes, id, newMesh) {
        if (!newMesh) {
            newMesh = new BABYLON.Mesh(node.name, gltfRuntime.scene);
            newMesh.id = id;
        }
        if (!node.babylonNode) {
            return newMesh;
        }
        var multiMat = new BABYLON.MultiMaterial("multimat" + id, gltfRuntime.scene);
        newMesh.material = multiMat;
        var vertexData = new BABYLON.VertexData();
        var geometry = new BABYLON.Geometry(id, gltfRuntime.scene, vertexData, false, newMesh);
        var verticesStarts = [];
        var verticesCounts = [];
        var indexStarts = [];
        var indexCounts = [];
        for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
            var meshID = meshes[meshIndex];
            var mesh = gltfRuntime.meshes[meshID];
            if (!mesh) {
                continue;
            }
            // Positions, normals and UVs
            for (var i = 0; i < mesh.primitives.length; i++) {
                // Temporary vertex data
                var tempVertexData = new BABYLON.VertexData();
                var primitive = mesh.primitives[i];
                if (primitive.mode !== 4) {
                }
                var attributes = primitive.attributes;
                var accessor = null;
                var buffer = null;
                // Set positions, normal and uvs
                for (var semantic in attributes) {
                    // Link accessor and buffer view
                    accessor = gltfRuntime.accessors[attributes[semantic]];
                    buffer = BABYLON.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                    if (semantic === "NORMAL") {
                        tempVertexData.normals = new Float32Array(buffer.length);
                        tempVertexData.normals.set(buffer);
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
                            tempVertexData.positions.set(buffer);
                        }
                        verticesCounts.push(tempVertexData.positions.length);
                    }
                    else if (semantic.indexOf("TEXCOORD_") !== -1) {
                        var channel = Number(semantic.split("_")[1]);
                        var uvKind = BABYLON.VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                        var uvs = new Float32Array(buffer.length);
                        uvs.set(buffer);
                        normalizeUVs(uvs);
                        tempVertexData.set(uvs, uvKind);
                    }
                    else if (semantic === "JOINT") {
                        tempVertexData.matricesIndices = new Float32Array(buffer.length);
                        tempVertexData.matricesIndices.set(buffer);
                    }
                    else if (semantic === "WEIGHT") {
                        tempVertexData.matricesWeights = new Float32Array(buffer.length);
                        tempVertexData.matricesWeights.set(buffer);
                    }
                    else if (semantic === "COLOR") {
                        tempVertexData.colors = new Float32Array(buffer.length);
                        tempVertexData.colors.set(buffer);
                    }
                }
                // Indices
                accessor = gltfRuntime.accessors[primitive.indices];
                buffer = BABYLON.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                tempVertexData.indices = new Int32Array(buffer.length);
                tempVertexData.indices.set(buffer);
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
            var mesh = gltfRuntime.meshes[meshID];
            if (!mesh) {
                continue;
            }
            for (var i = 0; i < mesh.primitives.length; i++) {
                if (mesh.primitives[i].mode !== 4) {
                }
                var subMesh = new BABYLON.SubMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
                index++;
            }
        }
        // Finish
        return newMesh;
    };
    /**
    * Configure node transformation from position, rotation and scaling
    */
    var configureNode = function (newNode, position, rotation, scaling) {
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
    var configureNodeFromMatrix = function (newNode, node) {
        if (node.matrix) {
            var position = new BABYLON.Vector3(0, 0, 0);
            var rotation = new BABYLON.Quaternion();
            var scaling = new BABYLON.Vector3(0, 0, 0);
            var mat = BABYLON.Matrix.FromArray(node.matrix);
            mat.decompose(scaling, rotation, position);
            // Y is Up
            if (GLTFFileLoader.MakeYUP) {
                rotation = rotation.multiply(new BABYLON.Quaternion(-0.707107, 0, 0, 0.707107));
            }
            configureNode(newNode, position, rotation, scaling);
            if (newNode instanceof BABYLON.TargetCamera) {
                newNode.setTarget(BABYLON.Vector3.Zero());
            }
        }
        else {
            configureNode(newNode, BABYLON.Vector3.FromArray(node.translation), BABYLON.Quaternion.FromArray(node.rotation), BABYLON.Vector3.FromArray(node.scale));
        }
    };
    /**
    * Imports a node
    */
    var importNode = function (gltfRuntime, node, id) {
        var lastNode = null;
        if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
            if (gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name) === -1) {
                return null;
            }
        }
        // Meshes
        if (node.skin) {
            if (node.meshes) {
                var skin = gltfRuntime.skins[node.skin];
                var newMesh = importMesh(gltfRuntime, node, node.meshes, id, node.babylonNode);
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
            var newMesh = importMesh(gltfRuntime, node, node.mesh ? [node.mesh] : node.meshes, id, node.babylonNode);
            lastNode = newMesh;
        }
        else if (node.light && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
            var light = gltfRuntime.lights[node.light];
            if (light) {
                if (light.type === "ambient") {
                    var ambienLight = light[light.type];
                    var hemiLight = new BABYLON.HemisphericLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                    hemiLight.name = node.name;
                    if (ambienLight.color) {
                        hemiLight.diffuse = BABYLON.Color3.FromArray(ambienLight.color);
                    }
                    lastNode = hemiLight;
                }
                else if (light.type === "directional") {
                    var directionalLight = light[light.type];
                    var dirLight = new BABYLON.DirectionalLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                    dirLight.name = node.name;
                    if (directionalLight.color) {
                        dirLight.diffuse = BABYLON.Color3.FromArray(directionalLight.color);
                    }
                    lastNode = dirLight;
                }
                else if (light.type === "point") {
                    var pointLight = light[light.type];
                    var ptLight = new BABYLON.PointLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                    ptLight.name = node.name;
                    if (pointLight.color) {
                        ptLight.diffuse = BABYLON.Color3.FromArray(pointLight.color);
                    }
                    lastNode = ptLight;
                }
                else if (light.type === "spot") {
                    var spotLight = light[light.type];
                    var spLight = new BABYLON.SpotLight(node.light, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), 0, 0, gltfRuntime.scene);
                    spLight.name = node.name;
                    if (spotLight.color) {
                        spLight.diffuse = BABYLON.Color3.FromArray(spotLight.color);
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
        else if (node.camera && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
            var camera = gltfRuntime.cameras[node.camera];
            if (camera) {
                if (camera.type === "orthographic") {
                    var orthographicCamera = camera[camera.type];
                    var orthoCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                    orthoCamera.name = node.name;
                    orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                    orthoCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                    lastNode = orthoCamera;
                }
                else if (camera.type === "perspective") {
                    var perspectiveCamera = camera[camera.type];
                    var persCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene);
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
                var dummy = new BABYLON.Mesh(node.name, gltfRuntime.scene);
                node.babylonNode = dummy;
                lastNode = dummy;
            }
        }
        if (lastNode !== null) {
            if (node.matrix) {
                configureNodeFromMatrix(lastNode, node);
            }
            else {
                configureNode(lastNode, BABYLON.Vector3.FromArray(node.translation), BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.FromArray(node.rotation).normalize(), node.rotation[3]), BABYLON.Vector3.FromArray(node.scale));
            }
            lastNode.updateCache(true);
            node.babylonNode = lastNode;
        }
        return lastNode;
    };
    /**
    * Traverses nodes and creates them
    */
    var traverseNodes = function (gltfRuntime, id, parent, meshIncluded) {
        var node = gltfRuntime.nodes[id];
        var newNode = null;
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
    * do stuff after buffers, shaders are loaded (e.g. hook up materials, load animations, etc.)
    */
    var postLoad = function (gltfRuntime) {
        // Nodes
        var currentScene = gltfRuntime.currentScene;
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
    var onBindShaderMaterial = function (mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess) {
        for (var unif in unTreatedUniforms) {
            var uniform = unTreatedUniforms[unif];
            var type = uniform.type;
            if (type === BABYLON.EParameterType.FLOAT_MAT2 || type === BABYLON.EParameterType.FLOAT_MAT3 || type === BABYLON.EParameterType.FLOAT_MAT4) {
                if (uniform.semantic && !uniform.source && !uniform.node) {
                    BABYLON.GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
                }
                else if (uniform.semantic && (uniform.source || uniform.node)) {
                    var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node);
                    if (source === null) {
                        source = gltfRuntime.scene.getNodeByID(uniform.source || uniform.node);
                    }
                    if (source === null) {
                        continue;
                    }
                    BABYLON.GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
                }
            }
            else {
                var value = material.values[technique.uniforms[unif]];
                if (!value) {
                    continue;
                }
                if (type === BABYLON.EParameterType.SAMPLER_2D) {
                    var texture = gltfRuntime.textures[value].babylonTexture;
                    if (texture === null) {
                        continue;
                    }
                    shaderMaterial.getEffect().setTexture(unif, texture);
                }
                else {
                    BABYLON.GLTFUtils.SetUniform(shaderMaterial.getEffect(), unif, value, type);
                }
            }
        }
        onSuccess(shaderMaterial);
    };
    /**
    * Prepare uniforms to send the only one time
    * Loads the appropriate textures
    */
    var prepareShaderMaterialUniforms = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms) {
        var materialValues = material.values;
        var techniqueUniforms = technique.uniforms;
        /**
        * Prepare values here (not matrices)
        */
        for (var unif in unTreatedUniforms) {
            var uniform = unTreatedUniforms[unif];
            var type = uniform.type;
            var value = materialValues[techniqueUniforms[unif]] || uniform.value;
            if (!value) {
                continue;
            }
            var onLoadTexture = function (texture) {
                if (uniform.value) {
                    // Static uniform
                    shaderMaterial.setTexture(unif, texture);
                    delete unTreatedUniforms[unif];
                }
            };
            // Texture (sampler2D)
            if (type === BABYLON.EParameterType.SAMPLER_2D) {
                BABYLON.GLTFFileLoaderExtension.LoadTextureAsync(gltfRuntime, value, onLoadTexture, function () { return onLoadTexture(null); });
            }
            else {
                if (uniform.value && BABYLON.GLTFUtils.SetUniform(shaderMaterial, unif, value, type)) {
                    // Static uniform
                    delete unTreatedUniforms[unif];
                }
            }
        }
    };
    /**
    * Shader compilation failed
    */
    var onShaderCompileError = function (program, shaderMaterial, onError) {
        return function (effect, error) {
            BABYLON.Tools.Error("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
            shaderMaterial.dispose(true);
            onError();
        };
    };
    /**
    * Shader compilation success
    */
    var onShaderCompileSuccess = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess) {
        return function (_) {
            prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);
            shaderMaterial.onBind = function (mesh) {
                onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
            };
        };
    };
    /**
    * Returns the appropriate uniform if already handled by babylon
    */
    var parseShaderUniforms = function (tokenizer, technique, unTreatedUniforms) {
        for (var unif in technique.uniforms) {
            var uniform = technique.uniforms[unif];
            var uniformParameter = technique.parameters[uniform];
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
    var importMaterials = function (gltfRuntime) {
        // Create materials
        for (var mat in gltfRuntime.materials) {
            BABYLON.GLTFFileLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, function (material) { }, function () { });
        }
    };
    /**
    * Implementation of the base glTF spec
    */
    var GLTFFileLoaderBase = (function () {
        function GLTFFileLoaderBase() {
        }
        GLTFFileLoaderBase.CreateRuntime = function (parsedData, scene, rootUrl) {
            var gltfRuntime = {
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
            };
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
        };
        GLTFFileLoaderBase.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            var buffer = gltfRuntime.buffers[id];
            if (BABYLON.GLTFUtils.IsBase64(buffer.uri)) {
                setTimeout(function () { return onSuccess(new Uint8Array(BABYLON.GLTFUtils.DecodeBase64(buffer.uri))); });
            }
            else {
                BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, function (data) { return onSuccess(new Uint8Array(data)); }, null, null, true, onError);
            }
        };
        GLTFFileLoaderBase.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            var texture = gltfRuntime.textures[id];
            if (!texture || !texture.source) {
                onError();
                return;
            }
            if (texture.babylonTexture) {
                onSuccess(null);
                return;
            }
            var source = gltfRuntime.images[texture.source];
            if (BABYLON.GLTFUtils.IsBase64(source.uri)) {
                setTimeout(onSuccess(new Uint8Array(BABYLON.GLTFUtils.DecodeBase64(source.uri))));
            }
            else {
                BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + source.uri, function (data) { return onSuccess(new Uint8Array(data)); }, null, null, true, onError);
            }
        };
        GLTFFileLoaderBase.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
            var texture = gltfRuntime.textures[id];
            if (texture.babylonTexture) {
                onSuccess(texture.babylonTexture);
                return;
            }
            var sampler = gltfRuntime.samplers[texture.sampler];
            var createMipMaps = (sampler.minFilter === BABYLON.ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                (sampler.minFilter === BABYLON.ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                (sampler.minFilter === BABYLON.ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                (sampler.minFilter === BABYLON.ETextureFilterType.LINEAR_MIPMAP_LINEAR);
            var samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE;
            var blob = new Blob([buffer]);
            var blobURL = URL.createObjectURL(blob);
            var revokeBlobURL = function () { return URL.revokeObjectURL(blobURL); };
            var newTexture = new BABYLON.Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
            newTexture.wrapU = BABYLON.GLTFUtils.GetWrapMode(sampler.wrapS);
            newTexture.wrapV = BABYLON.GLTFUtils.GetWrapMode(sampler.wrapT);
            newTexture.name = id;
            texture.babylonTexture = newTexture;
            onSuccess(newTexture);
        };
        GLTFFileLoaderBase.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
            var shader = gltfRuntime.shaders[id];
            if (BABYLON.GLTFUtils.IsBase64(shader.uri)) {
                var shaderString = atob(shader.uri.split(",")[1]);
                onSuccess(shaderString);
            }
            else {
                BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, null, null, false, onError);
            }
        };
        GLTFFileLoaderBase.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
            var material = gltfRuntime.materials[id];
            var technique = gltfRuntime.techniques[material.technique];
            if (!technique) {
                var defaultMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                defaultMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                defaultMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                onSuccess(defaultMaterial);
                return;
            }
            var program = gltfRuntime.programs[technique.program];
            var states = technique.states;
            var vertexShader = BABYLON.Effect.ShadersStore[program.vertexShader + "VertexShader"];
            var pixelShader = BABYLON.Effect.ShadersStore[program.fragmentShader + "PixelShader"];
            var newVertexShader = "";
            var newPixelShader = "";
            var vertexTokenizer = new Tokenizer(vertexShader);
            var pixelTokenizer = new Tokenizer(pixelShader);
            var unTreatedUniforms = {};
            var uniforms = [];
            var attributes = [];
            var samplers = [];
            // Fill uniform, sampler2D and attributes
            for (var unif in technique.uniforms) {
                var uniform = technique.uniforms[unif];
                var uniformParameter = technique.parameters[uniform];
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
                else if (uniformParameter.type === BABYLON.EParameterType.SAMPLER_2D) {
                    samplers.push(unif);
                }
                else {
                    uniforms.push(unif);
                }
            }
            for (var attr in technique.attributes) {
                var attribute = technique.attributes[attr];
                var attributeParameter = technique.parameters[attribute];
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
                    var attributeParameter = technique.parameters[attribute];
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
            BABYLON.Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
            BABYLON.Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;
            var shaderMaterial = new BABYLON.ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
            shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
            shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
            shaderMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
            if (states.functions) {
                var functions = states.functions;
                if (functions.cullFace && functions.cullFace[0] !== BABYLON.ECullingType.BACK) {
                    shaderMaterial.backFaceCulling = false;
                }
                var blendFunc = functions.blendFuncSeparate;
                if (blendFunc) {
                    if (blendFunc[0] === BABYLON.EBlendingFunction.SRC_ALPHA && blendFunc[1] === BABYLON.EBlendingFunction.ONE_MINUS_SRC_ALPHA && blendFunc[2] === BABYLON.EBlendingFunction.ONE && blendFunc[3] === BABYLON.EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
                    }
                    else if (blendFunc[0] === BABYLON.EBlendingFunction.ONE && blendFunc[1] === BABYLON.EBlendingFunction.ONE && blendFunc[2] === BABYLON.EBlendingFunction.ZERO && blendFunc[3] === BABYLON.EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
                    }
                    else if (blendFunc[0] === BABYLON.EBlendingFunction.SRC_ALPHA && blendFunc[1] === BABYLON.EBlendingFunction.ONE && blendFunc[2] === BABYLON.EBlendingFunction.ZERO && blendFunc[3] === BABYLON.EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD;
                    }
                    else if (blendFunc[0] === BABYLON.EBlendingFunction.ZERO && blendFunc[1] === BABYLON.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === BABYLON.EBlendingFunction.ONE && blendFunc[3] === BABYLON.EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_SUBTRACT;
                    }
                    else if (blendFunc[0] === BABYLON.EBlendingFunction.DST_COLOR && blendFunc[1] === BABYLON.EBlendingFunction.ZERO && blendFunc[2] === BABYLON.EBlendingFunction.ONE && blendFunc[3] === BABYLON.EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MULTIPLY;
                    }
                    else if (blendFunc[0] === BABYLON.EBlendingFunction.SRC_ALPHA && blendFunc[1] === BABYLON.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === BABYLON.EBlendingFunction.ONE && blendFunc[3] === BABYLON.EBlendingFunction.ONE) {
                        shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MAXIMIZED;
                    }
                }
            }
        };
        return GLTFFileLoaderBase;
    }());
    BABYLON.GLTFFileLoaderBase = GLTFFileLoaderBase;
    /**
    * glTF File Loader Plugin
    */
    var GLTFFileLoader = (function () {
        function GLTFFileLoader() {
            /**
            * Public members
            */
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        GLTFFileLoader.RegisterExtension = function (extension) {
            if (GLTFFileLoader.Extensions[extension.name]) {
                BABYLON.Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                return;
            }
            GLTFFileLoader.Extensions[extension.name] = extension;
        };
        /**
        * Import meshes
        */
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onError) {
            var _this = this;
            scene.useRightHandedSystem = true;
            var gltfRuntime = BABYLON.GLTFFileLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
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
                    BABYLON.Tools.Warn("Argument meshesNames must be of type string or string[]");
                }
                // Create nodes
                _this._createNodes(gltfRuntime);
                var meshes = [];
                var skeletons = [];
                // Fill arrays of meshes and skeletons
                for (var nde in gltfRuntime.nodes) {
                    var node = gltfRuntime.nodes[nde];
                    if (node.babylonNode instanceof BABYLON.AbstractMesh) {
                        meshes.push(node.babylonNode);
                    }
                }
                for (var skl in gltfRuntime.skins) {
                    var skin = gltfRuntime.skins[skl];
                    if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                        skeletons.push(skin.babylonSkeleton);
                    }
                }
                // Load buffers, shaders, materials, etc.
                _this._loadBuffersAsync(gltfRuntime, function () {
                    _this._loadShadersAsync(gltfRuntime, function () {
                        importMaterials(gltfRuntime);
                        postLoad(gltfRuntime);
                    });
                });
                if (onSuccess) {
                    onSuccess(meshes, null, skeletons);
                }
            }, onError);
            return true;
        };
        /**
        * Load scene
        */
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onError) {
            var _this = this;
            scene.useRightHandedSystem = true;
            BABYLON.GLTFFileLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                // Create nodes
                _this._createNodes(gltfRuntime);
                // Load buffers, shaders, materials, etc.
                _this._loadBuffersAsync(gltfRuntime, function () {
                    _this._loadShadersAsync(gltfRuntime, function () {
                        importMaterials(gltfRuntime);
                        postLoad(gltfRuntime);
                    });
                });
                onSuccess();
            }, onError);
            return true;
        };
        GLTFFileLoader.prototype._loadShadersAsync = function (gltfRuntime, onload) {
            var hasShaders = false;
            var processShader = function (sha, shader) {
                BABYLON.GLTFFileLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, function (shaderString) {
                    gltfRuntime.loadedShaderCount++;
                    if (shaderString) {
                        BABYLON.Effect.ShadersStore[sha + (shader.type === BABYLON.EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = shaderString;
                    }
                    if (gltfRuntime.loadedShaderCount === gltfRuntime.shaderscount) {
                        onload();
                    }
                }, function () {
                    BABYLON.Tools.Error("Error when loading shader program named " + sha + " located at " + shader.uri);
                });
            };
            for (var sha in gltfRuntime.shaders) {
                hasShaders = true;
                var shader = gltfRuntime.shaders[sha];
                if (shader) {
                    processShader.bind(this, sha, shader)();
                }
                else {
                    BABYLON.Tools.Error("No shader named: " + sha);
                }
            }
            if (!hasShaders) {
                onload();
            }
        };
        ;
        GLTFFileLoader.prototype._loadBuffersAsync = function (gltfRuntime, onload) {
            var hasBuffers = false;
            var processBuffer = function (buf, buffer) {
                BABYLON.GLTFFileLoaderExtension.LoadBufferAsync(gltfRuntime, buf, function (bufferView) {
                    gltfRuntime.loadedBufferCount++;
                    if (bufferView) {
                        if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                            BABYLON.Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                        }
                        gltfRuntime.loadedBufferViews[buf] = bufferView;
                    }
                    if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                        onload();
                    }
                }, function () {
                    BABYLON.Tools.Error("Error when loading buffer named " + buf + " located at " + buffer.uri);
                });
            };
            for (var buf in gltfRuntime.buffers) {
                hasBuffers = true;
                var buffer = gltfRuntime.buffers[buf];
                if (buffer) {
                    processBuffer.bind(this, buf, buffer)();
                }
                else {
                    BABYLON.Tools.Error("No buffer named: " + buf);
                }
            }
            if (!hasBuffers) {
                onload();
            }
        };
        // Creates nodes before loading buffers and shaders
        GLTFFileLoader.prototype._createNodes = function (gltfRuntime) {
            var currentScene = gltfRuntime.currentScene;
            for (var i = 0; i < currentScene.nodes.length; i++) {
                traverseNodes(gltfRuntime, currentScene.nodes[i], null);
            }
        };
        /**
        * Private members
        */
        // None
        /**
        * Static members
        */
        GLTFFileLoader.MakeYUP = false;
        GLTFFileLoader.HomogeneousCoordinates = false;
        GLTFFileLoader.Extensions = {};
        return GLTFFileLoader;
    }());
    BABYLON.GLTFFileLoader = GLTFFileLoader;
    ;
    BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
})(BABYLON || (BABYLON = {}));

var BABYLON;
(function (BABYLON) {
    /**
    * Utils functions for GLTF
    */
    var GLTFUtils = (function () {
        function GLTFUtils() {
        }
        /**
         * Sets the given "parameter" matrix
         * @param scene: the {BABYLON.Scene} object
         * @param source: the source node where to pick the matrix
         * @param parameter: the GLTF technique parameter
         * @param uniformName: the name of the shader's uniform
         * @param shaderMaterial: the shader material
         */
        GLTFUtils.SetMatrix = function (scene, source, parameter, uniformName, shaderMaterial) {
            var mat = null;
            if (parameter.semantic === "MODEL") {
                mat = source.getWorldMatrix();
            }
            else if (parameter.semantic === "PROJECTION") {
                mat = scene.getProjectionMatrix();
            }
            else if (parameter.semantic === "VIEW") {
                mat = scene.getViewMatrix();
            }
            else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
                mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
            }
            else if (parameter.semantic === "MODELVIEW") {
                mat = source.getWorldMatrix().multiply(scene.getViewMatrix());
            }
            else if (parameter.semantic === "MODELVIEWPROJECTION") {
                mat = source.getWorldMatrix().multiply(scene.getTransformMatrix());
            }
            else if (parameter.semantic === "MODELINVERSE") {
                mat = source.getWorldMatrix().invert();
            }
            else if (parameter.semantic === "VIEWINVERSE") {
                mat = scene.getViewMatrix().invert();
            }
            else if (parameter.semantic === "PROJECTIONINVERSE") {
                mat = scene.getProjectionMatrix().invert();
            }
            else if (parameter.semantic === "MODELVIEWINVERSE") {
                mat = source.getWorldMatrix().multiply(scene.getViewMatrix()).invert();
            }
            else if (parameter.semantic === "MODELVIEWPROJECTIONINVERSE") {
                mat = source.getWorldMatrix().multiply(scene.getTransformMatrix()).invert();
            }
            else if (parameter.semantic === "MODELINVERSETRANSPOSE") {
                mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().invert());
            }
            else {
                debugger;
            }
            switch (parameter.type) {
                case BABYLON.EParameterType.FLOAT_MAT2:
                    shaderMaterial.setMatrix2x2(uniformName, BABYLON.Matrix.GetAsMatrix2x2(mat));
                    break;
                case BABYLON.EParameterType.FLOAT_MAT3:
                    shaderMaterial.setMatrix3x3(uniformName, BABYLON.Matrix.GetAsMatrix3x3(mat));
                    break;
                case BABYLON.EParameterType.FLOAT_MAT4:
                    shaderMaterial.setMatrix(uniformName, mat);
                    break;
                default: break;
            }
        };
        /**
         * Sets the given "parameter" matrix
         * @param shaderMaterial: the shader material
         * @param uniform: the name of the shader's uniform
         * @param value: the value of the uniform
         * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
         */
        GLTFUtils.SetUniform = function (shaderMaterial, uniform, value, type) {
            switch (type) {
                case BABYLON.EParameterType.FLOAT:
                    shaderMaterial.setFloat(uniform, value);
                    return true;
                case BABYLON.EParameterType.FLOAT_VEC2:
                    shaderMaterial.setVector2(uniform, BABYLON.Vector2.FromArray(value));
                    return true;
                case BABYLON.EParameterType.FLOAT_VEC3:
                    shaderMaterial.setVector3(uniform, BABYLON.Vector3.FromArray(value));
                    return true;
                case BABYLON.EParameterType.FLOAT_VEC4:
                    shaderMaterial.setVector4(uniform, BABYLON.Vector4.FromArray(value));
                    return true;
                default: return false;
            }
        };
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
        /**
        * Returns the wrap mode of the texture
        * @param mode: the mode value
        */
        GLTFUtils.GetWrapMode = function (mode) {
            switch (mode) {
                case BABYLON.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                case BABYLON.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                case BABYLON.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
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
                case BABYLON.ETextureFilterType.LINEAR:
                case BABYLON.ETextureFilterType.LINEAR_MIPMAP_NEAREST:
                case BABYLON.ETextureFilterType.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
                case BABYLON.ETextureFilterType.NEAREST:
                case BABYLON.ETextureFilterType.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_SAMPLINGMODE;
                default: return BABYLON.Texture.BILINEAR_SAMPLINGMODE;
            }
        };
        GLTFUtils.GetBufferFromBufferView = function (gltfRuntime, bufferView, byteOffset, byteLength, componentType) {
            var byteOffset = bufferView.byteOffset + byteOffset;
            var loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
            if (byteOffset + byteLength > loadedBufferView.byteLength) {
                throw new Error("Buffer access is out of range");
            }
            var buffer = loadedBufferView.buffer;
            byteOffset += loadedBufferView.byteOffset;
            switch (componentType) {
                case BABYLON.EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                case BABYLON.EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                case BABYLON.EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                case BABYLON.EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                default: return new Float32Array(buffer, byteOffset, byteLength);
            }
        };
        /**
         * Returns a buffer from its accessor
         * @param gltfRuntime: the GLTF runtime
         * @param accessor: the GLTF accessor
         */
        GLTFUtils.GetBufferFromAccessor = function (gltfRuntime, accessor) {
            var bufferView = gltfRuntime.bufferViews[accessor.bufferView];
            var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
            return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
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
    BABYLON.GLTFUtils = GLTFUtils;
})(BABYLON || (BABYLON = {}));

var BABYLON;
(function (BABYLON) {
    var GLTFFileLoaderExtension = (function () {
        function GLTFFileLoaderExtension(name) {
            this._name = name;
        }
        Object.defineProperty(GLTFFileLoaderExtension.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        /**
        * Defines an override for loading the runtime
        * Return true to stop further extensions from loading the runtime
        */
        GLTFFileLoaderExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
            return false;
        };
        /**
        * Defines an override for loading buffers
        * Return true to stop further extensions from loading this buffer
        */
        GLTFFileLoaderExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            return false;
        };
        /**
        * Defines an override for loading texture buffers
        * Return true to stop further extensions from loading this texture data
        */
        GLTFFileLoaderExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            return false;
        };
        /**
        * Defines an override for creating textures
        * Return true to stop further extensions from loading this texture
        */
        GLTFFileLoaderExtension.prototype.createTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
            return false;
        };
        /**
        * Defines an override for loading shader strings
        * Return true to stop further extensions from loading this shader data
        */
        GLTFFileLoaderExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
            return false;
        };
        /**
        * Defines an override for loading materials
        * Return true to stop further extensions from loading this material
        */
        GLTFFileLoaderExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
            return false;
        };
        // ---------
        // Utilities
        // ---------
        GLTFFileLoaderExtension.LoadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
            GLTFFileLoaderExtension.ApplyExtensions(function (loaderExtension) {
                return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
            }, function () {
                setTimeout(function () {
                    onSuccess(BABYLON.GLTFFileLoaderBase.CreateRuntime(JSON.parse(data), scene, rootUrl));
                });
            });
        };
        GLTFFileLoaderExtension.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            GLTFFileLoaderExtension.ApplyExtensions(function (loaderExtension) {
                return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError);
            }, function () {
                BABYLON.GLTFFileLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError);
            });
        };
        GLTFFileLoaderExtension.LoadTextureAsync = function (gltfRuntime, id, onSuccess, onError) {
            GLTFFileLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) { return GLTFFileLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError); }, onError);
        };
        GLTFFileLoaderExtension.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
            GLTFFileLoaderExtension.ApplyExtensions(function (loaderExtension) {
                return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
            }, function () {
                BABYLON.GLTFFileLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
            });
        };
        GLTFFileLoaderExtension.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
            GLTFFileLoaderExtension.ApplyExtensions(function (loaderExtension) {
                return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            }, function () {
                BABYLON.GLTFFileLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
            });
        };
        GLTFFileLoaderExtension.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            GLTFFileLoaderExtension.ApplyExtensions(function (loaderExtension) {
                return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
            }, function () {
                BABYLON.GLTFFileLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
            });
        };
        GLTFFileLoaderExtension.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
            GLTFFileLoaderExtension.ApplyExtensions(function (loaderExtension) {
                return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
            }, function () {
                BABYLON.GLTFFileLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
            });
        };
        GLTFFileLoaderExtension.ApplyExtensions = function (func, defaultFunc) {
            for (var extensionName in BABYLON.GLTFFileLoader.Extensions) {
                var loaderExtension = BABYLON.GLTFFileLoader.Extensions[extensionName];
                if (func(loaderExtension)) {
                    return;
                }
            }
            defaultFunc();
        };
        return GLTFFileLoaderExtension;
    }());
    BABYLON.GLTFFileLoaderExtension = GLTFFileLoaderExtension;
})(BABYLON || (BABYLON = {}));

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var BinaryExtensionBufferName = "binary_glTF";
    var EContentFormat;
    (function (EContentFormat) {
        EContentFormat[EContentFormat["JSON"] = 0] = "JSON";
    })(EContentFormat || (EContentFormat = {}));
    ;
    ;
    ;
    ;
    var GLTFBinaryExtension = (function (_super) {
        __extends(GLTFBinaryExtension, _super);
        function GLTFBinaryExtension() {
            _super.call(this, "KHR_binary_glTF");
        }
        GLTFBinaryExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
            var _this = this;
            if (!(data instanceof ArrayBuffer)) {
                return false;
            }
            setTimeout(function () {
                _this._binary = _this._parseBinary(data);
                if (!_this._binary) {
                    onError();
                    return true;
                }
                var gltfRuntime = BABYLON.GLTFFileLoaderBase.CreateRuntime(_this._binary.content, scene, rootUrl);
                if (gltfRuntime.extensionsUsed.indexOf(_this.name) === -1) {
                    BABYLON.Tools.Warn("glTF binary file does not have " + _this.name + " specified in extensionsUsed");
                    gltfRuntime.extensionsUsed.push(_this.name);
                }
                onSuccess(gltfRuntime);
            });
            return true;
        };
        GLTFBinaryExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
                return false;
            }
            if (id !== BinaryExtensionBufferName) {
                return false;
            }
            onSuccess(this._binary.body);
            return true;
        };
        GLTFBinaryExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
            var texture = gltfRuntime.textures[id];
            var source = gltfRuntime.images[texture.source];
            if (!source.extensions || !(this.name in source.extensions)) {
                return false;
            }
            var sourceExt = source.extensions[this.name];
            var bufferView = gltfRuntime.bufferViews[sourceExt.bufferView];
            var buffer = BABYLON.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, BABYLON.EComponentType.UNSIGNED_BYTE);
            onSuccess(buffer);
            return true;
        };
        GLTFBinaryExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
            var shader = gltfRuntime.shaders[id];
            if (!shader.extensions || !(this.name in shader.extensions)) {
                return false;
            }
            var binaryExtensionShader = shader.extensions[this.name];
            var bufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
            var shaderBytes = BABYLON.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, BABYLON.EComponentType.UNSIGNED_BYTE);
            setTimeout(function () {
                var shaderString = BABYLON.GLTFUtils.DecodeBufferToText(shaderBytes);
                onSuccess(shaderString);
            });
            return true;
        };
        // Parses a glTF binary array buffer into its content and body
        GLTFBinaryExtension.prototype._parseBinary = function (data) {
            var binaryReader = new BinaryReader(data);
            var magic = BABYLON.GLTFUtils.DecodeBufferToText(binaryReader.getUint8Array(4));
            if (magic != "glTF") {
                BABYLON.Tools.Error("Unexpected magic: " + magic);
                return null;
            }
            var version = binaryReader.getUint32();
            if (version != 1) {
                BABYLON.Tools.Error("Unsupported version: " + version);
                return null;
            }
            var length = binaryReader.getUint32();
            if (length != data.byteLength) {
                BABYLON.Tools.Error("Length in header does not match actual data length: " + length + " != " + data.byteLength);
                return null;
            }
            var contentLength = binaryReader.getUint32();
            var contentFormat = binaryReader.getUint32();
            var content;
            switch (contentFormat) {
                case EContentFormat.JSON:
                    var jsonText = BABYLON.GLTFUtils.DecodeBufferToText(binaryReader.getUint8Array(contentLength));
                    content = JSON.parse(jsonText);
                    break;
                default:
                    BABYLON.Tools.Error("Unexpected content format: " + contentFormat);
                    return null;
            }
            var body = binaryReader.getUint8Array();
            return {
                content: content,
                body: body
            };
        };
        ;
        return GLTFBinaryExtension;
    }(BABYLON.GLTFFileLoaderExtension));
    BABYLON.GLTFBinaryExtension = GLTFBinaryExtension;
    var BinaryReader = (function () {
        function BinaryReader(arrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }
        BinaryReader.prototype.getUint32 = function () {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        };
        BinaryReader.prototype.getUint8Array = function (length) {
            if (!length) {
                length = this._arrayBuffer.byteLength - this._byteOffset;
            }
            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        };
        return BinaryReader;
    }());
    BABYLON.GLTFFileLoader.RegisterExtension(new GLTFBinaryExtension());
})(BABYLON || (BABYLON = {}));
