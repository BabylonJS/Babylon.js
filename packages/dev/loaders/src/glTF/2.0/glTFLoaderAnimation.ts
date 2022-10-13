import { Animation } from "core/Animations/animation";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import type { INode } from "./glTFLoaderInterfaces";
import type { IAnimatable } from "core/Animations/animatable.interface";

/** @internal */
export type GetValueFn = (target: any, source: Float32Array, offset: number, scale: number) => any;

/** @internal */
export function getVector3(_target: any, source: Float32Array, offset: number, scale: number): Vector3 {
    return Vector3.FromArray(source, offset).scaleInPlace(scale);
}

/** @internal */
export function getQuaternion(_target: any, source: Float32Array, offset: number, scale: number): Quaternion {
    return Quaternion.FromArray(source, offset).scaleInPlace(scale);
}

/** @internal */
export function getWeights(target: INode, source: Float32Array, offset: number, scale: number): Array<number> {
    const value = new Array<number>(target._numMorphTargets!);
    for (let i = 0; i < value.length; i++) {
        value[i] = source[offset++] * scale;
    }

    return value;
}

/** @internal */
export abstract class AnimationPropertyInfo {
    /** @internal */
    public constructor(public readonly type: number, public readonly name: string, public readonly getValue: GetValueFn, public readonly getStride: (target: any) => number) {}

    protected _buildAnimation(name: string, fps: number, keys: any[]): Animation {
        const babylonAnimation = new Animation(name, this.name, fps, this.type);
        babylonAnimation.setKeys(keys);
        return babylonAnimation;
    }

    /** @internal */
    public abstract buildAnimations(target: any, name: string, fps: number, keys: any[], callback: (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void): void;
}

/** @internal */
export class TransformNodeAnimationPropertyInfo extends AnimationPropertyInfo {
    /** @internal */
    public buildAnimations(target: INode, name: string, fps: number, keys: any[], callback: (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void): void {
        callback(target._babylonTransformNode!, this._buildAnimation(name, fps, keys));
    }
}

/** @internal */
export class WeightAnimationPropertyInfo extends AnimationPropertyInfo {
    public buildAnimations(target: INode, name: string, fps: number, keys: any[], callback: (babylonAnimatable: IAnimatable, babylonAnimation: Animation) => void): void {
        if (target._numMorphTargets) {
            for (let targetIndex = 0; targetIndex < target._numMorphTargets; targetIndex++) {
                const babylonAnimation = new Animation(`${name}_${targetIndex}`, this.name, fps, this.type);
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
    }
}

/** @internal */
export const nodeAnimationData = {
    translation: [new TransformNodeAnimationPropertyInfo(Animation.ANIMATIONTYPE_VECTOR3, "position", getVector3, () => 3)],
    rotation: [new TransformNodeAnimationPropertyInfo(Animation.ANIMATIONTYPE_QUATERNION, "rotationQuaternion", getQuaternion, () => 4)],
    scale: [new TransformNodeAnimationPropertyInfo(Animation.ANIMATIONTYPE_VECTOR3, "scaling", getVector3, () => 3)],
    weights: [new WeightAnimationPropertyInfo(Animation.ANIMATIONTYPE_FLOAT, "influence", getWeights, (target) => target._numMorphTargets!)],
};
