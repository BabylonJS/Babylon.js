import { type Animation } from "core/Animations/animation";
import { type IAnimatable } from "core/Animations/animatable.interface";

/**
 * An animatable that may also expose child animatables (for example a skeleton and its bones).
 */
export type AnimatableWithChildren = Partial<IAnimatable> & { getAnimatables?: () => IAnimatable[] };

/**
 * Gets the animations owned by the child animatables of a target.
 * @param target - The animatable whose children are read
 * @returns The animations of all child animatables, in order
 */
export function GetChildAnimations(target: AnimatableWithChildren): Animation[] {
    return target.getAnimatables?.().flatMap((animatable) => animatable.animations ?? []) ?? [];
}

/**
 * Gets the animations owned by a target followed by the animations of its child animatables.
 * @param target - The animatable to read
 * @returns The target's own animations, then its children's
 */
export function GetAnimationsWithChildren(target: AnimatableWithChildren): Animation[] {
    return (target.animations ?? []).concat(GetChildAnimations(target));
}

/**
 * Removes an animation from the animatable that owns it: the target itself or one of its child animatables.
 * @param target - The animatable shown in the editor
 * @param animation - The animation to remove
 * @returns true if an owner was found and the animation was removed
 */
export function RemoveAnimationFromOwner(target: AnimatableWithChildren, animation: Animation): boolean {
    const owners: Partial<IAnimatable>[] = [target, ...(target.getAnimatables?.() ?? [])];
    for (const owner of owners) {
        if (owner.animations?.includes(animation)) {
            owner.animations = owner.animations.filter((a) => a !== animation);
            return true;
        }
    }
    return false;
}
