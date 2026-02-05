import type { Nullable } from "core/types";
import type { AnimationInput } from "./types";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import { GetRawAnimationDataAsync } from "./parsing/parser";
import { AnimationController } from "./rendering/animationController";
import { CalculateScaleFactor } from "./rendering/calculateScaleFactor";

/**
 * Allows you to play Lottie animations using Babylon.js.
 * It plays the animations in the main JS thread. Prefer to use Player instead if Offscreen canvas and worker threads are supported.
 * Once instance of this class can only be used to play a single animation. If you want to play multiple animations, create a new instance for each animation.
 */
export class LocalPlayer {
    private _input: Nullable<AnimationInput> = null;
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
     */
    public constructor() {}

    /**
     * Loads and plays a lottie animation.
     * @param input Input parameters required to load and play the animation.
     * @returns True if the animation is successfully set up to play, false if the animation couldn't play.
     */
    public async playAnimationAsync(input: AnimationInput): Promise<boolean> {
        if (this._playing || this._disposed) {
            return false;
        }

        this._input = input;

        // Load the animation from URL or use the provided parsed JSON
        if (typeof this._input.animationSource === "string") {
            this._rawAnimation = await GetRawAnimationDataAsync(this._input.animationSource);
        } else {
            this._rawAnimation = this._input.animationSource;
        }

        // Create the canvas element
        this._canvas = document.createElement("canvas");
        this._canvas.id = "babylon-canvas";

        // The size of the canvas is the relation between the size of the container div and the size of the animation
        this._scaleFactor = CalculateScaleFactor(this._rawAnimation.w, this._rawAnimation.h, this._input.container);
        this._canvas.style.width = `${this._rawAnimation.w * this._scaleFactor}px`;
        this._canvas.style.height = `${this._rawAnimation.h * this._scaleFactor}px`;

        // Append the canvas to the container
        this._input.container.appendChild(this._canvas);

        this._animationController = new AnimationController(
            this._canvas,
            this._rawAnimation,
            this._scaleFactor,
            this._input.variables ?? new Map<string, string>(),
            this._input.configuration ?? {}
        );
        this._animationController.playAnimation();
        this._playing = true;

        if ("ResizeObserver" in window) {
            this._resizeObserver = new ResizeObserver(() => {
                this._scheduleResizeUpdate();
            });
            this._resizeObserver.observe(this._input.container);
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

        if (this._input && this._canvas) {
            this._input.container.removeChild(this._canvas);
        }

        if (this._animationController) {
            this._animationController.dispose();
            this._animationController = null;
        }

        this._canvas = null;

        this._disposed = true;
    }

    private _scheduleResizeUpdate(): void {
        if (this._disposed || !this._input || !this._canvas || !this._rawAnimation || this._animationController === null) {
            return;
        }

        if (this._resizeDebounceHandle !== null) {
            clearTimeout(this._resizeDebounceHandle);
        }

        this._resizeDebounceHandle = window.setTimeout(() => {
            this._resizeDebounceHandle = null;
            if (this._disposed || !this._input || !this._canvas || !this._rawAnimation || this._animationController === null) {
                return;
            }

            const newScale = CalculateScaleFactor(this._rawAnimation.w, this._rawAnimation.h, this._input.container);
            if (this._scaleFactor !== newScale) {
                this._scaleFactor = newScale;

                this._canvas.style.width = `${this._rawAnimation.w * newScale}px`;
                this._canvas.style.height = `${this._rawAnimation.h * newScale}px`;
                this._animationController.setScale(newScale);
            }
        }, this._resizeDebounceMs);
    }
}
