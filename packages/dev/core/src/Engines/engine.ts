import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { IOfflineProvider } from "../Offline/IOfflineProvider";
import type { ILoadingScreen } from "../Loading/loadingScreen";
import { EngineStore } from "./engineStore";
import type { WebGLPipelineContext } from "./WebGL/webGLPipelineContext";
import type { IPipelineContext } from "./IPipelineContext";
import type { ICustomAnimationFrameRequester } from "../Misc/customAnimationFrameRequester";
import type { EngineOptions } from "./thinEngine";
import { ThinEngine } from "./thinEngine";
import { Constants } from "./constants";
import type { IViewportLike, IColor4Like } from "../Maths/math.like";
import { PerformanceMonitor } from "../Misc/performanceMonitor";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { WebGLDataBuffer } from "../Meshes/WebGL/webGLDataBuffer";
import { Logger } from "../Misc/logger";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import { WebGLHardwareTexture } from "./WebGL/webGLHardwareTexture";

import "./Extensions/engine.alpha";
import "./Extensions/engine.rawTexture";
import "./Extensions/engine.readTexture";
import "./Extensions/engine.dynamicBuffer";
import "./Extensions/engine.cubeTexture";
import "./Extensions/engine.renderTarget";
import "./Extensions/engine.renderTargetTexture";
import "./Extensions/engine.renderTargetCube";
import "./Extensions/engine.prefilteredCubeTexture";
import "./Extensions/engine.uniformBuffer";
import "./AbstractEngine/abstractEngine.loadingScreen";
import "./AbstractEngine/abstractEngine.dom";
import "./AbstractEngine/abstractEngine.states";
import "./AbstractEngine/abstractEngine.renderPass";
import "./AbstractEngine/abstractEngine.texture";

import type { PostProcess } from "../PostProcesses/postProcess";
import { AbstractEngine } from "./abstractEngine";
import {
    CreateImageBitmapFromSource,
    ExitFullscreen,
    ExitPointerlock,
    GetFontOffset,
    RequestFullscreen,
    RequestPointerlock,
    ResizeImageBitmap,
    _CommonDispose,
    _CommonInit,
} from "./engine.common";
import { PerfCounter } from "../Misc/perfCounter";
import { _retryWithInterval } from "core/Misc/timingTools";

/**
 * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio
 */
export class Engine extends ThinEngine {
    // Const statics

    /** Defines that alpha blending is disabled */
    public static readonly ALPHA_DISABLE = Constants.ALPHA_DISABLE;
    /** Defines that alpha blending to SRC ALPHA * SRC + DEST */
    public static readonly ALPHA_ADD = Constants.ALPHA_ADD;
    /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_COMBINE = Constants.ALPHA_COMBINE;
    /** Defines that alpha blending to DEST - SRC * DEST */
    public static readonly ALPHA_SUBTRACT = Constants.ALPHA_SUBTRACT;
    /** Defines that alpha blending to SRC * DEST */
    public static readonly ALPHA_MULTIPLY = Constants.ALPHA_MULTIPLY;
    /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC) * DEST */
    public static readonly ALPHA_MAXIMIZED = Constants.ALPHA_MAXIMIZED;
    /** Defines that alpha blending to SRC + DEST */
    public static readonly ALPHA_ONEONE = Constants.ALPHA_ONEONE;
    /** Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_PREMULTIPLIED = Constants.ALPHA_PREMULTIPLIED;
    /**
     * Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST
     * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_PREMULTIPLIED_PORTERDUFF = Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;
    /** Defines that alpha blending to CST * SRC + (1 - CST) * DEST */
    public static readonly ALPHA_INTERPOLATE = Constants.ALPHA_INTERPOLATE;
    /**
     * Defines that alpha blending to SRC + (1 - SRC) * DEST
     * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_SCREENMODE = Constants.ALPHA_SCREENMODE;

    /** Defines that the resource is not delayed*/
    public static readonly DELAYLOADSTATE_NONE = Constants.DELAYLOADSTATE_NONE;
    /** Defines that the resource was successfully delay loaded */
    public static readonly DELAYLOADSTATE_LOADED = Constants.DELAYLOADSTATE_LOADED;
    /** Defines that the resource is currently delay loading */
    public static readonly DELAYLOADSTATE_LOADING = Constants.DELAYLOADSTATE_LOADING;
    /** Defines that the resource is delayed and has not started loading */
    public static readonly DELAYLOADSTATE_NOTLOADED = Constants.DELAYLOADSTATE_NOTLOADED;

    // Depht or Stencil test Constants.
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
    public static readonly NEVER = Constants.NEVER;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
    public static readonly ALWAYS = Constants.ALWAYS;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
    public static readonly LESS = Constants.LESS;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
    public static readonly EQUAL = Constants.EQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
    public static readonly LEQUAL = Constants.LEQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
    public static readonly GREATER = Constants.GREATER;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
    public static readonly GEQUAL = Constants.GEQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
    public static readonly NOTEQUAL = Constants.NOTEQUAL;

    // Stencil Actions Constants.
    /** Passed to stencilOperation to specify that stencil value must be kept */
    public static readonly KEEP = Constants.KEEP;
    /** Passed to stencilOperation to specify that stencil value must be replaced */
    public static readonly REPLACE = Constants.REPLACE;
    /** Passed to stencilOperation to specify that stencil value must be incremented */
    public static readonly INCR = Constants.INCR;
    /** Passed to stencilOperation to specify that stencil value must be decremented */
    public static readonly DECR = Constants.DECR;
    /** Passed to stencilOperation to specify that stencil value must be inverted */
    public static readonly INVERT = Constants.INVERT;
    /** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
    public static readonly INCR_WRAP = Constants.INCR_WRAP;
    /** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
    public static readonly DECR_WRAP = Constants.DECR_WRAP;

    /** Texture is not repeating outside of 0..1 UVs */
    public static readonly TEXTURE_CLAMP_ADDRESSMODE = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    /** Texture is repeating outside of 0..1 UVs */
    public static readonly TEXTURE_WRAP_ADDRESSMODE = Constants.TEXTURE_WRAP_ADDRESSMODE;
    /** Texture is repeating and mirrored */
    public static readonly TEXTURE_MIRROR_ADDRESSMODE = Constants.TEXTURE_MIRROR_ADDRESSMODE;

    /** ALPHA */
    public static readonly TEXTUREFORMAT_ALPHA = Constants.TEXTUREFORMAT_ALPHA;
    /** LUMINANCE */
    public static readonly TEXTUREFORMAT_LUMINANCE = Constants.TEXTUREFORMAT_LUMINANCE;
    /** LUMINANCE_ALPHA */
    public static readonly TEXTUREFORMAT_LUMINANCE_ALPHA = Constants.TEXTUREFORMAT_LUMINANCE_ALPHA;
    /** RGB */
    public static readonly TEXTUREFORMAT_RGB = Constants.TEXTUREFORMAT_RGB;
    /** RGBA */
    public static readonly TEXTUREFORMAT_RGBA = Constants.TEXTUREFORMAT_RGBA;
    /** RED */
    public static readonly TEXTUREFORMAT_RED = Constants.TEXTUREFORMAT_RED;
    /** RED (2nd reference) */
    public static readonly TEXTUREFORMAT_R = Constants.TEXTUREFORMAT_R;
    /** RED unsigned short normed to [0, 1] **/
    public static readonly TEXTUREFORMAT_R16_UNORM = Constants.TEXTUREFORMAT_R16_UNORM;
    /** RG unsigned short normed to [0, 1] **/
    public static readonly TEXTUREFORMAT_RG16_UNORM = Constants.TEXTUREFORMAT_RG16_UNORM;
    /** RGB unsigned short normed to [0, 1] **/
    public static readonly TEXTUREFORMAT_RGB16_UNORM = Constants.TEXTUREFORMAT_RGB16_UNORM;
    /** RGBA unsigned short normed to [0, 1] **/
    public static readonly TEXTUREFORMAT_RGBA16_UNORM = Constants.TEXTUREFORMAT_RGBA16_UNORM;
    /** RED signed short normed to [-1, 1] **/
    public static readonly TEXTUREFORMAT_R16_SNORM = Constants.TEXTUREFORMAT_R16_SNORM;
    /** RG signed short normed to [-1, 1] **/
    public static readonly TEXTUREFORMAT_RG16_SNORM = Constants.TEXTUREFORMAT_RG16_SNORM;
    /** RGB signed short normed to [-1, 1] **/
    public static readonly TEXTUREFORMAT_RGB16_SNORM = Constants.TEXTUREFORMAT_RGB16_SNORM;
    /** RGBA signed short normed to [-1, 1] **/
    public static readonly TEXTUREFORMAT_RGBA16_SNORM = Constants.TEXTUREFORMAT_RGBA16_SNORM;
    /** RG */
    public static readonly TEXTUREFORMAT_RG = Constants.TEXTUREFORMAT_RG;
    /** RED_INTEGER */
    public static readonly TEXTUREFORMAT_RED_INTEGER = Constants.TEXTUREFORMAT_RED_INTEGER;
    /** RED_INTEGER (2nd reference) */
    public static readonly TEXTUREFORMAT_R_INTEGER = Constants.TEXTUREFORMAT_R_INTEGER;
    /** RG_INTEGER */
    public static readonly TEXTUREFORMAT_RG_INTEGER = Constants.TEXTUREFORMAT_RG_INTEGER;
    /** RGB_INTEGER */
    public static readonly TEXTUREFORMAT_RGB_INTEGER = Constants.TEXTUREFORMAT_RGB_INTEGER;
    /** RGBA_INTEGER */
    public static readonly TEXTUREFORMAT_RGBA_INTEGER = Constants.TEXTUREFORMAT_RGBA_INTEGER;

    /** UNSIGNED_BYTE */
    public static readonly TEXTURETYPE_UNSIGNED_BYTE = Constants.TEXTURETYPE_UNSIGNED_BYTE;
    /** @deprecated use more explicit TEXTURETYPE_UNSIGNED_BYTE instead. Use TEXTURETYPE_UNSIGNED_INTEGER for 32bits values.*/
    public static readonly TEXTURETYPE_UNSIGNED_INT = Constants.TEXTURETYPE_UNSIGNED_INT;
    /** FLOAT */
    public static readonly TEXTURETYPE_FLOAT = Constants.TEXTURETYPE_FLOAT;
    /** HALF_FLOAT */
    public static readonly TEXTURETYPE_HALF_FLOAT = Constants.TEXTURETYPE_HALF_FLOAT;
    /** BYTE */
    public static readonly TEXTURETYPE_BYTE = Constants.TEXTURETYPE_BYTE;
    /** SHORT */
    public static readonly TEXTURETYPE_SHORT = Constants.TEXTURETYPE_SHORT;
    /** UNSIGNED_SHORT */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT = Constants.TEXTURETYPE_UNSIGNED_SHORT;
    /** INT */
    public static readonly TEXTURETYPE_INT = Constants.TEXTURETYPE_INT;
    /** UNSIGNED_INT */
    public static readonly TEXTURETYPE_UNSIGNED_INTEGER = Constants.TEXTURETYPE_UNSIGNED_INTEGER;
    /** UNSIGNED_SHORT_4_4_4_4 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4;
    /** UNSIGNED_SHORT_5_5_5_1 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1;
    /** UNSIGNED_SHORT_5_6_5 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
    /** UNSIGNED_INT_2_10_10_10_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV;
    /** UNSIGNED_INT_24_8 */
    public static readonly TEXTURETYPE_UNSIGNED_INT_24_8 = Constants.TEXTURETYPE_UNSIGNED_INT_24_8;
    /** UNSIGNED_INT_10F_11F_11F_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV;
    /** UNSIGNED_INT_5_9_9_9_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV;
    /** FLOAT_32_UNSIGNED_INT_24_8_REV */
    public static readonly TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV;

    /** nearest is mag = nearest and min = nearest and mip = none */
    public static readonly TEXTURE_NEAREST_SAMPLINGMODE = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly TEXTURE_BILINEAR_SAMPLINGMODE = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_TRILINEAR_SAMPLINGMODE = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
    /** nearest is mag = nearest and min = nearest and mip = linear */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPLINEAR = Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPNEAREST = Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPLINEAR = Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
    /** mag = nearest and min = nearest and mip = nearest */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPNEAREST = Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
    /** mag = nearest and min = linear and mip = nearest */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPNEAREST = Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
    /** mag = nearest and min = linear and mip = linear */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPLINEAR = Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
    /** mag = nearest and min = linear and mip = none */
    public static readonly TEXTURE_NEAREST_LINEAR = Constants.TEXTURE_NEAREST_LINEAR;
    /** mag = nearest and min = nearest and mip = none */
    public static readonly TEXTURE_NEAREST_NEAREST = Constants.TEXTURE_NEAREST_NEAREST;
    /** mag = linear and min = nearest and mip = nearest */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPNEAREST = Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
    /** mag = linear and min = nearest and mip = linear */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPLINEAR = Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
    /** mag = linear and min = linear and mip = none */
    public static readonly TEXTURE_LINEAR_LINEAR = Constants.TEXTURE_LINEAR_LINEAR;
    /** mag = linear and min = nearest and mip = none */
    public static readonly TEXTURE_LINEAR_NEAREST = Constants.TEXTURE_LINEAR_NEAREST;

    /** Explicit coordinates mode */
    public static readonly TEXTURE_EXPLICIT_MODE = Constants.TEXTURE_EXPLICIT_MODE;
    /** Spherical coordinates mode */
    public static readonly TEXTURE_SPHERICAL_MODE = Constants.TEXTURE_SPHERICAL_MODE;
    /** Planar coordinates mode */
    public static readonly TEXTURE_PLANAR_MODE = Constants.TEXTURE_PLANAR_MODE;
    /** Cubic coordinates mode */
    public static readonly TEXTURE_CUBIC_MODE = Constants.TEXTURE_CUBIC_MODE;
    /** Projection coordinates mode */
    public static readonly TEXTURE_PROJECTION_MODE = Constants.TEXTURE_PROJECTION_MODE;
    /** Skybox coordinates mode */
    public static readonly TEXTURE_SKYBOX_MODE = Constants.TEXTURE_SKYBOX_MODE;
    /** Inverse Cubic coordinates mode */
    public static readonly TEXTURE_INVCUBIC_MODE = Constants.TEXTURE_INVCUBIC_MODE;
    /** Equirectangular coordinates mode */
    public static readonly TEXTURE_EQUIRECTANGULAR_MODE = Constants.TEXTURE_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed Mirrored coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE;

    // Texture rescaling mode
    /** Defines that texture rescaling will use a floor to find the closer power of 2 size */
    public static readonly SCALEMODE_FLOOR = Constants.SCALEMODE_FLOOR;
    /** Defines that texture rescaling will look for the nearest power of 2 size */
    public static readonly SCALEMODE_NEAREST = Constants.SCALEMODE_NEAREST;
    /** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
    public static readonly SCALEMODE_CEILING = Constants.SCALEMODE_CEILING;

    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    public static override get NpmPackage(): string {
        return AbstractEngine.NpmPackage;
    }

    /**
     * Returns the current version of the framework
     */
    public static override get Version(): string {
        return AbstractEngine.Version;
    }

    /** Gets the list of created engines */
    public static get Instances(): AbstractEngine[] {
        return EngineStore.Instances;
    }

    /**
     * Gets the latest created engine
     */
    public static get LastCreatedEngine(): Nullable<AbstractEngine> {
        return EngineStore.LastCreatedEngine;
    }

    /**
     * Gets the latest created scene
     */
    public static get LastCreatedScene(): Nullable<Scene> {
        return EngineStore.LastCreatedScene;
    }

    /** @internal */

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     * @returns The loading screen
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static override DefaultLoadingScreenFactory(canvas: HTMLCanvasElement): ILoadingScreen {
        return AbstractEngine.DefaultLoadingScreenFactory(canvas);
    }

    // Members

    /**
     * If set, will be used to request the next animation frame for the render loop
     */
    public customAnimationFrameRequester: Nullable<ICustomAnimationFrameRequester> = null;

    private _rescalePostProcess: Nullable<PostProcess>;

    protected override get _supportsHardwareTextureRescaling() {
        return !!Engine._RescalePostProcessFactory;
    }

    private _measureFps(): void {
        this._performanceMonitor.sampleFrame();
        this._fps = this._performanceMonitor.averageFPS;
        this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
    }

    private _performanceMonitor = new PerformanceMonitor();
    /**
     * Gets the performance monitor attached to this engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
     */
    public override get performanceMonitor(): PerformanceMonitor {
        return this._performanceMonitor;
    }

    // Events

    /**
     * Creates a new engine
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which already used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(
        canvasOrContext: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>,
        antialias?: boolean,
        options?: EngineOptions,
        adaptToDeviceRatio: boolean = false
    ) {
        super(canvasOrContext, antialias, options, adaptToDeviceRatio);

        this._drawCalls = new PerfCounter();

        if (!canvasOrContext) {
            return;
        }

        this._features.supportRenderPasses = true;

        options = this._creationOptions;
    }

    protected override _initGLContext(): void {
        super._initGLContext();

        this._rescalePostProcess = null;
    }

    /**
     * Shared initialization across engines types.
     * @param canvas The canvas associated with this instance of the engine.
     */
    protected override _sharedInit(canvas: HTMLCanvasElement) {
        super._sharedInit(canvas);

        _CommonInit(this, canvas, this._creationOptions);
    }

    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    public override resizeImageBitmap(image: HTMLImageElement | ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
        return ResizeImageBitmap(this, image, bufferWidth, bufferHeight);
    }

    /**
     * Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public override _createImageBitmapFromSource(imageSource: string, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return CreateImageBitmapFromSource(this, imageSource, options);
    }

    /**
     * Toggle full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public override switchFullscreen(requestPointerLock: boolean): void {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen(requestPointerLock);
        }
    }

    /**
     * Enters full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public override enterFullscreen(requestPointerLock: boolean): void {
        if (!this.isFullscreen) {
            this._pointerLockRequested = requestPointerLock;
            if (this._renderingCanvas) {
                RequestFullscreen(this._renderingCanvas);
            }
        }
    }

    /**
     * Exits full screen mode
     */
    public override exitFullscreen(): void {
        if (this.isFullscreen) {
            ExitFullscreen();
        }
    }

    /** States */

    /**
     * Sets a boolean indicating if the dithering state is enabled or disabled
     * @param value defines the dithering state
     */
    public setDitheringState(value: boolean): void {
        if (value) {
            this._gl.enable(this._gl.DITHER);
        } else {
            this._gl.disable(this._gl.DITHER);
        }
    }

    /**
     * Sets a boolean indicating if the rasterizer state is enabled or disabled
     * @param value defines the rasterizer state
     */
    public setRasterizerState(value: boolean): void {
        if (value) {
            this._gl.disable(this._gl.RASTERIZER_DISCARD);
        } else {
            this._gl.enable(this._gl.RASTERIZER_DISCARD);
        }
    }

    /**
     * Directly set the WebGL Viewport
     * @param x defines the x coordinate of the viewport (in screen space)
     * @param y defines the y coordinate of the viewport (in screen space)
     * @param width defines the width of the viewport (in screen space)
     * @param height defines the height of the viewport (in screen space)
     * @returns the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
     */
    public setDirectViewport(x: number, y: number, width: number, height: number): Nullable<IViewportLike> {
        const currentViewport = this._cachedViewport;
        this._cachedViewport = null;

        this._viewport(x, y, width, height);

        return currentViewport;
    }

    /**
     * Executes a scissor clear (ie. a clear on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     * @param clearColor defines the clear color
     */
    public scissorClear(x: number, y: number, width: number, height: number, clearColor: IColor4Like): void {
        this.enableScissor(x, y, width, height);
        this.clear(clearColor, true, true, true);
        this.disableScissor();
    }

    /**
     * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     */
    public enableScissor(x: number, y: number, width: number, height: number): void {
        const gl = this._gl;

        // Change state
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, width, height);
    }

    /**
     * Disable previously set scissor test rectangle
     */
    public disableScissor() {
        const gl = this._gl;

        gl.disable(gl.SCISSOR_TEST);
    }

    /**
     * @internal
     */
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: false): Promise<string>;
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: true): Promise<ArrayBuffer>;

    /**
     * @internal
     */
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._loadFile(
                url,
                (data) => {
                    resolve(data);
                },
                undefined,
                offlineProvider,
                useArrayBuffer,
                (request, exception) => {
                    reject(exception);
                }
            );
        });
    }

    /**
     * Gets the source code of the vertex shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the vertex shader associated with the program
     */
    public getVertexShaderSource(program: WebGLProgram): Nullable<string> {
        const shaders = this._gl.getAttachedShaders(program);

        if (!shaders) {
            return null;
        }

        return this._gl.getShaderSource(shaders[0]);
    }

    /**
     * Gets the source code of the fragment shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the fragment shader associated with the program
     */
    public getFragmentShaderSource(program: WebGLProgram): Nullable<string> {
        const shaders = this._gl.getAttachedShaders(program);

        if (!shaders) {
            return null;
        }

        return this._gl.getShaderSource(shaders[1]);
    }

    /**
     * sets the object from which width and height will be taken from when getting render width and height
     * Will fallback to the gl object
     * @param dimensions the framebuffer width and height that will be used.
     */
    public override set framebufferDimensionsObject(dimensions: Nullable<{ framebufferWidth: number; framebufferHeight: number }>) {
        this._framebufferDimensionsObject = dimensions;
        if (this._framebufferDimensionsObject) {
            this.onResizeObservable.notifyObservers(this);
        }
    }

    protected override _rebuildBuffers(): void {
        // Index / Vertex
        for (const scene of this.scenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
        }

        for (const scene of this._virtualScenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
        }

        super._rebuildBuffers();
    }

    /**
     * Get Font size information
     * @param font font name
     * @returns an object containing ascent, height and descent
     */
    public override getFontOffset(font: string): { ascent: number; height: number; descent: number } {
        return GetFontOffset(font);
    }

    protected override _cancelFrame() {
        if (this.customAnimationFrameRequester) {
            if (this._frameHandler !== 0) {
                this._frameHandler = 0;
                const { cancelAnimationFrame } = this.customAnimationFrameRequester;
                if (cancelAnimationFrame) {
                    cancelAnimationFrame(this.customAnimationFrameRequester.requestID);
                }
            }
        } else {
            super._cancelFrame();
        }
    }

    public override _renderLoop(timestamp?: number): void {
        this._processFrame(timestamp);

        // The first condition prevents queuing another frame if we no longer have active render loops (e.g., if
        // `stopRenderLoop` is called mid frame). The second condition prevents queuing another frame if one has
        // already been queued (e.g., if `stopRenderLoop` and `runRenderLoop` is called mid frame).
        if (this._activeRenderLoops.length > 0 && this._frameHandler === 0) {
            if (this.customAnimationFrameRequester) {
                this.customAnimationFrameRequester.requestID = this._queueNewFrame(
                    this.customAnimationFrameRequester.renderFunction || this._boundRenderFunction,
                    this.customAnimationFrameRequester
                );
                this._frameHandler = this.customAnimationFrameRequester.requestID;
            } else {
                this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
            }
        }
    }

    /**
     * Enters Pointerlock mode
     */
    public enterPointerlock(): void {
        if (this._renderingCanvas) {
            RequestPointerlock(this._renderingCanvas);
        }
    }

    /**
     * Exits Pointerlock mode
     */
    public exitPointerlock(): void {
        ExitPointerlock();
    }

    /**
     * Begin a new frame
     */
    public override beginFrame(): void {
        this._measureFps();
        super.beginFrame();
    }

    public override _deletePipelineContext(pipelineContext: IPipelineContext): void {
        const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (webGLPipelineContext && webGLPipelineContext.program) {
            if (webGLPipelineContext.transformFeedback) {
                this.deleteTransformFeedback(webGLPipelineContext.transformFeedback);
                webGLPipelineContext.transformFeedback = null;
            }
        }
        super._deletePipelineContext(pipelineContext);
    }

    public override createShaderProgram(
        pipelineContext: IPipelineContext,
        vertexCode: string,
        fragmentCode: string,
        defines: Nullable<string>,
        context?: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        context = context || this._gl;

        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        const program = super.createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
        this.onAfterShaderCompilationObservable.notifyObservers(this);

        return program;
    }

    protected override _createShaderProgram(
        pipelineContext: WebGLPipelineContext,
        vertexShader: WebGLShader,
        fragmentShader: WebGLShader,
        context: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        const shaderProgram = context.createProgram();
        pipelineContext.program = shaderProgram;

        if (!shaderProgram) {
            throw new Error("Unable to create program");
        }

        context.attachShader(shaderProgram, vertexShader);
        context.attachShader(shaderProgram, fragmentShader);

        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            const transformFeedback = this.createTransformFeedback();

            this.bindTransformFeedback(transformFeedback);
            this.setTranformFeedbackVaryings(shaderProgram, transformFeedbackVaryings);
            pipelineContext.transformFeedback = transformFeedback;
        }

        context.linkProgram(shaderProgram);

        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            this.bindTransformFeedback(null);
        }

        pipelineContext.context = context;
        pipelineContext.vertexShader = vertexShader;
        pipelineContext.fragmentShader = fragmentShader;

        if (!pipelineContext.isParallelCompiled) {
            this._finalizePipelineContext(pipelineContext);
        }

        return shaderProgram;
    }

    /**
     * @internal
     */
    public override _releaseTexture(texture: InternalTexture): void {
        super._releaseTexture(texture);
    }

    /**
     * @internal
     */
    public override _releaseRenderTargetWrapper(rtWrapper: RenderTargetWrapper): void {
        super._releaseRenderTargetWrapper(rtWrapper);

        // Set output texture of post process to null if the framebuffer has been released/disposed
        for (const scene of this.scenes) {
            for (const postProcess of scene.postProcesses) {
                if (postProcess._outputTexture === rtWrapper) {
                    postProcess._outputTexture = null;
                }
            }
            for (const camera of scene.cameras) {
                for (const postProcess of camera._postProcesses) {
                    if (postProcess) {
                        if (postProcess._outputTexture === rtWrapper) {
                            postProcess._outputTexture = null;
                        }
                    }
                }
            }
        }
    }

    /**
     * @internal
     * Rescales a texture
     * @param source input texture
     * @param destination destination texture
     * @param scene scene to use to render the resize
     * @param internalFormat format to use when resizing
     * @param onComplete callback to be called when resize has completed
     */
    public override _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<any>, internalFormat: number, onComplete: () => void): void {
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

        const rtt = this.createRenderTargetTexture(
            {
                width: destination.width,
                height: destination.height,
            },
            {
                generateMipMaps: false,
                type: Constants.TEXTURETYPE_UNSIGNED_INT,
                samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                generateDepthBuffer: false,
                generateStencilBuffer: false,
            }
        );

        if (!this._rescalePostProcess && Engine._RescalePostProcessFactory) {
            this._rescalePostProcess = Engine._RescalePostProcessFactory(this);
        }

        if (this._rescalePostProcess) {
            this._rescalePostProcess.externalTextureSamplerBinding = true;
            const onCompiled = () => {
                this._rescalePostProcess!.onApply = function (effect) {
                    effect._bindTexture("textureSampler", source);
                };

                let hostingScene: Scene = scene;

                if (!hostingScene) {
                    hostingScene = this.scenes[this.scenes.length - 1];
                }
                hostingScene.postProcessManager.directRender([this._rescalePostProcess!], rtt, true);

                this._bindTextureDirectly(this._gl.TEXTURE_2D, destination, true);
                this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

                this.unBindFramebuffer(rtt);
                rtt.dispose();

                if (onComplete) {
                    onComplete();
                }
            };
            const effect = this._rescalePostProcess.getEffect();
            if (effect) {
                effect.executeWhenCompiled(onCompiled);
            } else {
                this._rescalePostProcess.onEffectCreatedObservable.addOnce((effect) => {
                    effect.executeWhenCompiled(onCompiled);
                });
            }
        }
    }

    /**
     * Wraps an external web gl texture in a Babylon texture.
     * @param texture defines the external texture
     * @param hasMipMaps defines whether the external texture has mip maps (default: false)
     * @param samplingMode defines the sampling mode for the external texture (default: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE)
     * @param width defines the width for the external texture (default: 0)
     * @param height defines the height for the external texture (default: 0)
     * @returns the babylon internal texture
     */
    public wrapWebGLTexture(
        texture: WebGLTexture,
        hasMipMaps: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        width: number = 0,
        height: number = 0
    ): InternalTexture {
        const hardwareTexture = new WebGLHardwareTexture(texture, this._gl);
        const internalTexture = new InternalTexture(this, InternalTextureSource.Unknown, true);
        internalTexture._hardwareTexture = hardwareTexture;
        internalTexture.baseWidth = width;
        internalTexture.baseHeight = height;
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture.isReady = true;
        internalTexture.useMipMaps = hasMipMaps;
        this.updateTextureSamplingMode(samplingMode, internalTexture);
        return internalTexture;
    }

    /**
     * @internal
     */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
        const gl = this._gl;

        const textureType = this._getWebGLTextureType(texture.type);
        const format = this._getInternalFormat(texture.format);
        const internalFormat = this._getRGBABufferInternalSizedFormat(texture.type, format);

        const bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

        this._bindTextureDirectly(bindTarget, texture, true);
        this._unpackFlipY(texture.invertY);

        let target: GLenum = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        gl.texImage2D(target, lod, internalFormat, format, textureType, image);
        this._bindTextureDirectly(bindTarget, null, true);
    }

    /**
     * Updates a depth texture Comparison Mode and Function.
     * If the comparison Function is equal to 0, the mode will be set to none.
     * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
     * @param texture The texture to set the comparison function for
     * @param comparisonFunction The comparison function to set, 0 if no comparison required
     */
    public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
        if (this.webGLVersion === 1) {
            Logger.Error("WebGL 1 does not support texture comparison.");
            return;
        }

        const gl = this._gl;

        if (texture.isCube) {
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture, true);

            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            } else {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
        } else {
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);

            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
        }

        texture._comparisonFunction = comparisonFunction;
    }

    /**
     * Creates a webGL buffer to use with instantiation
     * @param capacity defines the size of the buffer
     * @returns the webGL buffer
     */
    public createInstancesBuffer(capacity: number): DataBuffer {
        const buffer = this._gl.createBuffer();

        if (!buffer) {
            throw new Error("Unable to create instance buffer");
        }

        const result = new WebGLDataBuffer(buffer);
        result.capacity = capacity;

        this.bindArrayBuffer(result);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);

        result.references = 1;

        return result;
    }

    /**
     * Delete a webGL buffer used with instantiation
     * @param buffer defines the webGL buffer to delete
     */
    public deleteInstancesBuffer(buffer: WebGLBuffer): void {
        this._gl.deleteBuffer(buffer);
    }

    private _clientWaitAsync(sync: WebGLSync, flags = 0, intervalms = 10): Promise<void> {
        const gl = <WebGL2RenderingContext>(this._gl as any);
        return new Promise((resolve, reject) => {
            _retryWithInterval(
                () => {
                    const res = gl.clientWaitSync(sync, flags, 0);
                    if (res == gl.WAIT_FAILED) {
                        throw new Error("clientWaitSync failed");
                    }
                    if (res == gl.TIMEOUT_EXPIRED) {
                        return false;
                    }
                    return true;
                },
                resolve,
                reject,
                intervalms
            );
        });
    }

    /**
     * @internal
     */
    public _readPixelsAsync(x: number, y: number, w: number, h: number, format: number, type: number, outputBuffer: ArrayBufferView): Nullable<Promise<ArrayBufferView>> {
        if (this._webGLVersion < 2) {
            throw new Error("_readPixelsAsync only work on WebGL2+");
        }

        const gl = <WebGL2RenderingContext>(this._gl as any);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, outputBuffer.byteLength, gl.STREAM_READ);
        gl.readPixels(x, y, w, h, format, type, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!sync) {
            return null;
        }

        gl.flush();

        return this._clientWaitAsync(sync, 0, 10).then(() => {
            gl.deleteSync(sync);

            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
            gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, outputBuffer);
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
            gl.deleteBuffer(buf);

            return outputBuffer;
        });
    }

    public override dispose(): void {
        this.hideLoadingUI();

        // Rescale PP
        if (this._rescalePostProcess) {
            this._rescalePostProcess.dispose();
        }

        _CommonDispose(this, this._renderingCanvas);

        super.dispose();
    }
}
