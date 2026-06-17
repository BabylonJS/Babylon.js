/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode, findChildByName, getPropertyValue, cleanFBXName } from "../types/fbxTypes";

import { type FBXObjectMap, getChildren } from "./connections";

import { getPropertyTemplate, resolvePropertyValue, resolvePropertyValues, type FBXPropertyTemplate, type FBXPropertyTemplateMap } from "./propertyTemplates";

/** Parsed material data */
export interface FBXMaterialData {
    id: number;
    name: string;
    type: "Lambert" | "Phong";
    properties: FBXMaterialProperties;
    textures: FBXTextureRef[];
}

export interface FBXMaterialProperties {
    diffuseColor?: [number, number, number];
    diffuseFactor?: number;
    ambientColor?: [number, number, number];
    ambientFactor?: number;
    specularColor?: [number, number, number];
    specularFactor?: number;
    shininess?: number;
    emissiveColor?: [number, number, number];
    emissiveFactor?: number;
    opacity?: number;
    transparencyFactor?: number;
}

export interface FBXTextureRef {
    /** Which material property this texture is connected to */
    propertyName: string;
    /** Absolute file path from the FBX */
    fileName: string;
    /** Relative file path from the FBX */
    relativeFileName: string;
    /** Texture node ID */
    id: number;
    /** Embedded texture data (from Video node Content), if available */
    embeddedData: Uint8Array | null;
    /** UV translation [u, v] */
    uvTranslation?: [number, number];
    /** UV scaling [u, v] */
    uvScaling?: [number, number];
    /** UV rotation in degrees */
    uvRotation?: number;
    /** Which UV set index this texture uses */
    uvSetIndex?: number;
    /** Which named UV set this texture uses */
    uvSetName?: string;
}

/**
 * Extract material data from an FBX Material node.
 */
export function extractMaterial(materialNode: FBXNode, materialId: number, objectMap: FBXObjectMap, templates?: FBXPropertyTemplateMap): FBXMaterialData {
    const name = cleanFBXName(getPropertyValue<string>(materialNode, 1) ?? "Material");
    const template = getMaterialTemplate(materialNode, templates);

    // Determine Lambert vs Phong from ShadingModel property
    const shadingModel = findChildByName(materialNode, "ShadingModel");
    const shadingType = shadingModel
        ? (getPropertyValue<string>(shadingModel, 0) ?? "Lambert")
        : (resolvePropertyValue<string>(materialNode, template, "ShadingModel") ?? "Lambert");
    const type: "Lambert" | "Phong" = shadingType.toLowerCase() === "phong" ? "Phong" : "Lambert";

    // Extract properties from Properties70
    const properties = extractMaterialProperties(materialNode, template);

    // Find connected textures
    const textureTemplate = templates ? (getPropertyTemplate(templates, "Texture", "FbxFileTexture") ?? getPropertyTemplate(templates, "Texture")) : undefined;
    const textures = extractTextures(materialId, objectMap, textureTemplate);

    return { id: materialId, name, type, properties, textures };
}

function extractMaterialProperties(materialNode: FBXNode, template?: FBXPropertyTemplate): FBXMaterialProperties {
    const props: FBXMaterialProperties = {};
    props.diffuseColor = getColorProperty(materialNode, template, "DiffuseColor") ?? getColorProperty(materialNode, template, "Diffuse");
    props.diffuseFactor = getNumberProperty(materialNode, template, "DiffuseFactor");
    props.ambientColor = getColorProperty(materialNode, template, "AmbientColor") ?? getColorProperty(materialNode, template, "Ambient");
    props.ambientFactor = getNumberProperty(materialNode, template, "AmbientFactor");
    props.specularColor = getColorProperty(materialNode, template, "SpecularColor") ?? getColorProperty(materialNode, template, "Specular");
    props.specularFactor = getNumberProperty(materialNode, template, "SpecularFactor");
    props.shininess = getNumberProperty(materialNode, template, "Shininess") ?? getNumberProperty(materialNode, template, "ShininessExponent");
    props.emissiveColor = getColorProperty(materialNode, template, "EmissiveColor") ?? getColorProperty(materialNode, template, "Emissive");
    props.emissiveFactor = getNumberProperty(materialNode, template, "EmissiveFactor");
    props.opacity = getNumberProperty(materialNode, template, "Opacity");
    props.transparencyFactor = getNumberProperty(materialNode, template, "TransparencyFactor");

    return props;
}

function extractTextures(materialId: number, objectMap: FBXObjectMap, template?: FBXPropertyTemplate): FBXTextureRef[] {
    const textures: FBXTextureRef[] = [];
    const textureChildren = getChildren(objectMap, materialId, "Texture");

    for (const { id, node, propertyName } of textureChildren) {
        const fileNameNode = findChildByName(node, "FileName");
        const relFileNameNode = findChildByName(node, "RelativeFilename");

        const fileName = fileNameNode ? (getPropertyValue<string>(fileNameNode, 0) ?? "") : "";
        const relativeFileName = relFileNameNode ? (getPropertyValue<string>(relFileNameNode, 0) ?? "") : "";

        // Extract UV transform properties
        let uvTranslation: [number, number] | undefined;
        let uvScaling: [number, number] | undefined;
        const uvRotation = getNumberProperty(node, template, "UVRotation") ?? getNumberProperty(node, template, "Rotation");
        let uvSetName: string | undefined;
        uvTranslation = getTextureVector2(node, template, "UVTranslation") ?? getTextureVector2(node, template, "Translation");
        uvScaling = getTextureVector2(node, template, "UVScaling") ?? getTextureVector2(node, template, "Scaling");
        const uvSet = resolvePropertyValue<string>(node, template, "UVSet");
        if (uvSet && uvSet.length > 0) {
            uvSetName = uvSet;
        }
        uvTranslation ??= getNumberPairChild(node, "ModelUVTranslation");
        uvScaling ??= getNumberPairChild(node, "ModelUVScaling");

        // Check for embedded texture data in connected Video node
        let embeddedData: Uint8Array | null = null;
        const videoChildren = getChildren(objectMap, id, "Video");
        for (const { node: videoNode } of videoChildren) {
            const contentNode = findChildByName(videoNode, "Content");
            if (contentNode && contentNode.properties.length > 0) {
                const content = contentNode.properties[0].value;
                if (content instanceof Uint8Array && content.length > 0) {
                    embeddedData = content;
                } else if (content instanceof ArrayBuffer && (content as ArrayBuffer).byteLength > 0) {
                    embeddedData = new Uint8Array(content as ArrayBuffer);
                }
            }
        }

        textures.push({
            propertyName: propertyName ?? "DiffuseColor",
            fileName,
            relativeFileName,
            id,
            embeddedData,
            uvTranslation,
            uvScaling,
            uvRotation,
            uvSetName,
        });
    }

    return textures;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMaterialTemplate(materialNode: FBXNode, templates: FBXPropertyTemplateMap | undefined): FBXPropertyTemplate | undefined {
    if (!templates) {
        return undefined;
    }

    const shadingModel = findChildByName(materialNode, "ShadingModel");
    const shadingType = shadingModel ? getPropertyValue<string>(shadingModel, 0) : undefined;
    if (shadingType?.toLowerCase() === "phong") {
        return getPropertyTemplate(templates, "Material", "FbxSurfacePhong") ?? getPropertyTemplate(templates, "Material");
    }
    if (shadingType?.toLowerCase() === "lambert") {
        return getPropertyTemplate(templates, "Material", "FbxSurfaceLambert") ?? getPropertyTemplate(templates, "Material");
    }

    return getPropertyTemplate(templates, "Material");
}

function getColorProperty(node: FBXNode, template: FBXPropertyTemplate | undefined, propertyName: string): [number, number, number] | undefined {
    const values = resolvePropertyValues(node, template, propertyName);
    if (!values || values.length < 3) {
        return undefined;
    }
    const r = toNumber(values[0]);
    const g = toNumber(values[1]);
    const b = toNumber(values[2]);
    if (r === undefined || g === undefined || b === undefined) {
        return undefined;
    }
    return [r, g, b];
}

function getNumberProperty(node: FBXNode, template: FBXPropertyTemplate | undefined, propertyName: string): number | undefined {
    return toNumber(resolvePropertyValue(node, template, propertyName));
}

function getTextureVector2(node: FBXNode, template: FBXPropertyTemplate | undefined, propertyName: string): [number, number] | undefined {
    const values = resolvePropertyValues(node, template, propertyName);
    if (!values) {
        return undefined;
    }
    const u = toNumber(values[0]);
    const v = toNumber(values[1]);
    return u !== undefined && v !== undefined ? [u, v] : undefined;
}

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number") {
        return value;
    }
    return undefined;
}

function getNumberPairChild(node: FBXNode, childName: string): [number, number] | undefined {
    const child = findChildByName(node, childName);
    if (!child) {
        return undefined;
    }
    const u = toNumber(child.properties[0]?.value);
    const v = toNumber(child.properties[1]?.value);
    return u !== undefined && v !== undefined ? [u, v] : undefined;
}
