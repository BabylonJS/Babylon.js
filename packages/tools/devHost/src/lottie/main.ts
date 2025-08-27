import type { AnimationConfiguration } from "lottie-player/animationConfiguration";
import { Player } from "lottie-player/player";
import { LocalPlayer } from "lottie-player/localPlayer";

/** Main entry point for the default scene for lottie-player */
export async function Main(): Promise<void> {
    const div = document.getElementById("main-div") as HTMLDivElement; // The player will be inside this div

    // You can also pass a local file that you are serving from the devhost public folder to test: const fileUrl = './myLottieFile.json'
    const searchParams = new URLSearchParams(window.location.search);
    const filename = searchParams.get("file") || "triangles_noParents_noCross.json";
    const fileUrl = `https://assets.babylonjs.com/lottie/${filename}`;

    // Whether to use a web worker for rendering or not, defaults to true
    const useWorkerParam = searchParams.get("useWorker");
    const useWorker = useWorkerParam !== "false"; // Default to true if not specified

    // These are variables that will be replaced in the lottie file if it contains them. You can replace with them text strings and text fill colors
    const variables = new Map<string, string>();

    // This is the configuration for the player, you can pass as much or as little as you want, the rest will be defaulted
    const configuration: AnimationConfiguration = {
        loopAnimation: false, // By default do not loop animations
        spriteAtlasWidth: 4096, // Size of the texture atlas
        spriteAtlasHeight: 4096, // Size of the texture atlas
        gapSize: 5, // Gap around the sprites in the atlas
        spritesCapacity: 64, // Maximum number of sprites the renderer can handle at once
        backgroundColor: { r: 1, g: 1, b: 1, a: 1 }, // Background color for the animation canvas
        scaleMultiplier: 5, // Minimum scale factor to prevent too small sprites,
        devicePixelRatio: 1, // Scale factor,
        easingSteps: 4, // Number of steps to sample easing functions for animations - Less than 4 causes issues with some interpolations
        supportDeviceLost: false, // Whether to support device lost events for WebGL contexts,
    };

    // Create the player and play the animation
    if (useWorker) {
        const player = new Player(div, fileUrl, variables, configuration);
        player.playAnimation();
    } else {
        const player = new LocalPlayer(div, fileUrl, variables, configuration);
        await player.playAnimationAsync();
    }
}
