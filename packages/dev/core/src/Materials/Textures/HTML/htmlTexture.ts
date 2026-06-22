/** This module has no top-level side effects: the engine extension it depends on is registered lazily from the constructor */

import { type Nullable } from "../../../types";
import { BaseTexture } from "../baseTexture.pure";
import { Constants } from "../../../Engines/constants";
import { Matrix } from "../../../Maths/math.vector.pure";
import { Observable } from "../../../Misc/observable.pure";
import { Logger } from "../../../Misc/logger";
import { IsWindowObjectExist } from "../../../Misc/domManagement";
import { RegisterEnginesExtensionsEngineDynamicTexture } from "../../../Engines/Extensions/engine.dynamicTexture.pure";

import { type AbstractEngine } from "../../../Engines/abstractEngine.pure";
import { type ThinEngine } from "../../../Engines/thinEngine.pure";
import { type WebGPUEngine } from "../../../Engines/webgpuEngine.pure";
import { type WebGPUHardwareTexture } from "../../../Engines/WebGPU/webgpuHardwareTexture";
import { type InternalTexture } from "../internalTexture";
import { type Scene } from "../../../scene.pure";

let _HasWarnedAboutMissingApi = false;

function _WarnMissingApi(apiName: string): void {
    if (_HasWarnedAboutMissingApi) {
        return;
    }
    _HasWarnedAboutMissingApi = true;
    Logger.Warn(
        `HTML-in-Canvas: ${apiName} is not available. Enable chrome://flags/#canvas-draw-element, the built-in SVG fallback, or the three-html-render polyfill to use HtmlTexture.`
    );
}

let _HasWarnedAboutSvgFallback = false;

function _WarnSvgFallback(): void {
    if (_HasWarnedAboutSvgFallback) {
        return;
    }
    _HasWarnedAboutSvgFallback = true;
    Logger.Warn("HTML-in-Canvas: the SVG fallback could not rasterize the element. This usually means it references cross-origin or external resources, which taint the snapshot.");
}

let _HasWarnedAboutUploadFailure = false;

function _WarnUploadFailure(error: unknown): void {
    if (_HasWarnedAboutUploadFailure) {
        return;
    }
    _HasWarnedAboutUploadFailure = true;
    const message = error instanceof Error ? error.message : String(error);
    Logger.Warn(
        `HTML-in-Canvas: the native upload failed (${message}). The element must be a direct child of the engine's rendering canvas, which must carry the \`layoutsubtree\` attribute, and the upload must run during a paint event.`
    );
}

/**
 * Detects whether the engine can upload an HTML element through the native (or polyfilled) WICG
 * HTML-in-Canvas API, without emitting any warning. Used to decide whether the SVG fallback is needed.
 * @param engine defines the engine to test
 * @returns true when the WICG upload API is available for this engine
 */
export function IsHtmlInCanvasUploadSupported(engine: AbstractEngine): boolean {
    if (engine.isWebGPU) {
        const queue = (engine as WebGPUEngine)._device?.queue;
        return !!queue && typeof queue.copyElementImageToTexture === "function";
    }

    const gl = (engine as ThinEngine)._gl as Nullable<WebGL2RenderingContext>;
    return !!gl && typeof gl.texElementImage2D === "function";
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

    // texElementImage2D requires a *sized* internal format (RGBA8, SRGB8_ALPHA8, RGBA16F or RGBA32F);
    // the unsized gl.RGBA returned by _getInternalFormat is rejected.
    const internalFormat = engine._getRGBABufferInternalSizedFormat(texture.type, texture.format, texture._useSRGBBuffer);
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
    } catch (error) {
        // Reaching here means the snapshot upload failed - usually a real misconfiguration (the element is
        // not a child of the rendering canvas, or `layoutsubtree` is missing), though a stray call before
        // the first paint snapshot can also throw. Either way we must NOT disable the texture, so a later
        // paint-driven update can still succeed; we surface a one-time diagnostic to help debugging.
        _WarnUploadFailure(error);
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
    } catch (error) {
        // Reaching here means the snapshot upload failed - usually a real misconfiguration (the element is
        // not a child of the rendering canvas, or `layoutsubtree` is missing), though a stray call before
        // the first paint snapshot can also throw. Either way we must NOT disable the texture, so a later
        // paint-driven update can still succeed; we surface a one-time diagnostic to help debugging.
        _WarnUploadFailure(error);
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
    /**
     * Defines whether to fall back to an SVG `<foreignObject>` rasterization when the native WICG
     * HTML-in-Canvas API is unavailable (default: true). The fallback works in any browser but only
     * captures same-origin, inline-styled content as a static snapshot (see the documentation for caveats).
     */
    useSvgFallback?: boolean;
    /** Defines the engine instance to use the texture with. Not mandatory if a scene is provided. */
    engine?: Nullable<AbstractEngine>;
    /** Defines the scene the texture belongs to. Not mandatory if an engine is provided. */
    scene?: Nullable<Scene>;
}

/**
 * A texture whose content is rendered from a live HTML element using the WICG HTML-in-Canvas API
 * (https://github.com/WICG/html-in-canvas).
 *
 * The element is hosted as a child of the engine's rendering canvas (which is marked `layoutsubtree`) so
 * the browser can lay it out and snapshot it; the WICG API requires the source element to be a direct
 * child of the canvas whose context performs the upload. Content is uploaded through
 * `WebGLRenderingContext.texElementImage2D` (WebGL) or `GPUQueue.copyElementImageToTexture` (WebGPU),
 * available either natively (behind chrome://flags/#canvas-draw-element) or via the three-html-render
 * polyfill (https://github.com/repalash/three-html-render). When neither is present, a built-in SVG
 * `<foreignObject>` fallback is used instead (see `useSvgFallback`).
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
     * The element that hosts {@link element} in the document. This is the engine's rendering canvas when one
     * is available (required by the WICG API, which can only capture the element from that canvas), or a
     * hidden helper `<div>` otherwise - in which case only the SVG fallback can render.
     */
    public readonly host: Nullable<HTMLElement>;

    /**
     * Observable triggered once the texture has been rendered for the first time.
     */
    public onLoadObservable: Observable<HtmlTexture> = new Observable<HtmlTexture>();

    private static readonly _DefaultOptions: Required<Pick<IHtmlTextureOptions, "generateMipMaps" | "samplingMode" | "format" | "autoUpdate" | "useSvgFallback">> = {
        generateMipMaps: false,
        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        format: Constants.TEXTUREFORMAT_RGBA,
        autoUpdate: true,
        useSvgFallback: true,
    };

    private readonly _format: number;
    private readonly _generateMipMaps: boolean;
    private readonly _samplingMode: number;
    private readonly _useSvgFallback: boolean;
    private readonly _textureMatrix: Matrix;
    private _paintHandler: Nullable<(event: PaintEvent) => void> = null;
    private _ownsHost: boolean = false;
    private _originalParent: Nullable<Node & ParentNode> = null;
    private _originalNextSibling: Nullable<ChildNode> = null;
    private _addedInert: boolean = false;
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
            this.host = null;
            this._width = 0;
            this._height = 0;
            this._format = HtmlTexture._DefaultOptions.format;
            this._generateMipMaps = HtmlTexture._DefaultOptions.generateMipMaps;
            this._samplingMode = HtmlTexture._DefaultOptions.samplingMode;
            this._useSvgFallback = HtmlTexture._DefaultOptions.useSvgFallback;
            return;
        }

        this._generateMipMaps = options.generateMipMaps ?? HtmlTexture._DefaultOptions.generateMipMaps;
        this._samplingMode = options.samplingMode ?? HtmlTexture._DefaultOptions.samplingMode;
        this._format = options.format ?? HtmlTexture._DefaultOptions.format;
        this._useSvgFallback = options.useSvgFallback ?? HtmlTexture._DefaultOptions.useSvgFallback;
        const autoUpdate = options.autoUpdate ?? HtmlTexture._DefaultOptions.autoUpdate;

        this._width = options.width || element.offsetWidth || 256;
        this._height = options.height || element.offsetHeight || 256;

        this.name = name;
        this.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this.anisotropicFilteringLevel = 1;

        this.host = this._createHost();

        // The native WICG API has no content until the first paint snapshot is recorded, so the initial
        // upload must happen from a paint event. The rendering canvas emits `paint`; listen for at least the
        // first one and, when auto-update is disabled, detach after that first refresh. A non-canvas helper
        // host never emits `paint`, so this listener is simply never invoked there.
        if (this.host) {
            this._paintHandler = (event: PaintEvent) => {
                // A single `paint` event covers every changed child of the shared rendering canvas. When the
                // browser reports which elements changed, skip the upload unless ours is among them, so that
                // multiple HTML textures hosted on the same canvas don't all re-upload on every unrelated change.
                if (event.changedElements && !event.changedElements.some((changed) => this.element === changed || this.element.contains(changed))) {
                    return;
                }
                this.update();
                if (!autoUpdate && this._paintHandler && this.host) {
                    this.host.removeEventListener("paint", this._paintHandler as EventListener);
                    this._paintHandler = null;
                }
            };
            this.host.addEventListener("paint", this._paintHandler as EventListener);
        }

        this._createInternalTexture();
    }

    private _createHost(): Nullable<HTMLElement> {
        if (!IsWindowObjectExist() || typeof document === "undefined") {
            return null;
        }

        // Remember where the caller had the element so dispose() can put it back: we are about to re-parent it
        // into the host (the element must be a direct child of the host to be captured and laid out).
        this._originalParent = this.element.parentNode;
        this._originalNextSibling = this.element.nextSibling;

        // Per the WICG spec, the source element must be a *direct child* of the same canvas whose WebGL/WebGPU
        // context performs the upload, and that canvas must opt its subtree into layout via `layoutsubtree`.
        // The engine already owns our texture through its rendering canvas, so the element has to live inside
        // that canvas: it is the only one whose context can snapshot the element via texElementImage2D /
        // copyElementImageToTexture. A separate canvas would lay the element out but could never be captured
        // into the engine's texture (this is why nothing rendered on the native path before).
        const renderingCanvas = this._getEngine()?.getRenderingCanvas() ?? null;
        if (renderingCanvas) {
            renderingCanvas.layoutSubtree = true;
            // `layoutsubtree` opts children into hit testing; mark ours inert so it never steals pointer events
            // from the canvas (e.g. camera controls). Synthetic event dispatch still reaches inert elements, so
            // HtmlRaycastInteractionManager keeps working; HtmlInteractionManager clears it to enable native input.
            this._addedInert = !this.element.hasAttribute("inert");
            this.element.setAttribute("inert", "");
            renderingCanvas.appendChild(this.element);
            this._ownsHost = false;
            return renderingCanvas;
        }

        // No rendering canvas (e.g. NullEngine / offscreen): the native upload paths cannot run, because they
        // capture from the engine's canvas and there is none. Only the SVG fallback renders here, and it builds
        // from the element's serialized markup rather than from a canvas - so a host *canvas* would buy nothing.
        // Host the element in a hidden, off-screen <div> purely so it is laid out in the document (giving
        // correct measured sizes); there is no canvas to capture into on this path.
        const host = document.createElement("div");
        host.style.position = "absolute";
        host.style.left = "-99999px";
        host.style.top = "0px";
        host.style.pointerEvents = "none";
        host.setAttribute("aria-hidden", "true");

        host.appendChild(this.element);
        document.body.appendChild(host);
        this._ownsHost = true;

        return host;
    }

    private _createInternalTexture(): void {
        const engine = this._getEngine();
        if (engine) {
            // createDynamicTexture is an engine extension; register it lazily (idempotent) so this module stays free of top-level side effects.
            RegisterEnginesExtensionsEngineDynamicTexture();
            this._texture = engine.createDynamicTexture(this._width, this._height, this._generateMipMaps, this._samplingMode);
            this._texture.format = this._format;
        }

        // Trigger the initial render. On the native path this requests a paint so the first upload happens
        // once a snapshot exists (calling the WICG API before the first snapshot throws); otherwise the
        // SVG fallback (or a direct update) renders immediately.
        this.requestUpdate();
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
        // `requestPaint` only exists on a WICG-capable rendering canvas; the helper <div> host has no such
        // method, so fall back to an immediate update there.
        const canvasHost = this.host as Nullable<HTMLCanvasElement>;
        if (canvasHost && typeof canvasHost.requestPaint === "function") {
            canvasHost.requestPaint();
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

        // When the native WICG upload API is unavailable, render through the SVG <foreignObject> fallback
        // (unless it was explicitly disabled, in which case the upload helper emits a one-time warning).
        if (this._useSvgFallback && !IsHtmlInCanvasUploadSupported(engine)) {
            this._updateFromSvgFallback(engine, invertY);
            return;
        }

        const wasReady = this.isReady();

        UploadHtmlElementToTexture(engine, this._texture, this.element, invertY);

        if (!wasReady && this.isReady()) {
            this.onLoadObservable.notifyObservers(this);
        }
    }

    /**
     * Renders the element through an SVG `<foreignObject>` snapshot and uploads it to the texture. This
     * fallback works in any browser but only captures same-origin, inline-styled content as a static image.
     * @param engine defines the engine that owns the texture
     * @param invertY defines whether the texture should be inverted on Y
     */
    private _updateFromSvgFallback(engine: AbstractEngine, invertY: boolean): void {
        if (typeof document === "undefined" || typeof Image === "undefined" || typeof XMLSerializer === "undefined") {
            return;
        }

        const svgUrl = this._buildSvgDataUrl();
        if (!svgUrl) {
            return;
        }

        const image = new Image();
        image.onload = () => {
            if (this._texture == null) {
                return;
            }
            const wasReady = this.isReady();
            try {
                engine.updateDynamicTexture(this._texture, image, invertY, false, this._format);
            } catch {
                _WarnSvgFallback();
                return;
            }
            if (!wasReady && this.isReady()) {
                this.onLoadObservable.notifyObservers(this);
            }
        };
        image.onerror = () => {
            _WarnSvgFallback();
        };
        image.src = svgUrl;
    }

    /**
     * Serializes the element into an SVG `<foreignObject>` data URL sized to the texture.
     * @returns a data URL, or null if serialization failed
     */
    private _buildSvgDataUrl(): Nullable<string> {
        try {
            const clone = this.element.cloneNode(true) as HTMLElement;
            clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
            const serialized = new XMLSerializer().serializeToString(clone);
            const svg =
                `<svg xmlns="http://www.w3.org/2000/svg" width="${this._width}" height="${this._height}">` +
                `<foreignObject x="0" y="0" width="100%" height="100%">${serialized}</foreignObject>` +
                `</svg>`;
            return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        } catch {
            return null;
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
        if (this.host) {
            if (this._paintHandler) {
                this.host.removeEventListener("paint", this._paintHandler as EventListener);
                this._paintHandler = null;
            }
            // Remove the `inert` attribute we added so the caller gets the element back as they passed it.
            if (this._addedInert) {
                this.element.removeAttribute("inert");
                this._addedInert = false;
            }
            // Restore the element to where the caller had it before we re-parented it into the host, rather
            // than silently deleting their node from the document.
            if (this._originalParent) {
                const reference = this._originalNextSibling && this._originalNextSibling.parentNode === this._originalParent ? this._originalNextSibling : null;
                this._originalParent.insertBefore(this.element, reference);
            } else {
                this.element.remove();
            }
            // Remove the helper host we created (never the engine's borrowed rendering canvas).
            if (this._ownsHost) {
                this.host.remove();
            }
        }

        this.onLoadObservable.clear();
        super.dispose();
    }
}
