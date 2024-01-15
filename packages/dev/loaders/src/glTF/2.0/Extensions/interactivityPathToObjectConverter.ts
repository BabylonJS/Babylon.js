/* eslint-disable @typescript-eslint/naming-convention */
import type { IGLTF, INode } from "../glTFLoaderInterfaces";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import type { TransformNode } from "core/Meshes";
import type { IObjectAccessor } from "core/FlowGraph";

/**
 * Class to convert an interactivity pointer path to a smart object
 */
export class InteractivityPathToObjectConverter extends GLTFPathToObjectConverter<IObjectAccessor> {
    public constructor(gltf: IGLTF) {
        super(gltf, gltfTree);
    }
}

const nodesTree = {
    __array__: {
        __target__: true,
        translation: {
            type: "Vector3",
            get: (node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                return babylonObject.position;
            },
            set: (value: any, node: INode) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                babylonObject.position = value;
            },
            getObject(node: INode) {
                return node._babylonTransformNode;
            },
        },
    },
};

const gltfTree = {
    nodes: nodesTree,
};
