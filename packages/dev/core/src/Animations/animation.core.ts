import type { Scene } from "core/scene";
import type { EasingFunction } from "./easing";
import type { Nullable } from "core/types";
import { Animation } from "./animation";
import { BeginAnimation, BeginDirectAnimation, BeginDirectHierarchyAnimation } from "./animatable.core";
import type { Node } from "../node";
import type { Animatable } from "./animatable.core";

/**
 * Create and start an animation on a node
 * @param name defines the name of the global animation that will be run on all nodes
 * @param target defines the target where the animation will take place
 * @param targetProperty defines property to animate
 * @param framePerSecond defines the number of frame per second yo use
 * @param totalFrame defines the number of frames in total
 * @param from defines the initial value
 * @param to defines the final value
 * @param loopMode defines which loop mode you want to use (off by default)
 * @param easingFunction defines the easing function to use (linear by default)
 * @param onAnimationEnd defines the callback to call when animation end
 * @param scene defines the hosting scene
 * @returns the animatable created for this animation
 */
export function CreateAndStartAnimation(
    name: string,
    target: any,
    targetProperty: string,
    framePerSecond: number,
    totalFrame: number,
    from: any,
    to: any,
    loopMode?: number,
    easingFunction?: EasingFunction,
    onAnimationEnd?: () => void,
    scene?: Scene
): Nullable<Animatable> {
    const animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

    if (!animation) {
        return null;
    }

    if (target.getScene) {
        scene = target.getScene();
    }

    if (!scene) {
        return null;
    }

    return BeginDirectAnimation(scene, target, [animation], 0, totalFrame, animation.loopMode === 1, 1.0, onAnimationEnd);
}

/**
 * Create and start an animation on a node and its descendants
 * @param name defines the name of the global animation that will be run on all nodes
 * @param node defines the root node where the animation will take place
 * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used
 * @param targetProperty defines property to animate
 * @param framePerSecond defines the number of frame per second to use
 * @param totalFrame defines the number of frames in total
 * @param from defines the initial value
 * @param to defines the final value
 * @param loopMode defines which loop mode you want to use (off by default)
 * @param easingFunction defines the easing function to use (linear by default)
 * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
 * @returns the list of animatables created for all nodes
 * @example https://www.babylonjs-playground.com/#MH0VLI
 */
export function CreateAndStartHierarchyAnimation(
    name: string,
    node: Node,
    directDescendantsOnly: boolean,
    targetProperty: string,
    framePerSecond: number,
    totalFrame: number,
    from: any,
    to: any,
    loopMode?: number,
    easingFunction?: EasingFunction,
    onAnimationEnd?: () => void
): Nullable<Animatable[]> {
    const animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

    if (!animation) {
        return null;
    }

    const scene = node.getScene();
    return BeginDirectHierarchyAnimation(scene, node, directDescendantsOnly, [animation], 0, totalFrame, animation.loopMode === 1, 1.0, onAnimationEnd);
}

/**
 * Creates a new animation, merges it with the existing animations and starts it
 * @param name Name of the animation
 * @param node Node which contains the scene that begins the animations
 * @param targetProperty Specifies which property to animate
 * @param framePerSecond The frames per second of the animation
 * @param totalFrame The total number of frames
 * @param from The frame at the beginning of the animation
 * @param to The frame at the end of the animation
 * @param loopMode Specifies the loop mode of the animation
 * @param easingFunction (Optional) The easing function of the animation, which allow custom mathematical formulas for animations
 * @param onAnimationEnd Callback to run once the animation is complete
 * @returns Nullable animation
 */
export function CreateMergeAndStartAnimation(
    name: string,
    node: Node,
    targetProperty: string,
    framePerSecond: number,
    totalFrame: number,
    from: any,
    to: any,
    loopMode?: number,
    easingFunction?: EasingFunction,
    onAnimationEnd?: () => void
): Nullable<Animatable> {
    const animation = Animation._PrepareAnimation(name, targetProperty, framePerSecond, totalFrame, from, to, loopMode, easingFunction);

    if (!animation) {
        return null;
    }

    node.animations.push(animation);

    return BeginAnimation(node.getScene(), node, 0, totalFrame, animation.loopMode === 1, 1.0, onAnimationEnd);
}

/**
 * Transition property of an host to the target Value
 * @param property The property to transition
 * @param targetValue The target Value of the property
 * @param host The object where the property to animate belongs
 * @param scene Scene used to run the animation
 * @param frameRate Framerate (in frame/s) to use
 * @param transition The transition type we want to use
 * @param duration The duration of the animation, in milliseconds
 * @param onAnimationEnd Callback trigger at the end of the animation
 * @returns Nullable animation
 */
export function TransitionTo(
    property: string,
    targetValue: any,
    host: any,
    scene: Scene,
    frameRate: number,
    transition: Animation,
    duration: number,
    onAnimationEnd: Nullable<() => void> = null
): Nullable<Animatable> {
    if (duration <= 0) {
        host[property] = targetValue;
        if (onAnimationEnd) {
            onAnimationEnd();
        }
        return null;
    }

    const endFrame: number = frameRate * (duration / 1000);

    transition.setKeys([
        {
            frame: 0,
            value: host[property].clone ? host[property].clone() : host[property],
        },
        {
            frame: endFrame,
            value: targetValue,
        },
    ]);

    if (!host.animations) {
        host.animations = [];
    }

    host.animations.push(transition);

    const animation: Animatable = BeginAnimation(scene, host, 0, endFrame, false);
    animation.onAnimationEnd = onAnimationEnd;
    return animation;
}
