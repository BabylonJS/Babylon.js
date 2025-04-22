import type { Scene } from "core/scene";

/**
 * Interface used to define the optimization options for animations
 */
export type AnimationOptimization =
    | {
          /**
           * Do not merge runtime animations
           * @defaultValue true
           */
          mergeRuntimeAnimations: false;
      }
    | {
          /**
           * All runtime animations will be merged into the first animatable
           * @defaultValue true
           */
          mergeRuntimeAnimations: true;
          /**
           * If true, all keyframes evaluation will be merged from the first runtime animation
           * You need to turn on `mergeRuntimeAnimations` for this to work
           * @defaultValue false
           */
          mergeKeyFrames: boolean;
      };

/**
 * This is a destructive optimization that merges all animatables into the first one.
 * That animatable will also host all the runtime animations.
 * We expect that all the animatables are on the same timeframe (same start, end, loop, etc..)
 * @param scene defines the scene to optimize
 * @param options defines the optimization options
 */
export function OptimizeAnimations(scene: Scene, options: Partial<AnimationOptimization> = {}) {
    const mergeRuntimeAnimations = options.mergeRuntimeAnimations ?? true;
    const mergeKeyFrames = options.mergeRuntimeAnimations === true ? (options.mergeKeyFrames ?? false) : false;

    // We will go through all the current animatables and merge them
    const animatables = scene.animatables;

    if (animatables.length === 0) {
        return;
    }

    const mainAnimatable = animatables[0];

    for (let i = 1; i < animatables.length; i++) {
        const animatable = animatables[i];

        // Merge the current animatable with the main one
        mainAnimatable._runtimeAnimations.push(...animatable._runtimeAnimations);
    }

    if (mergeRuntimeAnimations && mainAnimatable._runtimeAnimations.length > 1) {
        // Make sure only one runtime animation is driving the beat
        const mainRuntimeAnimation = mainAnimatable._runtimeAnimations[0];
        for (let i = 1; i < mainAnimatable._runtimeAnimations.length; i++) {
            const runtimeAnimation = mainAnimatable._runtimeAnimations[i];
            runtimeAnimation._coreRuntimeAnimation = mainRuntimeAnimation;
        }
    }

    if (mergeKeyFrames && mainAnimatable._runtimeAnimations.length > 1) {
        // Merge the keyframes from all the runtime animations into the first one
        const mainAnimation = mainAnimatable._runtimeAnimations[0]._animation;
        for (let i = 1; i < mainAnimatable._runtimeAnimations.length; i++) {
            const runtimeAnimation = mainAnimatable._runtimeAnimations[i];
            const animation = runtimeAnimation._animation;
            animation._coreAnimation = mainAnimation;
        }
    }

    scene._activeAnimatables = [mainAnimatable];
}
