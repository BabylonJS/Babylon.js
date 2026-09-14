/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode, type FBXPropertyValue, findChildByName, getPropertyValue, cleanFBXName } from "../types/fbxTypes";

import { type FBXObjectMap, getChildren } from "./connections";

import {
    extractUserProperties,
    getPropertyEntries,
    getPropertyTemplate,
    resolvePropertyValue,
    resolvePropertyValues,
    type FBXPropertyTemplate,
    type FBXPropertyTemplateMap,
    type FBXUserPropertyValue,
} from "./propertyTemplates";
import { resolveMaterialModel, type FBXMaterialModel, type FBXMaterialSource } from "./materialModel";

/** Parsed material data */
export interface FBXMaterialData {
    id: number;
    name: string;
    type: "Lambert" | "Phong";
    properties: FBXMaterialProperties;
    textures: FBXTextureRef[];
    /** Unified classic + PBR parameter model resolved from whichever shader flavour the file uses */
    model: FBXMaterialModel<FBXTextureRef>;
    /** User-defined properties */
    userProperties?: Record<string, FBXUserPropertyValue>;
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
    /** WrapModeU: 0 = repeat, 1 = clamp */
    wrapU?: number;
    /** WrapModeV: 0 = repeat, 1 = clamp */
    wrapV?: number;
    /** Set when the texture came from a LayeredTexture (only the first layer is used) */
    layeredTextureId?: number;
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

    // Resolve the unified material model (classic + PBR parameters) from all properties, textures and shader bindings.
    const props = new Map<string, { type: string; values: FBXPropertyValue[] }>();
    for (const tp of template?.properties.values() ?? []) {
        props.set(tp.name, { type: tp.propertyType, values: tp.values });
    }
    for (const entry of getPropertyEntries(materialNode)) {
        props.set(entry.name, { type: entry.type, values: entry.values });
    }
    const texturesByProp = new Map<string, FBXTextureRef>();
    for (const tex of textures) {
        if (!texturesByProp.has(tex.propertyName)) {
            texturesByProp.set(tex.propertyName, tex);
        }
    }
    const source: FBXMaterialSource<FBXTextureRef> = { shadingModelName: shadingType, props, texturesByProp, shader: extractShaderInfo(materialId, objectMap) };
    const model = resolveMaterialModel(source);

    return { id: materialId, name, type, properties, textures, model, userProperties: extractUserProperties(materialNode) };
}

/**
 * Shader implementation connected to a material (Arnold, OSL / Standard Surface, Stingray PBS): the RenderAPI names
 * the flavour and the binding table maps shader semantics to material property names.
 */
function extractShaderInfo(materialId: number, objectMap: FBXObjectMap): { renderApi: string; bindings: Map<string, string[]> } | undefined {
    // The material is connected as a child of its Implementation (Material -> Implementation), so look at parents.
    const implementations = objectMap.connections
        .filter((conn) => conn.type === "OO" && conn.childId === materialId && objectMap.objects.get(conn.parentId)?.name === "Implementation")
        .map((conn) => ({ id: conn.parentId, node: objectMap.objects.get(conn.parentId)! }));
    if (implementations.length === 0) {
        return undefined;
    }
    const impl = implementations[0];
    const renderApi = getPropertyEntries(impl.node).find((e) => e.name === "RenderAPI")?.values[0];
    const bindings = new Map<string, string[]>();
    const add = (shaderProp: string, materialProp: string) => {
        const list = bindings.get(shaderProp);
        if (list) {
            list.push(materialProp);
        } else {
            bindings.set(shaderProp, [materialProp]);
        }
    };
    for (const table of getChildren(objectMap, impl.id, "BindingTable")) {
        for (const entry of table.node.children) {
            if (entry.name !== "Entry") {
                continue;
            }
            const src = getPropertyValue<string>(entry, 0);
            const srcType = getPropertyValue<string>(entry, 1);
            const dst = getPropertyValue<string>(entry, 2);
            const dstType = getPropertyValue<string>(entry, 3);
            if (typeof src !== "string" || typeof dst !== "string") {
                continue;
            }
            if (srcType === "FbxPropertyEntry" && dstType === "FbxSemanticEntry") {
                add(dst, src);
            } else if (srcType === "FbxSemanticEntry" && dstType === "FbxPropertyEntry") {
                add(src, dst);
            }
        }
    }
    return { renderApi: typeof renderApi === "string" ? renderApi : "", bindings };
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
        textures.push(extractTextureRef(id, node, propertyName, objectMap, template));
    }

    // LayeredTexture: several textures blended into one slot. Babylon has no layer blending, so the first layer
    // stands in for the stack; the layer count is recorded on the ref for diagnostics.
    for (const { id: layeredId, propertyName } of getChildren(objectMap, materialId, "LayeredTexture")) {
        const layers = getChildren(objectMap, layeredId, "Texture");
        if (layers.length === 0) {
            continue;
        }
        const ref = extractTextureRef(layers[0].id, layers[0].node, propertyName, objectMap, template);
        ref.layeredTextureId = layeredId;
        textures.push(ref);
    }

    return textures;
}

export function extractTextureRef(id: number, node: FBXNode, propertyName: string | undefined, objectMap: FBXObjectMap, template?: FBXPropertyTemplate): FBXTextureRef {
    {
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
        const wrapU = getNumberProperty(node, template, "WrapModeU");
        const wrapV = getNumberProperty(node, template, "WrapModeV");

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

        return {
            propertyName: propertyName ?? "DiffuseColor",
            fileName,
            relativeFileName,
            id,
            embeddedData,
            uvTranslation,
            uvScaling,
            uvRotation,
            uvSetName,
            wrapU,
            wrapV,
        };
    }
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
