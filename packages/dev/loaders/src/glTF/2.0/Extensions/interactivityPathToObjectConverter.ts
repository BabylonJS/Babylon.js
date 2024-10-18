/* eslint-disable @typescript-eslint/naming-convention */
import type { IAnimation, IGLTF, INode } from "../glTFLoaderInterfaces";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
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
            get: (node: INode) => node._babylonTransformNode?.position,
            set: (value: Vector3, node: INode) => node._babylonTransformNode?.position.copyFrom(value),
            getObject: (node: INode) => node._babylonTransformNode,
            getPropertyName: (_node: INode) => "position",
        },
        rotation: {
            type: "Quaternion",
            get: (node: INode) => node._babylonTransformNode?.rotationQuaternion,
            set: (value: Quaternion, node: INode) => node._babylonTransformNode?.rotationQuaternion?.copyFrom(value),
            getObject: (node: INode) => node._babylonTransformNode,
            getPropertyName: (_node: INode) => "rotationQuaternion",
        },
        scale: {
            type: "Vector3",
            get: (node: INode) => node._babylonTransformNode?.scaling,
            set: (value: Vector3, node: INode) => node._babylonTransformNode?.scaling.copyFrom(value),
            getObject: (node: INode) => node._babylonTransformNode,
            getPropertyName: (_node: INode) => "scaling",
        },
        // weights?
        // readonly!
        matrix: {
            type: "Matrix",
            get: (node: INode) => node._babylonTransformNode?.getPoseMatrix(),
            getObject: (node: INode) => node._babylonTransformNode,
            getPropertyName: (_node: INode) => "_poseMatrix",
        },
        globalMatrix: {
            type: "Matrix",
            get: (node: INode) => node._babylonTransformNode?.getWorldMatrix(),
            getObject: (node: INode) => node._babylonTransformNode,
            getPropertyName: (_node: INode) => "worldMatrix",
        },
    },
};

const animationsTree = {
    length: {
        get: (animations: IAnimation[]) => {
            return animations.length;
        },
        getObject(animations: IAnimation[]) {
            return animations;
        },
        getPropertyName(_animations: IAnimation[]) {
            return "length";
        },
    },
    __array__: {},
};

const gltfTree = {
    nodes: nodesTree,
    animations: animationsTree,
};
