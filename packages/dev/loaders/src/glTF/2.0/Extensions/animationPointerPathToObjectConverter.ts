import { Vector3 } from "core/Maths/math.vector";
import type { IGLTF, INode } from "../glTFLoaderInterfaces";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import type { IAnimatable } from "core/Animations";
import { Animation } from "core/Animations";

export class AnimationPointerPathToObjectConverter extends GLTFPathToObjectConverter {
    constructor(public gltf: IGLTF) {
        super(gltf, gltfTree);
    }
}

export type AnimationCallback = (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void;

function buildAnimation(name: string, propertyName: string, propertyType: number, fps: number, keys: any[]): Animation {
    const babylonAnimation = new Animation(name, propertyName, fps, propertyType);
    babylonAnimation.setKeys(keys);
    return babylonAnimation;
}

const nodesTree = {
    __array__: {
        __target__: true,
        translation: {
            type: Animation.ANIMATIONTYPE_VECTOR3,
            get: (target: INode, _propertyName: string, source: Float32Array, offset: number, scale: number) => {
                return getVector3(target, source, offset, scale);
            },
            extras: {
                babylonPropertyNames: ["position"],
                strides: [() => 3],
                buildAnimations: (target: INode, name: string, _propertyName: string, fps: number, keys: any[], callback: AnimationCallback) => {
                    callback(target._babylonTransformNode!, buildAnimation(name, "position", Animation.ANIMATIONTYPE_VECTOR3, fps, keys));
                },
            },
        },
        weights: {
            type: Animation.ANIMATIONTYPE_FLOAT,
            get: (target: INode, _propertyName: string, source: Float32Array, offset: number, scale: number) => {
                return getWeights(target, source, offset, scale);
            },
            extras: {
                babylonPropertyNames: ["influence"],
                strides: [(target: any) => target._numMorphTargets!],
                buildAnimations: (target: INode, name: string, _propertyName: string, fps: number, keys: any[], callback: AnimationCallback) => {
                    if (target._numMorphTargets) {
                        for (let targetIndex = 0; targetIndex < target._numMorphTargets; targetIndex++) {
                            const babylonAnimation = new Animation(`${name}_${targetIndex}`, name, fps, Animation.ANIMATIONTYPE_FLOAT);
                            babylonAnimation.setKeys(
                                keys.map((key) => ({
                                    frame: key.frame,
                                    inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                                    value: key.value[targetIndex],
                                    outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined,
                                    interpolation: key.interpolation,
                                }))
                            );

                            if (target._primitiveBabylonMeshes) {
                                for (const babylonMesh of target._primitiveBabylonMeshes) {
                                    if (babylonMesh.morphTargetManager) {
                                        const morphTarget = babylonMesh.morphTargetManager.getTarget(targetIndex);
                                        const babylonAnimationClone = babylonAnimation.clone();
                                        morphTarget.animations.push(babylonAnimationClone);
                                        callback(morphTarget, babylonAnimationClone);
                                    }
                                }
                            }
                        }
                    }
                },
            },
        },
    },
};

const gltfTree = {
    nodes: nodesTree,
};

/** @internal */
export function getVector3(_target: INode, source: Float32Array, offset: number, scale: number): Vector3 {
    return Vector3.FromArray(source, offset).scaleInPlace(scale);
}

/** @internal */
export function getWeights(target: INode, source: Float32Array, offset: number, scale: number): Array<number> {
    const value = new Array<number>(target._numMorphTargets!);
    for (let i = 0; i < value.length; i++) {
        value[i] = source[offset++] * scale;
    }

    return value;
}
