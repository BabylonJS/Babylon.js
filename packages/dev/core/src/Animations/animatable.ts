import type { Nullable } from "../types";
import type { Vector3 } from "../Maths/math.vector";
import { Bone } from "../Bones/bone";
import type { Node } from "../node";
import { AddAnimationExtensions } from "./animatable.core";
import type { Animatable } from "./animatable.core";
import type { Animation } from "./animation";
import { Scene } from "core/scene";

export * from "./animatable.core";

declare module "../scene" {
    export interface Scene {
        /**
         * Sort active animatables based on their playOrder property
         */
        sortActiveAnimatables(): void;

        /**
         * Will start the animation sequence of a given target
         * @param target defines the target
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param weight defines the weight to apply to the animation (1.0 by default)
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @param targetMask defines if the target should be animated if animations are present (this is called recursively on descendant animatables regardless of return value)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the animatable object created for this animation
         */
        beginWeightedAnimation(
            target: any,
            from: number,
            to: number,
            weight: number,
            loop?: boolean,
            speedRatio?: number,
            onAnimationEnd?: () => void,
            animatable?: Animatable,
            targetMask?: (target: any) => boolean,
            onAnimationLoop?: () => void,
            isAdditive?: boolean
        ): Animatable;

        /**
         * Will start the animation sequence of a given target
         *
         * Note that it is possible that the value(s) of speedRatio from and to will be changed if the animation is inverted
         * @param target defines the target
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @param stopCurrent defines if the current animations must be stopped first (true by default)
         * @param targetMask defines if the target should be animate if animations are present (this is called recursively on descendant animatables regardless of return value)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the animatable object created for this animation
         */
        beginAnimation(
            target: any,
            from: number,
            to: number,
            loop?: boolean,
            speedRatio?: number,
            onAnimationEnd?: () => void,
            animatable?: Animatable,
            stopCurrent?: boolean,
            targetMask?: (target: any) => boolean,
            onAnimationLoop?: () => void,
            isAdditive?: boolean
        ): Animatable;

        /**
         * Will start the animation sequence of a given target and its hierarchy
         * @param target defines the target
         * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param from defines from which frame should animation start
         * @param to defines until which frame should animation run.
         * @param loop defines if the animation loops
         * @param speedRatio defines the speed in which to run the animation (1.0 by default)
         * @param onAnimationEnd defines the function to be executed when the animation ends
         * @param animatable defines an animatable object. If not provided a new one will be created from the given params
         * @param stopCurrent defines if the current animations must be stopped first (true by default)
         * @param targetMask defines if the target should be animated if animations are present (this is called recursively on descendant animatables regardless of return value)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the list of created animatables
         */
        beginHierarchyAnimation(
            target: any,
            directDescendantsOnly: boolean,
            from: number,
            to: number,
            loop?: boolean,
            speedRatio?: number,
            onAnimationEnd?: () => void,
            animatable?: Animatable,
            stopCurrent?: boolean,
            targetMask?: (target: any) => boolean,
            onAnimationLoop?: () => void,
            isAdditive?: boolean
        ): Animatable[];

        /**
         * Begin a new animation on a given node
         *
         * Note that it is possible that the value(s) of speedRatio from and to will be changed if the animation is inverted
         * @param target defines the target where the animation will take place
         * @param animations defines the list of animations to start
         * @param from defines the initial value
         * @param to defines the final value
         * @param loop defines if you want animation to loop (off by default)
         * @param speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the list of created animatables
         */
        beginDirectAnimation(
            target: any,
            animations: Animation[],
            from: number,
            to: number,
            loop?: boolean,
            speedRatio?: number,
            onAnimationEnd?: () => void,
            onAnimationLoop?: () => void,
            isAdditive?: boolean
        ): Animatable;

        /**
         * Begin a new animation on a given node and its hierarchy
         * @param target defines the root node where the animation will take place
         * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param animations defines the list of animations to start
         * @param from defines the initial value
         * @param to defines the final value
         * @param loop defines if you want animation to loop (off by default)
         * @param speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @param onAnimationLoop defines the callback to call when an animation loops
         * @param isAdditive defines whether the animation should be evaluated additively (false by default)
         * @returns the list of animatables created for all nodes
         */
        beginDirectHierarchyAnimation(
            target: Node,
            directDescendantsOnly: boolean,
            animations: Animation[],
            from: number,
            to: number,
            loop?: boolean,
            speedRatio?: number,
            onAnimationEnd?: () => void,
            onAnimationLoop?: () => void,
            isAdditive?: boolean
        ): Animatable[];

        /**
         * Gets the animatable associated with a specific target
         * @param target defines the target of the animatable
         * @returns the required animatable if found
         */
        getAnimatableByTarget(target: any): Nullable<Animatable>;

        /**
         * Gets all animatables associated with a given target
         * @param target defines the target to look animatables for
         * @returns an array of Animatables
         */
        getAllAnimatablesByTarget(target: any): Array<Animatable>;

        /**
         * Stops and removes all animations that have been applied to the scene
         */
        stopAllAnimations(): void;
    }
}

declare module "../Bones/bone" {
    export interface Bone {
        /**
         * Copy an animation range from another bone
         * @param source defines the source bone
         * @param rangeName defines the range name to copy
         * @param frameOffset defines the frame offset
         * @param rescaleAsRequired defines if rescaling must be applied if required
         * @param skelDimensionsRatio defines the scaling ratio
         * @returns true if operation was successful
         */
        copyAnimationRange(source: Bone, rangeName: string, frameOffset: number, rescaleAsRequired: boolean, skelDimensionsRatio: Nullable<Vector3>): boolean;
    }
}

// Connect everything!
AddAnimationExtensions(Scene, Bone);
