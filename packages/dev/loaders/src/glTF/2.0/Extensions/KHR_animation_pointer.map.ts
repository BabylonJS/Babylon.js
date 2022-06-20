import { Animation } from "core/Animations/animation";
import type { AnimationGroup } from "core/Animations/animationGroup";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { IGLTF, INode } from "../glTFLoaderInterfaces";
import { Material } from "core/Materials/material";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Mesh } from "core/Meshes/mesh";

type GetTargetFn = (source: IGLTF, index: string) => any | null;
export type GetValueFn = (target: any, source: Float32Array, offset: number, scale?: number) => any;
export type GetStrideFn = (target: any) => number;

export interface IAnimationPointerPropertyInfos {
    type: number;
    name: string;
    get: GetValueFn;
    isValid(target: any):boolean;
    buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup): void;
}

const parseIntIndex = (str: string) => {
    const targetIndex = parseInt(str);
    if (isNaN(targetIndex)) {
        return -1;
    }
    return targetIndex;
};

const _getNode: GetTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.nodes) {
        const i = parseIntIndex(index);
        if (i != -1) {
            return gltf.nodes[i];
        }
    }
    return null;
};

const _getMaterial: GetTargetFn = (gltf: IGLTF, index: string) => {
    if (gltf.materials) {
        const i = parseIntIndex(index);
        if (i != -1) {
            return gltf.materials[i];
        }
    }
    return null;
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
    if( target._numMorphTargets){
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

    protected _buildAnimation(animatable: IAnimatable, fps: number, keys: any[], babylonAnimationGroup: AnimationGroup) {
        if (animatable) {
            const animationName = `${babylonAnimationGroup!.name}_channel${babylonAnimationGroup.targetedAnimations.length}_${this.name}`;
            const babylonAnimation = new Animation(animationName, this.name, fps, this.type);
            babylonAnimation.setKeys(keys);

            animatable.animations = animatable.animations || Array<Animation>(1);
            animatable.animations.push(babylonAnimation);
            babylonAnimationGroup.addTargetedAnimation(babylonAnimation, animatable);
        }
    }
    public isValid(_target: any):boolean{ return true; }

    public abstract buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup): void;
}

class TransformNodeAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn) {
        super(type, name, get);
    }
    public isValid(target: any):boolean{ return target._babylonTransformNode !== null &&  target._babylonTransformNode !== undefined; }

    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup): void {
        return this._buildAnimation(target._babylonTransformNode, fps, keys, group);
    }
}

class MaterialAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {
    public constructor(type: number, name: string, get: GetValueFn, public fillMode: any = Material.TriangleFillMode) {
        super(type, name, get);
    }

    public isValid(target: any) : boolean { 
        const data = target._data;
        if(data) {
            const c =  data[this.fillMode] ;
            if(c){
                return c.babylonMaterial !== null && c.babylonMaterial !== undefined ;
            }
        }
        return false;
    }

    public buildAnimations(target: any, fps: number, keys: any[], group: AnimationGroup): void {
        return this._buildAnimation(target._data[this.fillMode].babylonMaterial, fps, keys, group);
    }
}

class WeightAnimationPointerPropertyInfos extends AbstractAnimationPointerPropertyInfos {

    public constructor(type: number, name: string, get: GetValueFn) {
        super(type, name, get);
    }
    public isValid(target: any) : boolean { 
        return target._numMorphTargets ;
    }
    public buildAnimations(targetNode: any, fps: number, keys: any[], babylonAnimationGroup: AnimationGroup): void {

        if(targetNode._numMorphTargets){
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
    hasIndex: true,
    translation: {
        getTarget: _getNode,
        getStride: (_target: any) => {
            return 3;
        },
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_VECTOR3, "position", _getVector3)],
    },
    rotation: {
        getTarget: _getNode,
        getStride: (_target: any) => {
            return 4;
        },
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_QUATERNION, "rotationQuaternion", _getQuaternion)],
    },
    scale: {
        getTarget: _getNode,
        getStride: (_target: any) => {
            return 3;
        },
        properties: [new TransformNodeAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_VECTOR3, "scaling", _getVector3)],
    },
    weight: {
        getTarget: _getNode,
        getStride: (target: any) => {
            return target._numMorphTargets;
        },
        properties: [new WeightAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "influence", _getWeights)],
    },
};

const CoreAnimationMaterialsPointerMap: any = {
    hasIndex: true,
    pbrMetallicRoughness: {
        baseColorFactor: {
            getTarget: _getMaterial,
            getStride: (_target: any) => {
                return 4;
            },
            properties: [
                new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_COLOR3, "albedoColor", _getColor3),
                new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "alpha", _getAlpha),
            ],
        },
        metallicFactor: {
            getTarget: _getMaterial,
            getStride: (_target: any) => {
                return 1;
            },
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "metallic", _getFloat)],
        },
        roughnessFactor: {
            getTarget: _getMaterial,
            getStride: (_target: any) => {
                return 1;
            },
            properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "roughness", _getFloat)],
        },
    },
    emissiveFactor: {
        getTarget: _getMaterial,
        getStride: (_target: any) => {
            return 1;
        },
        properties: [new MaterialAnimationPointerPropertyInfos(Animation.ANIMATIONTYPE_FLOAT, "emissive", _getFloat)],
    },
};

const CoreAnimationCamerasPointerMap: any = {
    hasIndex: true,
};

export const CoreAnimationPointerMap: any = {
    nodes: CoreAnimationNodesPointerMap,
    materials: CoreAnimationMaterialsPointerMap,
    cameras: CoreAnimationCamerasPointerMap,
};
