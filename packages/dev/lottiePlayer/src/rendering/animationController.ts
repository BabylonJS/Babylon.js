import { type ILottieFile } from "../animation/lottieRaw";
import { type AnimationConfiguration, type ResolvedAnimationConfiguration, UpdateConfiguration } from "../animationConfiguration";
import { CreateVectorEngine, DisposeVectorPlayer, IsPlayerReady, RenderLottieFrame, type ILottiePlayer } from "../player/playerCore";
import { CreateLottiePlayerAsync } from "../player/playerFactory";

import { type ThinEngine } from "core/Engines/thinEngine";

/**
 * Returns a usable animation frame rate for timing calculations.
 * @param frameRate The frame rate from the Lottie document.
 * @returns The positive finite frame rate, or 30 for malformed input.
 */
export function GetSafeFrameRate(frameRate: number): number {
    return Number.isFinite(frameRate) && frameRate > 0 ? frameRate : 30;
}

/**
 * Wraps a frame into an animation's in/out-point range.
 * @param frame The frame to wrap.
 * @param startFrame The inclusive in point.
 * @param endFrame The exclusive out point.
 * @returns The wrapped frame, or `startFrame` when the range is empty or reversed.
 */
export function WrapLoopFrame(frame: number, startFrame: number, endFrame: number): number {
    const span = endFrame - startFrame;
    return span > 0 ? ((frame - startFrame) % span) + startFrame : startFrame;
}

/**
 * Controls the playback of a Lottie animation, rendering it with the stencil-then-cover vector
 * renderer. Owns the engine, the render loop and the animation clock.
 */
export class AnimationController {
    private _canvasScale: number;
    private readonly _configuration: ResolvedAnimationConfiguration;
    private readonly _engine: ThinEngine;
    private readonly _player: ILottiePlayer;

    private readonly _width: number;
    private readonly _height: number;
    private readonly _startFrame: number;
    private readonly _endFrame: number;

    private _firstRun: boolean;
    private readonly _frameDuration: number;
    private _currentFrame: number;
    private _isPlaying: boolean;
    private _animationFrameId: number | null;
    private _lastFrameTime: number;
    private _deltaTime: number;
    private _accumulatedTime: number;
    private readonly _loop: boolean;
    private _hasRendered: boolean;

    private readonly _onFirstRender?: () => void;

    /**
     * Gets the canvas used for rendering the animation.
     * @returns The canvas element used for rendering.
     */
    public get view(): HTMLCanvasElement {
        return this._engine.getRenderingCanvas()!;
    }

    /**
     * Gets the height of the animation in pixels.
     * @returns The height of the animation in pixels.
     */
    public get animationHeight(): number {
        return this._height;
    }

    /**
     * Gets the width of the animation in pixels.
     * @returns The width of the animation in pixels.
     */
    public get animationWidth(): number {
        return this._width;
    }

    /**
     * Creates an animation controller after loading the renderer chunks required by the animation.
     * @param canvas The canvas element to render the animation on.
     * @param animationData The raw lottie animation as a JSON object.
     * @param canvasScale The scale factor for the canvas / viewport (may be \< 1 when the animation is larger than the container).
     * @param variables Map of variables to replace in the animation file.
     * @param configuration The partial configuration for the animation player. Will be finalized after engine creation.
     * @param mainThreadDevicePixelRatio The devicePixelRatio from the main thread (used in worker scenarios).
     * @param onFirstRender Optional callback invoked after the first frame renders.
     * @returns The initialized animation controller.
     */
    public static async CreateAsync(
        canvas: HTMLCanvasElement | OffscreenCanvas,
        animationData: ILottieFile,
        canvasScale: number,
        variables: Map<string, string>,
        configuration: Partial<AnimationConfiguration>,
        mainThreadDevicePixelRatio?: number,
        onFirstRender?: () => void
    ): Promise<AnimationController> {
        const engine = CreateVectorEngine(canvas, configuration.supportDeviceLost ?? true);
        const resolvedConfiguration = UpdateConfiguration(configuration, engine.getCaps().maxTextureSize, mainThreadDevicePixelRatio);
        const variableRecord: Record<string, string> = {};
        for (const [key, value] of variables) {
            variableRecord[key] = value;
        }
        try {
            const player = await CreateLottiePlayerAsync(engine, animationData, {
                variables: variableRecord,
                backgroundColor: resolvedConfiguration.backgroundColor,
            });
            return new AnimationController(animationData, canvasScale, resolvedConfiguration, engine, player, onFirstRender);
        } catch (error) {
            engine.dispose();
            throw error;
        }
    }

    private constructor(
        animationData: ILottieFile,
        canvasScale: number,
        configuration: ResolvedAnimationConfiguration,
        engine: ThinEngine,
        player: ILottiePlayer,
        onFirstRender?: () => void
    ) {
        this._canvasScale = canvasScale;
        this._currentFrame = 0;
        this._isPlaying = false;
        this._animationFrameId = null;
        this._lastFrameTime = 0;
        this._deltaTime = 0;
        this._accumulatedTime = 0;
        this._firstRun = true;
        this._hasRendered = false;
        this._onFirstRender = onFirstRender;
        this._engine = engine;
        this._configuration = configuration;
        this._loop = this._configuration.loopAnimation;
        this._player = player;

        this._width = animationData.w;
        this._height = animationData.h;
        this._startFrame = animationData.ip;
        this._endFrame = animationData.op;
        this._frameDuration = 1000 / GetSafeFrameRate(animationData.fr);

        this._setSize();
    }

    /**
     * Plays the animation.
     */
    public playAnimation(): void {
        this._currentFrame = this._startFrame;
        this._accumulatedTime = 0;
        this._isPlaying = true;
        this._lastFrameTime = 0;

        this._startRenderLoop();
    }

    /**
     * Stops the animation playback.
     */
    public stopAnimation(): void {
        this._accumulatedTime = 0;
        this._isPlaying = false;
        if (this._animationFrameId !== null) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    /**
     * Sets a new canvas scale factor for the animation and updates the rendering size.
     * @param canvasScale The new canvas scale factor to apply to the animation.
     */
    public setScale(canvasScale: number): void {
        if (canvasScale <= 0) {
            return;
        }

        this._canvasScale = canvasScale;
        this._setSize();
    }

    /**
     * Disposes the player and releases all resources.
     */
    public dispose(): void {
        this.stopAnimation();

        // Offscreen canvas do not have .remove() as it doesn't inherit from Element
        const canvas = this._engine.getRenderingCanvas();
        if (canvas && canvas.remove) {
            canvas.remove();
        }

        DisposeVectorPlayer(this._player);
        this._engine.dispose();
    }

    private _setSize(): void {
        const devicePixelRatio = this._configuration.devicePixelRatio;
        this._engine.setSize(this._width * this._canvasScale * devicePixelRatio, this._height * this._canvasScale * devicePixelRatio);

        // Resizing clears the buffer, so redraw the last frame rather than leaving the canvas blank.
        if (!this._isPlaying && this._hasRendered) {
            RenderLottieFrame(this._player, this._currentFrame);
        }
    }

    private _startRenderLoop(): void {
        if (!this._isPlaying) {
            return;
        }

        this._animationFrameId = requestAnimationFrame((currentTime) => {
            // The first time we render, we set the last frame time
            // to the current time to sync with the page startup time
            if (this._firstRun) {
                this._lastFrameTime = currentTime;
                this._firstRun = false;
            }

            this._deltaTime = currentTime - this._lastFrameTime;
            this._lastFrameTime = currentTime;

            this._render();
            this._lastFrameTime = performance.now();

            if (this._isPlaying) {
                this._startRenderLoop();
            }
        });
    }

    private _render(): void {
        if (!this._isPlaying) {
            return;
        }

        // Effects compile asynchronously; hold the clock at the first frame until they are ready so
        // playback starts from the beginning rather than jumping forward by the compile time.
        if (!IsPlayerReady(this._player)) {
            this._accumulatedTime = 0;
            return;
        }

        this._accumulatedTime += this._deltaTime;
        const framesToAdvance = Math.floor(this._accumulatedTime / this._frameDuration);

        // Nothing to draw yet, unless this is the very first frame.
        if (framesToAdvance <= 0 && this._hasRendered) {
            return;
        }

        this._accumulatedTime -= framesToAdvance * this._frameDuration;
        this._currentFrame += framesToAdvance;

        let stoppingAfterThisFrame = false;
        const effectiveEndFrame = this._configuration.stopAtFrame !== undefined ? Math.min(this._configuration.stopAtFrame, this._endFrame) : this._endFrame;
        // Lottie out-point (op) is exclusive — the last visible frame is op - 1
        const animationSpan = this._endFrame - this._startFrame;
        const lastVisibleFrame = this._configuration.stopAtFrame !== undefined ? effectiveEndFrame : animationSpan > 0 ? effectiveEndFrame - 1 : this._startFrame;

        if (this._currentFrame > lastVisibleFrame) {
            if (this._loop && this._configuration.stopAtFrame === undefined && animationSpan > 0) {
                this._currentFrame = WrapLoopFrame(this._currentFrame, this._startFrame, this._endFrame);
            } else {
                this._currentFrame = lastVisibleFrame;
                stoppingAfterThisFrame = true;
            }
        }

        RenderLottieFrame(this._player, this._currentFrame);

        if (!this._hasRendered) {
            this._hasRendered = true;
            this._onFirstRender?.();
        }

        if (stoppingAfterThisFrame && this._configuration.stopAtFrame === undefined) {
            this._isPlaying = false;
        }
        // When stopAtFrame is set, the render loop stays alive to prevent
        // preserveDrawingBuffer:false from clearing the canvas.
    }
}
