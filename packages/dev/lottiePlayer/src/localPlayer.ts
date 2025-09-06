import type { AnimationConfiguration } from "./animationConfiguration";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import { DefaultConfiguration } from "./animationConfiguration";
import { GetRawAnimationDataAsync } from "./parsing/parser";
import { AnimationController } from "./rendering/animationController";
import { CalculateScaleFactor } from "./rendering/calculateScaleFactor";

/**
 * Allows you to play Lottie animations using Babylon.js.
 * It plays the animations in the main JS thread. Prefer to use Player instead if Offscreen canvas and worker threads are supported.
 * Once instance of this class can only be used to play a single animation. If you want to play multiple animations, create a new instance for each animation.
 */
export class LocalPlayer {
    private readonly _container: HTMLDivElement;
    private readonly _animationSource: string | RawLottieAnimation;
    private readonly _variables: Map<string, string>;
    private readonly _configuration: Partial<AnimationConfiguration>;

    private _rawAnimation: RawLottieAnimation | undefined = undefined;
    private _scaleFactor: number = 1;
    private _playing = false;
    private _disposed = false;
    private _canvas: HTMLCanvasElement | null = null;
    private _resizeObserver: ResizeObserver | null = null;
    private _animationController: AnimationController | null = null;
    private _resizeDebounceHandle: number | null = null;
    private _resizeDebounceMs: number = 1000 / 60; // Debounce resize updates to approximately 60 FPS

    /**
     * Creates a new instance of the LottiePlayer.
     * @param container The HTMLDivElement to create the canvas in and render the animation on.
     * @param animationSource The URL of the Lottie animation file to be played, or a parsed Lottie JSON object.
     * @param variables Optional map of variables to replace in the animation file.
     * @param configuration Optional configuration object to customize the animation playback.
     */
    public constructor(container: HTMLDivElement, animationSource: string | RawLottieAnimation, variables?: Map<string, string>, configuration?: Partial<AnimationConfiguration>) {
        this._container = container;
        this._animationSource = animationSource;
        this._variables = variables ?? new Map<string, string>();
        this._configuration = configuration ?? {};
    }

    /**
     * Loads and plays a lottie animation.
     * @returns True if the animation is successfully set up to play, false if the animation couldn't play.
     */
    public async playAnimationAsync(): Promise<boolean> {
        if (this._playing || this._disposed) {
            return false;
        }

        // Load the animation from URL or use the provided parsed JSON
        if (typeof this._animationSource === "string") {
            this._rawAnimation = await GetRawAnimationDataAsync(this._animationSource);
        } else {
            this._rawAnimation = this._animationSource;
        }

        // Create the canvas element
        this._canvas = document.createElement("canvas");
        this._canvas.id = "babylon-canvas";

        // Center the canvas in the container
        this._canvas.style.position = "absolute";
        this._canvas.style.left = "50%";
        this._canvas.style.top = "50%";
        this._canvas.style.transform = "translate(-50%, -50%)";
        this._canvas.style.display = "block";

        // The size of the canvas is the relation between the size of the container div and the size of the animation
        this._scaleFactor = CalculateScaleFactor(this._rawAnimation.w, this._rawAnimation.h, this._container);
        this._canvas.style.width = `${this._rawAnimation.w * this._scaleFactor}px`;
        this._canvas.style.height = `${this._rawAnimation.h * this._scaleFactor}px`;

        // Append the canvas to the container
        this._container.appendChild(this._canvas);

        const finalConfig: AnimationConfiguration = {
            ...DefaultConfiguration,
            ...this._configuration,
        };

        this._animationController = new AnimationController(this._canvas, this._rawAnimation, this._scaleFactor, this._variables, finalConfig);
        this._animationController.playAnimation();
        this._playing = true;

        if ("ResizeObserver" in window) {
            this._resizeObserver = new ResizeObserver(() => {
                this._scheduleResizeUpdate();
            });
            this._resizeObserver.observe(this._container);
        }

        return true;
    }

    /**
     * Disposes the LottiePlayer instance, cleaning up resources and event listeners.
     */
    public dispose(): void {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        if (this._resizeDebounceHandle !== null) {
            clearTimeout(this._resizeDebounceHandle);
            this._resizeDebounceHandle = null;
        }

        if (this._canvas) {
            this._container.removeChild(this._canvas);
            this._canvas = null;
        }

        this._disposed = true;
    }

    private _scheduleResizeUpdate(): void {
        if (this._disposed || !this._canvas || !this._rawAnimation || this._animationController === null) {
            return;
        }

        if (this._resizeDebounceHandle !== null) {
            clearTimeout(this._resizeDebounceHandle);
        }

        this._resizeDebounceHandle = window.setTimeout(() => {
            this._resizeDebounceHandle = null;
            if (this._disposed || !this._canvas || !this._rawAnimation || this._animationController === null) {
                return;
            }

            const newScale = CalculateScaleFactor(this._rawAnimation.w, this._rawAnimation.h, this._container);
            if (this._scaleFactor !== newScale) {
                this._scaleFactor = newScale;

                this._canvas.style.width = `${this._rawAnimation.w * newScale}px`;
                this._canvas.style.height = `${this._rawAnimation.h * newScale}px`;
            }
        }, this._resizeDebounceMs);
    }
}
