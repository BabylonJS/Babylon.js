import { type Material, type SceneContext } from "@babylonjs/lite";

export type DescriptorValue<T> = { readonly state: "unsupported"; readonly reason: string } | { readonly state: "absent" } | { readonly state: "present"; readonly value: T };

export type DescriptorDatum<T> = { readonly state: "unknown"; readonly reason?: string } | { readonly state: "known"; readonly value: T };

export type MaterialMutationClass = "U" | "R" | "A" | "U/R";
export type AppliedMaterialMutationClass = Exclude<MaterialMutationClass, "U/R">;
export type MaterialPostMutation = "none" | "rebuild-material" | "rebuild-material-and-frame-graph";

export interface IDescriptorNumberConstraint {
    readonly finite: true;
    readonly integer?: boolean;
    readonly min?: number;
    readonly max?: number;
}

export interface IMaterialDescriptorEdit {
    readonly access: "read-write";
    readonly mutation: MaterialMutationClass;
    readonly postMutation: MaterialPostMutation;
    readonly number?: IDescriptorNumberConstraint;
}

export interface IMaterialDescriptorReadOnly {
    readonly access: "read-only";
    readonly reason?: string;
}

export type MaterialDescriptorAccess = IMaterialDescriptorEdit | IMaterialDescriptorReadOnly;

export type MaterialDescriptorSection =
    | "general"
    | "transparency"
    | "lighting-colors"
    | "textures"
    | "texture-settings"
    | "transform"
    | "occlusion"
    | "lightmap"
    | "metallic-reflectance"
    | "clear-coat"
    | "sheen"
    | "iridescence"
    | "anisotropy"
    | "subsurface-translucency"
    | "subsurface-thickness"
    | "subsurface-tint"
    | "transmission"
    | "special-modes"
    | "inputs"
    | "configuration"
    | "stencil";

export type MaterialDescriptorScalar = string | number | boolean;
export type MaterialDescriptorTuple =
    | readonly [number, number]
    | readonly [number, number, number]
    | readonly [number, number, number, number]
    | readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
export type MaterialDescriptorPropertyValue = MaterialDescriptorScalar | MaterialDescriptorTuple;

export type MaterialDescriptorPropertyId =
    | "material.name"
    | "standard.backFaceCulling"
    | "standard.disableLighting"
    | "standard.alpha"
    | "standard.alphaCutOff"
    | "standard.diffuseColor"
    | "standard.specularColor"
    | "standard.emissiveColor"
    | "standard.ambientColor"
    | "standard.specularPower"
    | "standard.diffuseCoordIndex"
    | "standard.specularCoordIndex"
    | "standard.ambientCoordIndex"
    | "standard.lightmapCoordIndex"
    | "standard.bumpLevel"
    | "standard.ambientTexLevel"
    | "standard.lightmapLevel"
    | "standard.opacityLevel"
    | "standard.reflectionLevel"
    | "standard.reflectionCoordMode"
    | "standard.useLightmapAsShadowmap"
    | "standard.opacityFromRGB"
    | "standard.uvScale"
    | "standard.uvOffset"
    | "standard.stencil.compare"
    | "standard.stencil.passOp"
    | "standard.stencil.failOp"
    | "standard.stencil.depthFailOp"
    | "standard.stencil.readMask"
    | "standard.stencil.writeMask"
    | "pbr.doubleSided"
    | "pbr.alphaBlend"
    | "pbr.enableSpecularAA"
    | "pbr.alpha"
    | "pbr.alphaCutOff"
    | "pbr.baseColorFactor"
    | "pbr.emissiveColor"
    | "pbr.environmentIntensity"
    | "pbr.directIntensity"
    | "pbr.reflectance"
    | "pbr.metallicFactor"
    | "pbr.roughnessFactor"
    | "pbr.normalTextureScale"
    | "pbr.usePhysicalLightFalloff"
    | "pbr.occlusionStrength"
    | "pbr.occlusionTexCoord"
    | "pbr.lightmapLevel"
    | "pbr.lightmapCoordIndex"
    | "pbr.useLightmapAsShadowmap"
    | "pbr.gammaLightmap"
    | "pbr.metallicReflectanceColor"
    | "pbr.metallicF0Factor"
    | "pbr.specularWeight"
    | "pbr.useOnlyMetallicFromTexture"
    | "pbr.clearCoat.enabled"
    | "pbr.clearCoat.intensity"
    | "pbr.clearCoat.roughness"
    | "pbr.clearCoat.indexOfRefraction"
    | "pbr.clearCoat.useF0Remap"
    | "pbr.clearCoat.bumpTextureScale"
    | "pbr.sheen.enabled"
    | "pbr.sheen.color"
    | "pbr.sheen.roughness"
    | "pbr.sheen.intensity"
    | "pbr.sheen.albedoScaling"
    | "pbr.iridescence.enabled"
    | "pbr.iridescence.intensity"
    | "pbr.iridescence.indexOfRefraction"
    | "pbr.iridescence.minimumThickness"
    | "pbr.iridescence.maximumThickness"
    | "pbr.anisotropy.enabled"
    | "pbr.anisotropy.intensity"
    | "pbr.anisotropy.direction"
    | "pbr.translucency.intensity"
    | "pbr.translucency.color"
    | "pbr.translucency.diffusionDistance"
    | "pbr.thickness.min"
    | "pbr.thickness.max"
    | "pbr.thickness.useGlTFChannel"
    | "pbr.tint.color"
    | "pbr.tint.atDistance"
    | "pbr.transmission.intensity"
    | "pbr.transmission.indexOfRefraction"
    | "pbr.transmission.useThicknessAsDepth"
    | "pbr.transmission.dispersion"
    | "pbr.mode.unlit"
    | "pbr.mode.unlitColor"
    | "pbr.mode.gammaAlbedo"
    | "pbr.mode.skybox"
    | "pbr.mode.shadowOnly"
    | "pbr.mode.shadowOnlyColor"
    | "pbr.mode.shadowOnlyOpacity"
    | "pbr.mode.shadowOnlyFalloff"
    | "pbr.stencil.compare"
    | "pbr.stencil.passOp"
    | "pbr.stencil.failOp"
    | "pbr.stencil.depthFailOp"
    | "pbr.stencil.readMask"
    | "pbr.stencil.writeMask"
    | "shader.configuration"
    | `shader.uniform:${string}`
    | `node.input:${string}`;

export interface IMaterialDescriptorProperty {
    readonly id: MaterialDescriptorPropertyId;
    readonly section: MaterialDescriptorSection;
    readonly label: string;
    readonly valueType: "string" | "boolean" | "number" | "vec2" | "vec3" | "vec4" | "mat4" | "enum" | "summary";
    readonly value: DescriptorValue<MaterialDescriptorPropertyValue>;
    readonly access: MaterialDescriptorAccess;
    readonly options?: readonly { readonly value: string | number; readonly label: string }[];
}

export type TextureDescriptorKind = "2d" | "2d-array" | "3d" | "cube" | "unknown";
export type TextureBindingKind = Exclude<TextureDescriptorKind, "unknown">;
export type TextureSampleCategory = "float" | "unfilterable-float" | "depth" | "sint" | "uint" | "unknown";
export type TextureViewCategory = "2d" | "2d-array" | "3d" | "cube";
export type TextureBindingDirection = "assign" | "replace" | "clear" | "navigate";

export type MaterialTextureBindingId =
    | "standard.diffuse"
    | "standard.emissive"
    | "standard.bump"
    | "standard.specular"
    | "standard.ambient"
    | "standard.lightmap"
    | "standard.opacity"
    | "standard.reflection2d"
    | "standard.reflectionCube"
    | "pbr.baseColor"
    | "pbr.normal"
    | "pbr.orm"
    | "pbr.occlusion"
    | "pbr.emissive"
    | "pbr.specGloss"
    | "pbr.lightmap"
    | "pbr.metallicReflectance"
    | "pbr.reflectance"
    | "pbr.clearCoat"
    | "pbr.clearCoatRoughness"
    | "pbr.clearCoatBump"
    | "pbr.sheen"
    | "pbr.sheenRoughness"
    | "pbr.iridescence"
    | "pbr.iridescenceThickness"
    | "pbr.anisotropy"
    | "pbr.translucencyColor"
    | "pbr.translucencyIntensity"
    | "pbr.thickness"
    | "pbr.transmission"
    | `shader.sampler:${string}`
    | `node.texture:${string}`;

export interface IMaterialDescriptorTextureReference {
    /** The original Lite wrapper, intentionally typed as opaque object identity. */
    readonly entity: object;
    readonly kind: TextureBindingKind;
}

export interface IMaterialTextureBinding {
    readonly id: MaterialTextureBindingId;
    readonly label: string;
    readonly value: DescriptorValue<IMaterialDescriptorTextureReference>;
    readonly acceptedKinds: readonly TextureBindingKind[];
    readonly sampleCategory: TextureSampleCategory;
    readonly viewCategory: TextureViewCategory;
    readonly directions: readonly TextureBindingDirection[];
    readonly mutation: MaterialDescriptorAccess;
    /** Present only when this binding's selected 2D wrapper exposes standard Lite UV transforms. */
    readonly transform: DescriptorValue<ITextureDescriptorTransform>;
}

export interface IMaterialDescriptor {
    /** Original source object; a selected MaterialView is unwrapped before this is returned. */
    readonly source: Material;
    readonly family: string | undefined;
    readonly displayName: string;
    readonly isView: boolean;
    readonly properties: readonly IMaterialDescriptorProperty[];
    readonly textureBindings: readonly IMaterialTextureBinding[];
}

export type TextureDescriptorOrigin =
    "url-raster" | "ktx" | "basis" | "ktx2" | "solid" | "pixels" | "external-image" | "dynamic" | "html" | "render-target" | "sampled-depth" | "unknown";

export type TextureColorSpace = "linear" | "srgb" | "unknown";
export type TextureAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";
export type TextureFilterMode = "nearest" | "linear";

export interface ITextureDescriptorTransform {
    readonly uScale: number;
    readonly vScale: number;
    readonly uOffset: number;
    readonly vOffset: number;
    readonly uAng: number;
}

export interface ITextureSamplerDescriptor {
    readonly addressModeU: DescriptorDatum<TextureAddressMode>;
    readonly addressModeV: DescriptorDatum<TextureAddressMode>;
    readonly addressModeW: DescriptorDatum<TextureAddressMode>;
    readonly minFilter: DescriptorDatum<TextureFilterMode>;
    readonly magFilter: DescriptorDatum<TextureFilterMode>;
    readonly mipmapFilter: DescriptorDatum<TextureFilterMode>;
    readonly maxAnisotropy: DescriptorDatum<number>;
}

export interface ITextureDescriptor {
    readonly kind: TextureDescriptorKind;
    readonly displayName: DescriptorDatum<string>;
    readonly origin: DescriptorDatum<TextureDescriptorOrigin>;
    readonly width: number;
    readonly height: number;
    readonly depthOrLayers: DescriptorDatum<number>;
    readonly sampleCategory: TextureSampleCategory;
    readonly format: DescriptorDatum<string>;
    readonly mipLevelCount: DescriptorDatum<number>;
    readonly colorSpace: TextureColorSpace;
    readonly invertY: DescriptorValue<boolean>;
    readonly sampler: ITextureSamplerDescriptor;
    readonly transform: DescriptorValue<ITextureDescriptorTransform>;
    readonly capabilities: {
        readonly dynamicUpdate: DescriptorDatum<boolean>;
        readonly htmlReadiness: DescriptorDatum<"pending" | "ready" | "failed" | "disposed">;
        readonly renderAttachment: DescriptorDatum<boolean>;
        readonly sampledDepth: boolean;
        readonly released: DescriptorDatum<boolean>;
    };
}

export interface IMaterialDescriptorMutationScope {
    /** Every live scene in the inspected engine that currently references the source material. */
    readonly scenes: readonly SceneContext[];
}

export type MaterialTextureMutation = { readonly direction: "assign" | "replace"; readonly texture: object } | { readonly direction: "clear" };

export interface IMaterialDescriptorMutationResult {
    readonly changed: boolean;
    readonly mutation: AppliedMaterialMutationClass;
    readonly postMutation: MaterialPostMutation;
}
