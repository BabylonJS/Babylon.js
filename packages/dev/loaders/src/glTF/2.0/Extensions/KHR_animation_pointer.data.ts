/* eslint-disable @typescript-eslint/naming-convention */

import { Animation } from "core/Animations/animation";
import type { ICamera, IKHRLightsPunctual_Light, IMaterial } from "../glTFLoaderInterfaces";
import type { IAnimatable } from "core/Animations/animatable.interface";
import { AnimationPropertyInfo } from "../glTFLoaderAnimation";
import { Color3 } from "core/Maths/math.color";
import { AddInterpolation } from "./objectModelMapping";

function getColor3(_target: any, source: Float32Array, offset: number, scale: number): Color3 {
    return Color3.FromArray(source, offset).scale(scale);
}

function getAlpha(_target: any, source: Float32Array, offset: number, scale: number): number {
    return source[offset + 3] * scale;
}

function getFloat(_target: any, source: Float32Array, offset: number, scale: number): number {
    return source[offset] * scale;
}

function getMinusFloat(_target: any, source: Float32Array, offset: number, scale: number): number {
    return -source[offset] * scale;
}

function getNextFloat(_target: any, source: Float32Array, offset: number, scale: number): number {
    return source[offset + 1] * scale;
}

function getFloatBy2(_target: any, source: Float32Array, offset: number, scale: number): number {
    return source[offset] * scale * 2;
}

function getTextureTransformTree(textureName: string) {
    return {
        scale: [
            new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, `${textureName}.uScale`, getFloat, () => 2),
            new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, `${textureName}.vScale`, getNextFloat, () => 2),
        ],
        offset: [
            new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, `${textureName}.uOffset`, getFloat, () => 2),
            new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, `${textureName}.vOffset`, getNextFloat, () => 2),
        ],
        rotation: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, `${textureName}.wAng`, getMinusFloat, () => 1)],
    };
}

class CameraAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(target: ICamera, name: string, fps: number, keys: any[]) {
        return [{ babylonAnimatable: target._babylonCamera!, babylonAnimation: this._buildAnimation(name, fps, keys) }];
    }
}

class MaterialAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(target: IMaterial, name: string, fps: number, keys: any[]) {
        const babylonAnimations: { babylonAnimatable: IAnimatable; babylonAnimation: Animation }[] = [];
        for (const fillMode in target._data!) {
            babylonAnimations.push({
                babylonAnimatable: target._data[fillMode].babylonMaterial,
                babylonAnimation: this._buildAnimation(name, fps, keys),
            });
        }
        return babylonAnimations;
    }
}

class LightAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(target: IKHRLightsPunctual_Light, name: string, fps: number, keys: any[]) {
        return [{ babylonAnimatable: target._babylonLight!, babylonAnimation: this._buildAnimation(name, fps, keys) }];
    }
}

AddInterpolation("/cameras/{}/orthographic/xmag", [
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoLeft", getMinusFloat, () => 1),
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoRight", getNextFloat, () => 1),
]);

AddInterpolation("/cameras/{}/orthographic/ymag", [
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoBottom", getMinusFloat, () => 1),
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoTop", getNextFloat, () => 1),
]);

AddInterpolation("/cameras/{}/orthographic/zfar", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)]);
AddInterpolation("/cameras/{}/orthographic/znear", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)]);

AddInterpolation("/cameras/{}/perspective/yfov", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "fov", getFloat, () => 1)]);
AddInterpolation("/cameras/{}/perspective/zfar", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)]);
AddInterpolation("/cameras/{}/perspective/znear", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)]);

// add interpolation to the materials mapping
AddInterpolation("/materials/{}/pbrMetallicRoughness/baseColorFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "albedoColor", getColor3, () => 4),
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "alpha", getAlpha, () => 4),
]);
AddInterpolation("/materials/{}/pbrMetallicRoughness/metallicFactor", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallic", getFloat, () => 1)]);
AddInterpolation("/materials/{}/pbrMetallicRoughness/roughnessFactor", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "roughness", getFloat, () => 1)]);
const baseColorTextureInterpolation = getTextureTransformTree("albedoTexture");
AddInterpolation("/materials/{}/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", baseColorTextureInterpolation.scale);
AddInterpolation("/materials/{}/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", baseColorTextureInterpolation.offset);
AddInterpolation("/materials/{}/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", baseColorTextureInterpolation.rotation);

const metallicRoughnessTextureInterpolation = getTextureTransformTree("metallicTexture");
AddInterpolation("/materials/{}/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", metallicRoughnessTextureInterpolation.scale);
AddInterpolation("/materials/{}/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", metallicRoughnessTextureInterpolation.offset);
AddInterpolation("/materials/{}/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", metallicRoughnessTextureInterpolation.rotation);

AddInterpolation("/materials/{}/emissiveFactor", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "emissiveColor", getColor3, () => 3)]);
const normalTextureInterpolation = getTextureTransformTree("bumpTexture");
AddInterpolation("/materials/{}/normalTexture/scale", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "bumpTexture.level", getFloat, () => 1)]);

AddInterpolation("/materials/{}/normalTexture/extensions/KHR_texture_transform/scale", normalTextureInterpolation.scale);
AddInterpolation("/materials/{}/normalTexture/extensions/KHR_texture_transform/offset", normalTextureInterpolation.offset);
AddInterpolation("/materials/{}/normalTexture/extensions/KHR_texture_transform/rotation", normalTextureInterpolation.rotation);

AddInterpolation("/materials/{}/occlusionTexture/strength", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "ambientTextureStrength", getFloat, () => 1)]);

const occlusionTextureInterpolation = getTextureTransformTree("ambientTexture");
AddInterpolation("/materials/{}/occlusionTexture/extensions/KHR_texture_transform/scale", occlusionTextureInterpolation.scale);
AddInterpolation("/materials/{}/occlusionTexture/extensions/KHR_texture_transform/offset", occlusionTextureInterpolation.offset);
AddInterpolation("/materials/{}/occlusionTexture/extensions/KHR_texture_transform/rotation", occlusionTextureInterpolation.rotation);
const emissiveTextureInterpolation = getTextureTransformTree("emissiveTexture");
AddInterpolation("/materials/{}/emissiveTexture/extensions/KHR_texture_transform/scale", emissiveTextureInterpolation.scale);
AddInterpolation("/materials/{}/emissiveTexture/extensions/KHR_texture_transform/offset", emissiveTextureInterpolation.offset);
AddInterpolation("/materials/{}/emissiveTexture/extensions/KHR_texture_transform/rotation", emissiveTextureInterpolation.rotation);

// materials extensions
AddInterpolation("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyStrength", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.intensity", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyRotation", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.angle", getFloat, () => 1),
]);
const anisotropyTextureInterpolation = getTextureTransformTree("anisotropy.texture");
AddInterpolation("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", anisotropyTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", anisotropyTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", anisotropyTextureInterpolation.rotation);
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.intensity", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.roughness", getFloat, () => 1),
]);
const clearcoatTextureInterpolation = getTextureTransformTree("clearCoat.texture");
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", clearcoatTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", clearcoatTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", clearcoatTextureInterpolation.rotation);
const clearcoatNormalTextureInterpolation = getTextureTransformTree("clearCoat.bumpTexture");
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.bumpTexture.level", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/extensions/KHR_texture_transform/scale", clearcoatNormalTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/extensions/KHR_texture_transform/offset", clearcoatNormalTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/extensions/KHR_texture_transform/rotation", clearcoatNormalTextureInterpolation.rotation);
const clearcoatRoughnessTextureInterpolation = getTextureTransformTree("clearCoat.textureRoughness");
AddInterpolation("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", clearcoatRoughnessTextureInterpolation.scale);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset",
    clearcoatRoughnessTextureInterpolation.offset
);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation",
    clearcoatRoughnessTextureInterpolation.rotation
);

AddInterpolation("/materials/{}/extensions/KHR_materials_dispersion/dispersionFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.dispersion", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_emissive_strength/emissiveStrength", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "emissiveIntensity", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_ior/ior", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "indexOfRefraction", getFloat, () => 1)]);
AddInterpolation("/materials/{}/extensions/KHR_materials_iridescence/iridescenceFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.intensity", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_iridescence/iridescenceIor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.indexOfRefraction", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.minimumThickness", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.maximumThickness", getFloat, () => 1),
]);

const iridescenceTextureInterpolation = getTextureTransformTree("iridescence.texture");
AddInterpolation("/materials/{}/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", iridescenceTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", iridescenceTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", iridescenceTextureInterpolation.rotation);

const iridescenceThicknessTextureInterpolation = getTextureTransformTree("iridescence.thicknessTexture");
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale",
    iridescenceThicknessTextureInterpolation.scale
);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset",
    iridescenceThicknessTextureInterpolation.offset
);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation",
    iridescenceThicknessTextureInterpolation.rotation
);

AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenColorFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "sheen.color", getColor3, () => 3),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "sheen.roughness", getFloat, () => 1),
]);

const sheenTextureInterpolation = getTextureTransformTree("sheen.texture");
AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", sheenTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", sheenTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", sheenTextureInterpolation.rotation);

const sheenRoughnessTextureInterpolation = getTextureTransformTree("sheen.textureRoughness");
AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", sheenRoughnessTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", sheenRoughnessTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", sheenRoughnessTextureInterpolation.rotation);

AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallicF0Factor", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularColorFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "metallicReflectanceColor", getColor3, () => 3),
]);

const specularTextureInterpolation = getTextureTransformTree("metallicReflectanceTexture");
AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", specularTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", specularTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", specularTextureInterpolation.rotation);
const specularColorTextureInterpolation = getTextureTransformTree("reflectanceTexture");
AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", specularColorTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", specularColorTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", specularColorTextureInterpolation.rotation);

AddInterpolation("/materials/{}/extensions/KHR_materials_transmission/transmissionFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.refractionIntensity", getFloat, () => 1),
]);
const transmissionTextureInterpolation = getTextureTransformTree("subSurface.refractionIntensityTexture");
AddInterpolation("/materials/{}/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", transmissionTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", transmissionTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", transmissionTextureInterpolation.rotation);

AddInterpolation("/materials/{}/extensions/KHR_materials_volume/attenuationColor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "subSurface.tintColor", getColor3, () => 3),
]);

AddInterpolation("/materials/{}/extensions/KHR_materials_volume/attenuationDistance", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.tintColorAtDistance", getFloat, () => 1),
]);
AddInterpolation("/materials/{}/extensions/KHR_materials_volume/thicknessFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.maximumThickness", getFloat, () => 1),
]);

const thicknessTextureInterpolation = getTextureTransformTree("subSurface.thicknessTexture");
AddInterpolation("/materials/{}/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", thicknessTextureInterpolation.scale);
AddInterpolation("/materials/{}/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", thicknessTextureInterpolation.offset);
AddInterpolation("/materials/{}/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", thicknessTextureInterpolation.rotation);

AddInterpolation("/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.translucencyIntensity", getFloat, () => 1),
]);

const diffuseTransmissionTextureInterpolation = getTextureTransformTree("subSurface.translucencyIntensityTexture");
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture/extensions/KHR_texture_transform/scale",
    diffuseTransmissionTextureInterpolation.scale
);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture/extensions/KHR_texture_transform/offset",
    diffuseTransmissionTextureInterpolation.offset
);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture/extensions/KHR_texture_transform/rotation",
    diffuseTransmissionTextureInterpolation.rotation
);

AddInterpolation("/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor", [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "subSurface.translucencyColor", getColor3, () => 3),
]);

const diffuseTransmissionColorTextureInterpolation = getTextureTransformTree("subSurface.translucencyColorTexture");
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture/extensions/KHR_texture_transform/scale",
    diffuseTransmissionColorTextureInterpolation.scale
);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture/extensions/KHR_texture_transform/offset",
    diffuseTransmissionColorTextureInterpolation.offset
);
AddInterpolation(
    "/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture/extensions/KHR_texture_transform/rotation",
    diffuseTransmissionColorTextureInterpolation.rotation
);

AddInterpolation("/extensions/KHR_lights_punctual/lights/{}/color", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3, () => 3)]);
AddInterpolation("/extensions/KHR_lights_punctual/lights/{}/intensity", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "intensity", getFloat, () => 1)]);
AddInterpolation("/extensions/KHR_lights_punctual/lights/{}/range", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "range", getFloat, () => 1)]);
AddInterpolation("/extensions/KHR_lights_punctual/lights/{}/spot/innerConeAngle", [
    new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "innerAngle", getFloatBy2, () => 1),
]);
AddInterpolation("/extensions/KHR_lights_punctual/lights/{}/spot/outerConeAngle", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "angle", getFloatBy2, () => 1)]);

AddInterpolation("/nodes/{}/extensions/EXT_lights_ies/color", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3, () => 3)]);
AddInterpolation("/nodes/{}/extensions/EXT_lights_ies/multiplier", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "intensity", getFloat, () => 1)]);
