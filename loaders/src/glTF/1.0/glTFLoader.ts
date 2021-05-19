import { IGLTFRuntime, IGLTFTechniqueParameter, IGLTFAnimation, IGLTFAnimationSampler, IGLTFNode, IGLTFSkins, INodeToRoot, IJointNode, IGLTFMesh, IGLTFAccessor, IGLTFLight, IGLTFAmbienLight, IGLTFDirectionalLight, IGLTFPointLight, IGLTFSpotLight, IGLTFCamera, IGLTFCameraPerspective, IGLTFScene, IGLTFTechnique, IGLTFMaterial, EParameterType, IGLTFProgram, IGLTFBuffer, IGLTFTexture, IGLTFImage, IGLTFSampler, ETextureFilterType, IGLTFShader, IGLTFTechniqueStates, ECullingType, EBlendingFunction, EShaderType } from "./glTFLoaderInterfaces";

import { FloatArray, Nullable } from "babylonjs/types";
import { Quaternion, Vector3, Matrix } from "babylonjs/Maths/math.vector";
import { Color3 } from 'babylonjs/Maths/math.color';
import { Tools } from "babylonjs/Misc/tools";
import { Camera } from "babylonjs/Cameras/camera";
import { FreeCamera } from "babylonjs/Cameras/freeCamera";
import { Animation } from "babylonjs/Animations/animation";
import { Bone } from "babylonjs/Bones/bone";
import { Skeleton } from "babylonjs/Bones/skeleton";
import { Effect } from "babylonjs/Materials/effect";
import { Material } from "babylonjs/Materials/material";
import { MultiMaterial } from "babylonjs/Materials/multiMaterial";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { Node } from "babylonjs/node";
import { VertexData } from "babylonjs/Meshes/mesh.vertexData";
import { VertexBuffer } from "babylonjs/Buffers/buffer";
import { Geometry } from "babylonjs/Meshes/geometry";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { HemisphericLight } from "babylonjs/Lights/hemisphericLight";
import { DirectionalLight } from "babylonjs/Lights/directionalLight";
import { PointLight } from "babylonjs/Lights/pointLight";
import { SpotLight } from "babylonjs/Lights/spotLight";
import { ISceneLoaderAsyncResult, ISceneLoaderProgressEvent } from "babylonjs/Loading/sceneLoader";
import { Scene } from "babylonjs/scene";

import { GLTFUtils } from "./glTFLoaderUtils";
import { GLTFFileLoader, IGLTFLoader, GLTFLoaderState, IGLTFLoaderData } from "../glTFFileLoader";
import { Constants } from 'babylonjs/Engines/constants';

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

    public currentToken: ETokenType = ETokenType.UNKNOWN;
    public currentIdentifier: string = "";
    public currentString: string = "";
    public isLetterOrDigitPattern: RegExp = /^[a-zA-Z0-9]+$/;

    constructor(toParse: string) {
        this._toParse = toParse;
        this._maxPos = toParse.length;
    }

    public getNextToken(): ETokenType {
        if (this.isEnd()) { return ETokenType.END_OF_INPUT; }

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
        (<any>gltfRuntime)[runtimeProperty][object] = parsedObject;
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

var getAttribute = (attributeParameter: IGLTFTechniqueParameter): Nullable<string> => {
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
    } else if (attributeParameter.semantic && attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
        var channel = Number(attributeParameter.semantic.split("_")[1]);
        return "uv" + (channel === 0 ? "" : channel + 1);
    }

    return null;
};

/**
* Loads and creates animations
*/
var loadAnimations = (gltfRuntime: IGLTFRuntime) => {
    for (var anim in gltfRuntime.animations) {
        var animation: IGLTFAnimation = gltfRuntime.animations[anim];

        if (!animation.channels || !animation.samplers) {
            continue;
        }

        var lastAnimation: Nullable<Animation> = null;

        for (var i = 0; i < animation.channels.length; i++) {
            // Get parameters and load buffers
            var channel = animation.channels[i];
            var sampler: IGLTFAnimationSampler = animation.samplers[channel.sampler];

            if (!sampler) {
                continue;
            }

            var inputData: Nullable<string> = null;
            var outputData: Nullable<string> = null;

            if (animation.parameters) {
                inputData = animation.parameters[sampler.input];
                outputData = animation.parameters[sampler.output];
            }
            else {
                inputData = sampler.input;
                outputData = sampler.output;
            }

            var bufferInput = GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
            var bufferOutput = GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);

            var targetId = channel.target.id;
            var targetNode: any = gltfRuntime.scene.getNodeById(targetId);

            if (targetNode === null) {
                targetNode = gltfRuntime.scene.getNodeByName(targetId);
            }

            if (targetNode === null) {
                Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetId + " to attach to");
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
            var babylonAnimation: Nullable<Animation> = null;
            var keys = [];
            var arrayOffset = 0;
            var modifyKey = false;

            if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                babylonAnimation = lastAnimation;
                modifyKey = true;
            }

            if (!modifyKey) {
                gltfRuntime.scene._blockEntityCollection = gltfRuntime.forAssetContainer;
                babylonAnimation = new Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, Animation.ANIMATIONLOOPMODE_CYCLE);
                gltfRuntime.scene._blockEntityCollection = false;
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

                    if (modifyKey && lastAnimation) {
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
                else if (lastAnimation) {
                    lastAnimation.getKeys()[j].value = value;
                }
            }

            // Finish
            if (!modifyKey && babylonAnimation) {
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
    var mat: Nullable<Matrix> = null;

    if (node.translation || node.rotation || node.scale) {
        var scale = Vector3.FromArray(node.scale || [1, 1, 1]);
        var rotation = Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
        var position = Vector3.FromArray(node.translation || [0, 0, 0]);

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
var getParentBone = (gltfRuntime: IGLTFRuntime, skins: IGLTFSkins, jointName: string, newSkeleton: Skeleton): Nullable<Bone> => {
    // Try to find
    for (var i = 0; i < newSkeleton.bones.length; i++) {
        if (newSkeleton.bones[i].name === jointName) {
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
                var bone = new Bone(node.name || "", newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
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
var getNodeToRoot = (nodesToRoot: INodeToRoot[], id: string): Nullable<Bone> => {
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
var getJointNode = (gltfRuntime: IGLTFRuntime, jointName: string): Nullable<IJointNode> => {
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
};

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
};

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
        var bone = new Bone(node.name || "", newSkeleton, null, mat);
        bone.id = id;
        nodesToRoot.push({ bone: bone, node: node, id: id });
    }

    // Parenting
    for (var i = 0; i < nodesToRoot.length; i++) {
        var nodeToRoot = nodesToRoot[i];
        var children = nodeToRoot.node.children;

        for (var j = 0; j < children.length; j++) {
            var child: Nullable<INodeToRoot> = null;

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

/**
* Imports a skeleton
*/
var importSkeleton = (gltfRuntime: IGLTFRuntime, skins: IGLTFSkins, mesh: Mesh, newSkeleton: Skeleton | undefined, id: string): Skeleton => {

    if (!newSkeleton) {
        newSkeleton = new Skeleton(skins.name || "", "", gltfRuntime.scene);
    }

    if (!skins.babylonSkeleton) {
        return newSkeleton;
    }

    // Find the root bones
    var nodesToRoot: INodeToRoot[] = [];
    var nodesToRootToAdd: Bone[] = [];

    getNodesToRoot(gltfRuntime, newSkeleton, skins, nodesToRoot);
    newSkeleton.bones = [];

    // Joints
    for (var i = 0; i < skins.jointNames.length; i++) {
        var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);

        if (!jointNode) {
            continue;
        }

        var node = jointNode.node;

        if (!node) {
            Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
            continue;
        }

        var id = jointNode.id;

        // Optimize, if the bone already exists...
        var existingBone = gltfRuntime.scene.getBoneById(id);
        if (existingBone) {
            newSkeleton.bones.push(existingBone);
            continue;
        }

        // Search for parent bone
        var foundBone = false;
        var parentBone: Nullable<Bone> = null;

        for (var j = 0; j < i; j++) {
            let jointNode = getJointNode(gltfRuntime, skins.jointNames[j]);

            if (!jointNode) {
                continue;
            }

            var joint: IGLTFNode = jointNode.node;

            if (!joint) {
                Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
                continue;
            }

            var children = joint.children;
            if (!children) {
                continue;
            }
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

        var bone = new Bone(node.jointName || "", newSkeleton, parentBone, mat);
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

    newSkeleton.prepare();

    // Finish
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
        gltfRuntime.scene._blockEntityCollection = gltfRuntime.forAssetContainer;
        newMesh = new Mesh(node.name || "", gltfRuntime.scene);
        gltfRuntime.scene._blockEntityCollection = false;
        newMesh.id = id;
    }

    if (!node.babylonNode) {
        return newMesh;
    }

    const subMaterials: Material[] = [];

    var vertexData: Nullable<VertexData> = null;
    var verticesStarts = new Array<number>();
    var verticesCounts = new Array<number>();
    var indexStarts = new Array<number>();
    var indexCounts = new Array<number>();

    for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
        var meshId = meshes[meshIndex];
        var mesh: IGLTFMesh = gltfRuntime.meshes[meshId];

        if (!mesh) {
            continue;
        }

        // Positions, normals and UVs
        for (var i = 0; i < mesh.primitives.length; i++) {
            // Temporary vertex data
            var tempVertexData = new VertexData();

            var primitive = mesh.primitives[i];
            if (primitive.mode !== 4) {
                // continue;
            }

            var attributes = primitive.attributes;
            var accessor: Nullable<IGLTFAccessor> = null;
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
            if (accessor) {
                buffer = GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);

                tempVertexData.indices = new Int32Array(buffer.length);
                tempVertexData.indices.set(buffer);
                indexCounts.push(tempVertexData.indices.length);
            }
            else {
                // Set indices on the fly
                var indices: number[] = [];
                for (var j = 0; j < (<FloatArray>tempVertexData.positions).length / 3; j++) {
                    indices.push(j);
                }

                tempVertexData.indices = new Int32Array(indices);
                indexCounts.push(tempVertexData.indices.length);
            }

            if (!vertexData) {
                vertexData = tempVertexData;
            }
            else {
                vertexData.merge(tempVertexData);
            }

            // Sub material
            let material = gltfRuntime.scene.getMaterialById(primitive.material);

            subMaterials.push(material === null ? GLTFUtils.GetDefaultMaterial(gltfRuntime.scene) : material);

            // Update vertices start and index start
            verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
            indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
        }
    }
    let material: StandardMaterial | MultiMaterial;
    gltfRuntime.scene._blockEntityCollection = gltfRuntime.forAssetContainer;
    if (subMaterials.length > 1) {
        material = new MultiMaterial("multimat" + id, gltfRuntime.scene);
        (material as MultiMaterial).subMaterials = subMaterials;
    }
    else {
        material = new StandardMaterial("multimat" + id, gltfRuntime.scene);
    }

    if (subMaterials.length === 1) {
        material = (subMaterials[0] as StandardMaterial);
    }

    if (!newMesh.material) {
        newMesh.material = material;
    }

    // Apply geometry
    new Geometry(id, gltfRuntime.scene, vertexData!, false, newMesh);
    newMesh.computeWorldMatrix(true);

    gltfRuntime.scene._blockEntityCollection = false;

    // Apply submeshes
    newMesh.subMeshes = [];
    var index = 0;
    for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
        var meshId = meshes[meshIndex];
        var mesh: IGLTFMesh = gltfRuntime.meshes[meshId];

        if (!mesh) {
            continue;
        }

        for (var i = 0; i < mesh.primitives.length; i++) {
            if (mesh.primitives[i].mode !== 4) {
                //continue;
            }

            SubMesh.AddToMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
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
var configureNodeFromMatrix = (newNode: Mesh, node: IGLTFNode, parent: Nullable<Node>) => {
    if (node.matrix) {
        var position = new Vector3(0, 0, 0);
        var rotation = new Quaternion();
        var scaling = new Vector3(0, 0, 0);
        var mat = Matrix.FromArray(node.matrix);
        mat.decompose(scaling, rotation, position);

        configureNode(newNode, position, rotation, scaling);
    }
    else if (node.translation && node.rotation && node.scale) {
        configureNode(newNode, Vector3.FromArray(node.translation), Quaternion.FromArray(node.rotation), Vector3.FromArray(node.scale));
    }

    newNode.computeWorldMatrix(true);
};

/**
* Imports a node
*/
var importNode = (gltfRuntime: IGLTFRuntime, node: IGLTFNode, id: string, parent: Nullable<Node>): Nullable<Node> => {
    var lastNode: Nullable<Node> = null;

    if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
        if (gltfRuntime.importMeshesNames && gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name || "") === -1) {
            return null;
        }
    }

    // Meshes
    if (node.skin) {
        if (node.meshes) {
            var skin: IGLTFSkins = gltfRuntime.skins[node.skin];

            var newMesh = importMesh(gltfRuntime, node, node.meshes, id, <Mesh>node.babylonNode);
            newMesh.skeleton = gltfRuntime.scene.getLastSkeletonById(node.skin);

            if (newMesh.skeleton === null) {
                newMesh.skeleton = importSkeleton(gltfRuntime, skin, newMesh, skin.babylonSkeleton, node.skin);

                if (!skin.babylonSkeleton) {
                    skin.babylonSkeleton = newMesh.skeleton;
                }
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
                var ambienLight: IGLTFAmbienLight = (<any>light)[light.type];
                var hemiLight = new HemisphericLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                hemiLight.name = node.name || "";

                if (ambienLight.color) {
                    hemiLight.diffuse = Color3.FromArray(ambienLight.color);
                }

                lastNode = hemiLight;
            }
            else if (light.type === "directional") {
                var directionalLight: IGLTFDirectionalLight = (<any>light)[light.type];
                var dirLight = new DirectionalLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                dirLight.name = node.name || "";

                if (directionalLight.color) {
                    dirLight.diffuse = Color3.FromArray(directionalLight.color);
                }

                lastNode = dirLight;
            }
            else if (light.type === "point") {
                var pointLight: IGLTFPointLight = (<any>light)[light.type];
                var ptLight = new PointLight(node.light, Vector3.Zero(), gltfRuntime.scene);
                ptLight.name = node.name || "";

                if (pointLight.color) {
                    ptLight.diffuse = Color3.FromArray(pointLight.color);
                }

                lastNode = ptLight;
            }
            else if (light.type === "spot") {
                var spotLight: IGLTFSpotLight = (<any>light)[light.type];
                var spLight = new SpotLight(node.light, Vector3.Zero(), Vector3.Zero(), 0, 0, gltfRuntime.scene);
                spLight.name = node.name || "";

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

            gltfRuntime.scene._blockEntityCollection = gltfRuntime.forAssetContainer;
            if (camera.type === "orthographic") {
                var orthoCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene, false);

                orthoCamera.name = node.name || "";
                orthoCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
                orthoCamera.attachControl();

                lastNode = orthoCamera;
            }
            else if (camera.type === "perspective") {
                var perspectiveCamera: IGLTFCameraPerspective = (<any>camera)[camera.type];
                var persCamera = new FreeCamera(node.camera, Vector3.Zero(), gltfRuntime.scene, false);

                persCamera.name = node.name || "";
                persCamera.attachControl();

                if (!perspectiveCamera.aspectRatio) {
                    perspectiveCamera.aspectRatio = gltfRuntime.scene.getEngine().getRenderWidth() / gltfRuntime.scene.getEngine().getRenderHeight();
                }

                if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                    persCamera.maxZ = perspectiveCamera.zfar;
                    persCamera.minZ = perspectiveCamera.znear;
                }

                lastNode = persCamera;
            }

            gltfRuntime.scene._blockEntityCollection = false;
        }
    }

    // Empty node
    if (!node.jointName) {
        if (node.babylonNode) {
            return node.babylonNode;
        }
        else if (lastNode === null) {
            gltfRuntime.scene._blockEntityCollection = gltfRuntime.forAssetContainer;
            var dummy = new Mesh(node.name || "", gltfRuntime.scene);
            gltfRuntime.scene._blockEntityCollection = false;
            node.babylonNode = dummy;
            lastNode = dummy;
        }
    }

    if (lastNode !== null) {
        if (node.matrix && lastNode instanceof Mesh) {
            configureNodeFromMatrix(lastNode, node, parent);
        }
        else {
            var translation = node.translation || [0, 0, 0];
            var rotation = node.rotation || [0, 0, 0, 1];
            var scale = node.scale || [1, 1, 1];
            configureNode(lastNode, Vector3.FromArray(translation), Quaternion.FromArray(rotation), Vector3.FromArray(scale));
        }

        lastNode.updateCache(true);
        node.babylonNode = lastNode;
    }

    return lastNode;
};

/**
* Traverses nodes and creates them
*/
var traverseNodes = (gltfRuntime: IGLTFRuntime, id: string, parent: Nullable<Node>, meshIncluded: boolean = false) => {
    var node: IGLTFNode = gltfRuntime.nodes[id];
    var newNode: Nullable<Node> = null;

    if (gltfRuntime.importOnlyMeshes && !meshIncluded && gltfRuntime.importMeshesNames) {
        if (gltfRuntime.importMeshesNames.indexOf(node.name || "") !== -1 || gltfRuntime.importMeshesNames.length === 0) {
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
        newNode = importNode(gltfRuntime, node, id, parent);

        if (newNode !== null) {
            newNode.id = id;
            newNode.parent = parent;
        }
    }

    if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
            traverseNodes(gltfRuntime, node.children[i], newNode, meshIncluded);
        }
    }
};

/**
* do stuff after buffers, shaders are loaded (e.g. hook up materials, load animations, etc.)
*/
var postLoad = (gltfRuntime: IGLTFRuntime) => {
    // Nodes
    var currentScene: IGLTFScene = <IGLTFScene>gltfRuntime.currentScene;

    if (currentScene) {
        for (var i = 0; i < currentScene.nodes.length; i++) {
            traverseNodes(gltfRuntime, currentScene.nodes[i], null);
        }
    }
    else {
        for (var thing in gltfRuntime.scenes) {
            currentScene = <IGLTFScene>gltfRuntime.scenes[thing];

            for (var i = 0; i < currentScene.nodes.length; i++) {
                traverseNodes(gltfRuntime, currentScene.nodes[i], null);
            }
        }
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
var onBindShaderMaterial = (mesh: AbstractMesh, gltfRuntime: IGLTFRuntime, unTreatedUniforms: { [key: string]: IGLTFTechniqueParameter }, shaderMaterial: ShaderMaterial, technique: IGLTFTechnique, material: IGLTFMaterial, onSuccess: (shaderMaterial: ShaderMaterial) => void) => {
    var materialValues = material.values || technique.parameters;

    for (var unif in unTreatedUniforms) {
        var uniform: IGLTFTechniqueParameter = unTreatedUniforms[unif];
        var type = uniform.type;

        if (type === EParameterType.FLOAT_MAT2 || type === EParameterType.FLOAT_MAT3 || type === EParameterType.FLOAT_MAT4) {
            if (uniform.semantic && !uniform.source && !uniform.node) {
                GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, <Effect>shaderMaterial.getEffect());
            }
            else if (uniform.semantic && (uniform.source || uniform.node)) {
                var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node || "");
                if (source === null) {
                    source = gltfRuntime.scene.getNodeById(uniform.source || uniform.node || "");
                }
                if (source === null) {
                    continue;
                }

                GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, <Effect>shaderMaterial.getEffect());
            }
        }
        else {
            var value = (<any>materialValues)[technique.uniforms[unif]];
            if (!value) {
                continue;
            }

            if (type === EParameterType.SAMPLER_2D) {
                var texture = gltfRuntime.textures[material.values ? value : uniform.value].babylonTexture;

                if (texture === null || texture === undefined) {
                    continue;
                }

                (<Effect>shaderMaterial.getEffect()).setTexture(unif, texture);
            }
            else {
                GLTFUtils.SetUniform(<Effect>(shaderMaterial.getEffect()), unif, value, type);
            }
        }
    }

    onSuccess(shaderMaterial);
};

/**
* Prepare uniforms to send the only one time
* Loads the appropriate textures
*/
var prepareShaderMaterialUniforms = (gltfRuntime: IGLTFRuntime, shaderMaterial: ShaderMaterial, technique: IGLTFTechnique, material: IGLTFMaterial, unTreatedUniforms: { [key: string]: IGLTFTechniqueParameter }) => {
    var materialValues = material.values || technique.parameters;
    var techniqueUniforms = technique.uniforms;

    /**
    * Prepare values here (not matrices)
    */
    for (var unif in unTreatedUniforms) {
        var uniform: IGLTFTechniqueParameter = unTreatedUniforms[unif];
        var type = uniform.type;
        var value = (<any>materialValues)[techniqueUniforms[unif]];

        if (value === undefined) {
            // In case the value is the same for all materials
            value = <any>uniform.value;
        }

        if (!value) {
            continue;
        }

        var onLoadTexture = (uniformName: Nullable<string>) => {
            return (texture: Texture) => {
                if (uniform.value && uniformName) {
                    // Static uniform
                    shaderMaterial.setTexture(uniformName, texture);
                    delete unTreatedUniforms[uniformName];
                }
            };
        };

        // Texture (sampler2D)
        if (type === EParameterType.SAMPLER_2D) {
            GLTFLoaderExtension.LoadTextureAsync(gltfRuntime, material.values ? value : uniform.value, onLoadTexture(unif), () => onLoadTexture(null));
        }
        // Others
        else {
            if (uniform.value && GLTFUtils.SetUniform(shaderMaterial, unif, material.values ? value : uniform.value, type)) {
                // Static uniform
                delete unTreatedUniforms[unif];
            }
        }
    }
};

/**
* Shader compilation failed
*/
var onShaderCompileError = (program: IGLTFProgram, shaderMaterial: ShaderMaterial, onError: (message: string) => void) => {
    return (effect: Effect, error: string) => {
        shaderMaterial.dispose(true);
        onError("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
    };
};

/**
* Shader compilation success
*/
var onShaderCompileSuccess = (gltfRuntime: IGLTFRuntime, shaderMaterial: ShaderMaterial, technique: IGLTFTechnique, material: IGLTFMaterial, unTreatedUniforms: { [key: string]: IGLTFTechniqueParameter }, onSuccess: (shaderMaterial: ShaderMaterial) => void) => {
    return (_: Effect) => {
        prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);

        shaderMaterial.onBind = (mesh: AbstractMesh) => {
            onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
        };
    };
};

/**
* Returns the appropriate uniform if already handled by babylon
*/
var parseShaderUniforms = (tokenizer: Tokenizer, technique: IGLTFTechnique, unTreatedUniforms: { [key: string]: IGLTFTechniqueParameter }): string => {
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
        GLTFLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, (material: Material) => { }, () => { });
    }
};

/**
* Implementation of the base glTF spec
* @hidden
*/
export class GLTFLoaderBase {
    public static CreateRuntime(parsedData: any, scene: Scene, rootUrl: string): IGLTFRuntime {
        var gltfRuntime: IGLTFRuntime = {
            extensions: {},
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
            extensionsUsed: [],

            scenes: {},

            buffersCount: 0,
            shaderscount: 0,

            scene: scene,
            rootUrl: rootUrl,

            loadedBufferCount: 0,
            loadedBufferViews: {},

            loadedShaderCount: 0,

            importOnlyMeshes: false,

            dummyNodes: [],

            forAssetContainer: false
        };

        // Parse
        if (parsedData.extensions) {
            parseObject(parsedData.extensions, "extensions", gltfRuntime);
        }

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

        if (parsedData.scenes) {
            gltfRuntime.scenes = parsedData.scenes;
        }

        if (parsedData.scene && parsedData.scenes) {
            gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
        }

        return gltfRuntime;
    }

    public static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): void {
        var buffer: IGLTFBuffer = gltfRuntime.buffers[id];

        if (Tools.IsBase64(buffer.uri)) {
            setTimeout(() => onSuccess(new Uint8Array(Tools.DecodeBase64(buffer.uri))));
        }
        else {
            Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, (data) => onSuccess(new Uint8Array(data as ArrayBuffer)), onProgress, undefined, true, (request) => {
                if (request) {
                    onError(request.status + " " + request.statusText);
                }
            });
        }
    }

    public static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: Nullable<ArrayBufferView>) => void, onError: (message: string) => void): void {
        var texture: IGLTFTexture = gltfRuntime.textures[id];

        if (!texture || !texture.source) {
            onError("");
            return;
        }

        if (texture.babylonTexture) {
            onSuccess(null);
            return;
        }

        var source: IGLTFImage = gltfRuntime.images[texture.source];

        if (Tools.IsBase64(source.uri)) {
            setTimeout(() => onSuccess(new Uint8Array(Tools.DecodeBase64(source.uri))));
        }
        else {
            Tools.LoadFile(gltfRuntime.rootUrl + source.uri, (data) => onSuccess(new Uint8Array(data as ArrayBuffer)), undefined, undefined, true, (request) => {
                if (request) {
                    onError(request.status + " " + request.statusText);
                }
            });
        }
    }

    public static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: Nullable<ArrayBufferView>, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void {
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

        var blob = buffer == null ? new Blob() : new Blob([buffer]);
        var blobURL = URL.createObjectURL(blob);
        var revokeBlobURL = () => URL.revokeObjectURL(blobURL);
        var newTexture = new Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
        if (sampler.wrapS !== undefined) {
            newTexture.wrapU = GLTFUtils.GetWrapMode(sampler.wrapS);
        }
        if (sampler.wrapT !== undefined) {
            newTexture.wrapV = GLTFUtils.GetWrapMode(sampler.wrapT);
        }
        newTexture.name = id;

        texture.babylonTexture = newTexture;
        onSuccess(newTexture);
    }

    public static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string | ArrayBuffer) => void, onError?: (message: string) => void): void {
        var shader: IGLTFShader = gltfRuntime.shaders[id];

        if (Tools.IsBase64(shader.uri)) {
            var shaderString = atob(shader.uri.split(",")[1]);
            if (onSuccess) {
                onSuccess(shaderString);
            }
        }
        else {
            Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, undefined, undefined, false, (request) => {
                if (request && onError) {
                    onError(request.status + " " + request.statusText);
                }
            });
        }
    }

    public static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): void {
        var material: IGLTFMaterial = gltfRuntime.materials[id];
        if (!material.technique) {
            if (onError) {
                onError("No technique found.");
            }
            return;
        }

        var technique: IGLTFTechnique = gltfRuntime.techniques[material.technique];
        if (!technique) {
            gltfRuntime.scene._blockEntityCollection = gltfRuntime.forAssetContainer;
            var defaultMaterial = new StandardMaterial(id, gltfRuntime.scene);
            gltfRuntime.scene._blockEntityCollection = false;
            defaultMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
            defaultMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            onSuccess(defaultMaterial);
            return;
        }

        var program: IGLTFProgram = gltfRuntime.programs[technique.program];
        var states: IGLTFTechniqueStates = technique.states;

        var vertexShader: string = Effect.ShadersStore[program.vertexShader + "VertexShader"];
        var pixelShader: string = Effect.ShadersStore[program.fragmentShader + "PixelShader"];
        var newVertexShader = "";
        var newPixelShader = "";

        var vertexTokenizer = new Tokenizer(vertexShader);
        var pixelTokenizer = new Tokenizer(pixelShader);

        var unTreatedUniforms: { [key: string]: IGLTFTechniqueParameter } = {};
        var uniforms: string[] = [];
        var attributes: string[] = [];
        var samplers: string[] = [];

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
                let name = getAttribute(attributeParameter);
                if (name) {
                    attributes.push(name);
                }
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
            needAlphaBlending: states && states.enable && states.enable.indexOf(3042) !== -1
        };

        Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
        Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;

        var shaderMaterial = new ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
        shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
        shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
        shaderMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;

        if (states && states.functions) {
            var functions = states.functions;
            if (functions.cullFace && functions.cullFace[0] !== ECullingType.BACK) {
                shaderMaterial.backFaceCulling = false;
            }

            var blendFunc = functions.blendFuncSeparate;
            if (blendFunc) {
                if (blendFunc[0] === EBlendingFunction.SRC_ALPHA && blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_ALPHA && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_COMBINE;
                }
                else if (blendFunc[0] === EBlendingFunction.ONE && blendFunc[1] === EBlendingFunction.ONE && blendFunc[2] === EBlendingFunction.ZERO && blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_ONEONE;
                }
                else if (blendFunc[0] === EBlendingFunction.SRC_ALPHA && blendFunc[1] === EBlendingFunction.ONE && blendFunc[2] === EBlendingFunction.ZERO && blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_ADD;
                }
                else if (blendFunc[0] === EBlendingFunction.ZERO && blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_SUBTRACT;
                }
                else if (blendFunc[0] === EBlendingFunction.DST_COLOR && blendFunc[1] === EBlendingFunction.ZERO && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_MULTIPLY;
                }
                else if (blendFunc[0] === EBlendingFunction.SRC_ALPHA && blendFunc[1] === EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === EBlendingFunction.ONE && blendFunc[3] === EBlendingFunction.ONE) {
                    shaderMaterial.alphaMode = Constants.ALPHA_MAXIMIZED;
                }
            }
        }
    }
}

/**
* glTF V1 Loader
* @hidden
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

    public state: Nullable<GLTFLoaderState> = null;

    public dispose(): void {
        // do nothing
    }

    private _importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, forAssetContainer: boolean, onSuccess: (meshes: AbstractMesh[], skeletons: Skeleton[]) => void, onProgress?: (event: ISceneLoaderProgressEvent) => void, onError?: (message: string) => void): boolean {
        scene.useRightHandedSystem = true;

        GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, (gltfRuntime) => {
            gltfRuntime.forAssetContainer = forAssetContainer;
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

            var meshes = new Array<AbstractMesh>();
            var skeletons = new Array<Skeleton>();

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
                    postLoad(gltfRuntime);

                    if (!GLTFFileLoader.IncrementalLoading && onSuccess) {
                        onSuccess(meshes, skeletons);
                    }
                });
            }, onProgress);

            if (GLTFFileLoader.IncrementalLoading && onSuccess) {
                onSuccess(meshes, skeletons);
            }
        }, onError);

        return true;
    }

    /**
    * Imports one or more meshes from a loaded gltf file and adds them to the scene
    * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
    * @param scene the scene the meshes should be added to
    * @param forAssetContainer defines if the entities must be stored in the scene
    * @param data gltf data containing information of the meshes in a loaded file
    * @param rootUrl root url to load from
    * @param onProgress event that fires when loading progress has occured
    * @returns a promise containg the loaded meshes, particles, skeletons and animations
    */
    public importMeshAsync(meshesNames: any, scene: Scene, forAssetContainer: boolean, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void): Promise<ISceneLoaderAsyncResult> {
        return new Promise((resolve, reject) => {
            this._importMeshAsync(meshesNames, scene, data, rootUrl, forAssetContainer, (meshes, skeletons) => {
                resolve({
                    meshes: meshes,
                    particleSystems: [],
                    skeletons: skeletons,
                    animationGroups: [],
                    lights: [],
                    transformNodes: [],
                    geometries: []
                });
            }, onProgress, (message) => {
                reject(new Error(message));
            });
        });
    }

    private _loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, forAssetContainer: boolean, onSuccess: () => void, onProgress?: (event: ISceneLoaderProgressEvent) => void, onError?: (message: string) => void): void {
        scene.useRightHandedSystem = true;

        GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, (gltfRuntime) => {
            // Load runtime extensios
            GLTFLoaderExtension.LoadRuntimeExtensionsAsync(gltfRuntime, () => {
                // Create nodes
                this._createNodes(gltfRuntime);

                // Load buffers, shaders, materials, etc.
                this._loadBuffersAsync(gltfRuntime, () => {
                    this._loadShadersAsync(gltfRuntime, () => {
                        importMaterials(gltfRuntime);
                        postLoad(gltfRuntime);

                        if (!GLTFFileLoader.IncrementalLoading) {
                            onSuccess();
                        }
                    });
                });

                if (GLTFFileLoader.IncrementalLoading) {
                    onSuccess();
                }
            }, onError);
        }, onError);
    }

    /**
    * Imports all objects from a loaded gltf file and adds them to the scene
    * @param scene the scene the objects should be added to
    * @param data gltf data containing information of the meshes in a loaded file
    * @param rootUrl root url to load from
    * @param onProgress event that fires when loading progress has occured
    * @returns a promise which completes when objects have been loaded to the scene
    */
    public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            this._loadAsync(scene, data, rootUrl, false, () => {
                resolve();
            }, onProgress, (message) => {
                reject(new Error(message));
            });
        });
    }

    private _loadShadersAsync(gltfRuntime: IGLTFRuntime, onload: () => void): void {
        var hasShaders = false;

        var processShader = (sha: string, shader: IGLTFShader) => {
            GLTFLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, (shaderString) => {
                if (shaderString instanceof ArrayBuffer) {
                    return;
                }

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
    }

    private _loadBuffersAsync(gltfRuntime: IGLTFRuntime, onLoad: () => void, onProgress?: (event: ISceneLoaderProgressEvent) => void): void {
        var hasBuffers = false;

        var processBuffer = (buf: string, buffer: IGLTFBuffer) => {
            GLTFLoaderExtension.LoadBufferAsync(gltfRuntime, buf, (bufferView) => {
                gltfRuntime.loadedBufferCount++;

                if (bufferView) {
                    if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                        Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                    }

                    gltfRuntime.loadedBufferViews[buf] = bufferView;
                }

                if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                    onLoad();
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
            onLoad();
        }
    }

    private _createNodes(gltfRuntime: IGLTFRuntime): void {
        var currentScene = <IGLTFScene>gltfRuntime.currentScene;

        if (currentScene) {
            // Only one scene even if multiple scenes are defined
            for (var i = 0; i < currentScene.nodes.length; i++) {
                traverseNodes(gltfRuntime, currentScene.nodes[i], null);
            }
        }
        else {
            // Load all scenes
            for (var thing in gltfRuntime.scenes) {
                currentScene = <IGLTFScene>gltfRuntime.scenes[thing];

                for (var i = 0; i < currentScene.nodes.length; i++) {
                    traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                }
            }
        }
    }
}

/** @hidden */
export abstract class GLTFLoaderExtension {
    private _name: string;

    public constructor(name: string) {
        this._name = name;
    }

    public get name(): string {
        return this._name;
    }

    /**
    * Defines an override for loading the runtime
    * Return true to stop further extensions from loading the runtime
    */
    public loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (gltfRuntime: IGLTFRuntime) => void, onError?: (message: string) => void): boolean {
        return false;
    }

    /**
     * Defines an onverride for creating gltf runtime
     * Return true to stop further extensions from creating the runtime
     */
    public loadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError?: (message: string) => void): boolean {
        return false;
    }

    /**
    * Defines an override for loading buffers
    * Return true to stop further extensions from loading this buffer
    */
    public loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): boolean {
        return false;
    }

    /**
    * Defines an override for loading texture buffers
    * Return true to stop further extensions from loading this texture data
    */
    public loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): boolean {
        return false;
    }

    /**
    * Defines an override for creating textures
    * Return true to stop further extensions from loading this texture
    */
    public createTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: (message: string) => void): boolean {
        return false;
    }

    /**
    * Defines an override for loading shader strings
    * Return true to stop further extensions from loading this shader data
    */
    public loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: (message: string) => void): boolean {
        return false;
    }

    /**
    * Defines an override for loading materials
    * Return true to stop further extensions from loading this material
    */
    public loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): boolean {
        return false;
    }

    // ---------
    // Utilities
    // ---------

    public static LoadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (gltfRuntime: IGLTFRuntime) => void, onError?: (message: string) => void): void {
        GLTFLoaderExtension.ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
        }, () => {
            setTimeout(() => {
                if (!onSuccess) {
                    return;
                }
                onSuccess(GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
            });
        });
    }

    public static LoadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError?: (message: string) => void): void {
        GLTFLoaderExtension.ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError);
        }, () => {
            setTimeout(() => {
                onSuccess();
            });
        });
    }

    public static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (bufferView: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): void {
        GLTFLoaderExtension.ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
        }, () => {
            GLTFLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
        });
    }

    public static LoadTextureAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void {
        GLTFLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id,
            (buffer) => {
                if (buffer) {
                    GLTFLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                }
            }, onError);
    }

    public static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string | ArrayBuffer) => void, onError: (message: string) => void): void {
        GLTFLoaderExtension.ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
        });
    }

    public static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): void {
        GLTFLoaderExtension.ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
        });
    }

    private static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: Nullable<ArrayBufferView>) => void, onError: (message: string) => void): void {
        GLTFLoaderExtension.ApplyExtensions((loaderExtension) => {
            return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
        });
    }

    private static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void {
        GLTFLoaderExtension.ApplyExtensions((loaderExtension) => {
            return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
        }, () => {
            GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
        });
    }

    private static ApplyExtensions(func: (loaderExtension: GLTFLoaderExtension) => boolean, defaultFunc: () => void): void {
        for (var extensionName in GLTFLoader.Extensions) {
            var loaderExtension = GLTFLoader.Extensions[extensionName];
            if (func(loaderExtension)) {
                return;
            }
        }

        defaultFunc();
    }
}

GLTFFileLoader._CreateGLTF1Loader = () => new GLTFLoader();
