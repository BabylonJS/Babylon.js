/**
 * Configuration options for the Lottie animation player.
 */
export type AnimationConfiguration = {
    /**
     * Whether the animation should play on a loop or not
     */
    loopAnimation?: boolean;
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
 * LottiePlayer is a class that allows you to play Lottie animations using Babylon.js.
 * It plays the animations in a worker thread using OffscreenCanvas.
 * Once instance of this class can only be used to play a single animation. If you want to play multiple animations, create a new instance for each animation.
 */
export class LottiePlayer {
    private _playing: boolean;
    private _disposed: boolean;
    private _worker: Worker | null;
    private _canvas: HTMLCanvasElement | null;

    /**
     * Creates a new instance of the LottiePlayer.
     */
    public constructor() {
        this._playing = false;
        this._disposed = false;
        this._worker = null;
        this._canvas = null;
    }

    /**
     * Plays a Lottie animation using Babylon running on a worker thread and an OffscreenCanvas if available.
     * @param container The HTMLDivElement to create the canvas in and render the animation on.
     * @param animationFile The URL of the Lottie animation file to be played.
     * @param configuration Optional configuration object to customize the animation playback.
     * @returns True if the animation is successfully set up to play, false if the animation couldn't play.
     */
    public playAnimation(container: HTMLDivElement, animationFile: string, configuration?: AnimationConfiguration): boolean {
        if (this._playing || this._disposed) {
            return false;
        }

        this._playing = true;

        if ("OffscreenCanvas" in window) {
            // Create the canvas element
            this._canvas = document.createElement("canvas");
            this._canvas.width = container.clientWidth;
            this._canvas.height = container.clientHeight;

            // Style the canvas to fill the container
            this._canvas.style.width = "100%";
            this._canvas.style.height = "100%";
            this._canvas.style.display = "block";

            // Append the canvas to the container
            container.appendChild(this._canvas);

            const offscreen = this._canvas.transferControlToOffscreen();

            this._worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
            this._worker.postMessage({ canvas: offscreen, file: animationFile, config: configuration }, [offscreen]);

            // Listen for size information from worker
            this._worker.onmessage = this._onWorkerMessage.bind(this);
            this._worker.onerror = function (error) {
                // eslint-disable-next-line no-console
                console.error("Worker onerror:", error);
            };
            this._worker.onmessageerror = function (error) {
                // eslint-disable-next-line no-console
                console.error("Worker onmessageerror:", error);
            };

            // Window events that affect the worker
            window.addEventListener("resize", this._resizeEventListener.bind(this));
            window.addEventListener("beforeunload", this._beforeUnloadEventListener.bind(this));

            return true;
        } else {
            return false;
        }
    }

    /**
     * Disposes the LottiePlayer instance, cleaning up resources and event listeners.
     */
    public dispose(): void {
        window.removeEventListener("resize", this._resizeEventListener);
        window.removeEventListener("beforeunload", this._beforeUnloadEventListener);

        this._beforeUnloadEventListener();
        this._disposed = true;
    }

    private _onWorkerMessage(evt: MessageEvent): void {
        if (evt.data.animationWidth && evt.data.animationHeight && this._canvas) {
            this._canvas.style.width = `${evt.data.animationWidth}px`;
            this._canvas.style.height = `${evt.data.animationHeight}px`;
        }
    }

    private _resizeEventListener() {
        this._worker?.postMessage({ width: this._canvas?.clientWidth, height: this._canvas?.clientHeight });
    }

    private _beforeUnloadEventListener() {
        this._worker?.terminate();
    }
}
