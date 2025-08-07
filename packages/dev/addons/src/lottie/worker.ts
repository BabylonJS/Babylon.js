import type { AnimationConfiguration } from "./lottiePlayer";
import { AnimationController } from "./rendering/animationController";

let AnimationPlayer: AnimationController | null = null;

const LoopAnimation = false; // By default do not loop animations
const SpriteAtlasSize = 2048; // Size of the texture atlas
const GapSize = 5; // Gap around the sprites in the atlas
const Capacity = 64; // Maximum number of sprites the renderer can handle at once
const White = { r: 1, g: 1, b: 1, a: 0 }; // Background color for the animation canvas
const ScaleMultiplier = 5; // Minimum scale factor to prevent too small sprites
const DevicePixelRatio = 1; // Scale factor
const EasingSteps = 4; // Number of steps to sample easing functions for animations - Less than 4 causes issues with some interpolations
const IgnoreOpacityAnimations = true; // Whether to ignore opacity animations for performance
const SupportDeviceLost = false; // Whether to support device lost events for WebGL contexts

onmessage = async function (evt) {
    if (evt.data.canvas && evt.data.file) {
        const canvas = evt.data.canvas as HTMLCanvasElement;
        const file = evt.data.file as string;
        const originalConfig = evt.data.config as AnimationConfiguration | undefined;
        const configuration = {
            loopAnimation: originalConfig?.loopAnimation ?? LoopAnimation,
            spriteAtlasSize: originalConfig?.spriteAtlasSize || SpriteAtlasSize,
            gapSize: originalConfig?.gapSize || GapSize,
            spritesCapacity: originalConfig?.spritesCapacity || Capacity,
            backgroundColor: originalConfig?.backgroundColor || White,
            scaleMultiplier: originalConfig?.scaleMultiplier || ScaleMultiplier,
            devicePixelRatio: originalConfig?.devicePixelRatio || DevicePixelRatio,
            easingSteps: originalConfig?.easingSteps || EasingSteps,
            ignoreOpacityAnimations: originalConfig?.ignoreOpacityAnimations ?? IgnoreOpacityAnimations,
            supportDeviceLost: originalConfig?.supportDeviceLost ?? SupportDeviceLost,
        } as Required<AnimationConfiguration>;

        const animationData = await (await fetch(file)).text();
        AnimationPlayer = new AnimationController(canvas, configuration);
        AnimationPlayer.initialize(animationData);

        postMessage({
            animationWidth: AnimationPlayer.animationWidth,
            animationHeight: AnimationPlayer.animationHeight,
        });

        AnimationPlayer.playAnimation(configuration.loopAnimation);
    } else if (evt.data.width && evt.data.height && AnimationPlayer) {
        AnimationPlayer && AnimationPlayer.setSize(evt.data.width, evt.data.height);
    }
};
