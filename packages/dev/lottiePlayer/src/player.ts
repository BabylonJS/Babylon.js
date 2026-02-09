import type { Nullable } from "core/types";
import type { AnimationInput } from "./types";
import type {
    AnimationSizeMessagePayload,
    AnimationUrlMessage,
    ContainerResizeMessage,
    DisposeMessage,
    Message,
    StartAnimationMessage,
    PreWarmMessage,
    WorkerLoadedMessagePayload,
} from "./messageTypes";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import { CalculateScaleFactors } from "./rendering/calculateScaleFactor";
import type { ScaleFactors } from "./rendering/calculateScaleFactor";
import { BlobWorkerWrapper as Worker } from "./blobWorkerWrapper";

/**
 * Allows you to play Lottie animations using Babylon.js.
 * It plays the animations in a worker thread using OffscreenCanvas.
 * Once instance of this class can only be used to play a single animation. If you want to play multiple animations, create a new instance for each animation.
 */
export class Player {
    private _input: Nullable<AnimationInput> = null;

    private _playing: boolean = false;
    private _disposed: boolean = false;
    private _preWarmed: boolean = false;
    private _preWarmPromise: Promise<Player> | null = null;
    private _preWarmResolve: ((player: Player) => void) | null = null;
    private _preWarmReject: ((reason?: any) => void) | null = null;
    private _worker: Nullable<globalThis.Worker> = null;
    private _canvas: Nullable<HTMLCanvasElement> = null;
    private _animationWidth: number = 0;
    private _animationHeight: number = 0;
    private _scaleFactors: ScaleFactors = { canvasScale: 1, atlasScale: 1 };
    private _resizeObserver: Nullable<ResizeObserver> = null;
    private _resizeDebounceHandle: number | null = null;
    private _resizeDebounceMs: number = 1000 / 60; // Debounce resize updates to approximately 60 FPS

    /**
     * Creates a new instance of the LottiePlayer.
     * If OffscreenCanvas is not supported by the browser, the animation will not play. Try using LocalLottiePlayer instead.
     * @throws Error if OffscreenCanvas is not supported
     */
    public constructor() {
        // Check if OffscreenCanvas is supported
        if (!("OffscreenCanvas" in window)) {
            throw new Error("OffscreenCanvas not supported - cannot create Player");
        }
    }

    /**
     * Pre-warms the worker by loading necessary code ahead of time.
     * This promise resolves when the worker has loaded all the code required to play an animation.
     * @returns A Promise that resolves to this Player instance when the worker is ready
     * @throws Error if the player is already playing or disposed
     */
    public async preWarmPlayerAsync(): Promise<Player> {
        if (this._playing || this._disposed) {
            throw new Error("Invalid call to preWarmPlayerAsync - player is already playing or disposed");
        }

        if (this._preWarmed) {
            return this;
        }

        // Pre-warming already in progress
        if (this._preWarmPromise) {
            return await this._preWarmPromise;
        }

        // Create the promise that will be resolved when we receive the "loaded" message
        this._preWarmPromise = new Promise<Player>((resolve, reject) => {
            this._preWarmResolve = resolve;
            this._preWarmReject = reject;
        });

        // Initialize worker if not already done
        const worker = this._getOrCreateWorker();

        // Send pre-warm message to worker
        const preWarmMessage: PreWarmMessage = {
            type: "preWarm",
            payload: {},
        };

        worker.postMessage(preWarmMessage);

        return await this._preWarmPromise;
    }

    /**
     * Loads and plays a lottie animation using a webworker and offscreen canvas.
     * @param input Input parameters required to load and play the animation.
     * @returns True if the animation is successfully set up to play, false if the animation couldn't play.
     */
    public async playAnimationAsync(input: AnimationInput): Promise<boolean> {
        if (this._playing || this._disposed) {
            return false;
        }

        this._input = input;

        // Set up resize observer to handle container resizing
        if ("ResizeObserver" in window) {
            this._resizeObserver = new ResizeObserver(() => {
                this._scheduleResizeUpdate();
            });
            this._resizeObserver.observe(this._input.container);
        }

        // If we are pre-warming, wait for it to complete
        if (this._preWarmPromise) {
            try {
                await this._preWarmPromise;
            } catch {
                return false;
            }
        }

        // Initialize worker if not already done by pre-warming
        const worker = this._getOrCreateWorker();

        if (typeof this._input.animationSource === "string") {
            // We need to load the animation from a URL in the worker
            const animationUrlMessage: AnimationUrlMessage = {
                type: "animationUrl",
                payload: {
                    url: this._input.animationSource,
                },
            };
            worker.postMessage(animationUrlMessage);
        } else {
            // We have the raw animation data already on this thread
            this._createCanvasAndStartAnimation(this._input.animationSource);
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

        // Clean up pre-warm promise
        if (this._preWarmReject) {
            this._preWarmReject(new Error("Player disposed"));
        }

        this._preWarmResolve = null;
        this._preWarmReject = null;
        this._preWarmPromise = null;

        if (this._worker) {
            // Try graceful shutdown first
            const disposeMessage: DisposeMessage = {
                type: "dispose",
                payload: {},
            };

            this._worker.postMessage(disposeMessage);
            this._worker = null;
            window.removeEventListener("beforeunload", this._onBeforeUnload);
        }

        if (this._input && this._canvas) {
            this._input.container.removeChild(this._canvas);
        }

        this._canvas = null;

        this._disposed = true;
    }

    private _getOrCreateWorker(): globalThis.Worker {
        if (!this._worker) {
            const wrapperWorker = new Worker(new URL("./worker", import.meta.url));
            this._worker = wrapperWorker.getWorker();
            this._worker.onmessage = (evt: MessageEvent) => {
                this._handleWorkerMessage(evt);
            };

            window.addEventListener("beforeunload", this._onBeforeUnload);
        }

        return this._worker;
    }

    private _createCanvasAndStartAnimation(animationData: RawLottieAnimation | AnimationSizeMessagePayload): void {
        if (this._input === null || this._worker === null) {
            return;
        }

        if (IsRawLottieAnimation(animationData)) {
            this._animationWidth = animationData.w;
            this._animationHeight = animationData.h;
        } else {
            this._animationWidth = animationData.width;
            this._animationHeight = animationData.height;
        }

        // Create the canvas element
        this._canvas = document.createElement("canvas");
        this._canvas.id = "babylon-canvas";

        // The size of the canvas is the relation between the size of the container div and the size of the animation
        this._scaleFactors = CalculateScaleFactors(this._animationWidth, this._animationHeight, this._input.container);
        this._canvas.style.width = `${this._animationWidth * this._scaleFactors.canvasScale}px`;
        this._canvas.style.height = `${this._animationHeight * this._scaleFactors.canvasScale}px`;

        // Append the canvas to the container
        this._input.container.appendChild(this._canvas);
        const offscreen = this._canvas.transferControlToOffscreen();

        const startAnimationMessage: StartAnimationMessage = {
            type: "startAnimation",
            payload: {
                canvas: offscreen,
                canvasScale: this._scaleFactors.canvasScale,
                atlasScale: this._scaleFactors.atlasScale,
                variables: this._input.variables,
                configuration: this._input.configuration,
                animationData: IsRawLottieAnimation(animationData) ? animationData : undefined,
                mainThreadDevicePixelRatio: window.devicePixelRatio,
            },
        };

        this._worker.postMessage(startAnimationMessage, [offscreen]);
        this._playing = true;
    }

    private _onBeforeUnload = () => {
        this._worker?.terminate();
        this._worker = null;
    };

    private _handleWorkerMessage(evt: MessageEvent): void {
        const message = evt.data as Message;
        if (message === undefined) {
            return;
        }

        switch (message.type) {
            case "animationSize": {
                if (this._worker === null) {
                    return;
                }

                this._createCanvasAndStartAnimation(message.payload as AnimationSizeMessagePayload);
                break;
            }
            case "workerLoaded": {
                const payload = message.payload as WorkerLoadedMessagePayload;
                if (payload.success) {
                    this._preWarmed = true;
                    this._preWarmResolve?.(this);
                } else {
                    this._preWarmReject?.(new Error(payload.error || "Pre-warming failed"));
                }

                // Clean up promise handlers
                this._preWarmResolve = null;
                this._preWarmReject = null;
                this._preWarmPromise = null;
                break;
            }
        }
    }

    private _scheduleResizeUpdate(): void {
        if (this._disposed || !this._input || !this._canvas || !this._worker) {
            return;
        }

        if (this._animationWidth === 0 || this._animationHeight === 0) {
            return; // Not initialized yet
        }

        if (this._resizeDebounceHandle !== null) {
            clearTimeout(this._resizeDebounceHandle);
        }

        this._resizeDebounceHandle = window.setTimeout(() => {
            this._resizeDebounceHandle = null;
            if (this._disposed || !this._input || !this._canvas || !this._worker) {
                return;
            }

            const newScaleFactors = CalculateScaleFactors(this._animationWidth, this._animationHeight, this._input.container);
            if (this._scaleFactors.canvasScale !== newScaleFactors.canvasScale) {
                this._scaleFactors = newScaleFactors;

                this._canvas.style.width = `${this._animationWidth * newScaleFactors.canvasScale}px`;
                this._canvas.style.height = `${this._animationHeight * newScaleFactors.canvasScale}px`;

                const containerResizeMessage: ContainerResizeMessage = {
                    type: "containerResize",
                    payload: { canvasScale: newScaleFactors.canvasScale },
                };
                this._worker.postMessage(containerResizeMessage);
            }
        }, this._resizeDebounceMs);
    }
}

function IsRawLottieAnimation(x: unknown): x is RawLottieAnimation {
    const o = x as any;
    return !!o && typeof o === "object" && typeof o.w === "number" && typeof o.h === "number" && Array.isArray(o.layers);
}
