/**
 * Configuration options for the Lottie animation player.
 */
export type AnimationConfiguration = {
    /**
     * Size of the sprite atlas texture.
     * Default is 2048.
     */
    spriteAtlasSize?: number;
    /**
     * Gap size around sprites in the atlas.
     * Default is 5.
     */
    gapSize?: number;
    /**
     * Maximum number of sprites the renderer can handle at once.
     * Default is 64.
     */
    spritesCapacity?: number;
    /**
     * Background color for the animation canvas.
     * Default is white with full opacity.
     */
    backgroundColor?: { r: number; g: number; b: number; a: number };
    /**
     * Minimum scale factor to prevent too small sprites.
     * Default is 5.
     */
    scaleMultiplier?: number;
    /**
     * Scale factor for the rendering.
     * Default is 1.
     */
    devicePixelRatio?: number;
    /**
     * Number of steps to sample cubic bezier easing functions for animations.
     * Default is 4.
     */
    easingSteps?: number;
    /**
     * Whether to ignore opacity animations for performance.
     * Default is true.
     */
    ignoreOpacityAnimations?: boolean;
    /**
     * Whether to support device lost events for WebGL contexts.
     * Default is false.
     */
    supportDeviceLost?: boolean;
};

/**
 * Plays a Lottie animation using Babylon running on a worker thread and an OffscreenCanvas if available.
 * @param container The HTMLDivElement to create the canvas in and render the animation on.
 * @param animationFile The URL of the Lottie animation file to be played.
 * @param configuration Optional configuration object to customize the animation playback.
 * @returns True if the animation is successfully set up to play, false if OffscreenCanvas is not supported.
 */
export function PlayAnimation(container: HTMLDivElement, animationFile: string, configuration?: AnimationConfiguration): boolean {
    if ("OffscreenCanvas" in window) {
        // Create the canvas element
        const canvas = document.createElement("canvas");
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Style the canvas to fill the container
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";

        // Append the canvas to the container
        container.appendChild(canvas);

        const offscreen = canvas.transferControlToOffscreen();

        const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
        worker.postMessage({ canvas: offscreen, file: animationFile, config: configuration }, [offscreen]);

        // Listen for size information from worker
        worker.onmessage = function (evt) {
            if (evt.data.animationWidth && evt.data.animationHeight) {
                canvas.style.width = `${evt.data.animationWidth}px`;
                canvas.style.height = `${evt.data.animationHeight}px`;
            }
        };

        // Window events that affect the worker
        window.addEventListener("resize", () => {
            worker.postMessage({ width: canvas.clientWidth, height: canvas.clientHeight });
        });

        window.addEventListener("beforeunload", () => {
            worker.terminate();
        });

        return true;
    } else {
        return false;
    }
}
