/* eslint-disable @typescript-eslint/naming-convention */

/** This file must only contain pure code and pure imports */

import { Animation } from "core/Animations/animation.pure";
import { type ICamera, type IEXTLightsArea_Light, type IKHRLightsPunctual_Light, type IMaterial, type INode } from "../glTFLoaderInterfaces";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { AnimationPropertyInfo, RegisterGLTFLoaderAnimation } from "../glTFLoaderAnimation.pure";
import { Color3 } from "core/Maths/math.color.pure";
import { _GetMaterialTexture, SetInterpolationForKey } from "./objectModelMapping";
import { _GetGLTFMaterialCoatState } from "./gltfMaterialCoatState";
import { _GetAreaLightDimensions } from "./gltfAreaLightDimensions";
import { type OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { type IAnimationKey } from "core/Animations/animationKey";
import { MaterialAlphaMode } from "babylonjs-gltf2interface";
import { type PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { _MarkTextureAsDynamic } from "core/Materials/Textures/textureProcessor";

const OpenPBRPropertyNames: Readonly<Record<string, string | undefined>> = {
    albedoColor: "baseColor",
    alpha: "geometryOpacity",
    metallic: "baseMetalness",
    roughness: "specularRoughness",
    albedoTexture: "baseColorTexture",
    metallicTexture: "baseMetalnessTexture",
    emissiveColor: "emissionColor",
    emissiveIntensity: "emissionLuminance",
    emissiveTexture: "emissionColorTexture",
    bumpTexture: "geometryNormalTexture",
    ambientTexture: "ambientOcclusionTexture",
    ambientTextureStrength: "ambientOcclusionTexture.level",
    "anisotropy.intensity": "specularRoughnessAnisotropy",
    "anisotropy.angle": "geometryTangentAngle",
    "anisotropy.texture": "geometryTangentTexture",
    "clearCoat.intensity": "coatWeight",
    "clearCoat.roughness": "coatRoughness",
    "clearCoat.texture": "coatWeightTexture",
    "clearCoat.textureRoughness": "coatRoughnessTexture",
    "clearCoat.bumpTexture": "geometryCoatNormalTexture",
    indexOfRefraction: "specularIor",
    "iridescence.intensity": "thinFilmWeight",
    "iridescence.indexOfRefraction": "thinFilmIor",
    "iridescence.minimumThickness": "thinFilmThicknessMin",
    "iridescence.maximumThickness": "thinFilmThickness",
    "iridescence.texture": "thinFilmWeightTexture",
    "iridescence.thicknessTexture": "thinFilmThicknessTexture",
    "sheen.color": "fuzzColor",
    "sheen.roughness": "fuzzRoughness",
    "sheen.texture": "fuzzColorTexture",
    "sheen.textureRoughness": "fuzzRoughnessTexture",
    metallicF0Factor: "specularWeight",
    metallicReflectanceColor: "specularColor",
    metallicReflectanceTexture: "specularWeightTexture",
    reflectanceTexture: "specularColorTexture",
    "subSurface.dispersion": "transmissionDispersionScale",
    "subSurface.refractionIntensity": "transmissionWeight",
    "subSurface.refractionIntensityTexture": "transmissionWeightTexture",
    "subSurface.tintColor": "transmissionColor",
    "subSurface.tintColorAtDistance": "transmissionDepth",
    "subSurface.maximumThickness": "geometryThickness",
    "subSurface.thicknessTexture": "geometryThicknessTexture",
    "subSurface.translucencyIntensity": "subsurfaceWeight",
    "subSurface.translucencyIntensityTexture": "subsurfaceWeightTexture",
    "subSurface.translucencyColor": "subsurfaceColor",
    "subSurface.translucencyColorTexture": "subsurfaceColorTexture",
};

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
    public buildAnimations(target: IMaterial, name: string, fps: number, keys: IAnimationKey[]) {
        const babylonAnimations: { babylonAnimatable: IAnimatable; babylonAnimation: Animation }[] = [];
        for (const fillMode in target._data!) {
            const material = target._data[fillMode].babylonMaterial;
            let propertyName = this.name;
            let materialKeys = keys;
            if (material.getClassName() === "OpenPBRMaterial") {
                if (this.name === "alpha" && (target.alphaMode === undefined || target.alphaMode === MaterialAlphaMode.OPAQUE)) {
                    continue;
                }
                const openPbrMaterial = material as OpenPBRMaterial;
                if (this.name === "clearCoat.intensity" || this.name === "clearCoat.roughness") {
                    babylonAnimations.push({
                        babylonAnimatable: _GetGLTFMaterialCoatState(openPbrMaterial),
                        babylonAnimation: this._buildAnimation(name, fps, keys, OpenPBRPropertyNames[this.name]),
                    });
                    continue;
                }
                // Texture component paths append one member to the mapped texture property.
                const separator = this.name.lastIndexOf(".");
                const parentName = this.name.substring(0, separator);
                propertyName =
                    OpenPBRPropertyNames[this.name] ?? (OpenPBRPropertyNames[parentName] ? OpenPBRPropertyNames[parentName] + this.name.substring(separator) : this.name);
                if (parentName === "metallicReflectanceTexture" && openPbrMaterial._useSpecularWeightFromSpecularColorTexture) {
                    propertyName = "specularColorTexture" + this.name.substring(separator);
                }
                if (this.name === "albedoColor" && openPbrMaterial.transmissionWeight > 0 && (openPbrMaterial.geometryThinWalled || openPbrMaterial.transmissionDepth === 0)) {
                    // The loading adapter derives transmission tint from base color for these materials.
                    babylonAnimations.push({
                        babylonAnimatable: material,
                        babylonAnimation: this._buildAnimation(name, fps, materialKeys, "transmissionColor"),
                    });
                }
                if (this.name === "iridescence.minimumThickness" || this.name === "iridescence.maximumThickness") {
                    // glTF stores nanometers; OpenPBR stores micrometers, including spline tangents.
                    materialKeys = keys.map((key) => ({
                        ...key,
                        value: key.value / 1000,
                        inTangent: key.inTangent === undefined ? undefined : key.inTangent / 1000,
                        outTangent: key.outTangent === undefined ? undefined : key.outTangent / 1000,
                    }));
                }
                const texturePath = (this.name === "ambientTextureStrength" ? "ambientTexture" : parentName).split(".");
                const component = propertyName.substring(propertyName.lastIndexOf(".") + 1);
                const texture = ["uScale", "vScale", "uOffset", "vOffset", "wAng", "level"].includes(component)
                    ? _GetMaterialTexture(openPbrMaterial, texturePath[0] as keyof PBRMaterial, texturePath[1])
                    : null;
                if (texture && typeof texture === "object" && "getTextureMatrix" in texture && "animations" in texture) {
                    // Finalization can replace this slot with baked textures; retain the animated source.
                    const animation = this._buildAnimation(name, fps, materialKeys, propertyName.substring(propertyName.lastIndexOf(".") + 1));
                    _MarkTextureAsDynamic(texture);
                    babylonAnimations.push({ babylonAnimatable: texture, babylonAnimation: animation });
                    continue;
                }
            }
            babylonAnimations.push({
                babylonAnimatable: material,
                babylonAnimation: this._buildAnimation(name, fps, materialKeys, propertyName),
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

class AreaLightDimensionsAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(target: IEXTLightsArea_Light, name: string, fps: number, keys: any[]) {
        const dimensions = _GetAreaLightDimensions(target);
        if (!dimensions) {
            throw new Error("Area light must be loaded before animating its dimensions.");
        }
        return [{ babylonAnimatable: dimensions, babylonAnimation: this._buildAnimation(name, fps, keys) }];
    }
}

class MeshAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(target: INode, name: string, fps: number, keys: any[]) {
        return target._primitiveBabylonMeshes
            ? target._primitiveBabylonMeshes.map((mesh) => ({ babylonAnimatable: mesh, babylonAnimation: this._buildAnimation(name, fps, keys) }))
            : [];
    }
}

let _Registered = false;

/**
 * Registers the KHR_animation_pointer interpolation mappings.
 * @internal
 */
export function _RegisterKHRAnimationPointerData(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterGLTFLoaderAnimation();

    SetInterpolationForKey("/cameras/{}/orthographic/xmag", [
        new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoLeft", getMinusFloat, () => 1),
        new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoRight", getFloat, () => 1),
    ]);

    SetInterpolationForKey("/cameras/{}/orthographic/ymag", [
        new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoBottom", getMinusFloat, () => 1),
        new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoTop", getFloat, () => 1),
    ]);

    SetInterpolationForKey("/cameras/{}/orthographic/zfar", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)]);
    SetInterpolationForKey("/cameras/{}/orthographic/znear", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)]);

    SetInterpolationForKey("/cameras/{}/perspective/yfov", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "fov", getFloat, () => 1)]);
    SetInterpolationForKey("/cameras/{}/perspective/zfar", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)]);
    SetInterpolationForKey("/cameras/{}/perspective/znear", [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)]);

    // add interpolation to the materials mapping
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/baseColorFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "albedoColor", getColor3, () => 4),
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "alpha", getAlpha, () => 4),
    ]);
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/metallicFactor", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallic", getFloat, () => 1)]);
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/roughnessFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "roughness", getFloat, () => 1),
    ]);
    const baseColorTextureInterpolation = getTextureTransformTree("albedoTexture");
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", baseColorTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", baseColorTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", baseColorTextureInterpolation.rotation);

    const metallicRoughnessTextureInterpolation = getTextureTransformTree("metallicTexture");
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", metallicRoughnessTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", metallicRoughnessTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", metallicRoughnessTextureInterpolation.rotation);

    SetInterpolationForKey("/materials/{}/emissiveFactor", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "emissiveColor", getColor3, () => 3)]);
    const normalTextureInterpolation = getTextureTransformTree("bumpTexture");
    SetInterpolationForKey("/materials/{}/normalTexture/scale", [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "bumpTexture.level", getFloat, () => 1)]);

    SetInterpolationForKey("/materials/{}/normalTexture/extensions/KHR_texture_transform/scale", normalTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/normalTexture/extensions/KHR_texture_transform/offset", normalTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/normalTexture/extensions/KHR_texture_transform/rotation", normalTextureInterpolation.rotation);

    SetInterpolationForKey("/materials/{}/occlusionTexture/strength", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "ambientTextureStrength", getFloat, () => 1),
    ]);

    const occlusionTextureInterpolation = getTextureTransformTree("ambientTexture");
    SetInterpolationForKey("/materials/{}/occlusionTexture/extensions/KHR_texture_transform/scale", occlusionTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/occlusionTexture/extensions/KHR_texture_transform/offset", occlusionTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/occlusionTexture/extensions/KHR_texture_transform/rotation", occlusionTextureInterpolation.rotation);
    const emissiveTextureInterpolation = getTextureTransformTree("emissiveTexture");
    SetInterpolationForKey("/materials/{}/emissiveTexture/extensions/KHR_texture_transform/scale", emissiveTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/emissiveTexture/extensions/KHR_texture_transform/offset", emissiveTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/emissiveTexture/extensions/KHR_texture_transform/rotation", emissiveTextureInterpolation.rotation);

    // materials extensions
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyStrength", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.intensity", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyRotation", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.angle", getFloat, () => 1),
    ]);
    const anisotropyTextureInterpolation = getTextureTransformTree("anisotropy.texture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", anisotropyTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", anisotropyTextureInterpolation.offset);
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation",
        anisotropyTextureInterpolation.rotation
    );
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.intensity", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.roughness", getFloat, () => 1),
    ]);
    const clearcoatTextureInterpolation = getTextureTransformTree("clearCoat.texture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", clearcoatTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", clearcoatTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", clearcoatTextureInterpolation.rotation);
    const clearcoatNormalTextureInterpolation = getTextureTransformTree("clearCoat.bumpTexture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/scale", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.bumpTexture.level", getFloat, () => 1),
    ]);
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/extensions/KHR_texture_transform/scale",
        clearcoatNormalTextureInterpolation.scale
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/extensions/KHR_texture_transform/offset",
        clearcoatNormalTextureInterpolation.offset
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatNormalTexture/extensions/KHR_texture_transform/rotation",
        clearcoatNormalTextureInterpolation.rotation
    );
    const clearcoatRoughnessTextureInterpolation = getTextureTransformTree("clearCoat.textureRoughness");
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale",
        clearcoatRoughnessTextureInterpolation.scale
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset",
        clearcoatRoughnessTextureInterpolation.offset
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation",
        clearcoatRoughnessTextureInterpolation.rotation
    );

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_dispersion/dispersion", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.dispersion", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_emissive_strength/emissiveStrength", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "emissiveIntensity", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_ior/ior", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "indexOfRefraction", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_iridescence/iridescenceFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.intensity", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_iridescence/iridescenceIor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.indexOfRefraction", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.minimumThickness", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.maximumThickness", getFloat, () => 1),
    ]);

    const iridescenceTextureInterpolation = getTextureTransformTree("iridescence.texture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", iridescenceTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", iridescenceTextureInterpolation.offset);
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation",
        iridescenceTextureInterpolation.rotation
    );

    const iridescenceThicknessTextureInterpolation = getTextureTransformTree("iridescence.thicknessTexture");
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale",
        iridescenceThicknessTextureInterpolation.scale
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset",
        iridescenceThicknessTextureInterpolation.offset
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation",
        iridescenceThicknessTextureInterpolation.rotation
    );

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_sheen/sheenColorFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "sheen.color", getColor3, () => 3),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "sheen.roughness", getFloat, () => 1),
    ]);

    const sheenTextureInterpolation = getTextureTransformTree("sheen.texture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", sheenTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", sheenTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", sheenTextureInterpolation.rotation);

    const sheenRoughnessTextureInterpolation = getTextureTransformTree("sheen.textureRoughness");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", sheenRoughnessTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", sheenRoughnessTextureInterpolation.offset);
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation",
        sheenRoughnessTextureInterpolation.rotation
    );

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_specular/specularFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallicF0Factor", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_specular/specularColorFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "metallicReflectanceColor", getColor3, () => 3),
    ]);

    const specularTextureInterpolation = getTextureTransformTree("metallicReflectanceTexture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", specularTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", specularTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", specularTextureInterpolation.rotation);
    const specularColorTextureInterpolation = getTextureTransformTree("reflectanceTexture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", specularColorTextureInterpolation.scale);
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset",
        specularColorTextureInterpolation.offset
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation",
        specularColorTextureInterpolation.rotation
    );

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_transmission/transmissionFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.refractionIntensity", getFloat, () => 1),
    ]);
    const transmissionTextureInterpolation = getTextureTransformTree("subSurface.refractionIntensityTexture");
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale",
        transmissionTextureInterpolation.scale
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset",
        transmissionTextureInterpolation.offset
    );
    SetInterpolationForKey(
        "/materials/{}/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation",
        transmissionTextureInterpolation.rotation
    );

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_volume/attenuationColor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "subSurface.tintColor", getColor3, () => 3),
    ]);

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_volume/attenuationDistance", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.tintColorAtDistance", getFloat, () => 1),
    ]);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_volume/thicknessFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.maximumThickness", getFloat, () => 1),
    ]);

    const thicknessTextureInterpolation = getTextureTransformTree("subSurface.thicknessTexture");
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", thicknessTextureInterpolation.scale);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", thicknessTextureInterpolation.offset);
    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", thicknessTextureInterpolation.rotation);

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.translucencyIntensity", getFloat, () => 1),
    ]);

    const diffuseTransmissionTextureInterpolation = getTextureTransformTree("subSurface.translucencyIntensityTexture");
    SetInterpolationForKey(
        "materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture/extensions/KHR_texture_transform/scale",
        diffuseTransmissionTextureInterpolation.scale
    );
    SetInterpolationForKey(
        "materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture/extensions/KHR_texture_transform/offset",
        diffuseTransmissionTextureInterpolation.offset
    );
    SetInterpolationForKey(
        "materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionTexture/extensions/KHR_texture_transform/rotation",
        diffuseTransmissionTextureInterpolation.rotation
    );

    SetInterpolationForKey("/materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorFactor", [
        new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "subSurface.translucencyColor", getColor3, () => 3),
    ]);

    const diffuseTransmissionColorTextureInterpolation = getTextureTransformTree("subSurface.translucencyColorTexture");
    SetInterpolationForKey(
        "materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture/extensions/KHR_texture_transform/scale",
        diffuseTransmissionColorTextureInterpolation.scale
    );
    SetInterpolationForKey(
        "materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture/extensions/KHR_texture_transform/offset",
        diffuseTransmissionColorTextureInterpolation.offset
    );
    SetInterpolationForKey(
        "materials/{}/extensions/KHR_materials_diffuse_transmission/diffuseTransmissionColorTexture/extensions/KHR_texture_transform/rotation",
        diffuseTransmissionColorTextureInterpolation.rotation
    );

    SetInterpolationForKey("/extensions/KHR_lights_punctual/lights/{}/color", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3, () => 3)]);
    SetInterpolationForKey("/extensions/KHR_lights_punctual/lights/{}/intensity", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "intensity", getFloat, () => 1)]);
    SetInterpolationForKey("/extensions/KHR_lights_punctual/lights/{}/range", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "range", getFloat, () => 1)]);
    SetInterpolationForKey("/extensions/KHR_lights_punctual/lights/{}/spot/innerConeAngle", [
        new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "innerAngle", getFloatBy2, () => 1),
    ]);
    SetInterpolationForKey("/extensions/KHR_lights_punctual/lights/{}/spot/outerConeAngle", [
        new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "angle", getFloatBy2, () => 1),
    ]);

    SetInterpolationForKey("/extensions/EXT_lights_area/lights/{}/color", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3, () => 3)]);
    SetInterpolationForKey("/extensions/EXT_lights_area/lights/{}/intensity", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "intensity", getFloat, () => 1)]);
    SetInterpolationForKey("/extensions/EXT_lights_area/lights/{}/size", [new AreaLightDimensionsAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "size", getFloat, () => 1)]);
    SetInterpolationForKey("/extensions/EXT_lights_area/lights/{}/rect/aspect", [
        new AreaLightDimensionsAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "aspect", getFloat, () => 1),
    ]);

    SetInterpolationForKey("/nodes/{}/extensions/EXT_lights_ies/color", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3, () => 3)]);
    SetInterpolationForKey("/nodes/{}/extensions/EXT_lights_ies/multiplier", [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "intensity", getFloat, () => 1)]);

    SetInterpolationForKey("/nodes/{}/extensions/KHR_node_visibility/visible", [new MeshAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "isVisible", getFloat, () => 1)]);
}
