/* eslint-disable @typescript-eslint/naming-convention */

import { Animation } from "core/Animations/animation";
import type { ICamera, IKHRLightsPunctual_Light, IMaterial } from "../glTFLoaderInterfaces";
import type { IAnimatable } from "core/Animations/animatable.interface";
import { AnimationPropertyInfo, nodeAnimationData } from "../glTFLoaderAnimation";
import { Color3 } from "core/Maths/math.color";

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
    public buildAnimations(target: ICamera, name: string, fps: number, keys: any[], callback: (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void): void {
        callback(target._babylonCamera!, this._buildAnimation(name, fps, keys));
    }
}

class MaterialAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(target: IMaterial, name: string, fps: number, keys: any[], callback: (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void): void {
        for (const fillMode in target._data!) {
            callback(target._data![fillMode].babylonMaterial, this._buildAnimation(name, fps, keys));
        }
    }
}

class LightAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(
        target: IKHRLightsPunctual_Light,
        name: string,
        fps: number,
        keys: any[],
        callback: (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void
    ): void {
        callback(target._babylonLight!, this._buildAnimation(name, fps, keys));
    }
}

const nodesTree = {
    __array__: {
        __target__: true,
        ...nodeAnimationData,
    },
};

const camerasTree = {
    __array__: {
        __target__: true,
        orthographic: {
            xmag: [
                new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoLeft", getMinusFloat, () => 1),
                new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoRight", getNextFloat, () => 1),
            ],
            ymag: [
                new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoBottom", getMinusFloat, () => 1),
                new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "orthoTop", getNextFloat, () => 1),
            ],
            zfar: [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)],
            znear: [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)],
        },
        perspective: {
            yfov: [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "fov", getFloat, () => 1)],
            zfar: [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "maxZ", getFloat, () => 1)],
            znear: [new CameraAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "minZ", getFloat, () => 1)],
        },
    },
};

const materialsTree = {
    __array__: {
        __target__: true,
        pbrMetallicRoughness: {
            baseColorFactor: [
                new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "albedoColor", getColor3, () => 4),
                new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "alpha", getAlpha, () => 4),
            ],
            metallicFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallic", getFloat, () => 1)],
            roughnessFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "roughness", getFloat, () => 1)],
            baseColorTexture: {
                extensions: {
                    KHR_texture_transform: getTextureTransformTree("albedoTexture"),
                },
            },
            metallicRoughnessTexture: {
                extensions: {
                    KHR_texture_transform: getTextureTransformTree("metallicTexture"),
                },
            },
        },
        emissiveFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "emissiveColor", getColor3, () => 3)],
        normalTexture: {
            scale: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "bumpTexture.level", getFloat, () => 1)],
            extensions: {
                KHR_texture_transform: getTextureTransformTree("bumpTexture"),
            },
        },
        occlusionTexture: {
            strength: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "ambientTextureStrength", getFloat, () => 1)],
            extensions: {
                KHR_texture_transform: getTextureTransformTree("ambientTexture"),
            },
        },
        emissiveTexture: {
            extensions: {
                KHR_texture_transform: getTextureTransformTree("emissiveTexture"),
            },
        },
        extensions: {
            KHR_materials_anisotropy: {
                anisotropyStrength: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.intensity", getFloat, () => 1)],
                anisotropyRotation: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "anisotropy.angle", getFloat, () => 1)],
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("anisotropy.texture"),
                    },
                },
            },
            KHR_materials_clearcoat: {
                clearcoatFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.intensity", getFloat, () => 1)],
                clearcoatRoughnessFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.roughness", getFloat, () => 1)],
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("clearCoat.texture"),
                    },
                },
                clearcoatNormalTexture: {
                    scale: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.bumpTexture.level", getFloat, () => 1)],
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("clearCoat.bumpTexture"),
                    },
                },
                clearcoatRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("clearCoat.textureRoughness"),
                    },
                },
            },
            KHR_materials_dispersion: {
                dispersion: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.dispersion", getFloat, () => 1)],
            },
            KHR_materials_emissive_strength: {
                emissiveStrength: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "emissiveIntensity", getFloat, () => 1)],
            },
            KHR_materials_ior: {
                ior: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "indexOfRefraction", getFloat, () => 1)],
            },
            KHR_materials_iridescence: {
                iridescenceFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.intensity", getFloat, () => 1)],
                iridescenceIor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.indexOfRefraction", getFloat, () => 1)],
                iridescenceThicknessMinimum: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.minimumThickness", getFloat, () => 1)],
                iridescenceThicknessMaximum: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "iridescence.maximumThickness", getFloat, () => 1)],
                iridescenceTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("iridescence.texture"),
                    },
                },
                iridescenceThicknessTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("iridescence.thicknessTexture"),
                    },
                },
            },
            KHR_materials_sheen: {
                sheenColorFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "sheen.color", getColor3, () => 3)],
                sheenRoughnessFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "sheen.roughness", getFloat, () => 1)],
                sheenColorTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("sheen.texture"),
                    },
                },
                sheenRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("sheen.textureRoughness"),
                    },
                },
            },
            KHR_materials_specular: {
                specularFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "metallicF0Factor", getFloat, () => 1)],
                specularColorFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "metallicReflectanceColor", getColor3, () => 3)],
                specularTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("metallicReflectanceTexture"),
                    },
                },
                specularColorTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("reflectanceTexture"),
                    },
                },
            },
            KHR_materials_transmission: {
                transmissionFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.refractionIntensity", getFloat, () => 1)],
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("subSurface.refractionIntensityTexture"),
                    },
                },
            },
            KHR_materials_volume: {
                attenuationColor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "subSurface.tintColor", getColor3, () => 3)],
                attenuationDistance: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.tintColorAtDistance", getFloat, () => 1)],
                thicknessFactor: [new MaterialAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "subSurface.maximumThickness", getFloat, () => 1)],
                thicknessTexture: {
                    extensions: {
                        KHR_texture_transform: getTextureTransformTree("subSurface.thicknessTexture"),
                    },
                },
            },
        },
    },
};

const extensionsTree = {
    KHR_lights_punctual: {
        lights: {
            __array__: {
                __target__: true,
                color: [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3, () => 3)],
                intensity: [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "intensity", getFloat, () => 1)],
                range: [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "range", getFloat, () => 1)],
                spot: {
                    innerConeAngle: [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "innerAngle", getFloatBy2, () => 1)],
                    outerConeAngle: [new LightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "angle", getFloatBy2, () => 1)],
                },
            },
        },
    },
};

/** @internal */
export const animationPointerTree = {
    nodes: nodesTree,
    materials: materialsTree,
    cameras: camerasTree,
    extensions: extensionsTree,
};
