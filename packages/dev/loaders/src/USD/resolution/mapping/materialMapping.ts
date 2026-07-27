import { type IResolvedMaterial, type IResolvedMaterialBinding, type IResolvedTexture, type ResolvedTextureSlot, type Vec3, type Vec4 } from "../resolvedStage";
import { type ISdfAttributeSpec, type ISdfPrimSpec } from "../sdf/index";
import { ResolveAssetIdentifier } from "../assetPath";
import { type IStageMappingContext } from "./mappingContext";
import {
    AsAssetPath,
    AsBoolean,
    AsNumber,
    AsToken,
    AsVec3,
    AsVec4,
    GetAttribute,
    GetAttributeValue,
    GetConnectionTargets,
    GetRelationship,
    GetRelationshipTargets,
    SplitPropertyPath,
} from "./valueAccess";

interface IPreviewInputMapping {
    readonly inputName: string;
    readonly scalarSlot?: keyof Omit<IResolvedMaterial, "name" | "textures">;
    readonly textureSlot?: ResolvedTextureSlot;
    readonly defaultChannel?: IResolvedTexture["channel"];
}

const PreviewInputMappings: IPreviewInputMapping[] = [
    { inputName: "diffuseColor", scalarSlot: "baseColor", textureSlot: "baseColor" },
    { inputName: "metallic", scalarSlot: "metallic", textureSlot: "metallic", defaultChannel: "b" },
    { inputName: "roughness", scalarSlot: "roughness", textureSlot: "roughness", defaultChannel: "r" },
    { inputName: "opacity", scalarSlot: "opacity", textureSlot: "opacity", defaultChannel: "a" },
    { inputName: "emissiveColor", scalarSlot: "emissiveColor", textureSlot: "emissive" },
    { inputName: "ior", scalarSlot: "ior" },
    { inputName: "occlusion", scalarSlot: "occlusion", textureSlot: "occlusion", defaultChannel: "r" },
    { inputName: "clearcoat", scalarSlot: "clearcoat", textureSlot: "clearcoat", defaultChannel: "r" },
    { inputName: "clearcoatRoughness", scalarSlot: "clearcoatRoughness", textureSlot: "clearcoatRoughness", defaultChannel: "g" },
    { inputName: "normal", textureSlot: "normal" },
    { inputName: "specularColor", scalarSlot: "specularColor" },
];

/**
 * Resolves a mesh or subset material binding and pools the target material.
 * @param prim prim that may author a material:binding relationship
 * @param context mapping context with material pool and prim lookup
 * @param fallbackBaseColor fallback color used when the bound material has no PreviewSurface
 * @returns resolved material binding, if one was authored
 */
export function ResolveMaterialBinding(prim: ISdfPrimSpec, context: IStageMappingContext, fallbackBaseColor?: Vec3): IResolvedMaterialBinding | undefined {
    const materialPath = GetMaterialBindingPath(prim);
    if (!materialPath) {
        return undefined;
    }
    return { materialIndex: ResolveMaterialIndex(materialPath, context, fallbackBaseColor) };
}

/**
 * Returns the direct `material:binding` target authored on a prim, if any.
 *
 * In USD a direct material binding applies to the prim and is inherited by every descendant in
 * namespace, so callers can walk this up an ancestor chain to bind meshes whose binding is authored
 * on a parent (a common pattern for exporters that reference geometry under a bound Xform).
 * @param prim prim that may author a `material:binding` relationship
 * @returns absolute material path, or undefined when none is authored
 */
export function GetMaterialBindingPath(prim: ISdfPrimSpec): string | undefined {
    return GetRelationshipTargets(GetRelationship(prim, "material:binding"))[0];
}

/**
 * Resolves and pools a Material prim by path.
 * @param materialPath absolute path to the Material prim
 * @param context mapping context with material pool and prim lookup
 * @param fallbackBaseColor fallback color used when the material network is unsupported
 * @returns material pool index
 */
export function ResolveMaterialIndex(materialPath: string, context: IStageMappingContext, fallbackBaseColor?: Vec3): number {
    const existing = context.materialIndexByPath.get(materialPath);
    if (existing !== undefined) {
        return existing;
    }

    const prim = context.primByPath.get(materialPath);
    const material = prim ? BuildMaterialFromPrim(prim, context, fallbackBaseColor) : BuildDefaultMaterial(materialPath, fallbackBaseColor ?? [1, 1, 1]);
    const index = context.materials.length;
    context.materials.push(material);
    context.materialIndexByPath.set(materialPath, index);
    if (!prim) {
        context.diagnostics.push({ severity: "warning", path: materialPath, message: "Material binding target was not found; using a default material." });
    }
    return index;
}

/**
 * Returns the first displayColor value as a material fallback.
 * @param prim prim whose displayColor primvar should be inspected
 * @returns first authored display color, if present
 */
export function GetDisplayColorFallback(prim: ISdfPrimSpec): Vec3 | undefined {
    const colorValue = GetAttributeValue(GetAttribute(prim, "primvars:displayColor"));
    const color = AsVec3(colorValue);
    if (color) {
        return color;
    }
    const arrayValue = colorValue?.value;
    if (Array.isArray(arrayValue) && Array.isArray(arrayValue[0]) && arrayValue[0].length >= 3) {
        return [Number(arrayValue[0][0]), Number(arrayValue[0][1]), Number(arrayValue[0][2])];
    }
    return undefined;
}

function BuildMaterialFromPrim(materialPrim: ISdfPrimSpec, context: IStageMappingContext, fallbackBaseColor?: Vec3): IResolvedMaterial {
    const surfaceShader = ResolvePreviewSurfaceShader(materialPrim, context);
    if (!surfaceShader) {
        context.diagnostics.push({ severity: "info", path: materialPrim.path, message: "UsdPreviewSurface network was not found; using a default material." });
        return BuildDefaultMaterial(materialPrim.name, fallbackBaseColor ?? [1, 1, 1]);
    }

    const material = BuildDefaultMaterial(materialPrim.name, fallbackBaseColor ?? [1, 1, 1]);
    for (const mapping of PreviewInputMappings) {
        ApplyPreviewInput(material, surfaceShader, mapping, context);
    }

    const opacityThreshold = AsNumber(GetAttributeValue(GetAttribute(surfaceShader, "inputs:opacityThreshold")));
    if (opacityThreshold !== undefined) {
        material.opacityThreshold = opacityThreshold;
    }
    material.useSpecularWorkflow = AsBoolean(GetAttributeValue(GetAttribute(surfaceShader, "inputs:useSpecularWorkflow"))) ?? material.useSpecularWorkflow;

    return material;
}

function ResolvePreviewSurfaceShader(materialPrim: ISdfPrimSpec, context: IStageMappingContext): ISdfPrimSpec | undefined {
    const surfaceOutput = GetAttribute(materialPrim, "outputs:surface");
    for (const connection of GetConnectionTargets(surfaceOutput)) {
        const target = SplitPropertyPath(connection);
        const shaderPrim = target ? context.primByPath.get(target.primPath) : undefined;
        if (shaderPrim && GetShaderId(shaderPrim) === "UsdPreviewSurface") {
            return shaderPrim;
        }
    }
    return materialPrim.children.find((child) => child.typeName === "Shader" && GetShaderId(child) === "UsdPreviewSurface");
}

function ApplyPreviewInput(material: IResolvedMaterial, shaderPrim: ISdfPrimSpec, mapping: IPreviewInputMapping, context: IStageMappingContext): void {
    const input = GetAttribute(shaderPrim, `inputs:${mapping.inputName}`);
    const inputValue = GetAttributeValue(input);
    if (mapping.scalarSlot) {
        ApplyScalarMaterialInput(material, mapping.scalarSlot, inputValue);
    }

    if (!mapping.textureSlot && GetConnectionTargets(input).length > 0) {
        context.diagnostics.push({
            severity: "info",
            path: input?.path ?? shaderPrim.path,
            message: `Connected texture for '${mapping.inputName}' is not representable in IResolvedMaterial and was skipped.`,
        });
        return;
    }
    const texture = mapping.textureSlot ? ResolveConnectedTexture(input, context, mapping.textureSlot, mapping.defaultChannel) : undefined;
    if (texture && mapping.textureSlot) {
        material.textures[mapping.textureSlot] = texture;
    }
}

function ApplyScalarMaterialInput(material: IResolvedMaterial, slot: keyof Omit<IResolvedMaterial, "name" | "textures">, value: ReturnType<typeof GetAttributeValue>): void {
    const vector = AsVec3(value);
    if (vector && (slot === "baseColor" || slot === "emissiveColor" || slot === "specularColor")) {
        material[slot] = vector;
        return;
    }
    const scalar = AsNumber(value);
    if (scalar !== undefined && slot !== "baseColor" && slot !== "emissiveColor" && slot !== "specularColor") {
        material[slot] = scalar as never;
    }
}

function ResolveConnectedTexture(
    input: ISdfAttributeSpec | undefined,
    context: IStageMappingContext,
    slot: ResolvedTextureSlot,
    defaultChannel?: IResolvedTexture["channel"]
): IResolvedTexture | undefined {
    const connection = GetConnectionTargets(input)[0];
    const target = connection ? SplitPropertyPath(connection) : undefined;
    const texturePrim = target ? context.primByPath.get(target.primPath) : undefined;
    if (!texturePrim || GetShaderId(texturePrim) !== "UsdUVTexture") {
        return undefined;
    }

    const file = AsAssetPath(GetAttributeValue(GetAttribute(texturePrim, "inputs:file")));
    if (!file) {
        context.diagnostics.push({ severity: "warning", path: texturePrim.path, message: "UsdUVTexture is missing inputs:file and was ignored." });
        return undefined;
    }

    return {
        uri: ResolveAssetUri(file, context.layer.identifier),
        uvSet: ResolveTextureUvSet(texturePrim, context),
        wrapU: MapWrapMode(AsToken(GetAttributeValue(GetAttribute(texturePrim, "inputs:wrapS")))),
        wrapV: MapWrapMode(AsToken(GetAttributeValue(GetAttribute(texturePrim, "inputs:wrapT")))),
        colorSpace: ResolveTextureColorSpace(texturePrim, slot),
        scale: AsVec4(GetAttributeValue(GetAttribute(texturePrim, "inputs:scale"))) ?? AsVec4FromVec3(GetAttributeValue(GetAttribute(texturePrim, "inputs:scale"))),
        bias: AsVec4(GetAttributeValue(GetAttribute(texturePrim, "inputs:bias"))) ?? AsVec4FromVec3(GetAttributeValue(GetAttribute(texturePrim, "inputs:bias"))),
        channel: ResolveTextureChannel(target?.propertyName, defaultChannel),
    };
}

function ResolveTextureUvSet(texturePrim: ISdfPrimSpec, context: IStageMappingContext): number {
    const stTarget = SplitPropertyPath(GetConnectionTargets(GetAttribute(texturePrim, "inputs:st"))[0] ?? "");
    const readerPrim = stTarget ? FindPrimvarReader(stTarget.primPath, context) : undefined;
    const varname = readerPrim ? AsToken(GetAttributeValue(GetAttribute(readerPrim, "inputs:varname"))) : undefined;
    return UvSetNameToIndex(varname ?? "st");
}

function FindPrimvarReader(primPath: string, context: IStageMappingContext): ISdfPrimSpec | undefined {
    const prim = context.primByPath.get(primPath);
    if (!prim) {
        return undefined;
    }
    if (GetShaderId(prim).startsWith("UsdPrimvarReader")) {
        return prim;
    }
    const nestedInput = SplitPropertyPath(GetConnectionTargets(GetAttribute(prim, "inputs:in"))[0] ?? "");
    return nestedInput ? FindPrimvarReader(nestedInput.primPath, context) : undefined;
}

function UvSetNameToIndex(varname: string): number {
    if (varname === "st" || varname === "st0") {
        return 0;
    }
    const match = /(?:st|uv|UVMap)(\d+)/.exec(varname);
    return match ? Math.max(0, Number(match[1])) : 0;
}

function ResolveTextureColorSpace(texturePrim: ISdfPrimSpec, slot: ResolvedTextureSlot): IResolvedTexture["colorSpace"] {
    const authored = AsToken(GetAttributeValue(GetAttribute(texturePrim, "inputs:sourceColorSpace")));
    if (authored === "sRGB" || authored === "linear" || authored === "raw") {
        return authored;
    }
    return slot === "baseColor" || slot === "emissive" ? "sRGB" : "raw";
}

function ResolveTextureChannel(outputName: string | undefined, defaultChannel: IResolvedTexture["channel"] | undefined): IResolvedTexture["channel"] | undefined {
    const suffix = outputName?.split(":").pop();
    return suffix === "r" || suffix === "g" || suffix === "b" || suffix === "a" ? suffix : defaultChannel;
}

function ResolveAssetUri(path: string, layerIdentifier: string): string {
    const cleanPath = StripAssetDelimiters(path);
    if (cleanPath.startsWith("data:")) {
        return cleanPath;
    }
    // Resolve textures through the same normalizer as external layers so a sibling .png and a sibling
    // .usd authored with the same relative path resolve identically (including the dropped-file scheme).
    return ResolveAssetIdentifier(cleanPath, layerIdentifier);
}

function StripAssetDelimiters(path: string): string {
    return path.length >= 2 && path.startsWith("@") && path.endsWith("@") ? path.slice(1, -1) : path;
}

function MapWrapMode(mode: string | undefined): IResolvedTexture["wrapU"] {
    if (mode === "clamp" || mode === "mirror" || mode === "black") {
        return mode;
    }
    return "repeat";
}

function GetShaderId(shaderPrim: ISdfPrimSpec): string {
    return AsToken(GetAttributeValue(GetAttribute(shaderPrim, "info:id"))) ?? "";
}

function BuildDefaultMaterial(name: string, baseColor: Vec3): IResolvedMaterial {
    return {
        name,
        baseColor,
        opacity: 1,
        metallic: 0,
        roughness: 0.5,
        emissiveColor: [0, 0, 0],
        ior: 1.5,
        occlusion: 1,
        clearcoat: 0,
        clearcoatRoughness: 0,
        useSpecularWorkflow: false,
        specularColor: [1, 1, 1],
        textures: {},
    };
}

function AsVec4FromVec3(value: ReturnType<typeof GetAttributeValue>): Vec4 | undefined {
    const vec3 = AsVec3(value);
    return vec3 ? [vec3[0], vec3[1], vec3[2], 1] : undefined;
}
