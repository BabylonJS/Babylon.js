import type { Nullable } from "core/types";

/**
 * Configuration options for the Lottie animation player.
 */
export type AnimationConfiguration = {
    /**
     * Whether the animation should play on a loop or not
     */
    loopAnimation: boolean;
    /**
     * Size of the sprite atlas texture.
     * Default is 2048.
     */
    spriteAtlasSize: number;
    /**
     * Gap size around sprites in the atlas.
     * Default is 5.
     */
    gapSize: number;
    /**
     * Maximum number of sprites the renderer can handle at once.
     * Default is 64.
     */
    spritesCapacity: number;
    /**
     * Background color for the animation canvas.
     * Default is white with full opacity.
     */
    backgroundColor: { r: number; g: number; b: number; a: number };
    /**
     * Minimum scale factor to prevent too small sprites.
     * Default is 5.
     */
    scaleMultiplier: number;
    /**
     * Scale factor for the rendering.
     * Default is 1.
     */
    devicePixelRatio: number;
    /**
     * Number of steps to sample cubic bezier easing functions for animations.
     * Default is 4.
     */
    easingSteps: number;
    /**
     * Whether to ignore opacity animations for performance.
     * Default is true.
     */
    ignoreOpacityAnimations: boolean;
    /**
     * Whether to support device lost events for WebGL contexts.
     * Default is false.
     */
    supportDeviceLost: boolean;
};

/**
 * LottiePlayer is a class that allows you to play Lottie animations using Babylon.js.
 * It plays the animations in a worker thread using OffscreenCanvas.
 * Once instance of this class can only be used to play a single animation. If you want to play multiple animations, create a new instance for each animation.
 */
export class LottiePlayer {
    private _playing: boolean = false;
    private _disposed: boolean = false;
    private _worker: Nullable<Worker> = null;
    private _canvas: Nullable<HTMLCanvasElement> = null;
    private _resizeObserver: Nullable<ResizeObserver> = null;

    private readonly _container: HTMLDivElement;
    private readonly _animationFile: string;
    private readonly _configuration: Partial<AnimationConfiguration>;

    /**
     * Creates a new instance of the LottiePlayer.
     * @param container The HTMLDivElement to create the canvas in and render the animation on.
     * @param animationFile The URL of the Lottie animation file to be played.
     * @param configuration Optional configuration object to customize the animation playback.
     */
    public constructor(container: HTMLDivElement, animationFile: string, configuration?: Partial<AnimationConfiguration>) {
        this._container = container;
        this._animationFile = animationFile;
        this._configuration = configuration ?? {};
    }

    /**
     * Loads and plays a lottie animation.
     * @returns True if the animation is successfully set up to play, false if the animation couldn't play.
     */
    public playAnimation(): boolean {
        if (this._playing || this._disposed) {
            return false;
        }

        if ("OffscreenCanvas" in window) {
            // Create the canvas element
            this._canvas = document.createElement("canvas");
            this._canvas.width = this._container.clientWidth;
            this._canvas.height = this._container.clientHeight;

            // Style the canvas to fill the container
            this._canvas.style.width = "100%";
            this._canvas.style.height = "100%";
            this._canvas.style.display = "block";

            // Append the canvas to the container
            this._container.appendChild(this._canvas);

            const offscreen = this._canvas.transferControlToOffscreen();

            this._worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
            this._worker.onmessage = (evt: MessageEvent) => {
                if (evt.data.animationWidth && evt.data.animationHeight && this._canvas) {
                    this._canvas.style.width = `${evt.data.animationWidth}px`;
                    this._canvas.style.height = `${evt.data.animationHeight}px`;
                }
            };

            this._worker.postMessage({ canvas: offscreen, file: this._animationFile, config: this._configuration }, [offscreen]);
            this._playing = true;

            window.addEventListener("resize", this._onWindowResize);
            window.addEventListener("beforeunload", this._onBeforeUnload);

            if ("ResizeObserver" in window) {
                this._resizeObserver = new ResizeObserver(() => {
                    if (this._disposed || !this._canvas || !this._worker) {
                        return;
                    }

                    const w = this._canvas.clientWidth;
                    const h = this._canvas.clientHeight;

                    this._worker.postMessage({ width: w, height: h });
                });

                this._resizeObserver.observe(this._container);
            }

            return true;
        } else {
            return false;
        }
    }

    /**
     * Disposes the LottiePlayer instance, cleaning up resources and event listeners.
     */
    public dispose(): void {
        window.removeEventListener("resize", this._onWindowResize);
        window.removeEventListener("beforeunload", this._onBeforeUnload);

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        this._onBeforeUnload();

        if (this._canvas) {
            this._container.removeChild(this._canvas);
            this._canvas = null;
        }

        this._disposed = true;
    }

    private _onWindowResize = () => {
        if (this._disposed || !this._canvas || !this._worker) {
            return;
        }

        const w = this._canvas.clientWidth;
        const h = this._canvas.clientHeight;

        this._worker.postMessage({ width: w, height: h });
    };

    private _onBeforeUnload = () => {
        this._worker?.terminate();
        this._worker = null;
    };
}
