import type { Nullable } from "core/types";

import type { AnimationConfiguration } from "./lottiePlayer";
import { AnimationController } from "./rendering/animationController";

let AnimationPlayer: Nullable<AnimationController> = null;

/**
 * Default configuration for lottie animations playback.
 */
const DefaultConfiguration = {
    loopAnimation: false, // By default do not loop animations
    spriteAtlasSize: 2048, // Size of the texture atlas
    gapSize: 5, // Gap around the sprites in the atlas
    spritesCapacity: 64, // Maximum number of sprites the renderer can handle at once
    backgroundColor: { r: 1, g: 1, b: 1, a: 1 }, // Background color for the animation canvas
    scaleMultiplier: 5, // Minimum scale factor to prevent too small sprites,
    devicePixelRatio: 1, // Scale factor,
    easingSteps: 4, // Number of steps to sample easing functions for animations - Less than 4 causes issues with some interpolations
    ignoreOpacityAnimations: true, // Whether to ignore opacity animations for performance
    supportDeviceLost: false, // Whether to support device lost events for WebGL contexts,
} as const satisfies AnimationConfiguration;

onmessage = async function (evt) {
    if (evt.data.canvas && evt.data.file) {
        const canvas = evt.data.canvas as HTMLCanvasElement;
        const file = evt.data.file as string;
        const originalConfig = evt.data.config as AnimationConfiguration;
        const finalConfig: AnimationConfiguration = {
            ...DefaultConfiguration,
            ...originalConfig,
        };

        const animationData = await (await fetch(file)).text();
        AnimationPlayer = new AnimationController(canvas, animationData, finalConfig);

        postMessage({
            animationWidth: AnimationPlayer.animationWidth,
            animationHeight: AnimationPlayer.animationHeight,
        });

        AnimationPlayer.playAnimation(finalConfig.loopAnimation);
    } else if (evt.data.width && evt.data.height) {
        AnimationPlayer && AnimationPlayer.setSize(evt.data.width, evt.data.height);
    }
};
