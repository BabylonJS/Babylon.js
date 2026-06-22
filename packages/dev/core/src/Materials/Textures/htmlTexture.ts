/** This module has no top-level side effects: the engine extension it depends on is registered lazily from the constructor */

import { type Nullable } from "../../types";
import { BaseTexture } from "../../Materials/Textures/baseTexture.pure";
import { Constants } from "../../Engines/constants";
import { Matrix } from "../../Maths/math.vector.pure";
import { Observable } from "../../Misc/observable.pure";
import { Logger } from "../../Misc/logger";
import { IsWindowObjectExist } from "../../Misc/domManagement";
import { RegisterEnginesExtensionsEngineDynamicTexture } from "../../Engines/Extensions/engine.dynamicTexture.pure";

import { type AbstractEngine } from "../../Engines/abstractEngine.pure";
import { type ThinEngine } from "../../Engines/thinEngine.pure";
import { type WebGPUEngine } from "../../Engines/webgpuEngine.pure";
import { type WebGPUHardwareTexture } from "../../Engines/WebGPU/webgpuHardwareTexture";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";
import { type Scene } from "../../scene.pure";

let _HasWarnedAboutMissingApi = false;

function _WarnMissingApi(apiName: string): void {
    if (_HasWarnedAboutMissingApi) {
        return;
    }
    _HasWarnedAboutMissingApi = true;
    Logger.Warn(`HTML-in-Canvas: ${apiName} is not available. Enable chrome://flags/#canvas-draw-element or install the three-html-render polyfill to use HtmlTexture.`);
}

/**
 * Uploads a live HTML element (or a captured ElementImage) into an existing 2D texture using the WICG
 * HTML-in-Canvas API (https://github.com/WICG/html-in-canvas).
 *
 * This is a side-effect-free helper - it is only reachable when {@link HtmlTexture} (or a direct caller)
 * is imported, so it adds nothing to bundles that do not use it. It relies on
 * `WebGLRenderingContext.texElementImage2D` (WebGL) or `GPUQueue.copyElementImageToTexture` (WebGPU),
 * available either natively (behind chrome://flags/#canvas-draw-element) or through the
 * three-html-render polyfill.
 * @param engine defines the engine that owns the texture
 * @param texture defines the internal texture to update
 * @param element defines the source HTML element (or captured ElementImage) to upload
 * @param invertY defines if data must be stored with Y axis inverted (true by default)
 * @param config defines an optional source rectangle and sizing configuration
 * @returns true if the upload succeeded, false otherwise (e.g. the API is unavailable)
 */
export function UploadHtmlElementToTexture(
    engine: AbstractEngine,
    texture: Nullable<InternalTexture>,
    element: Element | ElementImage,
    invertY: boolean = true,
    config?: WebGLCopyElementImageConfig
): boolean {
    if (!texture || texture._isDisabled) {
        return false;
    }

    if (engine.isWebGPU) {
        return _UploadHtmlElementToWebGPUTexture(engine as WebGPUEngine, texture, element, invertY, config);
    }

    return _UploadHtmlElementToWebGLTexture(engine as ThinEngine, texture, element, invertY, config);
}

function _UploadHtmlElementToWebGLTexture(
    engine: ThinEngine,
    texture: InternalTexture,
    element: Element | ElementImage,
    invertY: boolean,
    config?: WebGLCopyElementImageConfig
): boolean {
    // texElementImage2D is provided either natively (behind a flag) or by the three-html-render polyfill.
    // Engines without a WebGL context (e.g. NullEngine) have no _gl and are handled by this guard.
    const gl = engine._gl as Nullable<WebGL2RenderingContext>;
    if (!gl || typeof gl.texElementImage2D !== "function") {
        _WarnMissingApi("texElementImage2D");
        return false;
    }

    const internalFormat = engine._getInternalFormat(texture.format);
    const wasPreviouslyBound = engine._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
    engine._unpackFlipY(invertY);

    try {
        gl.texElementImage2D(gl.TEXTURE_2D, internalFormat, element, config);

        if (texture.generateMipMaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        if (!wasPreviouslyBound) {
            engine._bindTextureDirectly(gl.TEXTURE_2D, null);
        }

        texture.invertY = invertY;
        texture.isReady = true;
        return true;
    } catch {
        // Something unexpected happened during the upload; disable the texture to avoid repeated failures.
        texture._isDisabled = true;
        return false;
    }
}

function _UploadHtmlElementToWebGPUTexture(
    engine: WebGPUEngine,
    texture: InternalTexture,
    element: Element | ElementImage,
    invertY: boolean,
    config?: WebGLCopyElementImageConfig
): boolean {
    // copyElementImageToTexture is provided either natively (behind a flag) or by the three-html-render polyfill.
    const device = engine._device;
    const queue = device && device.queue;
    if (!device || !queue || typeof queue.copyElementImageToTexture !== "function") {
        _WarnMissingApi("GPUQueue.copyElementImageToTexture");
        return false;
    }

    const gpuTexture = (texture._hardwareTexture as Nullable<WebGPUHardwareTexture>)?.underlyingResource;
    if (!gpuTexture) {
        return false;
    }

    try {
        const source: GPUCopyElementImageSource = { source: element };
        if (config) {
            source.sx = config.sx;
            source.sy = config.sy;
            source.swidth = config.swidth;
            source.sheight = config.sheight;
        }

        queue.copyElementImageToTexture(source, {
            destination: { texture: gpuTexture },
            width: config?.width ?? texture.width,
            height: config?.height ?? texture.height,
        });

        if (texture.generateMipMaps) {
            engine._generateMipmaps(texture);
        }

        // The WICG copyElementImageToTexture API has no flipY option; the destination orientation is
        // determined by the source. We record the requested value for downstream sampling conventions.
        texture.invertY = invertY;
        texture.isReady = true;
        return true;
    } catch {
        // Something unexpected happened during the upload; disable the texture to avoid repeated failures.
        texture._isDisabled = true;
        return false;
    }
}

/**
 * Defines the options used to create an {@link HtmlTexture}.
 */
export interface IHtmlTextureOptions {
    /** Defines the width of the texture in pixels (defaults to the element's offset width, then 256). */
    width?: number;
    /** Defines the height of the texture in pixels (defaults to the element's offset height, then 256). */
    height?: number;
    /** Defines whether mip maps should be created or not (default: false). */
    generateMipMaps?: boolean;
    /** Defines the sampling mode of the texture (default: TEXTURE_BILINEAR_SAMPLINGMODE). */
    samplingMode?: number;
    /** Defines the associated texture format (default: TEXTUREFORMAT_RGBA). */
    format?: number;
    /** Defines whether the texture is automatically updated when the host canvas emits a paint event (default: true). */
    autoUpdate?: boolean;
    /** Defines the engine instance to use the texture with. Not mandatory if a scene is provided. */
    engine?: Nullable<AbstractEngine>;
    /** Defines the scene the texture belongs to. Not mandatory if an engine is provided. */
    scene?: Nullable<Scene>;
}

/**
 * A texture whose content is rendered from a live HTML element using the WICG HTML-in-Canvas API
 * (https://github.com/WICG/html-in-canvas).
 *
 * The element is hosted inside a hidden `<canvas layoutsubtree>` so the browser can lay it out and
 * snapshot it. Content is uploaded through `WebGLRenderingContext.texElementImage2D`, which is
 * available either natively (behind chrome://flags/#canvas-draw-element) or via the three-html-render
 * polyfill (https://github.com/repalash/three-html-render).
 *
 * As with {@link HtmlElementTexture}, updates are not automatic unless `autoUpdate` is enabled; in
 * that case the texture refreshes whenever the host canvas reports a paint change.
 */
export class HtmlTexture extends BaseTexture {
    /**
     * The HTML element rendered into the texture.
     */
    public readonly element: HTMLElement;

    /**
     * The hidden host canvas that owns the element and drives layout/paint events.
     */
    public readonly hostCanvas: Nullable<HTMLCanvasElement>;

    /**
     * Observable triggered once the texture has been rendered for the first time.
     */
    public onLoadObservable: Observable<HtmlTexture> = new Observable<HtmlTexture>();

    private static readonly _DefaultOptions: Required<Pick<IHtmlTextureOptions, "generateMipMaps" | "samplingMode" | "format" | "autoUpdate">> = {
        generateMipMaps: false,
        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        format: Constants.TEXTUREFORMAT_RGBA,
        autoUpdate: true,
    };

    private readonly _format: number;
    private readonly _generateMipMaps: boolean;
    private readonly _samplingMode: number;
    private readonly _textureMatrix: Matrix;
    private _paintHandler: Nullable<() => void> = null;
    private _width: number;
    private _height: number;

    /**
     * Instantiates an HtmlTexture from an HTML element.
     * @param name Defines the name of the texture
     * @param element Defines the HTML element to render into the texture
     * @param options Defines the texture creation options
     */
    constructor(name: string, element: HTMLElement, options: IHtmlTextureOptions) {
        super(options.scene || options.engine);

        this.element = element;
        this._textureMatrix = Matrix.Identity();

        if (!element || (!options.engine && !options.scene)) {
            this.hostCanvas = null;
            this._width = 0;
            this._height = 0;
            this._format = HtmlTexture._DefaultOptions.format;
            this._generateMipMaps = HtmlTexture._DefaultOptions.generateMipMaps;
            this._samplingMode = HtmlTexture._DefaultOptions.samplingMode;
            return;
        }

        this._generateMipMaps = options.generateMipMaps ?? HtmlTexture._DefaultOptions.generateMipMaps;
        this._samplingMode = options.samplingMode ?? HtmlTexture._DefaultOptions.samplingMode;
        this._format = options.format ?? HtmlTexture._DefaultOptions.format;
        const autoUpdate = options.autoUpdate ?? HtmlTexture._DefaultOptions.autoUpdate;

        this._width = options.width || element.offsetWidth || 256;
        this._height = options.height || element.offsetHeight || 256;

        this.name = name;
        this.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.anisotropicFilteringLevel = 1;

        this.hostCanvas = this._createHostCanvas();

        if (autoUpdate && this.hostCanvas) {
            this._paintHandler = () => this.update();
            this.hostCanvas.addEventListener("paint", this._paintHandler);
        }

        this._createInternalTexture();
    }

    private _createHostCanvas(): Nullable<HTMLCanvasElement> {
        if (!IsWindowObjectExist() || typeof document === "undefined") {
            return null;
        }

        const hostCanvas = document.createElement("canvas");
        hostCanvas.width = this._width;
        hostCanvas.height = this._height;
        // Keep the host canvas in the DOM (required for layout) but invisible to the user.
        hostCanvas.style.position = "absolute";
        hostCanvas.style.left = "-99999px";
        hostCanvas.style.top = "0px";
        hostCanvas.style.pointerEvents = "none";
        hostCanvas.setAttribute("aria-hidden", "true");
        // Opt the element subtree into layout and hit testing so it can be drawn into the canvas.
        hostCanvas.layoutSubtree = true;

        hostCanvas.appendChild(this.element);
        document.body.appendChild(hostCanvas);

        return hostCanvas;
    }

    private _createInternalTexture(): void {
        const engine = this._getEngine();
        if (engine) {
            // createDynamicTexture is an engine extension; register it lazily (idempotent) so this module stays free of top-level side effects.
            RegisterEnginesExtensionsEngineDynamicTexture();
            this._texture = engine.createDynamicTexture(this._width, this._height, this._generateMipMaps, this._samplingMode);
            this._texture.format = this._format;
        }

        this.update();
    }

    /**
     * @returns the texture matrix used in most of the material.
     */
    public override getTextureMatrix(): Matrix {
        return this._textureMatrix;
    }

    /**
     * Requests the host canvas to emit a paint event on the next rendering update. When auto-update is
     * enabled, this triggers a texture refresh in sync with the DOM. Falls back to an immediate update
     * when the WICG API is not available.
     */
    public requestUpdate(): void {
        if (this.hostCanvas && typeof this.hostCanvas.requestPaint === "function") {
            this.hostCanvas.requestPaint();
        } else {
            this.update();
        }
    }

    /**
     * Updates the content of the texture from the current state of the HTML element.
     * @param invertY Defines whether the texture should be inverted on Y (true by default)
     */
    public update(invertY: boolean = true): void {
        const engine = this._getEngine();
        if (this._texture == null || engine == null) {
            return;
        }

        const wasReady = this.isReady();

        UploadHtmlElementToTexture(engine, this._texture, this.element, invertY);

        if (!wasReady && this.isReady()) {
            this.onLoadObservable.notifyObservers(this);
        }
    }

    /**
     * Gets the current class name of the texture useful for serialization or dynamic coding.
     * @returns "HtmlTexture"
     */
    public override getClassName(): string {
        return "HtmlTexture";
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public override dispose(): void {
        if (this.hostCanvas) {
            if (this._paintHandler) {
                this.hostCanvas.removeEventListener("paint", this._paintHandler);
                this._paintHandler = null;
            }
            this.hostCanvas.remove();
        }

        this.onLoadObservable.clear();
        super.dispose();
    }
}
