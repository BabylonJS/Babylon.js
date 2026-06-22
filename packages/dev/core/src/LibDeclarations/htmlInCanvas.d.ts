/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-var */
// Type definitions for the WICG HTML-in-Canvas proposal (https://github.com/WICG/html-in-canvas).
// These augment the standard DOM and WebGL types so Babylon can consume the API - whether provided
// natively (behind chrome://flags/#canvas-draw-element) or by the three-html-render polyfill -
// without TypeScript errors. The proposal is experimental; signatures track the explainer IDL and
// may change. WebGPU (GPUQueue.copyElementImageToTexture) declarations are added in Phase 2.

/**
 * A transferable snapshot of a rendered element, produced by `HTMLCanvasElement.captureElementImage`.
 */
interface ElementImage {
    readonly width: number;
    readonly height: number;
    close(): void;
}

declare var ElementImage: {
    prototype: ElementImage;
    new (): ElementImage;
};

/**
 * Source rectangle and sizing configuration for `WebGLRenderingContext.texElementImage2D`.
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
 * Event dispatched on a `<canvas layoutsubtree>` when the rendering of one of its children changes.
 */
interface PaintEvent extends Event {
    readonly changedElements: ReadonlyArray<Element>;
}

interface HTMLCanvasElementEventMap {
    paint: PaintEvent;
}

interface HTMLCanvasElement {
    /** Opts canvas descendants into layout and hit testing so they can be drawn into the canvas. */
    layoutSubtree: boolean;
    /** Fired when the rendering of any canvas child has changed. */
    onpaint: ((this: HTMLCanvasElement, ev: PaintEvent) => any) | null;
    /** Requests a single `paint` event on the next rendering update, even if nothing changed. */
    requestPaint(): void;
    /** Captures a transferable snapshot of the given element. */
    captureElementImage(element: Element): ElementImage;
    /** Returns the CSS transform that keeps the element's DOM location in sync with its drawn location. */
    getElementTransform(element: Element | ElementImage, drawTransform: DOMMatrix): DOMMatrix;
}

interface CanvasRenderingContext2D {
    drawElementImage(element: Element | ElementImage, dx: number, dy: number): DOMMatrix;
    drawElementImage(element: Element | ElementImage, dx: number, dy: number, dwidth: number, dheight: number): DOMMatrix;
    drawElementImage(
        element: Element | ElementImage,
        sx: number,
        sy: number,
        swidth: number,
        sheight: number,
        dx: number,
        dy: number,
        dwidth?: number,
        dheight?: number
    ): DOMMatrix;
}

interface WebGLRenderingContext {
    /** Uploads a rendered element (or snapshot) into the currently bound 2D texture. */
    texElementImage2D(target: number, internalformat: number, element: Element | ElementImage, config?: WebGLCopyElementImageConfig): void;
}

interface WebGL2RenderingContext {
    /** Uploads a rendered element (or snapshot) into the currently bound 2D texture. */
    texElementImage2D(target: number, internalformat: number, element: Element | ElementImage, config?: WebGLCopyElementImageConfig): void;
}
