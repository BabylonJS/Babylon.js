import type { Scene } from "../scene";
import type { Animation } from "./animation";
import type { IAnimatable } from "./animatable.interface";

/**
 * The callback for animation iteration in scene
 */
export interface IterateAnimationCallback {
    /**
     * The callback for animation iteration in scene
     * @param animation current animation
     * @param key key of context
     * @param context object holding this animation
     * @returns false to stop the iteration
     */
    (animation: Animation, key: number | string, context: any): void | boolean;
}

/**
 * Iterate through all animations of scene, could iterate an animation many times
 * @param scene The scene holding animations
 * @param callBack function to be called on any animation
 */
export function iterateAnimations(scene: Scene, callBack: IterateAnimationCallback): void {
    const {
        animations,
        animatables,
        animationGroups,
        transformNodes,
        meshes,
        materials,
        textures,
        cameras,
        particleSystems,
        morphTargetManagers,
        skeletons,
        spriteManagers,
        postProcesses,
    } = scene;

    let len = animations?.length;
    if (len) {
        for (let i = 0; i < len; i++) {
            if (callBack(animations[i], i, animations) === false) {
                return;
            }
        }
    }

    len = animatables?.length;
    if (len) {
        for (let i = 0; i < len; i++) {
            const animatable = animatables[i];
            const runtimeAnimations = animatable.getAnimations();
            const length = runtimeAnimations?.length;
            if (length) {
                for (let j = 0; j < length; j++) {
                    const runtimeAnimation = runtimeAnimations[i];
                    const animation = runtimeAnimation?.animation;
                    if (animation && callBack(animation, "_animation", runtimeAnimation) === false) {
                        return;
                    }
                    const target = runtimeAnimation?.target;
                    if (target?.animations) {
                        const iAnimatable = target as IAnimatable;
                        const animations = iAnimatable.animations;
                        const animationsLength = animations?.length;
                        if (animations && animationsLength) {
                            for (let k = 0; k < animationsLength; k++) {
                                const animation = animations[k];
                                if (animation && callBack(animation, k, animations) === false) {
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    len = animationGroups?.length;
    if (len) {
        for (let i = 0; i < len; i++) {
            const group = animationGroups[i];
            const targetedAnimations = group?.targetedAnimations;
            let length = targetedAnimations?.length;
            if (length) {
                for (let j = 0; j < length; j++) {
                    const targetedAnimation = targetedAnimations[j];
                    const animation = targetedAnimation?.animation;
                    if (animation && callBack(animation, "animation", targetedAnimation)) {
                        return;
                    }
                    const target = targetedAnimation.target;
                    if (target?.animations) {
                        const iAnimatable = target as IAnimatable;
                        const animations = iAnimatable.animations;
                        const animationsLength = animations?.length;
                        if (animations && animationsLength) {
                            for (let k = 0; k < animationsLength; k++) {
                                const animation = animations[k];
                                if (animation && callBack(animation, k, animations) === false) {
                                    return;
                                }
                            }
                        }
                    }
                }
            }
            const animatables = group?.animatables;
            length = animatables?.length;
            if (length) {
                for (let j = 0; j < length; j++) {
                    const animatable = animatables[j];
                    const runtimeAnimations = animatable.getAnimations();
                    const length = runtimeAnimations?.length;
                    if (length) {
                        for (let k = 0; k < length; k++) {
                            const runtimeAnimation = runtimeAnimations[k];
                            if (runtimeAnimation?.animation && callBack(runtimeAnimation.animation, "_animation", runtimeAnimation) === false) {
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    len = morphTargetManagers?.length;
    if (len) {
        for (let i = 0; i < len; i++) {
            const morphTargetManager = morphTargetManagers[i];
            const targetsLength = morphTargetManager.numTargets;
            if (!targetsLength) {
                continue;
            }
            for (let j = 0; j < targetsLength; j++) {
                const target = morphTargetManager.getTarget(j);
                const animations = target?.animations;
                const length = animations?.length;
                if (!length) {
                    continue;
                }
                for (let k = 0; k < length; k++) {
                    const animation = animations[k];
                    if (animation && callBack(animation, k, animations) === false) {
                        return;
                    }
                }
            }
        }
    }

    len = skeletons?.length;
    if (len) {
        for (let i = 0; i < len; i++) {
            const skeleton = skeletons[i];
            const bones = skeleton?.bones;
            const length = bones?.length;
            if (length) {
                for (let j = 0; j < length; j++) {
                    const target = bones[j];
                    const animations = target?.animations;
                    const animationsLength = animations?.length;
                    if (!animationsLength) {
                        continue;
                    }
                    for (let k = 0; k < animationsLength; k++) {
                        const animation = animations[k];
                        if (animation && callBack(animation, k, animations) === false) {
                            return;
                        }
                    }
                }
            }
            const animations = skeleton?.animations;
            const animationsLength = animations?.length;
            if (animationsLength) {
                for (let j = 0; j < animationsLength; j++) {
                    const animation = animations[j];
                    if (animation && callBack(animation, j, animations) === false) {
                        return;
                    }
                }
            }
        }
    }

    len = spriteManagers?.length;
    if (len) {
        for (let i = 0; i < len; i++) {
            const spriteManager = spriteManagers[i];
            const sprites = spriteManager?.sprites;
            const length = sprites?.length;
            if (length) {
                for (let j = 0; j < length; j++) {
                    const target = sprites[j];
                    const animations = target?.animations;
                    const animationsLength = animations?.length;
                    if (!animationsLength) {
                        continue;
                    }
                    for (let k = 0; k < animationsLength; k++) {
                        const animation = animations[k];
                        if (animation && callBack(animation, k, animations) === false) {
                            return;
                        }
                    }
                }
            }
            const animations = spriteManager?.texture?.animations;
            const animationsLength = animations?.length;
            if (animationsLength) {
                for (let j = 0; j < animationsLength; j++) {
                    const animation = animations[j];
                    if (animation && callBack(animation, j, animations) === false) {
                        return;
                    }
                }
            }
        }
    }

    let iAnimatables: IAnimatable[] = [];

    len = transformNodes?.length;
    if (len) {
        iAnimatables = iAnimatables.concat(transformNodes);
    }
    len = meshes?.length;
    if (len) {
        iAnimatables = iAnimatables.concat(meshes);
    }
    len = cameras?.length;
    if (len) {
        iAnimatables = iAnimatables.concat(cameras);
    }
    len = materials?.length;
    if (len) {
        iAnimatables = iAnimatables.concat(materials);
    }
    len = textures?.length;
    if (len) {
        iAnimatables = iAnimatables.concat(textures);
    }
    len = particleSystems?.length;
    if (len) {
        iAnimatables = iAnimatables.concat(particleSystems);
    }
    len = postProcesses?.length;
    if (len) {
        iAnimatables = iAnimatables.concat(postProcesses);
    }

    len = iAnimatables.length;
    if (len) {
        for (let i = 0; i < len; i++) {
            const iAnimatable = iAnimatables[i];
            const animations = iAnimatable?.animations;
            const length = animations?.length;
            if (length) {
                for (let j = 0; j < length; j++) {
                    const animation = animations[j];
                    if (animation && callBack(animation, j, animations) === false) {
                        return;
                    }
                }
            }
        }
    }
}

/**
 * Replace animation from scene
 * @param scene The scene holding animation
 * @param animation The animation to be replaced
 * @param replacement The animation to be replaced to
 */
export function replaceAnimation(scene: Scene, animation: Animation, replacement: Animation): number {
    let count = 0;
    iterateAnimations(scene, (current, key, context) => {
        if (animation === current) {
            context[key] = replacement;
            count++;
        }
    });
    return count;
}

/**
 * Replace multiple animations from scene
 * @param scene The scene holding animation
 * @param map Map of animations where key holding the animation to be replaced, value holding replacement
 */
export function replaceAnimations(scene: Scene, map: Map<Animation, Animation>): number {
    let count = 0;
    iterateAnimations(scene, (current, key, context) => {
        const replacement = map.get(current);
        if (replacement) {
            context[key] = replacement;
            count++;
        }
    });
    return count;
}
