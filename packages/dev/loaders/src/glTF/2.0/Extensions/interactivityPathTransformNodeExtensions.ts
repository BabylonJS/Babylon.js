import type { FlowGraphPath, IPathExtension } from "core/FlowGraph/flowGraphPath";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { TransformNode } from "core/Meshes";
import type { IGLTF } from "../glTFLoaderInterfaces";

const nodesRegex = /^\/nodes\/(\d+)\/(translation|rotation|scale)$/;

function getBabylonTransformNode(path: FlowGraphPath, context: FlowGraphContext) {
    const fullPath = path.getFinalPath();
    const gltfTree = context.getVariable("gltf") as IGLTF;
    if (!gltfTree) {
        throw new Error(`No glTF tree found for path ${fullPath}`);
    }
    const matches = fullPath.match(nodesRegex);
    if (!matches || matches.length !== 3) {
        throw new Error(`Invalid path ${fullPath}`);
    }
    const nodeIndex = parseInt(matches[1]);
    const node = gltfTree.nodes && gltfTree.nodes[nodeIndex];
    if (!node) {
        throw new Error(`Invalid node index for path ${fullPath}`);
    }
    const babylonNode = node._babylonTransformNode as TransformNode;
    if (!babylonNode) {
        throw new Error(`No Babylon node found for path ${fullPath}`);
    }
    const property = matches[2];
    if (!property) {
        throw new Error(`Invalid property for path ${fullPath}`);
    }
    const babylonProperty = gltfNodePropertyToBabylonPropertyMap[property];
    if (!babylonProperty) {
        throw new Error(`Invalid property for path ${fullPath}`);
    }
    return { babylonNode, babylonProperty };
}

const gltfNodePropertyToBabylonPropertyMap: { [key: string]: string } = {
    translation: "position",
    scale: "scaling",
    rotation: "rotationQuaternion",
};

export const transformNodeExtension: IPathExtension = {
    shouldProcess(path: FlowGraphPath): boolean {
        const fullPath = path.getFinalPath();
        return !!fullPath.match(nodesRegex);
    },
    processGet(path: FlowGraphPath, context: FlowGraphContext) {
        const { babylonNode, babylonProperty } = getBabylonTransformNode(path, context);
        return (babylonNode as any)[babylonProperty];
    },
    processSet(path: FlowGraphPath, context: FlowGraphContext, value: any) {
        const { babylonNode, babylonProperty } = getBabylonTransformNode(path, context);
        (babylonNode as any)[babylonProperty] = value;
    },
};
