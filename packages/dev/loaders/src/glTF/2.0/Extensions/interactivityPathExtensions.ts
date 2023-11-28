import type { IGLTF } from "../glTFLoaderInterfaces";
import type { FlowGraphContext, FlowGraphPath, IPathExtension } from "core/FlowGraph";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Color3 } from "core/Maths";
import type { TransformNode } from "core/Meshes";

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
    const babylonNode = (node as any)._babylonTransformNode as TransformNode;
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

const transformNodeExtension = {
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

const pbrMaterialsRegex = /^\/materials\/(\d+)\/pbrMetallicRoughness\/(baseColorFactor|metallicFactor|roughnessFactor)$/;

const gltfPbrMaterialPropertyToBabylonPropertyMap: { [key: string]: string } = {
    baseColorFactor: "albedoColor",
    metallicFactor: "metallic",
    roughnessFactor: "roughness",
};

function getBabylonPBRMaterial(path: FlowGraphPath, context: FlowGraphContext) {
    const fullPath = path.getFinalPath();
    const gltfTree = context.getVariable("gltf") as IGLTF;
    if (!gltfTree) {
        throw new Error(`No glTF tree found for path ${fullPath}`);
    }
    const matches = fullPath.match(pbrMaterialsRegex);
    if (!matches || matches.length !== 3) {
        throw new Error(`Invalid path ${fullPath}`);
    }
    const materialIndex = parseInt(matches[1]);
    const material = gltfTree.materials && gltfTree.materials[materialIndex];
    if (!material) {
        throw new Error(`Invalid material index for path ${fullPath}`);
    }
    const babylonMaterials = [];
    for (const data of Object.keys((material as any)._data)) {
        const babylonMaterial = (material as any)._data[data].babylonMaterial as PBRMaterial;
        if (babylonMaterial) {
            babylonMaterials.push(babylonMaterial);
        }
    }
    if (!babylonMaterials || babylonMaterials.length === 0) {
        throw new Error(`No Babylon materials found for path ${fullPath}`);
    }
    const property = matches[2];
    if (!property) {
        throw new Error(`Invalid property for path ${fullPath}`);
    }
    const babylonProperty = gltfPbrMaterialPropertyToBabylonPropertyMap[property];
    if (!babylonProperty) {
        throw new Error(`Invalid property for path ${fullPath}`);
    }
    return { babylonMaterials, babylonProperty };
}

const pbrMaterialExtension = {
    shouldProcess(path: FlowGraphPath): boolean {
        const fullPath = path.getFinalPath();
        return !!fullPath.match(pbrMaterialsRegex);
    },
    processGet(path: FlowGraphPath, context: FlowGraphContext): any {
        const { babylonMaterials, babylonProperty } = getBabylonPBRMaterial(path, context);
        /* The difference between the materials is only the drawMode, so we can return the
        property of the first one*/
        return (babylonMaterials[0] as any)[babylonProperty];
    },
    processSet(path: FlowGraphPath, context: FlowGraphContext, value: any) {
        const { babylonMaterials, babylonProperty } = getBabylonPBRMaterial(path, context);
        for (const material of babylonMaterials) {
            let finalValue = value;
            if (babylonProperty === "albedoColor") {
                finalValue = new Color3(value.x, value.y, value.z);
            }
            (material as any)[babylonProperty] = finalValue;
        }
    },
};

export const interactivityPathExensions: IPathExtension[] = [transformNodeExtension, pbrMaterialExtension];
