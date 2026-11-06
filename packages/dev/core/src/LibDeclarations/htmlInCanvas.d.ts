/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-var */
// Type definitions for the WICG HTML-in-Canvas proposal (https://github.com/WICG/html-in-canvas).
// These augment the standard DOM, WebGL and WebGPU types so Babylon can consume the API - whether
// provided natively (behind chrome://flags/#canvas-draw-element) or by the three-html-render polyfill -
// without TypeScript errors. The proposal is experimental; signatures track the explainer IDL and
// may change. Members removed from the explainer are kept (and deprecated) while implementations still ship them.

/**
 * A transferable snapshot of a rendered element, produced by `HTMLCanvasElement.captureElementImage`.
 */
interface ElementImage {
    /**
     * Default width of the snapshot in canvas grid coordinates.
     * @deprecated Removed from the proposal. Use `getElementImageDefaultSize` on the canvas instead.
     */
    readonly width: number;
    /**
     * Default height of the snapshot in canvas grid coordinates.
     * @deprecated Removed from the proposal. Use `getElementImageDefaultSize` on the canvas instead.
     */
    readonly height: number;
    /** Releases the snapshot. */
    close(): void;
}

declare var ElementImage: {
    prototype: ElementImage;
    new (): ElementImage;
};

/**
 * The default size of a drawable element (or snapshot) in canvas grid coordinates.
 */
interface ElementImageDefaultSize {
    width: number;
    height: number;
}

/**
 * Source rectangle and sizing configuration for HTML-in-Canvas WebGL uploads.
 */
interface WebGLCopyElementImageConfig {
    sx?: number;
    sy?: number;
    swidth?: number;
    sheight?: number;
    width?: number;
    height?: number;
}

/**
 * Initialization dictionary for {@link CanvasPaintEvent}.
 */
interface CanvasPaintEventInit extends EventInit {
    changedElements?: Element[];
}

/**
 * Event dispatched on a drawable canvas when the rendering of one of its drawable descendants changes.
 */
interface CanvasPaintEvent extends Event {
    /** The drawable descendants whose rendering changed since the last paint event. */
    readonly changedElements: ReadonlyArray<Element>;
}

declare var CanvasPaintEvent: {
    prototype: CanvasPaintEvent;
    new (type: string, eventInitDict?: CanvasPaintEventInit): CanvasPaintEvent;
};

/**
 * Event dispatched on a drawable canvas when the rendering of one of its drawable descendants changes.
 * @deprecated Use {@link CanvasPaintEvent} instead.
 */
interface PaintEvent extends CanvasPaintEvent {}

/**
 * Initialization dictionary for {@link ElementGeometryUpdateEvent}.
 */
interface ElementGeometryUpdateEventInit extends EventInit {
    elements?: Element[];
}

/**
 * Event dispatched on an `HTMLCanvasElement` once batched `OffscreenCanvas` geometry updates have been applied.
 */
interface ElementGeometryUpdateEvent extends Event {
    /** The elements whose geometry was updated. Elements that no longer exist are omitted. */
    readonly elements: ReadonlyArray<Element>;
}

declare var ElementGeometryUpdateEvent: {
    prototype: ElementGeometryUpdateEvent;
    new (type: string, eventInitDict?: ElementGeometryUpdateEventInit): ElementGeometryUpdateEvent;
};

interface HTMLCanvasElementEventMap extends HTMLElementEventMap {
    paint: CanvasPaintEvent;
    elementgeometryupdate: ElementGeometryUpdateEvent;
}

/**
 * Geometry used to synchronize a drawable element's hit testing with its canvas rendering.
 */
interface UpdateElementGeometryOptions {
    /** Keeps the element's current position in the canvas hit testing stack when it is already present. */
    preserveHitTestOrder?: boolean;
    /** Maps the element's border box, before CSS transforms, to the canvas. */
    canvasTransform?: DOMMatrixInit;
    /** Clip used for hit testing, in the coordinate space of `canvasTransform`. */
    canvasClip?: DOMRectInit;
}

/**
 * Options for `drawElementImage`.
 */
interface DrawElementImageOptions {
    /** Prevents the automatic element geometry update performed by 2D drawing (default false). */
    preserveElementGeometry?: boolean;
}

interface HTMLCanvasElement {
    /** Opts canvas descendants into layout when set to "drawable" (defaults to "fallback"). */
    content: string;
    /**
     * Opts canvas descendants into layout and hit testing so they can be drawn into the canvas.
     * @deprecated Replaced by `content = "drawable"`; retained for older implementations.
     */
    layoutSubtree: boolean;
    /** Fired when the rendering of any drawable canvas descendant has changed. */
    onpaint: ((this: HTMLCanvasElement, ev: CanvasPaintEvent) => any) | null;
    /** Fired once batched `OffscreenCanvas` geometry updates have been applied. */
    onelementgeometryupdate: ((this: HTMLCanvasElement, ev: ElementGeometryUpdateEvent) => any) | null;
    /** Requests a single `paint` event on the next rendering update, even if nothing changed. */
    requestPaint(): void;
    /** Captures a transferable snapshot of the given drawable element. */
    captureElementImage(element: Element): ElementImage;
    /** Registers a drawable descendant's geometry for hit testing and accessibility. */
    updateElementGeometry(element: Element | ElementImage, options?: UpdateElementGeometryOptions): void;
    /** Clears the registered hit-testing and accessibility geometry of a drawable descendant. */
    clearElementGeometry(element: Element | ElementImage): void;
    /** Returns the transform currently mapping the element's border box to the canvas, or identity when none is set. */
    getElementTransform(element: Element): DOMMatrix;
    /**
     * Older signature returning the CSS transform that keeps the element's DOM location in sync with its drawn location.
     * @deprecated Use `getElementTransform(element)` instead.
     */
    getElementTransform(element: Element | ElementImage, drawTransform: DOMMatrix): DOMMatrix;
    /** Returns the default size of the element (or snapshot) in canvas grid coordinates. */
    getElementImageDefaultSize(element: Element | ElementImage): ElementImageDefaultSize;
    addEventListener<K extends keyof HTMLCanvasElementEventMap>(
        type: K,
        listener: (this: HTMLCanvasElement, ev: HTMLCanvasElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof HTMLCanvasElementEventMap>(
        type: K,
        listener: (this: HTMLCanvasElement, ev: HTMLCanvasElementEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void;
}

interface OffscreenCanvas {
    /** Updates the element's geometry. Updates are batched and applied asynchronously on the main thread. */
    updateElementGeometry(element: Element | ElementImage, options?: UpdateElementGeometryOptions): void;
    /** Clears the element's geometry. Updates are batched and applied asynchronously on the main thread. */
    clearElementGeometry(element: Element | ElementImage): void;
    /** Returns the default size of the element (or snapshot) in canvas grid coordinates. */
    getElementImageDefaultSize(element: Element | ElementImage): ElementImageDefaultSize;
}

/**
 * Draws drawable elements (or snapshots) into a 2D context.
 */
interface CanvasDrawElementImage {
    drawElementImage(element: Element | ElementImage, dx: number, dy: number, options?: DrawElementImageOptions): void;
    drawElementImage(element: Element | ElementImage, dx: number, dy: number, dwidth: number, dheight: number, options?: DrawElementImageOptions): void;
    drawElementImage(element: Element | ElementImage, sx: number, sy: number, swidth: number, sheight: number, dx: number, dy: number, options?: DrawElementImageOptions): void;
    drawElementImage(
        element: Element | ElementImage,
        sx: number,
        sy: number,
        swidth: number,
        sheight: number,
        dx: number,
        dy: number,
        dwidth: number,
        dheight: number,
        options?: DrawElementImageOptions
    ): void;
    /**
     * Older overload with optional destination dimensions, kept so existing calls passing `undefined` or optional values still compile.
     * @deprecated Pass both `dwidth` and `dheight`, or neither.
     */
    drawElementImage(element: Element | ElementImage, sx: number, sy: number, swidth: number, sheight: number, dx: number, dy: number, dwidth?: number, dheight?: number): void;
}

interface CanvasRenderingContext2D extends CanvasDrawElementImage {}

interface OffscreenCanvasRenderingContext2D extends CanvasDrawElementImage {}

interface WebGLRenderingContext {
    /** Draws a rendered element (or snapshot) into an allocated 2D texture. */
    texElementSubImage2D(target: number, level: number, xoffset: number, yoffset: number, element: Element | ElementImage, config?: WebGLCopyElementImageConfig): void;
    /**
     * Older WICG upload signature, retained for browsers and polyfills exposing the legacy name.
     * @deprecated Use `texElementSubImage2D` instead.
     */
    texElementImage2D(target: number, internalformat: number, element: Element | ElementImage, config?: WebGLCopyElementImageConfig): void;
    /**
     * Legacy texImage2D-shaped overload still shipped by some Chrome Canary builds.
     * @deprecated Use `texElementSubImage2D` instead.
     */
    texElementImage2D(target: number, level: number, internalformat: number, format: number, type: number, element: Element | ElementImage): void;
}

interface WebGL2RenderingContext {
    /** Draws a rendered element (or snapshot) into an allocated 2D texture. */
    texElementSubImage2D(target: number, level: number, xoffset: number, yoffset: number, element: Element | ElementImage, config?: WebGLCopyElementImageConfig): void;
    /**
     * Older WICG upload signature, retained for browsers and polyfills exposing the legacy name.
     * @deprecated Use `texElementSubImage2D` instead.
     */
    texElementImage2D(target: number, internalformat: number, element: Element | ElementImage, config?: WebGLCopyElementImageConfig): void;
    /**
     * Legacy texImage2D-shaped overload still shipped by some Chrome Canary builds.
     * @deprecated Use `texElementSubImage2D` instead.
     */
    texElementImage2D(target: number, level: number, internalformat: number, format: number, type: number, element: Element | ElementImage): void;
}

/**
 * Source descriptor for the legacy `GPUQueue.copyElementImageToTexture`.
 * @deprecated Use {@link GPUDrawElementImageSource} with `GPUQueue.drawElementImageToTexture` instead.
 */
interface GPUCopyElementImageSource {
    source: Element | ElementImage;
    sx?: number;
    sy?: number;
    swidth?: number;
    sheight?: number;
}

/**
 * Destination descriptor for the legacy `GPUQueue.copyElementImageToTexture`.
 * @deprecated Use {@link GPUDrawElementImageDestination} with `GPUQueue.drawElementImageToTexture` instead.
 */
interface GPUCopyElementImageDestination {
    destination: GPUCopyExternalImageDestInfo;
    width?: number;
    height?: number;
}

/**
 * Source descriptor for `GPUQueue.drawElementImageToTexture`.
 */
interface GPUDrawElementImageSource {
    source: Element | ElementImage;
    sourceX?: number;
    sourceY?: number;
    sourceWidth?: number;
    sourceHeight?: number;
}

/**
 * Destination descriptor for `GPUQueue.drawElementImageToTexture`.
 */
interface GPUDrawElementImageDestination extends GPUCopyExternalImageDestInfo {
    size?: GPUExtent3D;
}

interface GPUQueue {
    /** Draws a rendered element (or snapshot) into a destination GPU texture. */
    drawElementImageToTexture(source: GPUDrawElementImageSource, destination: GPUDrawElementImageDestination): void;
    /**
     * Uploads a rendered element (or snapshot) into a destination GPU texture.
     * @deprecated Use `drawElementImageToTexture` instead.
     */
    copyElementImageToTexture(source: GPUCopyElementImageSource, destination: GPUCopyElementImageDestination): void;
    /**
     * Legacy polyfill overload using an element and an explicit destination size.
     * @deprecated Use `drawElementImageToTexture` instead.
     */
    copyElementImageToTexture(element: Element | ElementImage, width: number, height: number, destination: GPUCopyExternalImageDestInfo): void;
}
