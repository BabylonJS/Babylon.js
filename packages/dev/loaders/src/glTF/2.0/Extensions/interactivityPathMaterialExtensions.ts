import type { FlowGraphPath } from "core/FlowGraph/flowGraphPath";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Texture } from "core/Materials/Textures/texture";
import { Color3 } from "core/Maths/math.color";
import type { IGLTF } from "../glTFLoaderInterfaces";

const materialsRegex =
    /^\/materials\/(\d+)\/(pbrMetallicRoughness\/baseColorFactor|pbrMetallicRoughness\/metallicFactor|pbrMetallicRoughness\/roughnessFactor|alphaCutoff|emissiveFactor|normalTexture\/scale|emissiveTexture\/strength)$/;

const gltfPbrMaterialPropertyToBabylonPropertyMap: { [key: string]: string } = {
    "pbrMetallicRoughness/baseColorFactor": "albedoColor",
    "pbrMetallicRoughness/metallicFactor": "metallic",
    "pbrMetallicRoughness/roughnessFactor": "roughness",
    emissiveFactor: "emissiveColor",
};

function getBabylonMaterial(path: FlowGraphPath, context: FlowGraphContext) {
    const fullPath = path.getFinalPath();
    const gltfTree = context.getVariable("gltf") as IGLTF;
    if (!gltfTree) {
        throw new Error(`No glTF tree found for path ${fullPath}`);
    }
    const matches = fullPath.match(materialsRegex);
    if (!matches || matches.length !== 3) {
        throw new Error(`Invalid path ${fullPath}`);
    }
    const materialIndex = parseInt(matches[1]);
    const material = gltfTree.materials && gltfTree.materials[materialIndex];
    if (!material) {
        throw new Error(`Invalid material index for path ${fullPath}`);
    }
    const babylonMaterials = [];
    if (!material._data) {
        throw new Error(`No Babylon materials found for path ${fullPath}`);
    }
    for (const data of Object.keys(material._data)) {
        const babylonMaterial = material._data[parseInt(data)].babylonMaterial as PBRMaterial;
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
    const babylonProperty = gltfPbrMaterialPropertyToBabylonPropertyMap[property] ?? property;
    return { babylonMaterials, babylonProperty };
}

export const pbrMaterialExtension = {
    shouldProcess(path: FlowGraphPath): boolean {
        const fullPath = path.getFinalPath();
        return !!fullPath.match(materialsRegex);
    },
    processGet(path: FlowGraphPath, context: FlowGraphContext): any {
        const { babylonMaterials, babylonProperty } = getBabylonMaterial(path, context);
        /* The difference between the materials is only the drawMode, so we can return the
        property of the first one*/
        if (babylonProperty === "normalTexture/scale") {
            const firstMat = babylonMaterials[0];
            return (firstMat.bumpTexture as Texture)?.uScale;
        } else if (babylonProperty === "emissiveTexture/strength") {
            const firstMat = babylonMaterials[0];
            return firstMat.emissiveTexture?.level;
        } else {
            return (babylonMaterials[0] as any)[babylonProperty];
        }
    },
    processSet(path: FlowGraphPath, context: FlowGraphContext, value: any) {
        const { babylonMaterials, babylonProperty } = getBabylonMaterial(path, context);
        for (const material of babylonMaterials) {
            if (babylonProperty === "normalTexture/scale") {
                (material.bumpTexture as Texture).uScale = value;
                (material.bumpTexture as Texture).vScale = value;
            } else if (babylonProperty === "emissiveTexture/strength") {
                material.emissiveTexture!.level = value;
            } else {
                let finalValue = value;
                if (babylonProperty === "albedoColor" || babylonProperty === "emissiveColor") {
                    finalValue = new Color3(value.x, value.y, value.z);
                }
                (material as any)[babylonProperty] = finalValue;
            }
        }
    },
};
