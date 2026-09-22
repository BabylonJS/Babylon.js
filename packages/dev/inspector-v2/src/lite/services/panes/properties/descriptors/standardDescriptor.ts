import {
    getStandardAmbientTexture,
    getStandardBumpTexture,
    getStandardEmissiveTexture,
    getStandardLightmapTexture,
    getStandardOpacityTexture,
    getStandardReflectionCubeTexture,
    getStandardReflectionTexture,
    getStandardSpecularTexture,
    getTextureTransform,
    hasMaterialUvTransform,
    enableMaterialStencil,
    enableStandardUvOffset,
    setStandardAmbientTexture,
    setStandardBumpTexture,
    setStandardEmissiveTexture,
    setStandardLightmapTexture,
    setStandardOpacityTexture,
    setStandardReflectionCubeTexture,
    setStandardReflectionTexture,
    setStandardSpecularTexture,
    type CubeTexture,
    type Material,
    type StandardMaterialProps,
    type StencilState,
    type Texture2D,
} from "@babylonjs/lite";
import {
    type IDescriptorNumberConstraint,
    type DescriptorValue,
    type MaterialDescriptorAccess,
    type IMaterialDescriptorProperty,
    type MaterialDescriptorPropertyId,
    type MaterialDescriptorPropertyValue,
    type IMaterialTextureBinding,
    type MaterialTextureBindingId,
    type MaterialTextureMutation,
    type ITextureDescriptorTransform,
} from "./descriptorTypes.js";
import { type IMaterialDescriptorFamilyDescriptor, type IMaterialDescriptorMutationPlan } from "./materialDescriptor.js";

const UvOptions = [
    { value: 0, label: "UV1" },
    { value: 1, label: "UV2" },
] as const;

const ReflectionCoordOptions = [
    { value: 1, label: "Spherical" },
    { value: 2, label: "Planar" },
] as const;

const StencilCompareOptions = [
    { value: "never", label: "Never" },
    { value: "less", label: "Less" },
    { value: "equal", label: "Equal" },
    { value: "less-equal", label: "Less or Equal" },
    { value: "greater", label: "Greater" },
    { value: "not-equal", label: "Not Equal" },
    { value: "greater-equal", label: "Greater or Equal" },
    { value: "always", label: "Always" },
] as const;

const StencilOperationOptions = [
    { value: "keep", label: "Keep" },
    { value: "zero", label: "Zero" },
    { value: "replace", label: "Replace" },
    { value: "invert", label: "Invert" },
    { value: "increment-clamp", label: "Increment Clamp" },
    { value: "decrement-clamp", label: "Decrement Clamp" },
    { value: "increment-wrap", label: "Increment Wrap" },
    { value: "decrement-wrap", label: "Decrement Wrap" },
] as const;

const FiniteNumber = { finite: true } as const;
const NonNegativeNumber = { finite: true, min: 0 } as const;
const StencilMask = { finite: true, integer: true, min: 0, max: 0xffffffff } as const;

const StandardBindings: readonly {
    readonly id: MaterialTextureBindingId;
    readonly label: string;
    readonly get: (material: StandardMaterialProps) => Texture2D | CubeTexture | null | undefined;
    readonly kind: "2d" | "cube";
    readonly supportsTransform: boolean;
}[] = [
    { id: "standard.diffuse", label: "Diffuse Texture", get: (material) => material.diffuseTexture, kind: "2d", supportsTransform: true },
    { id: "standard.emissive", label: "Emissive Texture", get: getStandardEmissiveTexture, kind: "2d", supportsTransform: true },
    { id: "standard.bump", label: "Bump Texture", get: getStandardBumpTexture, kind: "2d", supportsTransform: true },
    { id: "standard.specular", label: "Specular Texture", get: getStandardSpecularTexture, kind: "2d", supportsTransform: true },
    { id: "standard.ambient", label: "Ambient Texture", get: getStandardAmbientTexture, kind: "2d", supportsTransform: true },
    { id: "standard.lightmap", label: "Lightmap Texture", get: getStandardLightmapTexture, kind: "2d", supportsTransform: true },
    { id: "standard.opacity", label: "Opacity Texture", get: getStandardOpacityTexture, kind: "2d", supportsTransform: true },
    { id: "standard.reflection2d", label: "Reflection Texture", get: getStandardReflectionTexture, kind: "2d", supportsTransform: false },
    { id: "standard.reflectionCube", label: "Reflection Cube Texture", get: getStandardReflectionCubeTexture, kind: "cube", supportsTransform: false },
];

/** @internal Side-effect-free Standard family descriptor. Dispatcher wiring is owned by the family convergence task. */
export const StandardMaterialDescriptor: IMaterialDescriptorFamilyDescriptor = {
    inspect: InspectStandardMaterial,
    preparePropertyMutation: PrepareStandardPropertyMutation,
    prepareTextureMutation: PrepareStandardTextureMutation,
};

function InspectStandardMaterial(source: Material) {
    const material = source as StandardMaterialProps;
    return {
        properties: CreateStandardProperties(material),
        textureBindings: StandardBindings.map((binding) => CreateStandardBinding(material, binding)),
    };
}

function CreateStandardProperties(material: StandardMaterialProps): IMaterialDescriptorProperty[] {
    return [
        Property("standard.backFaceCulling", "general", "Back Face Culling", "boolean", material.backFaceCulling, Edit("R", "rebuild-material")),
        Property("standard.disableLighting", "general", "Disable Lighting", "boolean", material.disableLighting, Edit("R", "rebuild-material")),
        Property("standard.alpha", "transparency", "Alpha", "number", material.alpha, Edit("U/R", "rebuild-material", FiniteNumber)),
        Property("standard.alphaCutOff", "transparency", "Alpha Cutoff", "number", material.alphaCutOff, Edit("U", "none", FiniteNumber)),
        Property("standard.diffuseColor", "lighting-colors", "Diffuse Color", "vec3", material.diffuseColor, Edit("U", "none")),
        Property("standard.specularColor", "lighting-colors", "Specular Color", "vec3", material.specularColor, Edit("U", "none")),
        Property("standard.emissiveColor", "lighting-colors", "Emissive Color", "vec3", material.emissiveColor, Edit("U", "none")),
        Property("standard.ambientColor", "lighting-colors", "Ambient Color", "vec3", material.ambientColor, Edit("U", "none")),
        Property("standard.specularPower", "lighting-colors", "Specular Power", "number", material.specularPower, Edit("U", "none", NonNegativeNumber)),
        EnumProperty("standard.diffuseCoordIndex", "Diffuse Coordinates", material.diffuseCoordIndex, UvOptions, "R"),
        EnumProperty("standard.specularCoordIndex", "Specular Coordinates", material.specularCoordIndex, UvOptions, "R"),
        EnumProperty("standard.ambientCoordIndex", "Ambient Coordinates", material.ambientCoordIndex, UvOptions, "R"),
        EnumProperty("standard.lightmapCoordIndex", "Lightmap Coordinates", material.lightmapCoordIndex, UvOptions, "R"),
        Property("standard.bumpLevel", "texture-settings", "Bump Level", "number", material.bumpLevel, Edit("U", "none", FiniteNumber)),
        Property("standard.ambientTexLevel", "texture-settings", "Ambient Texture Level", "number", material.ambientTexLevel, Edit("U", "none", FiniteNumber)),
        Property("standard.lightmapLevel", "texture-settings", "Lightmap Level", "number", material.lightmapLevel, Edit("U", "none", FiniteNumber)),
        Property("standard.opacityLevel", "texture-settings", "Opacity Level", "number", material.opacityLevel, Edit("U", "none", FiniteNumber)),
        Property("standard.reflectionLevel", "texture-settings", "Reflection Level", "number", material.reflectionLevel, Edit("U", "none", FiniteNumber)),
        {
            ...Property("standard.reflectionCoordMode", "texture-settings", "Reflection Coordinates", "enum", material.reflectionCoordMode, Edit("U", "none")),
            options: ReflectionCoordOptions,
        },
        Property("standard.useLightmapAsShadowmap", "texture-settings", "Use Lightmap as Shadowmap", "boolean", material.useLightmapAsShadowmap, Edit("R", "rebuild-material")),
        Property("standard.opacityFromRGB", "texture-settings", "Opacity from RGB", "boolean", material.opacityFromRGB, Edit("R", "rebuild-material")),
        Property("standard.uvScale", "transform", "UV Scale", "vec2", material.uvScale, Edit("R", "rebuild-material")),
        Property("standard.uvOffset", "transform", "UV Offset", "vec2", material.uvOffset ?? [0, 0], Edit("R", "rebuild-material")),
        StencilProperty("standard.stencil.compare", "Stencil Compare", material.stencil, material.stencil?.compare ?? "always", StencilCompareOptions),
        StencilProperty("standard.stencil.passOp", "Stencil Pass Operation", material.stencil, material.stencil?.passOp ?? "keep", StencilOperationOptions),
        StencilProperty("standard.stencil.failOp", "Stencil Fail Operation", material.stencil, material.stencil?.failOp ?? "keep", StencilOperationOptions),
        StencilProperty("standard.stencil.depthFailOp", "Stencil Depth Fail Operation", material.stencil, material.stencil?.depthFailOp ?? "keep", StencilOperationOptions),
        StencilNumberProperty("standard.stencil.readMask", "Stencil Read Mask", material.stencil, material.stencil?.readMask ?? 0xff),
        StencilNumberProperty("standard.stencil.writeMask", "Stencil Write Mask", material.stencil, material.stencil?.writeMask ?? 0xff),
    ];
}

function Property(
    id: MaterialDescriptorPropertyId,
    section: IMaterialDescriptorProperty["section"],
    label: string,
    valueType: IMaterialDescriptorProperty["valueType"],
    value: MaterialDescriptorPropertyValue,
    access: MaterialDescriptorAccess
): IMaterialDescriptorProperty {
    return { id, section, label, valueType, value: { state: "present", value }, access };
}

function EnumProperty(
    id: MaterialDescriptorPropertyId,
    label: string,
    value: number,
    options: readonly { readonly value: number; readonly label: string }[],
    mutation: "R"
): IMaterialDescriptorProperty {
    return {
        ...Property(id, "texture-settings", label, "enum", value, Edit(mutation, "rebuild-material")),
        options,
    };
}

function StencilProperty(
    id: MaterialDescriptorPropertyId,
    label: string,
    stencil: StencilState | undefined,
    value: string,
    options: readonly { readonly value: string; readonly label: string }[]
): IMaterialDescriptorProperty {
    return {
        id,
        section: "stencil",
        label,
        valueType: "enum",
        value: stencil ? { state: "present", value } : { state: "absent" },
        access: Edit("R", "rebuild-material"),
        options,
    };
}

function StencilNumberProperty(id: MaterialDescriptorPropertyId, label: string, stencil: StencilState | undefined, value: number): IMaterialDescriptorProperty {
    return {
        id,
        section: "stencil",
        label,
        valueType: "number",
        value: stencil ? { state: "present", value } : { state: "absent" },
        access: Edit("R", "rebuild-material", StencilMask),
    };
}

function Edit(mutation: "U" | "R" | "U/R", postMutation: "none" | "rebuild-material", number?: IDescriptorNumberConstraint): MaterialDescriptorAccess {
    return { access: "read-write", mutation, postMutation, number };
}

function CreateStandardBinding(material: StandardMaterialProps, descriptor: (typeof StandardBindings)[number]): IMaterialTextureBinding {
    const texture = descriptor.get(material);
    const present = texture != null;
    return {
        id: descriptor.id,
        label: descriptor.label,
        value: present ? { state: "present", value: { entity: texture, kind: descriptor.kind } } : { state: "absent" },
        acceptedKinds: [descriptor.kind],
        sampleCategory: "float",
        viewCategory: descriptor.kind,
        directions: present ? ["replace", "clear", "navigate"] : ["assign"],
        mutation: Edit("R", "rebuild-material"),
        transform: CreateBindingTransform(material, descriptor, texture),
    };
}

function CreateBindingTransform(
    material: StandardMaterialProps,
    descriptor: (typeof StandardBindings)[number],
    texture: Texture2D | CubeTexture | null | undefined
): DescriptorValue<ITextureDescriptorTransform> {
    if (!texture) {
        return { state: "absent" };
    }
    if (descriptor.kind !== "2d" || !descriptor.supportsTransform) {
        return { state: "unsupported", reason: `${descriptor.label} does not use Standard UV transforms.` };
    }
    if (!hasMaterialUvTransform(material)) {
        return { state: "unsupported", reason: "Per-texture UV transforms are not enabled for this material." };
    }
    const transform = getTextureTransform(texture as Texture2D);
    if (!transform) {
        return { state: "unsupported", reason: `${descriptor.label} does not support UV transforms.` };
    }
    return {
        state: "present",
        value: transform,
    };
}

function PrepareStandardPropertyMutation(source: Material, property: IMaterialDescriptorProperty, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const material = source as StandardMaterialProps;
    switch (property.id) {
        case "standard.backFaceCulling":
            return RebuildPlan(() => {
                material.backFaceCulling = value as boolean;
            });
        case "standard.disableLighting":
            return RebuildPlan(() => {
                material.disableLighting = value as boolean;
            });
        case "standard.alpha": {
            const alpha = value as number;
            const mutation = material.alpha < 1 === alpha < 1 ? "U" : "R";
            return Plan(mutation, () => {
                material.alpha = alpha;
            });
        }
        case "standard.alphaCutOff":
            return UniformPlan(() => {
                material.alphaCutOff = value as number;
            });
        case "standard.diffuseColor":
            return UniformPlan(() => {
                material.diffuseColor = value as [number, number, number];
            });
        case "standard.specularColor":
            return UniformPlan(() => {
                material.specularColor = value as [number, number, number];
            });
        case "standard.emissiveColor":
            return UniformPlan(() => {
                material.emissiveColor = value as [number, number, number];
            });
        case "standard.ambientColor":
            return UniformPlan(() => {
                material.ambientColor = value as [number, number, number];
            });
        case "standard.specularPower":
            return UniformPlan(() => {
                material.specularPower = value as number;
            });
        case "standard.diffuseCoordIndex":
            return RebuildPlan(() => {
                material.diffuseCoordIndex = value as 0 | 1;
            });
        case "standard.specularCoordIndex":
            return RebuildPlan(() => {
                material.specularCoordIndex = value as 0 | 1;
            });
        case "standard.ambientCoordIndex":
            return RebuildPlan(() => {
                material.ambientCoordIndex = value as 0 | 1;
            });
        case "standard.lightmapCoordIndex":
            return RebuildPlan(() => {
                material.lightmapCoordIndex = value as 0 | 1;
            });
        case "standard.bumpLevel":
            return UniformPlan(() => {
                material.bumpLevel = value as number;
            });
        case "standard.ambientTexLevel":
            return UniformPlan(() => {
                material.ambientTexLevel = value as number;
            });
        case "standard.lightmapLevel":
            return UniformPlan(() => {
                material.lightmapLevel = value as number;
            });
        case "standard.opacityLevel":
            return UniformPlan(() => {
                material.opacityLevel = value as number;
            });
        case "standard.reflectionLevel":
            return UniformPlan(() => {
                material.reflectionLevel = value as number;
            });
        case "standard.reflectionCoordMode":
            return UniformPlan(() => {
                material.reflectionCoordMode = value as 1 | 2;
            });
        case "standard.useLightmapAsShadowmap":
            return RebuildPlan(() => {
                material.useLightmapAsShadowmap = value as boolean;
            });
        case "standard.opacityFromRGB":
            return RebuildPlan(() => {
                material.opacityFromRGB = value as boolean;
            });
        case "standard.uvScale":
            return RebuildPlan(() => {
                material.uvScale = value as [number, number];
            });
        case "standard.uvOffset":
            return RebuildPlan(async () => {
                enableStandardUvOffset();
                material.uvOffset = value as [number, number];
            });
        case "standard.stencil.compare":
            return StencilPlan(material, { compare: value as GPUCompareFunction });
        case "standard.stencil.passOp":
            return StencilPlan(material, { passOp: value as GPUStencilOperation });
        case "standard.stencil.failOp":
            return StencilPlan(material, { failOp: value as GPUStencilOperation });
        case "standard.stencil.depthFailOp":
            return StencilPlan(material, { depthFailOp: value as GPUStencilOperation });
        case "standard.stencil.readMask":
            return StencilPlan(material, { readMask: value as number });
        case "standard.stencil.writeMask":
            return StencilPlan(material, { writeMask: value as number });
        default:
            throw new Error(`Property "${property.id}" is stale or unsupported for a Standard material.`);
    }
}

function PrepareStandardTextureMutation(source: Material, binding: IMaterialTextureBinding, mutation: MaterialTextureMutation): IMaterialDescriptorMutationPlan {
    const material = source as StandardMaterialProps;
    const texture = mutation.direction === "clear" ? null : mutation.texture;
    const expectedKind = binding.id === "standard.reflectionCube" ? "cube" : "2d";
    if (texture && !MatchesTextureKind(texture, expectedKind)) {
        throw new TypeError(`Texture binding "${binding.id}" requires a ${expectedKind === "cube" ? "CubeTexture" : "Texture2D"} value.`);
    }
    return RebuildPlan(async () => await SetStandardTexture(material, binding.id, texture as Texture2D | CubeTexture | null));
}

async function SetStandardTexture(material: StandardMaterialProps, binding: MaterialTextureBindingId, texture: Texture2D | CubeTexture | null): Promise<void> {
    switch (binding) {
        case "standard.diffuse":
            material.diffuseTexture = texture as Texture2D | null;
            return;
        case "standard.emissive": {
            setStandardEmissiveTexture(material, texture as Texture2D | null);
            return;
        }
        case "standard.bump": {
            setStandardBumpTexture(material, texture as Texture2D | null);
            return;
        }
        case "standard.specular": {
            setStandardSpecularTexture(material, texture as Texture2D | null);
            return;
        }
        case "standard.ambient": {
            setStandardAmbientTexture(material, texture as Texture2D | null);
            return;
        }
        case "standard.lightmap": {
            setStandardLightmapTexture(material, texture as Texture2D | null);
            return;
        }
        case "standard.opacity": {
            setStandardOpacityTexture(material, texture as Texture2D | null);
            return;
        }
        case "standard.reflection2d": {
            setStandardReflectionTexture(material, texture as Texture2D | null);
            return;
        }
        case "standard.reflectionCube": {
            setStandardReflectionCubeTexture(material, texture as CubeTexture | null);
            return;
        }
        default:
            throw new Error(`Texture binding "${binding}" is stale or unsupported for a Standard material.`);
    }
}

function StencilPlan(material: StandardMaterialProps, update: StencilState): IMaterialDescriptorMutationPlan {
    const current = material.stencil;
    return RebuildPlan(async () => {
        enableMaterialStencil();
        material.stencil = { ...current, ...update };
    });
}

function UniformPlan(apply: () => void): IMaterialDescriptorMutationPlan {
    return Plan("U", apply);
}

function RebuildPlan(apply: () => void | Promise<void>): IMaterialDescriptorMutationPlan {
    return Plan("R", apply);
}

function Plan(mutation: "U" | "R", apply: () => void | Promise<void>): IMaterialDescriptorMutationPlan {
    return { mutation, apply };
}

function MatchesTextureKind(texture: object, kind: "2d" | "cube"): boolean {
    try {
        const candidate = texture as Record<string, unknown>;
        const is2d =
            "texture" in candidate &&
            "view" in candidate &&
            "sampler" in candidate &&
            typeof candidate.width === "number" &&
            Number.isFinite(candidate.width) &&
            typeof candidate.height === "number" &&
            Number.isFinite(candidate.height);
        const isCube = "_texture" in candidate && "_view" in candidate && "_sampler" in candidate;
        return kind === "2d" ? is2d && !isCube : isCube && !is2d;
    } catch {
        return false;
    }
}
