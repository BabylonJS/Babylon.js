/* eslint-disable @typescript-eslint/naming-convention */
import type { IGLTF, INode } from "../glTFLoaderInterfaces";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import type { TransformNode } from "core/Meshes";
import type { IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import type { Vector3, Quaternion } from "core/Maths/math.vector";

/**
 * Class to convert an interactivity pointer path to a smart object
 */
export class InteractivityPathToObjectConverter extends GLTFPathToObjectConverter<IObjectAccessor> {
    public constructor(gltf: IGLTF) {
        super(gltf, gltfTree);
    }
}

const nodesTree = {
    length: {
        get: (nodes: INode[]) => {
            return nodes.length;
        },
        getObject(nodes: INode[]) {
            return nodes;
        },
        getPropertyName(_nodes: INode[]) {
            return "length";
        },
    },
    __array__: {
        __target__: true,
        translation: {
            type: "Vector3",
            get: (node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                return babylonObject.position;
            },
            set: (value: Vector3, node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                babylonObject.position = value;
            },
            getObject(node: INode) {
                return node._babylonTransformNode;
            },
            getPropertyName(_node: INode) {
                return "position";
            },
        },
        rotation: {
            type: "Quaternion",
            get: (node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                return babylonObject.rotationQuaternion;
            },
            set: (value: Quaternion, node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                babylonObject.rotationQuaternion = value;
            },
            getObject(node: INode) {
                return node._babylonTransformNode;
            },
            getPropertyName(_node: INode) {
                return "rotationQuaternion";
            },
        },
        scale: {
            type: "Vector3",
            get: (node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                return babylonObject.scaling;
            },
            set: (value: Vector3, node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                babylonObject.scaling = value;
            },
            getObject(node: INode) {
                return node._babylonTransformNode;
            },
            getPropertyName(_node: INode) {
                return "scaling";
            },
        },
        // weights?
        // readonly!
        matrix: {
            type: "Matrix",
            get: (node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                return babylonObject.getPoseMatrix();
            },
            getObject(node: INode) {
                return node._babylonTransformNode;
            },
            getPropertyName(_node: INode) {
                return "_poseMatrix";
            },
        },
        globalMatrix: {
            type: "Matrix",
            get: (node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                return babylonObject.getWorldMatrix();
            },
            getObject(node: INode) {
                return node._babylonTransformNode;
            },
            getPropertyName(_node: INode) {
                return "_worldMatrix";
            },
        },
    },
};

const gltfTree = {
    nodes: nodesTree,
};
