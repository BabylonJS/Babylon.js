/* eslint-disable @typescript-eslint/naming-convention */

import { Animation } from "core/Animations/animation";
import type { ICamera, IKHRLightsPunctual_Light, IMaterial } from "../glTFLoaderInterfaces";
import type { IAnimatable } from "core/Animations/animatable.interface";
import { AnimationPropertyInfo } from "../glTFLoaderAnimation";
import { Color3 } from "core/Maths/math.color";
import { objectModelMapping } from "./objectModelMapping";
import type { Material } from "core/Materials/material";

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
    public buildAnimations(target: IMaterial | Material, name: string, fps: number, keys: any[]) {
        const babylonAnimations: { babylonAnimatable: IAnimatable; babylonAnimation: Animation }[] = [];
        if ((target as IMaterial)._data) {
            const targetAsIMaterial = target as IMaterial;
            for (const fillMode in targetAsIMaterial._data!) {
                babylonAnimations.push({
                    babylonAnimatable: targetAsIMaterial._data![fillMode].babylonMaterial,
                    babylonAnimation: this._buildAnimation(name, fps, keys),
                });
            }
        } else {
            babylonAnimations.push({ babylonAnimatable: target as Material, babylonAnimation: this._buildAnimation(name, fps, keys) });
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

// add interpolation to the cameras mapping
objectModelMapping.cameras.__array__.orthographic.xmag.interpolation = [
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoLeft", getMinusFloat, () => 1),
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoRight", getNextFloat, () => 1),
];
objectModelMapping.cameras.__array__.orthographic.ymag.interpolation = [
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoBottom", getMinusFloat, () => 1),
    new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoTop", getNextFloat, () => 1),
];
objectModelMapping.cameras.__array__.orthographic.zfar.interpolation = [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)];
objectModelMapping.cameras.__array__.orthographic.znear.interpolation = [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)];
objectModelMapping.cameras.__array__.perspective.yfov.interpolation = [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "fov", getFloat, () => 1)];
objectModelMapping.cameras.__array__.perspective.zfar.interpolation = [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)];
objectModelMapping.cameras.__array__.perspective.znear.interpolation = [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)];

// add interpolation to the materials mapping
objectModelMapping.materials.__array__.pbrMetallicRoughness.baseColorFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "albedoColor", getColor3, () => 4),
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "alpha", getAlpha, () => 4),
];
objectModelMapping.materials.__array__.pbrMetallicRoughness.metallicFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallic", getFloat, () => 1),
];
objectModelMapping.materials.__array__.pbrMetallicRoughness.roughnessFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "roughness", getFloat, () => 1),
];
const baseColorTextureInterpolation = getTextureTransformTree("albedoTexture");
objectModelMapping.materials.__array__.pbrMetallicRoughness.baseColorTexture.extensions.KHR_texture_transform.scale.interpolation = baseColorTextureInterpolation.scale;
objectModelMapping.materials.__array__.pbrMetallicRoughness.baseColorTexture.extensions.KHR_texture_transform.offset.interpolation = baseColorTextureInterpolation.offset;
objectModelMapping.materials.__array__.pbrMetallicRoughness.baseColorTexture.extensions.KHR_texture_transform.rotation.interpolation = baseColorTextureInterpolation.rotation;
const metallicRoughnessTextureInterpolation = getTextureTransformTree("metallicTexture");
objectModelMapping.materials.__array__.pbrMetallicRoughness.metallicRoughnessTexture.extensions.KHR_texture_transform.scale.interpolation =
    metallicRoughnessTextureInterpolation.scale;
objectModelMapping.materials.__array__.pbrMetallicRoughness.metallicRoughnessTexture.extensions.KHR_texture_transform.offset.interpolation =
    metallicRoughnessTextureInterpolation.offset;
objectModelMapping.materials.__array__.pbrMetallicRoughness.metallicRoughnessTexture.extensions.KHR_texture_transform.rotation.interpolation =
    metallicRoughnessTextureInterpolation.rotation;
objectModelMapping.materials.__array__.emissiveFactor.interpolation = [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "emissiveColor", getColor3, () => 3)];
const normalTextureInterpolation = getTextureTransformTree("bumpTexture");
objectModelMapping.materials.__array__.normalTexture.scale.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "bumpTexture.level", getFloat, () => 1),
];
objectModelMapping.materials.__array__.normalTexture.extensions.KHR_texture_transform.scale.interpolation = normalTextureInterpolation.scale;
objectModelMapping.materials.__array__.normalTexture.extensions.KHR_texture_transform.offset.interpolation = normalTextureInterpolation.offset;
objectModelMapping.materials.__array__.normalTexture.extensions.KHR_texture_transform.rotation.interpolation = normalTextureInterpolation.rotation;
const occlusionTextureInterpolation = getTextureTransformTree("ambientTexture");
objectModelMapping.materials.__array__.occlusionTexture.strength.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "ambientTextureStrength", getFloat, () => 1),
];
objectModelMapping.materials.__array__.occlusionTexture.extensions.KHR_texture_transform.scale.interpolation = occlusionTextureInterpolation.scale;
objectModelMapping.materials.__array__.occlusionTexture.extensions.KHR_texture_transform.offset.interpolation = occlusionTextureInterpolation.offset;
objectModelMapping.materials.__array__.occlusionTexture.extensions.KHR_texture_transform.rotation.interpolation = occlusionTextureInterpolation.rotation;
const emissiveTextureInterpolation = getTextureTransformTree("emissiveTexture");
objectModelMapping.materials.__array__.emissiveTexture.extensions.KHR_texture_transform.scale.interpolation = emissiveTextureInterpolation.scale;
objectModelMapping.materials.__array__.emissiveTexture.extensions.KHR_texture_transform.offset.interpolation = emissiveTextureInterpolation.offset;
objectModelMapping.materials.__array__.emissiveTexture.extensions.KHR_texture_transform.rotation.interpolation = emissiveTextureInterpolation.rotation;
// materials extensions
objectModelMapping.materials.__array__.extensions.KHR_materials_anisotropy.anisotropyStrength.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.intensity", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_anisotropy.anisotropyRotation.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.angle", getFloat, () => 1),
];
const anisotropyTextureInterpolation = getTextureTransformTree("anisotropy.texture");
objectModelMapping.materials.__array__.extensions.KHR_materials_anisotropy.anisotropyTexture.extensions.KHR_texture_transform.scale.interpolation =
    anisotropyTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_anisotropy.anisotropyTexture.extensions.KHR_texture_transform.offset.interpolation =
    anisotropyTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_anisotropy.anisotropyTexture.extensions.KHR_texture_transform.rotation.interpolation =
    anisotropyTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.intensity", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.roughness", getFloat, () => 1),
];
const clearcoatTextureInterpolation = getTextureTransformTree("clearCoat.texture");
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatTexture.extensions.KHR_texture_transform.scale.interpolation =
    clearcoatTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatTexture.extensions.KHR_texture_transform.offset.interpolation =
    clearcoatTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatTexture.extensions.KHR_texture_transform.rotation.interpolation =
    clearcoatTextureInterpolation.rotation;
const clearcoatNormalTextureInterpolation = getTextureTransformTree("clearCoat.bumpTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatNormalTexture.scale.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.bumpTexture.level", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatNormalTexture.extensions.KHR_texture_transform.scale.interpolation =
    clearcoatNormalTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatNormalTexture.extensions.KHR_texture_transform.offset.interpolation =
    clearcoatNormalTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatNormalTexture.extensions.KHR_texture_transform.rotation.interpolation =
    clearcoatNormalTextureInterpolation.rotation;
const clearcoatRoughnessTextureInterpolation = getTextureTransformTree("clearCoat.textureRoughness");
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatRoughnessTexture.extensions.KHR_texture_transform.scale.interpolation =
    clearcoatRoughnessTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatRoughnessTexture.extensions.KHR_texture_transform.offset.interpolation =
    clearcoatRoughnessTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_clearcoat.clearcoatRoughnessTexture.extensions.KHR_texture_transform.rotation.interpolation =
    clearcoatRoughnessTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_dispersion.dispersion.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.dispersion", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_emissive_strength.emissiveStrength.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "emissiveIntensity", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_ior.ior.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "indexOfRefraction", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.intensity", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceIor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.indexOfRefraction", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceThicknessMinimum.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.minimumThickness", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceThicknessMaximum.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.maximumThickness", getFloat, () => 1),
];
const iridescenceTextureInterpolation = getTextureTransformTree("iridescence.texture");
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceTexture.extensions.KHR_texture_transform.scale.interpolation =
    iridescenceTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceTexture.extensions.KHR_texture_transform.offset.interpolation =
    iridescenceTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceTexture.extensions.KHR_texture_transform.rotation.interpolation =
    iridescenceTextureInterpolation.rotation;
const iridescenceThicknessTextureInterpolation = getTextureTransformTree("iridescence.thicknessTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceThicknessTexture.extensions.KHR_texture_transform.scale.interpolation =
    iridescenceThicknessTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceThicknessTexture.extensions.KHR_texture_transform.offset.interpolation =
    iridescenceThicknessTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_iridescence.iridescenceThicknessTexture.extensions.KHR_texture_transform.rotation.interpolation =
    iridescenceThicknessTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenColorFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "sheen.color", getColor3, () => 3),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenRoughnessFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "sheen.roughness", getFloat, () => 1),
];
const sheenTextureInterpolation = getTextureTransformTree("sheen.texture");
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenColorTexture.extensions.KHR_texture_transform.scale.interpolation = sheenTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenColorTexture.extensions.KHR_texture_transform.offset.interpolation = sheenTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenColorTexture.extensions.KHR_texture_transform.rotation.interpolation =
    sheenTextureInterpolation.rotation;
const sheenRoughnessTextureInterpolation = getTextureTransformTree("sheen.textureRoughness");
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenRoughnessTexture.extensions.KHR_texture_transform.scale.interpolation =
    sheenRoughnessTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenRoughnessTexture.extensions.KHR_texture_transform.offset.interpolation =
    sheenRoughnessTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_sheen.sheenRoughnessTexture.extensions.KHR_texture_transform.rotation.interpolation =
    sheenRoughnessTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallicF0Factor", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularColorFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "metallicReflectanceColor", getColor3, () => 3),
];
const specularTextureInterpolation = getTextureTransformTree("metallicReflectanceTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularTexture.extensions.KHR_texture_transform.scale.interpolation = specularTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularTexture.extensions.KHR_texture_transform.offset.interpolation =
    specularTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularTexture.extensions.KHR_texture_transform.rotation.interpolation =
    specularTextureInterpolation.rotation;
const specularColorTextureInterpolation = getTextureTransformTree("reflectanceTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularColorTexture.extensions.KHR_texture_transform.scale.interpolation =
    specularColorTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularColorTexture.extensions.KHR_texture_transform.offset.interpolation =
    specularColorTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_specular.specularColorTexture.extensions.KHR_texture_transform.rotation.interpolation =
    specularColorTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_transmission.transmissionFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.refractionIntensity", getFloat, () => 1),
];
const transmissionTextureInterpolation = getTextureTransformTree("subSurface.refractionIntensityTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_transmission.transmissionTexture.extensions.KHR_texture_transform.scale.interpolation =
    transmissionTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_transmission.transmissionTexture.extensions.KHR_texture_transform.offset.interpolation =
    transmissionTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_transmission.transmissionTexture.extensions.KHR_texture_transform.rotation.interpolation =
    transmissionTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_volume.attenuationColor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "subSurface.tintColor", getColor3, () => 3),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_volume.attenuationDistance.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.tintColorAtDistance", getFloat, () => 1),
];
objectModelMapping.materials.__array__.extensions.KHR_materials_volume.thicknessFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.maximumThickness", getFloat, () => 1),
];
const thicknessTextureInterpolation = getTextureTransformTree("subSurface.thicknessTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_volume.thicknessTexture.extensions.KHR_texture_transform.scale.interpolation = thicknessTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_volume.thicknessTexture.extensions.KHR_texture_transform.offset.interpolation =
    thicknessTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_volume.thicknessTexture.extensions.KHR_texture_transform.rotation.interpolation =
    thicknessTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.translucencyIntensity", getFloat, () => 1),
];
const diffuseTransmissionTextureInterpolation = getTextureTransformTree("subSurface.translucencyIntensityTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionTexture.extensions.KHR_texture_transform.scale.interpolation =
    diffuseTransmissionTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionTexture.extensions.KHR_texture_transform.offset.interpolation =
    diffuseTransmissionTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionTexture.extensions.KHR_texture_transform.rotation.interpolation =
    diffuseTransmissionTextureInterpolation.rotation;
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionColorFactor.interpolation = [
    new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "subSurface.translucencyColor", getColor3, () => 3),
];
const diffuseTransmissionColorTextureInterpolation = getTextureTransformTree("subSurface.translucencyColorTexture");
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture.extensions.KHR_texture_transform.scale.interpolation =
    diffuseTransmissionColorTextureInterpolation.scale;
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture.extensions.KHR_texture_transform.offset.interpolation =
    diffuseTransmissionColorTextureInterpolation.offset;
objectModelMapping.materials.__array__.extensions.KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture.extensions.KHR_texture_transform.rotation.interpolation =
    diffuseTransmissionColorTextureInterpolation.rotation;

// add interpolation to the extensions mapping
objectModelMapping.extensions.KHR_lights_punctual.lights.__array__.color.interpolation = [
    new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3, () => 3),
];
objectModelMapping.extensions.KHR_lights_punctual.lights.__array__.intensity.interpolation = [
    new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "intensity", getFloat, () => 1),
];
objectModelMapping.extensions.KHR_lights_punctual.lights.__array__.range.interpolation = [
    new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "range", getFloat, () => 1),
];
objectModelMapping.extensions.KHR_lights_punctual.lights.__array__.spot.innerConeAngle.interpolation = [
    new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "innerAngle", getFloatBy2, () => 1),
];
objectModelMapping.extensions.KHR_lights_punctual.lights.__array__.spot.outerConeAngle.interpolation = [
    new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "angle", getFloatBy2, () => 1),
];
