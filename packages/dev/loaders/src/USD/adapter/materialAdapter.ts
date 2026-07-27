import { Color3 } from "core/Maths/math.color.pure";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { Texture } from "core/Materials/Textures/texture.pure";
import { EncodeArrayBufferToBase64 } from "core/Misc/stringTools";
import { type Scene } from "core/scene";
import { type IResolvedMaterial, type IResolvedTexture, type ResolvedTextureSlot } from "../resolution/resolvedStage";
import { type USDLoadingOptions } from "../usdLoadingOptions";

type ResolvedTextureChannel = NonNullable<IResolvedTexture["channel"]>;
type ResolvedTextureWrap = IResolvedTexture["wrapU"];

const DefaultEmbeddedTextureMimeType = "image/png";

/**
 * Creates a Babylon PBR material from an already-resolved USD material.
 *
 * USD scalar texture channels are mapped onto Babylon's native PBR slots where those slots expose
 * channel controls. Standalone roughness textures use Babylon's `microSurfaceTexture`, which samples
 * the red channel; metallic/roughness packed into the same texture can use metallic red/blue and
 * roughness green/alpha. `black` wrap is approximated with clamp because Babylon has no direct black
 * border wrap mode. Per-channel texture scale is applied through `Texture.level` only when Babylon can
 * represent it as one uniform multiplier; bias and non-uniform color scale need a shader-level swizzle
 * path that the frozen resolved-stage contract does not provide. The USD specular workflow is
 * approximated with PBRMaterial's specular/glossiness controls (`reflectivityColor` and
 * `microSurface = 1 - roughness`). A specular-workflow roughness texture is intentionally skipped
 * because assigning it directly would reinterpret roughness as glossiness.
 *
 * @param material the resolved USD material data
 * @param scene the scene to create the Babylon material in
 * @param _options loader options reserved for future material resolution behavior
 * @returns the created Babylon PBR material
 */
export function CreateMaterialFromResolved(material: IResolvedMaterial, scene: Scene, _options: Readonly<USDLoadingOptions>): PBRMaterial {
    const babylonMaterial = new PBRMaterial(material.name, scene);

    babylonMaterial.albedoColor = CreateColor3(material.baseColor);
    babylonMaterial.alpha = material.opacity;
    babylonMaterial.emissiveColor = CreateColor3(material.emissiveColor);
    babylonMaterial.indexOfRefraction = material.ior;
    babylonMaterial.ambientTextureStrength = material.occlusion;

    if (material.useSpecularWorkflow) {
        babylonMaterial.metallic = null;
        babylonMaterial.roughness = null;
        babylonMaterial.reflectivityColor = CreateColor3(material.specularColor);
        babylonMaterial.microSurface = 1 - material.roughness;
    } else {
        babylonMaterial.metallic = material.metallic;
        babylonMaterial.roughness = material.roughness;
    }

    babylonMaterial.clearCoat.intensity = material.clearcoat;
    babylonMaterial.clearCoat.roughness = material.clearcoatRoughness;
    babylonMaterial.clearCoat.isEnabled = material.clearcoat > 0 || material.textures.clearcoat !== undefined || material.textures.clearcoatRoughness !== undefined;

    ApplyTextureSlots(babylonMaterial, material, scene);
    ApplyTransparencyMode(babylonMaterial, material);

    return babylonMaterial;
}

function ApplyTextureSlots(babylonMaterial: PBRMaterial, material: IResolvedMaterial, scene: Scene): void {
    const textures = material.textures;

    if (textures.baseColor) {
        babylonMaterial.albedoTexture = CreateTexture(textures.baseColor, scene, "baseColor");
    }

    if (textures.normal) {
        babylonMaterial.bumpTexture = CreateTexture(textures.normal, scene, "normal");
    }

    if (textures.emissive) {
        babylonMaterial.emissiveTexture = CreateTexture(textures.emissive, scene, "emissive");
    }

    if (textures.occlusion) {
        babylonMaterial.ambientTexture = CreateTexture(textures.occlusion, scene, "occlusion");
        babylonMaterial.useAmbientInGrayScale = true;
    }

    if (textures.opacity) {
        const opacityTexture = CreateTexture(textures.opacity, scene, "opacity");
        opacityTexture.hasAlpha = true;
        opacityTexture.getAlphaFromRGB = textures.opacity.channel !== undefined && textures.opacity.channel !== "a";
        babylonMaterial.opacityTexture = opacityTexture;
    } else if (textures.baseColor && material.opacityThreshold !== undefined && babylonMaterial.albedoTexture) {
        babylonMaterial.albedoTexture.hasAlpha = true;
        babylonMaterial.useAlphaFromAlbedoTexture = true;
    }

    if (!material.useSpecularWorkflow) {
        ApplyMetallicRoughnessTextures(babylonMaterial, textures.metallic, textures.roughness, scene);
    }

    ApplyClearCoatTextures(babylonMaterial, textures.clearcoat, textures.clearcoatRoughness, scene);
}

function ApplyMetallicRoughnessTextures(
    babylonMaterial: PBRMaterial,
    metallicTexture: IResolvedTexture | undefined,
    roughnessTexture: IResolvedTexture | undefined,
    scene: Scene
): void {
    if (metallicTexture) {
        babylonMaterial.metallicTexture = CreateTexture(metallicTexture, scene, "metallic");
        babylonMaterial.useMetallnessFromMetallicTextureBlue = GetTextureChannel(metallicTexture, "metallic") === "b";
    }

    if (!roughnessTexture) {
        return;
    }

    if (metallicTexture && AreSameTextureSource(metallicTexture, roughnessTexture)) {
        ApplyRoughnessPackingToMetallicTexture(babylonMaterial, roughnessTexture);
        return;
    }

    babylonMaterial.microSurfaceTexture = CreateTexture(roughnessTexture, scene, "roughness");
}

function ApplyRoughnessPackingToMetallicTexture(babylonMaterial: PBRMaterial, roughnessTexture: IResolvedTexture): void {
    const roughnessChannel = GetTextureChannel(roughnessTexture, "roughness");
    babylonMaterial.useRoughnessFromMetallicTextureAlpha = roughnessChannel === "a";
    babylonMaterial.useRoughnessFromMetallicTextureGreen = roughnessChannel === "g";
}

function ApplyClearCoatTextures(
    babylonMaterial: PBRMaterial,
    clearcoatTexture: IResolvedTexture | undefined,
    clearcoatRoughnessTexture: IResolvedTexture | undefined,
    scene: Scene
): void {
    if (clearcoatTexture) {
        babylonMaterial.clearCoat.texture = CreateTexture(clearcoatTexture, scene, "clearcoat");
    }

    if (!clearcoatRoughnessTexture) {
        return;
    }

    if (clearcoatTexture && AreSameTextureSource(clearcoatTexture, clearcoatRoughnessTexture)) {
        babylonMaterial.clearCoat.useRoughnessFromMainTexture = true;
        return;
    }

    babylonMaterial.clearCoat.textureRoughness = CreateTexture(clearcoatRoughnessTexture, scene, "clearcoatRoughness");
    babylonMaterial.clearCoat.useRoughnessFromMainTexture = false;
}

function ApplyTransparencyMode(babylonMaterial: PBRMaterial, material: IResolvedMaterial): void {
    const hasOpacityTexture = material.textures.opacity !== undefined;
    const hasAlphaCutoff = material.opacityThreshold !== undefined;

    if (hasAlphaCutoff) {
        babylonMaterial.alphaCutOff = material.opacityThreshold!;
        babylonMaterial.transparencyMode = material.opacity < 1 || hasOpacityTexture ? PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND : PBRMaterial.PBRMATERIAL_ALPHATEST;
        return;
    }

    babylonMaterial.transparencyMode = material.opacity < 1 || hasOpacityTexture ? PBRMaterial.PBRMATERIAL_ALPHABLEND : PBRMaterial.PBRMATERIAL_OPAQUE;
}

function CreateTexture(texture: IResolvedTexture, scene: Scene, slot: ResolvedTextureSlot): Texture {
    const gammaSpace = texture.colorSpace === "sRGB";
    const babylonTexture = new Texture(GetTextureUrl(texture), scene, {
        gammaSpace,
        mimeType: texture.data ? (texture.mimeType ?? DefaultEmbeddedTextureMimeType) : undefined,
    });

    babylonTexture.name = texture.uri;
    babylonTexture.coordinatesIndex = texture.uvSet;
    babylonTexture.wrapU = GetAddressMode(texture.wrapU);
    babylonTexture.wrapV = GetAddressMode(texture.wrapV);
    babylonTexture.gammaSpace = gammaSpace;
    ApplyTextureScaleBias(babylonTexture, texture, slot);

    return babylonTexture;
}

function GetTextureUrl(texture: IResolvedTexture): string {
    if (!texture.data) {
        return texture.uri;
    }

    const mimeType = texture.mimeType ?? DefaultEmbeddedTextureMimeType;
    return `data:${mimeType};base64,${EncodeArrayBufferToBase64(texture.data)}`;
}

function GetAddressMode(wrap: ResolvedTextureWrap): number {
    switch (wrap) {
        case "repeat":
            return Texture.WRAP_ADDRESSMODE;
        case "mirror":
            return Texture.MIRROR_ADDRESSMODE;
        case "clamp":
        case "black":
            return Texture.CLAMP_ADDRESSMODE;
    }
}

function ApplyTextureScaleBias(babylonTexture: Texture, texture: IResolvedTexture, slot: ResolvedTextureSlot): void {
    const level = GetSupportedTextureLevel(texture, slot);
    if (level !== undefined) {
        babylonTexture.level = level;
    }
}

function GetSupportedTextureLevel(texture: IResolvedTexture, slot: ResolvedTextureSlot): number | undefined {
    if (!texture.scale || HasUnsupportedBias(texture, slot)) {
        return undefined;
    }

    if (slot === "baseColor" || slot === "emissive") {
        return texture.scale[0] === texture.scale[1] && texture.scale[1] === texture.scale[2] ? texture.scale[0] : undefined;
    }

    if (slot === "normal") {
        return texture.scale[0] === texture.scale[1] ? texture.scale[0] : undefined;
    }

    return texture.scale[GetChannelIndex(GetTextureChannel(texture, slot))];
}

function HasUnsupportedBias(texture: IResolvedTexture, slot: ResolvedTextureSlot): boolean {
    if (!texture.bias) {
        return false;
    }

    if (slot === "baseColor" || slot === "emissive") {
        return texture.bias[0] !== 0 || texture.bias[1] !== 0 || texture.bias[2] !== 0;
    }

    if (slot === "normal") {
        return texture.bias[0] !== 0 || texture.bias[1] !== 0;
    }

    return texture.bias[GetChannelIndex(GetTextureChannel(texture, slot))] !== 0;
}

function GetTextureChannel(texture: IResolvedTexture, slot: ResolvedTextureSlot): ResolvedTextureChannel {
    if (texture.channel) {
        return texture.channel;
    }

    switch (slot) {
        case "opacity":
            return "a";
        case "roughness":
        case "clearcoatRoughness":
            return "g";
        case "baseColor":
        case "normal":
        case "emissive":
        case "metallic":
        case "occlusion":
        case "clearcoat":
            return "r";
    }
}

function GetChannelIndex(channel: ResolvedTextureChannel): number {
    switch (channel) {
        case "r":
            return 0;
        case "g":
            return 1;
        case "b":
            return 2;
        case "a":
            return 3;
    }
}

function AreSameTextureSource(left: IResolvedTexture, right: IResolvedTexture): boolean {
    return (
        left === right ||
        (left.uri === right.uri &&
            left.data === right.data &&
            left.mimeType === right.mimeType &&
            left.uvSet === right.uvSet &&
            left.wrapU === right.wrapU &&
            left.wrapV === right.wrapV &&
            left.colorSpace === right.colorSpace)
    );
}

function CreateColor3(value: readonly [number, number, number]): Color3 {
    return new Color3(value[0], value[1], value[2]);
}
