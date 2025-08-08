import "core/Engines/Extensions/engine.alpha";
import "core/Shaders/sprites.vertex";
import "core/Shaders/sprites.fragment";

import { ThinEngine } from "core/Engines/thinEngine";
import { Viewport } from "core/Maths/math.viewport";

import type { Node } from "./node";
import { RenderingManager } from "./renderingManager";

import type { AnimationInfo } from "../lottie/parsedTypes";
import { AnimationParser } from "../lottie/animationParser";

import { ThinMatrix } from "../maths/matrix";

import { SpritePacker } from "../sprites/spritePacker";

import type { AnimationConfiguration } from "../lottiePlayer";

/**
 * Defines the babylon combine alpha value to prevent a large import.
 */
const AlphaCombine = 2;

/**
 * Class that controls the playing of lottie animations using Babylon.js
 */
export class AnimationController {
    private _isReady: boolean;

    private readonly _canvas: HTMLCanvasElement;
    private readonly _configuration: AnimationConfiguration;
    private readonly _engine: ThinEngine;
    private readonly _spritePacker: SpritePacker;

    private _animation?: AnimationInfo;

    private readonly _viewport: Viewport;
    private readonly _projectionMatrix: ThinMatrix;
    private readonly _worldMatrix: ThinMatrix;

    private _frameDuration: number;
    private _currentFrame: number;
    private _isPlaying: boolean;
    private _animationFrameId: number | null;
    private _lastFrameTime: number;
    private _deltaTime: number;
    private _loop: boolean;

    private _accumulatedTime: number;
    private _framesToAdvance: number;

    private readonly _renderingManager: RenderingManager;

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
        return this._animation ? this._animation.heightPx : 0;
    }

    /**
     * Gets the width of the animation in pixels.
     * @returns The width of the animation in pixels.
     */
    public get animationWidth(): number {
        return this._animation ? this._animation.widthPx : 0;
    }

    /**
     * Creates a new instance of the Player.
     * @param canvas The canvas element to render the animation on.
     * @param animationJson The JSON string of the Lottie animation to be played.
     * @param configuration The configuration for the animation player.
     */
    public constructor(canvas: HTMLCanvasElement, animationJson: string, configuration: AnimationConfiguration) {
        this._isReady = false;
        this._canvas = canvas;
        this._configuration = configuration;
        this._currentFrame = 0;
        this._isPlaying = false;
        this._animationFrameId = null;
        this._lastFrameTime = 0;
        this._deltaTime = 0;
        this._accumulatedTime = 0;
        this._framesToAdvance = 0;
        this._loop = false;
        this._frameDuration = 1000 / 30; // Default to 30 FPS

        this._engine = new ThinEngine(
            this._canvas,
            false, // Antialias
            {
                alpha: true,
                stencil: false,
                antialias: false,
                audioEngine: false,
                depth: false,
                // Important to allow skip frame and tiled optimizations
                preserveDrawingBuffer: false,
                premultipliedAlpha: false,
                doNotHandleContextLost: this._configuration.supportDeviceLost,
                // Usefull during debug to simulate WebGL1 devices (Safari)
                // disableWebGL2Support: true,
            },
            false
        );

        // Prevent parallel shader compilation to simplify the boot sequence
        // Only a couple of fast compile shaders.
        this._engine.getCaps().parallelShaderCompile = undefined;
        this._engine.depthCullingState.depthTest = false;
        this._engine.stencilState.stencilTest = false;
        this._engine.setAlphaMode(AlphaCombine);

        this._spritePacker = new SpritePacker(this._engine, this._configuration);
        this._renderingManager = new RenderingManager(this._engine, this._spritePacker.texture, this._configuration);

        this._projectionMatrix = new ThinMatrix();
        this._worldMatrix = new ThinMatrix();
        this._worldMatrix.identity();

        this._viewport = new Viewport(0, 0, 1, 1);

        // Parse the animation
        const parser = new AnimationParser(this._spritePacker, animationJson, this._configuration, this._renderingManager);
        this._animation = parser.animationInfo;
        this._frameDuration = 1000 / this._animation.frameRate;

        this.setSize(this._animation.widthPx, this._animation.heightPx);
        this._cleanTree(this._animation.nodes);

        this._isReady = true;
    }

    /**
     * Plays the animation.
     * @param loop If true, the animation will loop when it reaches the end.
     */
    public playAnimation(loop: boolean = false): void {
        if (this._animation === undefined || !this._isReady) {
            return;
        }

        this._currentFrame = 0;
        this._accumulatedTime = 0;
        this._framesToAdvance = 0;
        this._isPlaying = true;
        this._loop = loop;
        this._lastFrameTime = 0;

        // Start the render loop
        this._startRenderLoop();
    }

    /**
     * Stops the animation playback.
     */
    public stopAnimation(): void {
        this._accumulatedTime = 0;
        this._framesToAdvance = 0;
        this._isPlaying = false;
        if (this._animationFrameId !== null) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    /**
     * Sets the rendering size for the engine
     * @param width Width of the rendering canvas
     * @param height Height of the rendering canvas
     */
    public setSize(width: number, height: number): void {
        const { _engine, _projectionMatrix, _worldMatrix } = this;
        const devicePixelRatio = this._configuration.devicePixelRatio;

        _engine.setSize(width * devicePixelRatio, height * devicePixelRatio);
        this._canvas.width = width * devicePixelRatio;
        this._canvas.height = height * devicePixelRatio;
        // _engine.getRenderingCanvas()!.style.width = `${width}px`;
        // _engine.getRenderingCanvas()!.style.height = `${height}px`;

        const world = _worldMatrix.asArray();
        world[5] = -1; // we are upside down with Lottie

        _projectionMatrix.orthoOffCenterLeftHanded(0, _engine.getRenderWidth() / devicePixelRatio, _engine.getRenderHeight() / devicePixelRatio, 0, -100, 100);
    }

    /**
     * Disposes the player and releases all resources.
     */
    public dispose(): void {
        this.stopAnimation();
        this._engine.getRenderingCanvas()?.remove();
        this._engine.dispose();
        this._renderingManager.dispose();
        this._spritePacker.texture.dispose();
    }

    private _cleanTree(nodes: Node[]): void {
        // Remove non shape nodes
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.children.length === 0 && !node.isShape) {
                nodes.splice(i, 1);
                i--;
                continue;
            }

            this._cleanTree(node.children);
        }
    }

    private _startRenderLoop(): void {
        if (!this._isPlaying) {
            return;
        }

        this._animationFrameId = requestAnimationFrame((currentTime) => {
            this._deltaTime = currentTime - this._lastFrameTime;
            this._lastFrameTime = currentTime;

            this._render();
            this._lastFrameTime = performance.now();

            // Continue the loop if still playing
            if (this._isPlaying) {
                this._startRenderLoop();
            }
        });
    }

    private _render(): void {
        if (!this._animation || !this._isPlaying) {
            return;
        }

        this._engine.setViewport(this._viewport);

        // Calculate the new frame based on time
        this._accumulatedTime += this._deltaTime;
        this._framesToAdvance = Math.floor(this._accumulatedTime / this._frameDuration);

        if (this._framesToAdvance <= 0) {
            return;
        }

        this._accumulatedTime -= this._framesToAdvance * this._frameDuration;

        this._currentFrame += this._framesToAdvance;

        if (this._currentFrame < this._animation.startFrame) {
            return;
        }

        if (this._currentFrame > this._animation.endFrame) {
            if (this._loop) {
                this._currentFrame = (this._currentFrame % (this._animation.endFrame - this._animation.startFrame)) + this._animation.startFrame;
                for (let i = 0; i < this._animation.nodes.length; i++) {
                    this._animation.nodes[i].reset();
                }
            } else {
                this._isPlaying = false;
                return;
            }
        }

        for (let i = 0; i < this._animation.nodes.length; i++) {
            this._animation.nodes[i].update(this._currentFrame);
        }

        // Render all layers of the animation
        this._renderingManager.render(this._worldMatrix, this._projectionMatrix);
    }
}
