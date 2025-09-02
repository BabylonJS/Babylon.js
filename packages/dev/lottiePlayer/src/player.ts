import type { Nullable } from "core/types";
import type { AnimationConfiguration } from "./animationConfiguration";
import type { AnimationSizeMessagePayload, AnimationUrlMessage, ContainerResizeMessage, Message, StartAnimationMessage } from "./messageTypes";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import { CalculateScaleFactor } from "./rendering/animationController";

/**
 * Allows you to play Lottie animations using Babylon.js.
 * It plays the animations in a worker thread using OffscreenCanvas.
 * Once instance of this class can only be used to play a single animation. If you want to play multiple animations, create a new instance for each animation.
 */
export class Player {
    private readonly _container: HTMLDivElement;
    private readonly _animationSource: string | RawLottieAnimation;
    private readonly _variables: Nullable<Map<string, string>>;
    private readonly _configuration: Nullable<Partial<AnimationConfiguration>>;

    private _playing: boolean = false;
    private _disposed: boolean = false;
    private _worker: Nullable<Worker> = null;
    private _canvas: Nullable<HTMLCanvasElement> = null;
    private _animationWidth: number = 0;
    private _animationHeight: number = 0;
    private _scaleFactor: number = 1;
    private _resizeObserver: Nullable<ResizeObserver> = null;

    /**
     * Creates a new instance of the LottiePlayer.
     * @param container The HTMLDivElement to create the canvas in and render the animation on.
     * @param animationSource The URL of the Lottie animation file to be played, or a parsed Lottie JSON object.
     * @param variables Optional map of variables to replace in the animation file.
     * @param configuration Optional configuration object to customize the animation playback.
     */
    public constructor(
        container: HTMLDivElement,
        animationSource: string | RawLottieAnimation,
        variables: Nullable<Map<string, string>> = null,
        configuration: Nullable<Partial<AnimationConfiguration>> = null
    ) {
        this._container = container;
        this._animationSource = animationSource;
        this._variables = variables;
        this._configuration = configuration;
    }

    /**
     * Loads and plays a lottie animation using a webworker and offscreen canvas.
     * If OffscreenCanvas is not supported by the browser, the animation will not play. Try using LocalLottiePlayer instead.
     * @returns True if the animation is successfully set up to play, false if the animation couldn't play.
     */
    public playAnimation(): boolean {
        if (this._playing || this._disposed) {
            return false;
        }

        if ("OffscreenCanvas" in window) {
            this._worker = new Worker(new URL("./worker", import.meta.url), { type: "module" });
            this._worker.onmessage = (evt: MessageEvent) => {
                const message = evt.data as Message;
                if (message === undefined) {
                    return;
                }

                switch (message.type) {
                    case "animationSize": {
                        if (this._worker === null) {
                            return;
                        }

                        this._createPlayerAndStartAnimation(message.payload as AnimationSizeMessagePayload);
                        break;
                    }
                }
            };

            if (typeof this._animationSource === "string") {
                // We need to load the animation from a URL in the worker
                const animationUrlMessage: AnimationUrlMessage = {
                    type: "animationUrl",
                    payload: {
                        url: this._animationSource,
                    },
                };
                this._worker.postMessage(animationUrlMessage);
            } else {
                // We have the raw animation data already on this thread
                this._createPlayerAndStartAnimation(this._animationSource);
            }

            window.addEventListener("resize", this._onWindowResize);
            window.addEventListener("beforeunload", this._onBeforeUnload);

            if ("ResizeObserver" in window) {
                this._resizeObserver = new ResizeObserver(() => {
                    if (this._disposed || !this._canvas || !this._worker) {
                        return;
                    }

                    // The size of the canvas is the relation between the size of the container div and the size of the animation
                    this._scaleFactor = CalculateScaleFactor(this._animationWidth, this._animationHeight, this._container);
                    this._canvas.style.width = `${this._animationWidth * this._scaleFactor}px`;
                    this._canvas.style.height = `${this._animationHeight * this._scaleFactor}px`;

                    const containerResizeMessage: ContainerResizeMessage = {
                        type: "containerResize",
                        payload: {
                            scaleFactor: this._scaleFactor,
                        },
                    };
                    this._worker.postMessage(containerResizeMessage);
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

    private _createPlayerAndStartAnimation(animationData: RawLottieAnimation | AnimationSizeMessagePayload): void {
        if (this._worker === null) {
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

        // Center the canvas in the container
        this._canvas.style.position = "absolute";
        this._canvas.style.left = "50%";
        this._canvas.style.top = "50%";
        this._canvas.style.transform = "translate(-50%, -50%)";
        this._canvas.style.display = "block";

        // The size of the canvas is the relation between the size of the container div and the size of the animation
        this._scaleFactor = CalculateScaleFactor(this._animationWidth, this._animationHeight, this._container);
        this._canvas.style.width = `${this._animationWidth * this._scaleFactor}px`;
        this._canvas.style.height = `${this._animationHeight * this._scaleFactor}px`;

        // Append the canvas to the container
        this._container.appendChild(this._canvas);
        const offscreen = this._canvas.transferControlToOffscreen();

        const startAnimationMessage: StartAnimationMessage = {
            type: "startAnimation",
            payload: {
                canvas: offscreen,
                scaleFactor: this._scaleFactor,
                variables: this._variables,
                configuration: this._configuration,
                animationData: IsRawLottieAnimation(animationData) ? animationData : undefined,
            },
        };

        this._worker.postMessage(startAnimationMessage, [offscreen]);
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

function IsRawLottieAnimation(x: unknown): x is RawLottieAnimation {
    const o = x as any;
    return !!o && typeof o === "object" && typeof o.w === "number" && typeof o.h === "number" && Array.isArray(o.layers);
}
