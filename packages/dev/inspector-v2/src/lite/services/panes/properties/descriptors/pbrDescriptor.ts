import {
    enableMaterialStencil,
    enablePbrLightmap,
    getPbrAlphaCutoff,
    getPbrAnisotropy,
    getPbrClearCoat,
    getPbrEmissiveColor,
    getPbrIridescence,
    getPbrMetallicReflectance,
    getPbrSheen,
    getPbrSubsurface,
    getPbrTransmission,
    getPbrUnlit,
    getShadowOnly,
    getTextureTransform,
    hasMaterialUvTransform,
    hasTextureTransform,
    isPbrGammaAlbedo,
    isPbrSkybox,
    setPbrAlphaCutoff,
    setPbrAnisotropy,
    setPbrClearCoat,
    setPbrDispersion,
    setPbrEmissive,
    setPbrIridescence,
    setPbrLightmap,
    setPbrMetallicReflectance,
    setPbrSheen,
    setPbrSubsurface,
    setPbrTransmission,
    type AnisotropyProps,
    type ClearCoatProps,
    type IridescenceProps,
    type Material,
    type PbrMaterialProps,
    type RefractionProps,
    type SheenProps,
    type StencilState,
    type SubSurfaceProps,
    type Texture2D,
    type ThicknessProps,
    type TintProps,
    type TranslucencyProps,
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
const UnitInterval = { finite: true, min: 0, max: 1 } as const;
const StencilMask = { finite: true, integer: true, min: 0, max: 0xffffffff } as const;

const PbrBindings: readonly {
    readonly id: MaterialTextureBindingId;
    readonly label: string;
    readonly field: "baseColorTexture" | "normalTexture" | "ormTexture" | "occlusionTexture" | "emissiveTexture" | "specGlossTexture";
}[] = [
    { id: "pbr.baseColor", label: "Base Color Texture", field: "baseColorTexture" },
    { id: "pbr.normal", label: "Normal Texture", field: "normalTexture" },
    { id: "pbr.orm", label: "ORM Texture", field: "ormTexture" },
    { id: "pbr.occlusion", label: "Occlusion Texture", field: "occlusionTexture" },
    { id: "pbr.emissive", label: "Emissive Texture", field: "emissiveTexture" },
    { id: "pbr.specGloss", label: "Specular-Glossiness Texture", field: "specGlossTexture" },
];

interface IMetallicReflectanceOptions {
    color?: [number, number, number];
    texture?: Texture2D;
    reflectanceTexture?: Texture2D;
    f0Factor?: number;
    specularWeight?: number;
    useOnlyMetallicFromTexture?: boolean;
}

/** @internal Side-effect-free PBR descriptor. Optional setters are imported only by requested mutations. */
export const PbrMaterialDescriptor: IMaterialDescriptorFamilyDescriptor = {
    inspect: InspectPbrMaterial,
    preparePropertyMutation: PreparePbrPropertyMutation,
    prepareTextureMutation: PreparePbrTextureMutation,
};

function InspectPbrMaterial(source: Material) {
    const material = source as PbrMaterialProps;
    return {
        properties: CreatePbrProperties(material),
        textureBindings: CreatePbrBindings(material),
    };
}

function CreatePbrProperties(material: PbrMaterialProps): IMaterialDescriptorProperty[] {
    const alphaCutoff = getPbrAlphaCutoff(material);
    const emissiveColor = getPbrEmissiveColor(material);
    const metallicReflectance = getPbrMetallicReflectance(material);
    const clearCoat = getPbrClearCoat(material);
    const sheen = getPbrSheen(material);
    const iridescence = getPbrIridescence(material);
    const anisotropy = getPbrAnisotropy(material);
    const properties: IMaterialDescriptorProperty[] = [
        Property("pbr.doubleSided", "general", "Double Sided", "boolean", material.doubleSided ?? false, Edit("R", "rebuild-material")),
        Property("pbr.alphaBlend", "general", "Alpha Blend", "boolean", material.alphaBlend ?? false, Edit("R", "rebuild-material")),
        Property("pbr.enableSpecularAA", "general", "Specular Anti-Aliasing", "boolean", material.enableSpecularAA ?? false, Edit("R", "rebuild-material")),
        Property("pbr.alpha", "transparency", "Alpha", "number", material.alpha ?? 1, Edit("U/R", "rebuild-material", UnitInterval)),
        OptionalProperty("pbr.alphaCutOff", "transparency", "Alpha Cutoff", "number", alphaCutoff, Edit("U/R", "rebuild-material", FiniteNumber)),
        OptionalProperty("pbr.baseColorFactor", "lighting-colors", "Base Color Factor", "vec4", material.baseColorFactor, Edit("U/R", "rebuild-material")),
        OptionalProperty("pbr.emissiveColor", "lighting-colors", "Emissive Color", "vec3", emissiveColor, Edit("U/R", "rebuild-material")),
        Property("pbr.environmentIntensity", "lighting-colors", "Environment Intensity", "number", material.environmentIntensity ?? 1, Edit("U", "none", FiniteNumber)),
        Property("pbr.directIntensity", "lighting-colors", "Direct Intensity", "number", material.directIntensity ?? 1, Edit("U", "none", FiniteNumber)),
        Property("pbr.reflectance", "lighting-colors", "Reflectance", "number", material.reflectance ?? 0.04, Edit("U", "none", FiniteNumber)),
        Property("pbr.metallicFactor", "lighting-colors", "Metallic Factor", "number", material.metallicFactor ?? 1, Edit("U", "none", FiniteNumber)),
        Property("pbr.roughnessFactor", "lighting-colors", "Roughness Factor", "number", material.roughnessFactor ?? 1, Edit("U", "none", FiniteNumber)),
        Property("pbr.normalTextureScale", "lighting-colors", "Normal Texture Scale", "number", material.normalTextureScale ?? 1, Edit("U", "none", FiniteNumber)),
        Property("pbr.usePhysicalLightFalloff", "lighting-colors", "Use Physical Light Falloff", "boolean", material.usePhysicalLightFalloff ?? true, Edit("U", "none")),
        Property("pbr.occlusionStrength", "occlusion", "Occlusion Strength", "number", material.occlusionStrength ?? 1, Edit("U/R", "rebuild-material", UnitInterval)),
        {
            ...Property("pbr.occlusionTexCoord", "occlusion", "Occlusion Coordinates", "enum", material.occlusionTexCoord ?? 0, {
                access: "read-only",
                reason: "Changing the occlusion UV set requires a public setter that maintains the UV2 claim.",
            }),
            options: [
                { value: 0, label: "UV1" },
                { value: 1, label: "UV2" },
            ],
        },
        StencilProperty("pbr.stencil.compare", "Stencil Compare", material.stencil, material.stencil?.compare ?? "always", StencilCompareOptions),
        StencilProperty("pbr.stencil.passOp", "Stencil Pass Operation", material.stencil, material.stencil?.passOp ?? "keep", StencilOperationOptions),
        StencilProperty("pbr.stencil.failOp", "Stencil Fail Operation", material.stencil, material.stencil?.failOp ?? "keep", StencilOperationOptions),
        StencilProperty("pbr.stencil.depthFailOp", "Stencil Depth Fail Operation", material.stencil, material.stencil?.depthFailOp ?? "keep", StencilOperationOptions),
        StencilNumberProperty("pbr.stencil.readMask", "Stencil Read Mask", material.stencil, material.stencil?.readMask ?? 0xff),
        StencilNumberProperty("pbr.stencil.writeMask", "Stencil Write Mask", material.stencil, material.stencil?.writeMask ?? 0xff),
    ];
    AppendLightmapProperties(properties, material);
    AppendMetallicReflectanceProperties(properties, metallicReflectance);
    AppendClearCoatProperties(properties, clearCoat);
    AppendSheenProperties(properties, sheen);
    AppendIridescenceProperties(properties, iridescence);
    AppendAnisotropyProperties(properties, anisotropy);
    AppendSubsurfaceProperties(properties, material);
    AppendSpecialModeProperties(properties, material);
    return properties;
}

function AppendLightmapProperties(properties: IMaterialDescriptorProperty[], material: PbrMaterialProps): void {
    if (!material.lightmapTexture) {
        return;
    }
    properties.push(
        Property("pbr.lightmapLevel", "lightmap", "Level", "number", material.lightmapLevel ?? 1, Edit("U/R", "rebuild-material", FiniteNumber)),
        {
            ...Property("pbr.lightmapCoordIndex", "lightmap", "Coordinates", "enum", material.lightmapCoordIndex ?? 1, Edit("U/R", "rebuild-material")),
            options: [
                { value: 0, label: "UV1" },
                { value: 1, label: "UV2" },
            ],
        },
        Property("pbr.useLightmapAsShadowmap", "lightmap", "Use as Shadowmap", "boolean", material.useLightmapAsShadowmap ?? false, Edit("U/R", "rebuild-material")),
        Property("pbr.gammaLightmap", "lightmap", "Gamma Decode", "boolean", material.gammaLightmap ?? false, Edit("U/R", "rebuild-material"))
    );
}

function AppendMetallicReflectanceProperties(properties: IMaterialDescriptorProperty[], configuration: ReturnType<typeof getPbrMetallicReflectance>): void {
    if (!configuration) {
        return;
    }
    properties.push(
        Property("pbr.metallicReflectanceColor", "metallic-reflectance", "Metallic Reflectance Color", "vec3", configuration.color ?? [1, 1, 1], Edit("U/R", "rebuild-material")),
        Property("pbr.metallicF0Factor", "metallic-reflectance", "Metallic F0 Factor", "number", configuration.f0Factor ?? 1, Edit("U/R", "rebuild-material", FiniteNumber)),
        Property(
            "pbr.specularWeight",
            "metallic-reflectance",
            "Specular Weight",
            "number",
            configuration.specularWeight ?? configuration.f0Factor ?? 1,
            Edit("U/R", "rebuild-material", FiniteNumber)
        ),
        Property(
            "pbr.useOnlyMetallicFromTexture",
            "metallic-reflectance",
            "Use Only Metallic From Texture",
            "boolean",
            configuration.useOnlyMetallicFromTexture ?? false,
            Edit("U/R", "rebuild-material")
        )
    );
}

function AppendClearCoatProperties(properties: IMaterialDescriptorProperty[], clearCoat: Readonly<ClearCoatProps> | undefined): void {
    if (!clearCoat) {
        return;
    }
    properties.push(
        Property("pbr.clearCoat.enabled", "clear-coat", "Enabled", "boolean", clearCoat.isEnabled ?? false, Edit("U/R", "rebuild-material")),
        Property("pbr.clearCoat.intensity", "clear-coat", "Intensity", "number", clearCoat.intensity ?? 1, Edit("U/R", "rebuild-material", UnitInterval)),
        Property("pbr.clearCoat.roughness", "clear-coat", "Roughness", "number", clearCoat.roughness ?? 0, Edit("U/R", "rebuild-material", UnitInterval)),
        Property(
            "pbr.clearCoat.indexOfRefraction",
            "clear-coat",
            "Index of Refraction",
            "number",
            clearCoat.indexOfRefraction ?? 1.5,
            Edit("U/R", "rebuild-material", FiniteNumber)
        ),
        Property("pbr.clearCoat.useF0Remap", "clear-coat", "F0 Remap", "boolean", clearCoat.useF0Remap ?? true, Edit("U/R", "rebuild-material")),
        Property("pbr.clearCoat.bumpTextureScale", "clear-coat", "Bump Texture Scale", "number", clearCoat.bumpTextureScale ?? 1, Edit("U/R", "rebuild-material", FiniteNumber))
    );
}

function AppendSheenProperties(properties: IMaterialDescriptorProperty[], sheen: Readonly<SheenProps> | undefined): void {
    if (!sheen) {
        return;
    }
    properties.push(
        Property("pbr.sheen.enabled", "sheen", "Enabled", "boolean", sheen.isEnabled ?? false, Edit("U/R", "rebuild-material")),
        Property("pbr.sheen.color", "sheen", "Color", "vec3", sheen.color ?? [1, 1, 1], Edit("U/R", "rebuild-material")),
        Property("pbr.sheen.roughness", "sheen", "Roughness", "number", sheen.roughness ?? 0, Edit("U/R", "rebuild-material", UnitInterval)),
        Property("pbr.sheen.intensity", "sheen", "Intensity", "number", sheen.intensity ?? 1, Edit("U/R", "rebuild-material", UnitInterval)),
        Property("pbr.sheen.albedoScaling", "sheen", "Albedo Scaling", "boolean", sheen.albedoScaling ?? false, Edit("U/R", "rebuild-material"))
    );
}

function AppendIridescenceProperties(properties: IMaterialDescriptorProperty[], iridescence: Readonly<IridescenceProps> | undefined): void {
    if (!iridescence) {
        return;
    }
    properties.push(
        Property("pbr.iridescence.enabled", "iridescence", "Enabled", "boolean", iridescence.isEnabled ?? false, Edit("U/R", "rebuild-material")),
        Property("pbr.iridescence.intensity", "iridescence", "Intensity", "number", iridescence.intensity ?? 1, Edit("U/R", "rebuild-material", UnitInterval)),
        Property(
            "pbr.iridescence.indexOfRefraction",
            "iridescence",
            "Index of Refraction",
            "number",
            iridescence.indexOfRefraction ?? 1.3,
            Edit("U/R", "rebuild-material", FiniteNumber)
        ),
        Property(
            "pbr.iridescence.minimumThickness",
            "iridescence",
            "Minimum Thickness",
            "number",
            iridescence.minimumThickness ?? 100,
            Edit("U/R", "rebuild-material", FiniteNumber)
        ),
        Property(
            "pbr.iridescence.maximumThickness",
            "iridescence",
            "Maximum Thickness",
            "number",
            iridescence.maximumThickness ?? 400,
            Edit("U/R", "rebuild-material", FiniteNumber)
        )
    );
}

function AppendAnisotropyProperties(properties: IMaterialDescriptorProperty[], anisotropy: Readonly<AnisotropyProps> | undefined): void {
    if (!anisotropy) {
        return;
    }
    properties.push(
        Property("pbr.anisotropy.enabled", "anisotropy", "Enabled", "boolean", anisotropy.isEnabled ?? false, Edit("U/R", "rebuild-material")),
        Property("pbr.anisotropy.intensity", "anisotropy", "Intensity", "number", anisotropy.intensity ?? 1, Edit("U/R", "rebuild-material", UnitInterval)),
        Property("pbr.anisotropy.direction", "anisotropy", "Direction", "vec2", anisotropy.direction ?? [1, 0], Edit("U/R", "rebuild-material"))
    );
}

function AppendSubsurfaceProperties(properties: IMaterialDescriptorProperty[], material: PbrMaterialProps): void {
    const subsurface = getPbrSubsurface(material);
    const translucency = subsurface?.translucency;
    if (translucency) {
        properties.push(
            Property("pbr.translucency.intensity", "subsurface-translucency", "Intensity", "number", translucency.intensity ?? 1, Edit("U/R", "rebuild-material", UnitInterval)),
            Property("pbr.translucency.color", "subsurface-translucency", "Color", "vec3", translucency.color ?? [1, 1, 1], Edit("U/R", "rebuild-material")),
            Property(
                "pbr.translucency.diffusionDistance",
                "subsurface-translucency",
                "Diffusion Distance",
                "vec3",
                translucency.diffusionDistance ?? [1, 1, 1],
                Edit("U/R", "rebuild-material")
            )
        );
    }
    const thickness = subsurface?.thickness;
    if (thickness) {
        properties.push(
            Property("pbr.thickness.min", "subsurface-thickness", "Minimum", "number", thickness.min ?? 0, Edit("U/R", "rebuild-material", FiniteNumber)),
            Property("pbr.thickness.max", "subsurface-thickness", "Maximum", "number", thickness.max ?? 1, Edit("U/R", "rebuild-material", FiniteNumber)),
            Property("pbr.thickness.useGlTFChannel", "subsurface-thickness", "Use glTF Channel", "boolean", thickness.useGlTFChannel ?? false, Edit("U/R", "rebuild-material"))
        );
    }
    const tint = subsurface?.tint;
    if (tint) {
        properties.push(
            Property("pbr.tint.color", "subsurface-tint", "Color", "vec3", tint.color ?? [1, 1, 1], Edit("U/R", "rebuild-material")),
            Property("pbr.tint.atDistance", "subsurface-tint", "Distance", "number", tint.atDistance ?? 1, Edit("U/R", "rebuild-material", FiniteNumber))
        );
    }
    const refraction = getPbrTransmission(material);
    if (refraction) {
        properties.push(
            Property("pbr.transmission.intensity", "transmission", "Intensity", "number", refraction.intensity ?? 0, Edit("U/R", "rebuild-material-and-frame-graph", UnitInterval)),
            Property(
                "pbr.transmission.indexOfRefraction",
                "transmission",
                "Index of Refraction",
                "number",
                refraction.indexOfRefraction ?? 1.5,
                Edit("U/R", "rebuild-material-and-frame-graph", FiniteNumber)
            ),
            Property(
                "pbr.transmission.useThicknessAsDepth",
                "transmission",
                "Use Thickness as Depth",
                "boolean",
                refraction.useThicknessAsDepth ?? false,
                Edit("U/R", "rebuild-material-and-frame-graph")
            )
        );
        if (refraction.dispersion !== undefined) {
            properties.push(Property("pbr.transmission.dispersion", "transmission", "Dispersion", "number", refraction.dispersion, Edit("U/R", "rebuild-material", FiniteNumber)));
        }
    }
}

function AppendSpecialModeProperties(properties: IMaterialDescriptorProperty[], material: PbrMaterialProps): void {
    const readOnly = (mode: string): MaterialDescriptorAccess => ({
        access: "read-only",
        reason: `${mode} is a one-way public mode and has no reversible setter.`,
    });
    const unlit = getPbrUnlit(material);
    const shadowOnly = getShadowOnly(material);
    if (unlit) {
        properties.push(Property("pbr.mode.unlit", "special-modes", "Unlit", "boolean", true, readOnly("Unlit")));
    }
    if (unlit) {
        properties.push(Property("pbr.mode.unlitColor", "special-modes", "Unlit Color", "vec3", unlit, readOnly("Unlit tint")));
    }
    if (isPbrGammaAlbedo(material)) {
        properties.push(Property("pbr.mode.gammaAlbedo", "special-modes", "Gamma Albedo", "boolean", true, readOnly("Gamma albedo")));
    }
    if (isPbrSkybox(material)) {
        properties.push(Property("pbr.mode.skybox", "special-modes", "Skybox", "boolean", true, readOnly("Skybox")));
    }
    if (shadowOnly) {
        properties.push(Property("pbr.mode.shadowOnly", "special-modes", "Shadow Only", "boolean", true, readOnly("Shadow-only")));
    }
    if (shadowOnly) {
        properties.push(Property("pbr.mode.shadowOnlyColor", "special-modes", "Shadow Color", "vec3", shadowOnly.color, readOnly("Shadow-only color")));
    }
    if (shadowOnly) {
        properties.push(Property("pbr.mode.shadowOnlyOpacity", "special-modes", "Shadow Opacity", "number", shadowOnly.opacity, readOnly("Shadow-only opacity")));
    }
    if (shadowOnly) {
        properties.push(Property("pbr.mode.shadowOnlyFalloff", "special-modes", "Shadow Falloff", "number", shadowOnly.falloff, readOnly("Shadow-only falloff")));
    }
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

function OptionalProperty(
    id: MaterialDescriptorPropertyId,
    section: IMaterialDescriptorProperty["section"],
    label: string,
    valueType: IMaterialDescriptorProperty["valueType"],
    value: MaterialDescriptorPropertyValue | undefined,
    access: MaterialDescriptorAccess
): IMaterialDescriptorProperty {
    return { id, section, label, valueType, value: value === undefined ? { state: "absent" } : { state: "present", value }, access };
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

function Edit(
    mutation: "U" | "R" | "U/R",
    postMutation: "none" | "rebuild-material" | "rebuild-material-and-frame-graph",
    number?: IDescriptorNumberConstraint
): MaterialDescriptorAccess {
    return { access: "read-write", mutation, postMutation, number };
}

function CreatePbrBindings(material: PbrMaterialProps): IMaterialTextureBinding[] {
    const bindings = PbrBindings.map((binding) => CreatePbrBinding(material, binding));
    if (material.lightmapTexture) {
        bindings.push(CreateOptionalPbrBinding(material, "pbr.lightmap", "Lightmap Texture", material.lightmapTexture, false));
    }
    const metallicReflectance = getPbrMetallicReflectance(material);
    if (metallicReflectance) {
        bindings.push(
            CreateOptionalPbrBinding(material, "pbr.metallicReflectance", "Metallic Reflectance Texture", metallicReflectance.texture, false),
            CreateOptionalPbrBinding(material, "pbr.reflectance", "Reflectance Texture", metallicReflectance.reflectanceTexture, false)
        );
    }
    const clearCoat = getPbrClearCoat(material);
    if (clearCoat) {
        bindings.push(
            CreateOptionalPbrBinding(material, "pbr.clearCoat", "Clear Coat Texture", clearCoat.texture, true),
            CreateOptionalPbrBinding(material, "pbr.clearCoatRoughness", "Clear Coat Roughness Texture", clearCoat.roughnessTexture, true),
            CreateOptionalPbrBinding(material, "pbr.clearCoatBump", "Clear Coat Bump Texture", clearCoat.bumpTexture, true)
        );
    }
    const sheen = getPbrSheen(material);
    if (sheen) {
        bindings.push(
            CreateOptionalPbrBinding(material, "pbr.sheen", "Sheen Color Texture", sheen.texture, true),
            CreateOptionalPbrBinding(material, "pbr.sheenRoughness", "Sheen Roughness Texture", sheen.roughnessTexture, true)
        );
    }
    const iridescence = getPbrIridescence(material);
    if (iridescence) {
        bindings.push(
            CreateOptionalPbrBinding(material, "pbr.iridescence", "Iridescence Texture", iridescence.texture, true),
            CreateOptionalPbrBinding(material, "pbr.iridescenceThickness", "Iridescence Thickness Texture", iridescence.thicknessTexture, true)
        );
    }
    const anisotropy = getPbrAnisotropy(material);
    if (anisotropy) {
        bindings.push(CreateOptionalPbrBinding(material, "pbr.anisotropy", "Anisotropy Texture", anisotropy.texture, true));
    }
    const subsurface = getPbrSubsurface(material);
    const translucency = subsurface?.translucency;
    if (translucency) {
        bindings.push(
            CreateOptionalPbrBinding(material, "pbr.translucencyColor", "Translucency Color Texture", translucency.colorTexture, true),
            CreateOptionalPbrBinding(material, "pbr.translucencyIntensity", "Translucency Intensity Texture", translucency.intensityTexture, true)
        );
    }
    if (subsurface?.thickness) {
        bindings.push(CreateOptionalPbrBinding(material, "pbr.thickness", "Thickness Texture", subsurface.thickness.texture, true));
    }
    const transmission = getPbrTransmission(material);
    if (transmission) {
        bindings.push(CreateOptionalPbrBinding(material, "pbr.transmission", "Transmission Texture", transmission.texture, true));
    }
    return bindings;
}

function CreatePbrBinding(material: PbrMaterialProps, descriptor: (typeof PbrBindings)[number]): IMaterialTextureBinding {
    const texture = material[descriptor.field];
    const present = texture != null;
    return {
        id: descriptor.id,
        label: descriptor.label,
        value: present ? { state: "present", value: { entity: texture, kind: "2d" } } : { state: "absent" },
        acceptedKinds: ["2d"],
        sampleCategory: "float",
        viewCategory: "2d",
        directions: present ? ["replace", "clear", "navigate"] : ["assign"],
        mutation: Edit("R", "rebuild-material"),
        transform: CreateBindingTransform(material, texture),
    };
}

function CreateOptionalPbrBinding(
    material: PbrMaterialProps,
    id: MaterialTextureBindingId,
    label: string,
    texture: Texture2D | undefined,
    canClear: boolean
): IMaterialTextureBinding {
    const present = texture != null;
    return {
        id,
        label,
        value: present ? { state: "present", value: { entity: texture, kind: "2d" } } : { state: "absent" },
        acceptedKinds: ["2d"],
        sampleCategory: "float",
        viewCategory: "2d",
        directions: present ? (canClear ? ["replace", "clear", "navigate"] : ["replace", "navigate"]) : ["assign"],
        mutation: Edit("R", "rebuild-material"),
        transform: CreateBindingTransform(material, texture),
    };
}

function CreateBindingTransform(material: PbrMaterialProps, texture: Texture2D | null | undefined): DescriptorValue<ITextureDescriptorTransform> {
    if (!texture) {
        return { state: "absent" };
    }
    if (!hasMaterialUvTransform(material) && !hasTextureTransform(texture)) {
        return { state: "unsupported", reason: "Per-texture UV transforms are not enabled for this material." };
    }
    const transform = getTextureTransform(texture);
    if (!transform) {
        return { state: "unsupported", reason: "This texture does not support UV transforms." };
    }
    return {
        state: "present",
        value: transform,
    };
}

function PreparePbrPropertyMutation(source: Material, property: IMaterialDescriptorProperty, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const material = source as PbrMaterialProps;
    switch (property.id) {
        case "pbr.doubleSided":
            return RebuildPlan(() => {
                material.doubleSided = value as boolean;
            });
        case "pbr.alphaBlend":
            return RebuildPlan(() => {
                material.alphaBlend = value as boolean;
            });
        case "pbr.enableSpecularAA":
            return RebuildPlan(() => {
                material.enableSpecularAA = value as boolean;
            });
        case "pbr.alpha":
            return Plan(IsAlphaBlended(material.alpha ?? 1, getPbrAlphaCutoff(material)) === IsAlphaBlended(value as number, getPbrAlphaCutoff(material)) ? "U" : "R", () => {
                material.alpha = value as number;
            });
        case "pbr.alphaCutOff":
            return Plan((getPbrAlphaCutoff(material) ?? 0) > 0 === (value as number) > 0 ? "U" : "R", () => {
                setPbrAlphaCutoff(material, value as number);
            });
        case "pbr.baseColorFactor": {
            const factor = value as [number, number, number, number];
            return Plan(material.baseColorFactor === undefined ? "R" : "U", () => {
                material.baseColorFactor = factor;
            });
        }
        case "pbr.emissiveColor": {
            const color = value as [number, number, number];
            return Plan(getPbrEmissiveColor(material) === undefined ? "R" : "U", () => {
                setPbrEmissive(material, color);
            });
        }
        case "pbr.environmentIntensity":
            return UniformPlan(() => {
                material.environmentIntensity = value as number;
            });
        case "pbr.directIntensity":
            return UniformPlan(() => {
                material.directIntensity = value as number;
            });
        case "pbr.reflectance":
            return UniformPlan(() => {
                material.reflectance = value as number;
            });
        case "pbr.metallicFactor":
            return UniformPlan(() => {
                material.metallicFactor = value as number;
            });
        case "pbr.roughnessFactor":
            return UniformPlan(() => {
                material.roughnessFactor = value as number;
            });
        case "pbr.normalTextureScale":
            return UniformPlan(() => {
                material.normalTextureScale = value as number;
            });
        case "pbr.usePhysicalLightFalloff":
            return UniformPlan(() => {
                material.usePhysicalLightFalloff = value as boolean;
            });
        case "pbr.occlusionStrength":
            return UniformPlan(() => {
                material.occlusionStrength = value as number;
            });
        case "pbr.lightmapLevel":
        case "pbr.lightmapCoordIndex":
        case "pbr.useLightmapAsShadowmap":
        case "pbr.gammaLightmap":
            return PrepareLightmapPropertyMutation(material, property.id, value);
        case "pbr.metallicReflectanceColor":
        case "pbr.metallicF0Factor":
        case "pbr.specularWeight":
        case "pbr.useOnlyMetallicFromTexture":
            return PrepareMetallicReflectancePropertyMutation(material, property.id, value);
        case "pbr.clearCoat.enabled":
        case "pbr.clearCoat.intensity":
        case "pbr.clearCoat.roughness":
        case "pbr.clearCoat.indexOfRefraction":
        case "pbr.clearCoat.useF0Remap":
        case "pbr.clearCoat.bumpTextureScale":
            return PrepareClearCoatPropertyMutation(material, property.id, value);
        case "pbr.sheen.enabled":
        case "pbr.sheen.color":
        case "pbr.sheen.roughness":
        case "pbr.sheen.intensity":
        case "pbr.sheen.albedoScaling":
            return PrepareSheenPropertyMutation(material, property.id, value);
        case "pbr.iridescence.enabled":
        case "pbr.iridescence.intensity":
        case "pbr.iridescence.indexOfRefraction":
        case "pbr.iridescence.minimumThickness":
        case "pbr.iridescence.maximumThickness":
            return PrepareIridescencePropertyMutation(material, property.id, value);
        case "pbr.anisotropy.enabled":
        case "pbr.anisotropy.intensity":
        case "pbr.anisotropy.direction":
            return PrepareAnisotropyPropertyMutation(material, property.id, value);
        case "pbr.translucency.intensity":
        case "pbr.translucency.color":
        case "pbr.translucency.diffusionDistance":
        case "pbr.thickness.min":
        case "pbr.thickness.max":
        case "pbr.thickness.useGlTFChannel":
        case "pbr.tint.color":
        case "pbr.tint.atDistance":
            return PrepareSubsurfacePropertyMutation(material, property.id, value);
        case "pbr.transmission.intensity":
        case "pbr.transmission.indexOfRefraction":
        case "pbr.transmission.useThicknessAsDepth":
            return PrepareTransmissionPropertyMutation(material, property.id, value);
        case "pbr.transmission.dispersion":
            return PrepareDispersionPropertyMutation(material, value as number);
        case "pbr.stencil.compare":
            return StencilPlan(material, { compare: value as GPUCompareFunction });
        case "pbr.stencil.passOp":
            return StencilPlan(material, { passOp: value as GPUStencilOperation });
        case "pbr.stencil.failOp":
            return StencilPlan(material, { failOp: value as GPUStencilOperation });
        case "pbr.stencil.depthFailOp":
            return StencilPlan(material, { depthFailOp: value as GPUStencilOperation });
        case "pbr.stencil.readMask":
            return StencilPlan(material, { readMask: value as number });
        case "pbr.stencil.writeMask":
            return StencilPlan(material, { writeMask: value as number });
        default:
            throw new Error(`Property "${property.id}" is stale, read-only, or unsupported for a PBR material.`);
    }
}

function PreparePbrTextureMutation(source: Material, binding: IMaterialTextureBinding, mutation: MaterialTextureMutation): IMaterialDescriptorMutationPlan {
    const material = source as PbrMaterialProps;
    const texture = mutation.direction === "clear" ? null : mutation.texture;
    if (texture && !MatchesTexture2d(texture)) {
        throw new TypeError(`Texture binding "${binding.id}" requires a Texture2D value.`);
    }
    const nextTexture = texture as Texture2D | null;
    switch (binding.id) {
        case "pbr.lightmap":
            return PrepareLightmapTextureMutation(material, RequireTexture(nextTexture, binding.id));
        case "pbr.metallicReflectance":
        case "pbr.reflectance":
            return PrepareMetallicReflectanceTextureMutation(material, binding.id, RequireTexture(nextTexture, binding.id));
        case "pbr.clearCoat":
        case "pbr.clearCoatRoughness":
        case "pbr.clearCoatBump":
            return PrepareClearCoatTextureMutation(material, binding.id, nextTexture ?? undefined);
        case "pbr.sheen":
        case "pbr.sheenRoughness":
            return PrepareSheenTextureMutation(material, binding.id, nextTexture ?? undefined);
        case "pbr.iridescence":
        case "pbr.iridescenceThickness":
            return PrepareIridescenceTextureMutation(material, binding.id, nextTexture ?? undefined);
        case "pbr.anisotropy":
            return PrepareAnisotropyTextureMutation(material, nextTexture ?? undefined);
        case "pbr.translucencyColor":
        case "pbr.translucencyIntensity":
        case "pbr.thickness":
            return PrepareSubsurfaceTextureMutation(material, binding.id, nextTexture ?? undefined);
        case "pbr.transmission":
            return PrepareTransmissionTextureMutation(material, nextTexture ?? undefined);
        default:
            return RebuildPlan(() => {
                SetPbrTexture(material, binding.id, nextTexture);
            });
    }
}

function SetPbrTexture(material: PbrMaterialProps, binding: MaterialTextureBindingId, texture: Texture2D | null): void {
    switch (binding) {
        case "pbr.baseColor":
            material.baseColorTexture = texture ?? undefined;
            return;
        case "pbr.normal":
            material.normalTexture = texture ?? undefined;
            return;
        case "pbr.orm":
            material.ormTexture = texture ?? undefined;
            return;
        case "pbr.occlusion":
            material.occlusionTexture = texture ?? undefined;
            return;
        case "pbr.emissive":
            material.emissiveTexture = texture ?? undefined;
            return;
        case "pbr.specGloss":
            material.specGlossTexture = texture ?? undefined;
            return;
        default:
            throw new Error(`Texture binding "${binding}" is stale or unsupported for a PBR material.`);
    }
}

function PrepareLightmapPropertyMutation(material: PbrMaterialProps, id: MaterialDescriptorPropertyId, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const texture = RequireConfigured(material.lightmapTexture, "PBR lightmap");
    const options = ReconstructLightmap(material);
    switch (id) {
        case "pbr.lightmapLevel":
            options.level = value as number;
            break;
        case "pbr.lightmapCoordIndex":
            options.coordIndex = value as 0 | 1;
            break;
        case "pbr.useLightmapAsShadowmap":
            options.useAsShadowmap = value as boolean;
            break;
        case "pbr.gammaLightmap":
            options.gamma = value as boolean;
            break;
    }
    return RebuildPlan(async () => {
        await enablePbrLightmap();
        setPbrLightmap(material, texture, options);
    });
}

function PrepareLightmapTextureMutation(material: PbrMaterialProps, texture: Texture2D): IMaterialDescriptorMutationPlan {
    const options = ReconstructLightmap(material);
    return RebuildPlan(async () => {
        await enablePbrLightmap();
        setPbrLightmap(material, texture, options);
    });
}

function ReconstructLightmap(material: PbrMaterialProps): {
    level: number;
    coordIndex: 0 | 1;
    useAsShadowmap: boolean;
    gamma: boolean;
} {
    return {
        level: material.lightmapLevel ?? 1,
        coordIndex: material.lightmapCoordIndex ?? 1,
        useAsShadowmap: material.useLightmapAsShadowmap ?? false,
        gamma: material.gammaLightmap ?? false,
    };
}

function PrepareMetallicReflectancePropertyMutation(
    material: PbrMaterialProps,
    id: MaterialDescriptorPropertyId,
    value: MaterialDescriptorPropertyValue
): IMaterialDescriptorMutationPlan {
    const options = ReconstructMetallicReflectance(material);
    switch (id) {
        case "pbr.metallicReflectanceColor":
            options.color = CopyTuple3(value);
            break;
        case "pbr.metallicF0Factor":
            options.f0Factor = value as number;
            break;
        case "pbr.specularWeight":
            options.specularWeight = value as number;
            break;
        case "pbr.useOnlyMetallicFromTexture":
            options.useOnlyMetallicFromTexture = value as boolean;
            break;
    }
    return ApplyMetallicReflectance(material, options);
}

function PrepareMetallicReflectanceTextureMutation(
    material: PbrMaterialProps,
    id: "pbr.metallicReflectance" | "pbr.reflectance",
    texture: Texture2D
): IMaterialDescriptorMutationPlan {
    const options = ReconstructMetallicReflectance(material);
    if (id === "pbr.metallicReflectance") {
        options.texture = texture;
    } else {
        options.reflectanceTexture = texture;
    }
    return ApplyMetallicReflectance(material, options);
}

function ReconstructMetallicReflectance(material: PbrMaterialProps): IMetallicReflectanceOptions {
    return {
        color: CopyOptionalTuple3(getPbrMetallicReflectance(material)?.color) ?? [1, 1, 1],
        texture: getPbrMetallicReflectance(material)?.texture,
        reflectanceTexture: getPbrMetallicReflectance(material)?.reflectanceTexture,
        f0Factor: getPbrMetallicReflectance(material)?.f0Factor ?? 1,
        specularWeight: getPbrMetallicReflectance(material)?.specularWeight ?? getPbrMetallicReflectance(material)?.f0Factor ?? 1,
        useOnlyMetallicFromTexture: getPbrMetallicReflectance(material)?.useOnlyMetallicFromTexture ?? false,
    };
}

function ApplyMetallicReflectance(material: PbrMaterialProps, options: IMetallicReflectanceOptions): IMaterialDescriptorMutationPlan {
    return RebuildPlan(() => {
        setPbrMetallicReflectance(material, options);
    });
}

function PrepareClearCoatPropertyMutation(material: PbrMaterialProps, id: MaterialDescriptorPropertyId, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const clearCoat = ReconstructClearCoat(RequireConfigured(getPbrClearCoat(material), "PBR clear coat"));
    switch (id) {
        case "pbr.clearCoat.enabled":
            clearCoat.isEnabled = value as boolean;
            break;
        case "pbr.clearCoat.intensity":
            clearCoat.intensity = value as number;
            break;
        case "pbr.clearCoat.roughness":
            clearCoat.roughness = value as number;
            break;
        case "pbr.clearCoat.indexOfRefraction":
            clearCoat.indexOfRefraction = value as number;
            break;
        case "pbr.clearCoat.useF0Remap":
            clearCoat.useF0Remap = value as boolean;
            break;
        case "pbr.clearCoat.bumpTextureScale":
            clearCoat.bumpTextureScale = value as number;
            break;
    }
    return ApplyClearCoat(material, clearCoat);
}

function PrepareClearCoatTextureMutation(
    material: PbrMaterialProps,
    id: "pbr.clearCoat" | "pbr.clearCoatRoughness" | "pbr.clearCoatBump",
    texture: Texture2D | undefined
): IMaterialDescriptorMutationPlan {
    const clearCoat = ReconstructClearCoat(RequireConfigured(getPbrClearCoat(material), "PBR clear coat"));
    if (id === "pbr.clearCoat") {
        clearCoat.texture = texture;
    } else if (id === "pbr.clearCoatRoughness") {
        clearCoat.roughnessTexture = texture;
    } else {
        clearCoat.bumpTexture = texture;
    }
    return ApplyClearCoat(material, clearCoat);
}

function ReconstructClearCoat(clearCoat: ClearCoatProps): ClearCoatProps {
    return {
        isEnabled: clearCoat.isEnabled ?? false,
        intensity: clearCoat.intensity ?? 1,
        roughness: clearCoat.roughness ?? 0,
        indexOfRefraction: clearCoat.indexOfRefraction ?? 1.5,
        texture: clearCoat.texture,
        roughnessTexture: clearCoat.roughnessTexture,
        bumpTexture: clearCoat.bumpTexture,
        bumpTextureScale: clearCoat.bumpTextureScale ?? 1,
        useF0Remap: clearCoat.useF0Remap ?? true,
    };
}

function ApplyClearCoat(material: PbrMaterialProps, clearCoat: ClearCoatProps): IMaterialDescriptorMutationPlan {
    return RebuildPlan(() => {
        setPbrClearCoat(material, clearCoat);
    });
}

function PrepareSheenPropertyMutation(material: PbrMaterialProps, id: MaterialDescriptorPropertyId, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const sheen = ReconstructSheen(RequireConfigured(getPbrSheen(material), "PBR sheen"));
    switch (id) {
        case "pbr.sheen.enabled":
            sheen.isEnabled = value as boolean;
            break;
        case "pbr.sheen.color":
            sheen.color = CopyTuple3(value);
            break;
        case "pbr.sheen.roughness":
            sheen.roughness = value as number;
            break;
        case "pbr.sheen.intensity":
            sheen.intensity = value as number;
            break;
        case "pbr.sheen.albedoScaling":
            sheen.albedoScaling = value as boolean;
            break;
    }
    return ApplySheen(material, sheen);
}

function PrepareSheenTextureMutation(material: PbrMaterialProps, id: "pbr.sheen" | "pbr.sheenRoughness", texture: Texture2D | undefined): IMaterialDescriptorMutationPlan {
    const sheen = ReconstructSheen(RequireConfigured(getPbrSheen(material), "PBR sheen"));
    if (id === "pbr.sheen") {
        sheen.texture = texture;
    } else {
        sheen.roughnessTexture = texture;
    }
    return ApplySheen(material, sheen);
}

function ReconstructSheen(sheen: SheenProps): SheenProps {
    return {
        isEnabled: sheen.isEnabled ?? false,
        color: CopyOptionalTuple3(sheen.color) ?? [1, 1, 1],
        roughness: sheen.roughness ?? 0,
        intensity: sheen.intensity ?? 1,
        texture: sheen.texture,
        roughnessTexture: sheen.roughnessTexture,
        albedoScaling: sheen.albedoScaling ?? false,
    };
}

function ApplySheen(material: PbrMaterialProps, sheen: SheenProps): IMaterialDescriptorMutationPlan {
    return RebuildPlan(() => {
        setPbrSheen(material, sheen);
    });
}

function PrepareIridescencePropertyMutation(material: PbrMaterialProps, id: MaterialDescriptorPropertyId, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const iridescence = ReconstructIridescence(RequireConfigured(getPbrIridescence(material), "PBR iridescence"));
    switch (id) {
        case "pbr.iridescence.enabled":
            iridescence.isEnabled = value as boolean;
            break;
        case "pbr.iridescence.intensity":
            iridescence.intensity = value as number;
            break;
        case "pbr.iridescence.indexOfRefraction":
            iridescence.indexOfRefraction = value as number;
            break;
        case "pbr.iridescence.minimumThickness":
            iridescence.minimumThickness = value as number;
            break;
        case "pbr.iridescence.maximumThickness":
            iridescence.maximumThickness = value as number;
            break;
    }
    return ApplyIridescence(material, iridescence);
}

function PrepareIridescenceTextureMutation(
    material: PbrMaterialProps,
    id: "pbr.iridescence" | "pbr.iridescenceThickness",
    texture: Texture2D | undefined
): IMaterialDescriptorMutationPlan {
    const iridescence = ReconstructIridescence(RequireConfigured(getPbrIridescence(material), "PBR iridescence"));
    if (id === "pbr.iridescence") {
        iridescence.texture = texture;
    } else {
        iridescence.thicknessTexture = texture;
    }
    return ApplyIridescence(material, iridescence);
}

function ReconstructIridescence(iridescence: IridescenceProps): IridescenceProps {
    return {
        isEnabled: iridescence.isEnabled ?? false,
        intensity: iridescence.intensity ?? 1,
        indexOfRefraction: iridescence.indexOfRefraction ?? 1.3,
        minimumThickness: iridescence.minimumThickness ?? 100,
        maximumThickness: iridescence.maximumThickness ?? 400,
        texture: iridescence.texture,
        thicknessTexture: iridescence.thicknessTexture,
    };
}

function ApplyIridescence(material: PbrMaterialProps, iridescence: IridescenceProps): IMaterialDescriptorMutationPlan {
    return RebuildPlan(() => {
        setPbrIridescence(material, iridescence);
    });
}

function PrepareAnisotropyPropertyMutation(material: PbrMaterialProps, id: MaterialDescriptorPropertyId, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const anisotropy = ReconstructAnisotropy(RequireConfigured(getPbrAnisotropy(material), "PBR anisotropy"));
    if (id === "pbr.anisotropy.enabled") {
        anisotropy.isEnabled = value as boolean;
    } else if (id === "pbr.anisotropy.intensity") {
        anisotropy.intensity = value as number;
    } else {
        anisotropy.direction = CopyTuple2(value);
    }
    return ApplyAnisotropy(material, anisotropy);
}

function PrepareAnisotropyTextureMutation(material: PbrMaterialProps, texture: Texture2D | undefined): IMaterialDescriptorMutationPlan {
    const anisotropy = ReconstructAnisotropy(RequireConfigured(getPbrAnisotropy(material), "PBR anisotropy"));
    anisotropy.texture = texture;
    return ApplyAnisotropy(material, anisotropy);
}

function ReconstructAnisotropy(anisotropy: AnisotropyProps): AnisotropyProps {
    return {
        isEnabled: anisotropy.isEnabled ?? false,
        intensity: anisotropy.intensity ?? 1,
        direction: anisotropy.direction ? [...anisotropy.direction] : [1, 0],
        texture: anisotropy.texture,
    };
}

function ApplyAnisotropy(material: PbrMaterialProps, anisotropy: AnisotropyProps): IMaterialDescriptorMutationPlan {
    return RebuildPlan(() => {
        setPbrAnisotropy(material, anisotropy);
    });
}

function PrepareSubsurfacePropertyMutation(material: PbrMaterialProps, id: MaterialDescriptorPropertyId, value: MaterialDescriptorPropertyValue): IMaterialDescriptorMutationPlan {
    const subsurface = ReconstructSubsurface(RequireConfigured(getPbrSubsurface(material), "PBR subsurface"));
    switch (id) {
        case "pbr.translucency.intensity":
            RequireConfigured(subsurface.translucency, "PBR translucency").intensity = value as number;
            break;
        case "pbr.translucency.color":
            RequireConfigured(subsurface.translucency, "PBR translucency").color = CopyTuple3(value);
            break;
        case "pbr.translucency.diffusionDistance":
            RequireConfigured(subsurface.translucency, "PBR translucency").diffusionDistance = CopyTuple3(value);
            break;
        case "pbr.thickness.min":
            RequireConfigured(subsurface.thickness, "PBR thickness").min = value as number;
            break;
        case "pbr.thickness.max":
            RequireConfigured(subsurface.thickness, "PBR thickness").max = value as number;
            break;
        case "pbr.thickness.useGlTFChannel":
            RequireConfigured(subsurface.thickness, "PBR thickness").useGlTFChannel = value as boolean;
            break;
        case "pbr.tint.color":
            RequireConfigured(subsurface.tint, "PBR tint").color = CopyTuple3(value);
            break;
        case "pbr.tint.atDistance":
            RequireConfigured(subsurface.tint, "PBR tint").atDistance = value as number;
            break;
    }
    return ApplySubsurface(material, subsurface);
}

function PrepareSubsurfaceTextureMutation(
    material: PbrMaterialProps,
    id: "pbr.translucencyColor" | "pbr.translucencyIntensity" | "pbr.thickness",
    texture: Texture2D | undefined
): IMaterialDescriptorMutationPlan {
    const subsurface = ReconstructSubsurface(RequireConfigured(getPbrSubsurface(material), "PBR subsurface"));
    if (id === "pbr.translucencyColor") {
        RequireConfigured(subsurface.translucency, "PBR translucency").colorTexture = texture;
    } else if (id === "pbr.translucencyIntensity") {
        RequireConfigured(subsurface.translucency, "PBR translucency").intensityTexture = texture;
    } else {
        RequireConfigured(subsurface.thickness, "PBR thickness").texture = texture;
    }
    return ApplySubsurface(material, subsurface);
}

function ReconstructSubsurface(subsurface: SubSurfaceProps): SubSurfaceProps {
    return {
        translucency: subsurface.translucency ? ReconstructTranslucency(subsurface.translucency) : undefined,
        scattering: subsurface.scattering ? { ...subsurface.scattering } : undefined,
        thickness: subsurface.thickness ? ReconstructThickness(subsurface.thickness) : undefined,
        tint: subsurface.tint ? ReconstructTint(subsurface.tint) : undefined,
        refraction: subsurface.refraction ? ReconstructRefraction(subsurface.refraction) : undefined,
    };
}

function ReconstructTranslucency(translucency: TranslucencyProps): TranslucencyProps {
    return {
        intensity: translucency.intensity ?? 1,
        color: CopyOptionalTuple3(translucency.color) ?? [1, 1, 1],
        colorTexture: translucency.colorTexture,
        intensityTexture: translucency.intensityTexture,
        diffusionDistance: CopyOptionalTuple3(translucency.diffusionDistance) ?? [1, 1, 1],
    };
}

function ReconstructThickness(thickness: ThicknessProps): ThicknessProps {
    return {
        texture: thickness.texture,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        useGlTFChannel: thickness.useGlTFChannel ?? false,
        min: thickness.min ?? 0,
        max: thickness.max ?? 1,
    };
}

function ReconstructTint(tint: TintProps): TintProps {
    return {
        color: CopyOptionalTuple3(tint.color) ?? [1, 1, 1],
        atDistance: tint.atDistance,
    };
}

function ApplySubsurface(material: PbrMaterialProps, subsurface: SubSurfaceProps): IMaterialDescriptorMutationPlan {
    return RebuildPlan(() => {
        setPbrSubsurface(material, subsurface);
    });
}

function PrepareTransmissionPropertyMutation(
    material: PbrMaterialProps,
    id: MaterialDescriptorPropertyId,
    value: MaterialDescriptorPropertyValue
): IMaterialDescriptorMutationPlan {
    const refraction = ReconstructRefraction(RequireTransmission(material));
    if (id === "pbr.transmission.intensity") {
        refraction.intensity = value as number;
    } else if (id === "pbr.transmission.indexOfRefraction") {
        refraction.indexOfRefraction = value as number;
    } else {
        refraction.useThicknessAsDepth = value as boolean;
    }
    return ApplyTransmission(material, refraction);
}

function PrepareTransmissionTextureMutation(material: PbrMaterialProps, texture: Texture2D | undefined): IMaterialDescriptorMutationPlan {
    const refraction = ReconstructRefraction(RequireTransmission(material));
    refraction.texture = texture;
    return ApplyTransmission(material, refraction);
}

function ReconstructRefraction(refraction: RefractionProps): RefractionProps {
    return {
        intensity: refraction.intensity ?? 0,
        texture: refraction.texture,
        indexOfRefraction: refraction.indexOfRefraction ?? 1.5,
        useThicknessAsDepth: refraction.useThicknessAsDepth ?? false,
        dispersion: refraction.dispersion,
    };
}

function ApplyTransmission(material: PbrMaterialProps, refraction: RefractionProps): IMaterialDescriptorMutationPlan {
    return {
        mutation: "R",
        frameGraphParticipationChanged: IsTransmissionActive(getPbrTransmission(material)) !== IsTransmissionActive(refraction),
        apply: () => {
            setPbrTransmission(material, refraction);
        },
    };
}

function PrepareDispersionPropertyMutation(material: PbrMaterialProps, dispersion: number): IMaterialDescriptorMutationPlan {
    return RebuildPlan(() => {
        setPbrDispersion(material, dispersion);
    });
}

function RequireTransmission(material: PbrMaterialProps): RefractionProps {
    const transmission = getPbrTransmission(material);
    if (!transmission) {
        throw new Error("PBR transmission is no longer configured.");
    }
    return transmission as RefractionProps;
}

function IsAlphaBlended(alpha: number, alphaCutoff: number | undefined): boolean {
    return alpha < 1 && (alphaCutoff ?? 0) <= 0;
}

function IsTransmissionActive(refraction: Readonly<RefractionProps> | undefined): boolean {
    return refraction !== undefined && (refraction.intensity ?? 0) > 0;
}

function StencilPlan(material: PbrMaterialProps, update: StencilState): IMaterialDescriptorMutationPlan {
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

function RequireConfigured<T>(value: T | null | undefined, name: string): T {
    if (value == null) {
        throw new Error(`${name} is no longer configured.`);
    }
    return value;
}

function RequireTexture(texture: Texture2D | null, binding: MaterialTextureBindingId): Texture2D {
    if (!texture) {
        throw new Error(`Texture binding "${binding}" cannot be cleared.`);
    }
    return texture;
}

function CopyTuple2(value: MaterialDescriptorPropertyValue): [number, number] {
    const tuple = value as readonly [number, number];
    return [tuple[0], tuple[1]];
}

function CopyTuple3(value: MaterialDescriptorPropertyValue): [number, number, number] {
    const tuple = value as readonly [number, number, number];
    return [tuple[0], tuple[1], tuple[2]];
}

function CopyOptionalTuple3(value: readonly [number, number, number] | undefined): [number, number, number] | undefined {
    return value ? [value[0], value[1], value[2]] : undefined;
}

function MatchesTexture2d(texture: object): boolean {
    try {
        const candidate = texture as Record<string, unknown>;
        return (
            "texture" in candidate &&
            "view" in candidate &&
            "sampler" in candidate &&
            typeof candidate.width === "number" &&
            Number.isFinite(candidate.width) &&
            typeof candidate.height === "number" &&
            Number.isFinite(candidate.height) &&
            !("_texture" in candidate) &&
            !("_view" in candidate) &&
            !("_sampler" in candidate)
        );
    } catch {
        return false;
    }
}
