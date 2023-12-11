import type { ITemplatedPath } from "core/ObjectModel";
import type { IGLTF, INode } from "../glTFLoaderInterfaces";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import type { TransformNode } from "core/Meshes";

export class InteractivityPathToObjectConverter extends GLTFPathToObjectConverter implements ITemplatedPath {
    public substitutionTemplates: { [key: string]: string } = {};

    constructor(public gltf: IGLTF) {
        super(gltf, gltfTree);
    }

    public beforeConvertPath(path: string): string {
        for (const template in this.substitutionTemplates) {
            path = path.replace(`{${template}}`, this.substitutionTemplates[template]);
        }
        return path;
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
            set: (node: INode, value: any) => {
                const babylonObject = node._babylonTransformNode as TransformNode;
                babylonObject.position = value;
            },
        },
    },
};

const gltfTree = {
    nodes: nodesTree,
};
