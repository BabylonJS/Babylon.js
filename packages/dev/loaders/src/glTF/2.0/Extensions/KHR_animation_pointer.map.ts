/* eslint-disable @typescript-eslint/naming-convention */
import { Animation } from "core/Animations/animation";
import type { AnimationGroup } from "core/Animations/animationGroup";
import { Quaternion, Vector3, Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { IGLTF, INode } from "../glTFLoaderInterfaces";
import { Material } from "core/Materials/material";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes/mesh";
import type { Nullable } from "core/types";

export type GetGltfNodeTargetFn = (source: IGLTF, indices: string) => any;
export type GetValueFn = (target: any, source: Float32Array, offset: number, scale?: number) => any;
export type GetStrideFn = (target: any) => number;

export interface IAnimationPointerPropertyInfos {
    type: number;
    name: string;
    get: GetValueFn;
    isValid(target: any): boolean;
    buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable>, params?: any): void;
}

const _parseIntIndex = (str: string) => {
    const targetIndex = parseInt(str);
    if (isNaN(targetIndex)) {
        return -1;
    }
    return targetIndex;
};

const _getGltfNode: GetGltfNodeTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.nodes) {
        const i = _parseIntIndex(index);
        if (i != -1) {
            return gltf.nodes[i];
        }
    }
    return null;
};

const _getGltfMaterial: GetGltfNodeTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.materials) {
        const i = _parseIntIndex(index);
        if (i != -1) {
            return gltf.materials[i];
        }
    }
    return null;
};

const _getGltfExtension: GetGltfNodeTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.extensions && index) {
        return gltf.extensions[index];
    }
    return null;
};

const _getMatrix: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Matrix.FromArray(source, offset).scale(scale) : Matrix.FromArray(source, offset);
};

const _getVector3: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Vector3.FromArray(source, offset).scaleInPlace(scale) : Vector3.FromArray(source, offset);
};

const _getQuaternion: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Quaternion.FromArray(source, offset).scaleInPlace(scale) : Quaternion.FromArray(source, offset);
};

const _getColor3: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? Color3.FromArray(source, offset).scale(scale) : Color3.FromArray(source, offset);
};

const _getAlpha: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? source[offset + 3] * scale : source[offset + 3];
};

const _getFloat: GetValueFn = (_target: any, source: Float32Array, offset: number, scale?: number) => {
    return scale ? source[offset] * scale : source[offset];
};

const _getWeights: GetValueFn = (target: any, source: Float32Array, offset: number, scale?: number) => {
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
    public constructor(type: number, name: string, get: GetValueFn) {
        super(type, name, get);
    }
    public isValid(target: any): boolean {
        return target._babylonTransformNode !== null && target._babylonTransformNode !== undefined;
    }

    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable> = null): void {
        return this._buildAnimation(target._babylonTransformNode, fps, keys, group, animationTargetOverride);
    }
}

class MaterialAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn, public fillMode: any = Material.TriangleFillMode) {
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
    public constructor(type: number, name: string, get: GetValueFn, public fillMode: any = Material.TriangleFillMode) {
        super(type, name, get);
    }

    public isValid(target: any): boolean {
        return target && target.length != 0;
    }

    // note : the extensions array store directly the BabylonLight reference
    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup, animationTargetOverride: Nullable<IAnimatable> = null, params: any): void {
        const i = _parseIntIndex(params[1]);
        const l = i >= 0 && i < target.lights.length ? target.lights[i] : null ;
        return this._buildAnimation(l, fps, keys, group, animationTargetOverride);
    }
}

class WeightAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn) {
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

                this._forEachPrimitive(targetNode, (babylonAbstractMesh: AbstractMesh) => {
                    const babylonMesh = babylonAbstractMesh as Mesh;
                    if (babylonMesh.morphTargetManager) {
                        const morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                        const babylonAnimationClone = babylonAnimation.clone();
                        morphTarget.animations.push(babylonAnimationClone);
                        babylonAnimationGroup.addTargetedAnimation(babylonAnimationClone, morphTarget);
                    }
                });
            }
        }
    }

    private _forEachPrimitive(node: INode, callback: (babylonMesh: AbstractMesh) => void): void {
        if (node._primitiveBabylonMeshes) {
            for (const babylonMesh of node._primitiveBabylonMeshes) {
                callback(babylonMesh);
            }
        }
    }
}

const CoreAnimationNodesPointerMap: any = {
    getTarget: _getGltfNode,
    hasIndex: true,
    matrix: {
         properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_MATRIX, "matrix", _getMatrix)],
    },
    translation: {
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_VECTOR3, "position", _getVector3)],
    },
    rotation: {
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_QUATERNION, "rotationQuaternion", _getQuaternion)],
    },
    scale: {
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_VECTOR3, "scaling", _getVector3)],
    },
    weights: {
        getStride: (target: any) => {
            return target._numMorphTargets;
        },
        properties: [new WeightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "influence", _getWeights)],
    },
};

const CoreAnimationCamerasPointerMap: any = {
    hasIndex: true,
};

const CoreAnimationMaterialsPointerMap: any = {
    hasIndex: true,
    getTarget: _getGltfMaterial,
    pbrMetallicRoughness: {
        baseColorFactor: {
            properties: [
                new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "albedoColor", _getColor3),
                new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "alpha", _getAlpha),
            ],
        },
        metallicFactor: {
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "metallic", _getFloat)],
        },
        roughnessFactor: {
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "roughness", _getFloat)],
        },
        baseColorTexture: {
            extensions: {
                KHR_texture_transform: {
                    scale: {
                         properties: [
                            // MAY introduce set scale(Vector2) into texture.
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.uScale", _getFloat),
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.vScale", _getFloat),
                        ],
                    },
                    offset: {
                         properties: [
                            // MAY introduce set offset(Vector2) into texture.
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.uOffset", _getFloat),
                            new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "albedoTexture.vOffset", _getFloat),
                        ],
                    },
                },
            },
        },
    },
    emissiveFactor: {
         properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "emissiveColor", _getColor3)],
    },
    normalTexture: {
        scale: {
             properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "bumpTexture.level", _getFloat)],
        },
    },
    occlusionTexture: {
        strength: {
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTextureStrength", _getFloat)],
        },
        extensions: {
            KHR_texture_transform: {
                scale: {
                    properties: [
                        // MAY introduce set scale(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.uScale", _getFloat),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.vScale", _getFloat),
                    ],
                },
                offset: {
                    properties: [
                        // MAY introduce set offset(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.uOffset", _getFloat),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "ambientTexture.vOffset", _getFloat),
                    ],
                },
            },
        },    },
    emissiveTexture: {
        extensions: {
            KHR_texture_transform: {
                scale: {
                    properties: [
                        // MAY introduce set scale(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.uScale", _getFloat),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.vScale", _getFloat),
                    ],
                },
                offset: {
                    properties: [
                        // MAY introduce set offset(Vector2) into texture.
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.uOffset", _getFloat),
                        new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveTexture.vOffset", _getFloat),
                    ],
                },
            },
        },
    },
    extensions: {
        KHR_materials_emissive_strength: {
            emissiveStrength: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissiveIntensity", _getFloat)],
            },
        },
        KHR_materials_transmission: {
            transmissionFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "subSurface.refractionIntensity", _getFloat)],
            },
        },
        KHR_materials_volume: {
            attenuationColor:{
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "subSurface.tintColor", _getColor3)],
            },
            attenuationDistance: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "subSurface.tintColorAtDistance", _getFloat)],
            },
            thicknessFactor: {
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "subSurface.maximumThickness", _getFloat)],
            },        
        },
        KHR_materials_iridescence :{
            iridescenceFactor :{
                 properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.intensity", _getFloat)],
            },
            iridescenceIor :{
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.indexOfRefraction", _getFloat)],
            },
            iridescenceThicknessMinimum :{
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.minimumThickness", _getFloat)],
            },
            iridescenceThicknessMaximum :{
                properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "iridescence.maximumThickness", _getFloat)],
            },
        },
    },
};

const CoreAnimationExtensionsPointerMap: any = {
    getTarget: _getGltfExtension,
    KHR_lights_punctual: {
        isIndex: true,
        lights: {
            hasIndex: true, // we have an array of light into the extension.
            color: {
                properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "diffuseColor", _getColor3)],
            },
            intensity: {
                properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "intensity", _getFloat)],
            },
            range: {
                properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "range", _getFloat)],
            },
            spot: {
                innerConeAngle: {
                     properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "innerAngle", _getFloat)],
                },
                outerConeAngle: {
                    properties: [new LightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "angle", _getFloat)],
                },
            },
        },
    }
};

export const CoreAnimationPointerMap: any = {
    nodes: CoreAnimationNodesPointerMap,
    materials: CoreAnimationMaterialsPointerMap,
    cameras: CoreAnimationCamerasPointerMap,
    extensions: CoreAnimationExtensionsPointerMap,
};
