/* eslint-disable @typescript-eslint/naming-convention */
import { Animation } from "core/Animations/animation";
import type { AnimationGroup } from "core/Animations/animationGroup";
import { Quaternion, Vector3, Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { IGLTF } from "../glTFLoaderInterfaces";
import { Material } from "core/Materials/material";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { Mesh } from "core/Meshes/mesh";
import type { Nullable } from "core/types";

export type GetGltfNodeTargetFn = (source: IGLTF, indices: string) => any;
type GetValueFn = (target: any, source: Float32Array, offset: number, scale?: number) => any;

export interface IAnimationPointerPropertyInfos {
    type: number;
    name: string;
    get: GetValueFn;
    isValid(target: any): boolean;
    buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable>, params?: any): void;
}

const parseIntIndex = (str: string) => {
    const targetIndex = parseInt(str);
    if (isNaN(targetIndex)) {
        return -1;
    }
    return targetIndex;
};

const getGltfNode: GetGltfNodeTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.nodes) {
        const i = parseIntIndex(index);
        if (i != -1) {
            return gltf.nodes[i];
        }
    }
    return null;
};

const getGltfMaterial: GetGltfNodeTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.materials) {
        const i = parseIntIndex(index);
        if (i != -1) {
            return gltf.materials[i];
        }
    }
    return null;
};

const getGltfCamera: GetGltfNodeTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.cameras) {
        const i = parseIntIndex(index);
        if (i != -1) {
            return gltf.cameras[i];
        }
    }
    return null;
};

const getGltfExtension: GetGltfNodeTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.extensions && index) {
        return gltf.extensions[index];
    }
    return null;
};

const getMatrix: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Matrix.FromArray(source, offset).scale(scale) : Matrix.FromArray(source, offset);
};

const getVector3: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Vector3.FromArray(source, offset).scaleInPlace(scale) : Vector3.FromArray(source, offset);
};

const getQuaternion: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Quaternion.FromArray(source, offset).scaleInPlace(scale) : Quaternion.FromArray(source, offset);
};

const getColor3: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Color3.FromArray(source, offset).scale(scale) : Color3.FromArray(source, offset);
};

const getAlpha: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? source[offset + 3] * scale : source[offset + 3];
};

const getFloat: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? source[offset] * scale : source[offset];
};

const getMinusFloat: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return -(scale ? source[offset] * scale : source[offset]);
};

const getNextFloat: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? source[offset + 1] * scale : source[offset + 1];
};

const getFloatBy2: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return (scale ? source[offset] * scale : source[offset]) * 2;
};

const getWeights: GetValueFn = (target: any, source: Float32Array, offset: number, scale?: number) => {
    if (target._numMorphTargets) {
        const value = new Array<number>(target._numMorphTargets!);
        for (let i = 0; i < target._numMorphTargets!; i++) {
            value[i] = scale ? source[offset++] * scale : source[offset++];
        }
        return value;
    }
    return null;
};

abstract class AbstractAnimationPointerPropertyInfos implements IAnimationPointerPropertyInfos {
    public constructor(public type: number, public name: string, public get: GetValueFn) {}

    protected _buildAnimation(
        animatable: Nullable<IAnimatable>,
        fps: number,
        keys: any[],
        babylonAnimationGroup: AnimationGroup,
        animationTargetOverride: Nullable<IAnimatable> = null
    ) {
        if (animatable || animationTargetOverride) {
            const animationName = `${babylonAnimationGroup!.name}_channel${babylonAnimationGroup.targetedAnimations.length}_${this.name}`;
            const babylonAnimation = new Animation(animationName, this.name, fps, this.type);
            babylonAnimation.setKeys(keys);

            if (animationTargetOverride != null && animationTargetOverride.animations != null) {
                animationTargetOverride.animations.push(babylonAnimation);
                babylonAnimationGroup.addTargetedAnimation(babylonAnimation, animationTargetOverride);
            } else if (animatable) {
                animatable.animations = animatable.animations || Array<Animation>(1);
                animatable.animations.push(babylonAnimation);
                babylonAnimationGroup.addTargetedAnimation(babylonAnimation, animatable);
            }
        }
    }
    public isValid(_target: any): boolean {
        return true;
    }

    public abstract buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable>, params?: any): void;
}

class TransformNodeAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn = getVector3) {
        super(type, name, get);
    }
    public isValid(target: any): boolean {
        return target._babylonTransformNode !== null && target._babylonTransformNode !== undefined;
    }

    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable> = null): void {
        return this._buildAnimation(target._babylonTransformNode, fps, keys, group, animationTargetOverride);
    }
}

class CameraAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn = getFloat) {
        super(type, name, get);
    }

    public isValid(target: any): boolean {
        return target._babylonCamera != null && target._babylonCamera !== undefined;
    }

    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable> = null): void {
        return this._buildAnimation(target._babylonCamera, fps, keys, group, animationTargetOverride);
    }
}

class MaterialAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn = getFloat, public fillMode: any = Material.TriangleFillMode) {
        super(type, name, get);
    }

    public isValid(target: any): boolean {
        const data = target._data;
        if (data) {
            const c = data[this.fillMode];
            if (c) {
                return c.babylonMaterial !== null && c.babylonMaterial !== undefined;
            }
        }
        return false;
    }

    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable> = null): void {
        return this._buildAnimation(target._data[this.fillMode].babylonMaterial, fps, keys, group, animationTargetOverride);
    }
}

class LightAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn = getFloat) {
        super(type, name, get);
    }

    public isValid(target: any): boolean {
        return target && target.length != 0;
    }

    // note : the extensions array store directly the BabylonLight reference
    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable> = null, params: any): void {
        const i = parseIntIndex(params[1]);
        const l = i >= 0 && i < target.lights.length ? target.lights[i] : null;
        return this._buildAnimation(l._babylonLight, fps, keys, group, animationTargetOverride);
    }
}

class WeightAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn = getWeights) {
        super(type, name, get);
    }
    public isValid(target: any): boolean {
        return target._numMorphTargets;
    }
    public buildAnimations(targetNode: any, fps: number, keys: any[], babylonAnimationGroup: AnimationGroup, _animationTargetOverride: Nullable<IAnimatable> = null): void {
        if (targetNode._numMorphTargets) {
            for (let targetIndex = 0; targetIndex < targetNode._numMorphTargets; targetIndex++) {
                const animationName = `${babylonAnimationGroup.name}_channel${babylonAnimationGroup.targetedAnimations.length}`;
                const babylonAnimation = new Animation(animationName, this.name, fps, this.type);
                babylonAnimation.setKeys(
                    keys.map((key) => ({
                        frame: key.frame,
                        inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                        value: key.value[targetIndex],
                        outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined,
                        interpolation: key.interpolation,
                    }))
                );

                if (targetNode._primitiveBabylonMeshes) {
                    for (const m of targetNode._primitiveBabylonMeshes) {
                        const babylonMesh = m as Mesh;
                        if (babylonMesh.morphTargetManager) {
                            const morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                            const babylonAnimationClone = babylonAnimation.clone();
                            morphTarget.animations.push(babylonAnimationClone);
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimationClone, morphTarget);
                        }
                    }
                }
            }
        }
    }
}

const CoreAnimationNodesPointerMap: any = {
    getTarget: getGltfNode,
    hasIndex: true,
    matrix: {
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_MATRIX, "matrix", getMatrix)],
    },
    translation: {
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_VECTOR3, "position")],
    },
    rotation: {
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_QUATERNION, "rotationQuaternion", getQuaternion)],
    },
    scale: {
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_VECTOR3, "scaling")],
    },
    weights: {
        getStride: (target: any) => {
            return target._numMorphTargets;
        },
        properties: [new WeightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "influence")],
    },
};

const CoreAnimationCamerasPointerMap: any = {
    hasIndex: true,
    getTarget: getGltfCamera,
    orthographic: {
        xmag: {
            properties: [
                new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "orthoLeft", getMinusFloat),
                new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "orthoRight", getNextFloat),
            ],
        },
        ymag: {
            properties: [
                new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "orthoBottom", getMinusFloat),
                new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "orthoTop", getNextFloat),
            ],
        },
        zfar: {
            properties: [new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "maxZ")],
        },
        znear: {
            properties: [new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "minZ")],
        },
    },
    perspective: {
        aspectRatio: {
            // not supported.
        },
        yfov: {
            properties: [new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "fov")],
        },
        zfar: {
            properties: [new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "maxZ")],
        },
        znear: {
            properties: [new CameraAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "minZ")],
        },
    },
};

const CoreAnimationMaterialsPointerMap: any = {
    hasIndex: true,
    getTarget: getGltfMaterial,
    pbrMetallicRoughness: {
        baseColorFactor: {
            properties: [
                new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "albedoColor", getColor3),
                new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "alpha", getAlpha),
            ],
        },
        metallicFactor: {
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "metallic")],
        },
        roughnessFactor: {
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "roughness")],
        },
        baseColorTexture: {
            extensions: {
                KHR_texture_transform: {
                    scale: {
                        properties: [
                            // MAY introduce set scale(Vector2) into texture.
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.uScale"),
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.vScale", getNextFloat),
                        ],
                    },
                    offset: {
                        properties: [
                            // MAY introduce set offset(Vector2) into texture.
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.uOffset"),
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.vOffset", getNextFloat),
                        ],
                    },
                    rotation: {
                        properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.wAng", getMinusFloat)],
                    },
                },
            },
        },
    },
    emissiveFactor: {
        properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "emissiveColor", getColor3)],
    },
    normalTexture: {
        scale: {
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "bumpTexture.level")],
        },
    },
    occlusionTexture: {
        strength: {
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTextureStrength")],
        },
        extensions: {
            KHR_texture_transform: {
                scale: {
                    properties: [
                        // MAY introduce set scale(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.uScale"),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.vScale", getNextFloat),
                    ],
                },
                offset: {
                    properties: [
                        // MAY introduce set offset(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.uOffset"),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.vOffset", getNextFloat),
                    ],
                },
                rotation: {
                    properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.wAng", getMinusFloat)],
                },
            },
        },
    },
    emissiveTexture: {
        extensions: {
            KHR_texture_transform: {
                scale: {
                    properties: [
                        // MAY introduce set scale(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.uScale"),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.vScale", getNextFloat),
                    ],
                },
                offset: {
                    properties: [
                        // MAY introduce set offset(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.uOffset"),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.vOffset", getNextFloat),
                    ],
                },
                rotation: {
                    properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.wAng", getMinusFloat)],
                },
            },
        },
    },
    extensions: {
        KHR_materials_ior: {
            ior: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "indexOfRefraction")],
            },
        },
        KHR_materials_clearcoat: {
            clearcoatFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.intensity")],
            },
            clearcoatRoughnessFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "clearCoat.roughness")],
            },
        },
        KHR_materials_sheen: {
            sheenColorFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "sheen.color", getColor3)],
            },
            sheenRoughnessFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "sheen.roughness")],
            },
        },
        KHR_materials_specular: {
            specularFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "metallicF0Factor")],
            },
            specularColorFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "metallicReflectanceColor", getColor3)],
            },
        },
        KHR_materials_emissive_strength: {
            emissiveStrength: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveIntensity")],
            },
        },
        KHR_materials_transmission: {
            transmissionFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "subSurface.refractionIntensity")],
            },
        },
        KHR_materials_volume: {
            attenuationColor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "subSurface.tintColor", getColor3)],
            },
            attenuationDistance: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "subSurface.tintColorAtDistance")],
            },
            thicknessFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "subSurface.maximumThickness")],
            },
        },
        KHR_materials_iridescence: {
            iridescenceFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.intensity")],
            },
            iridescenceIor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.indexOfRefraction")],
            },
            iridescenceThicknessMinimum: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.minimumThickness")],
            },
            iridescenceThicknessMaximum: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.maximumThickness")],
            },
        },
    },
};

const CoreAnimationExtensionsPointerMap: any = {
    getTarget: getGltfExtension,
    KHR_lights_punctual: {
        isIndex: true,
        lights: {
            hasIndex: true, // we have an array of light into the extension.
            color: {
                properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "diffuse", getColor3)],
            },
            intensity: {
                properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "intensity")],
            },
            range: {
                properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "range")],
            },
            spot: {
                innerConeAngle: {
                    properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "innerAngle", getFloatBy2)],
                },
                outerConeAngle: {
                    properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "angle", getFloatBy2)],
                },
            },
        },
    },
};

export const CoreAnimationPointerMap: any = {
    nodes: CoreAnimationNodesPointerMap,
    materials: CoreAnimationMaterialsPointerMap,
    cameras: CoreAnimationCamerasPointerMap,
    extensions: CoreAnimationExtensionsPointerMap,
};
