/**
 * TODO: remove this file when we upgrade to TypeScript 5.0
 */

/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/naming-convention */
interface OffscreenCanvasEventMap {
    contextlost: Event;
    contextrestored: Event;
}

interface OffscreenCanvas extends EventTarget {
    /**
     * These attributes return the dimensions of the OffscreenCanvas object's bitmap.
     *
     * They can be set, to replace the bitmap with a new, transparent black bitmap of the specified dimensions (effectively resizing it).
     */
    height: number;
    oncontextlost: ((this: OffscreenCanvas, ev: Event) => any) | null;
    oncontextrestored: ((this: OffscreenCanvas, ev: Event) => any) | null;
    /**
     * These attributes return the dimensions of the OffscreenCanvas object's bitmap.
     *
     * They can be set, to replace the bitmap with a new, transparent black bitmap of the specified dimensions (effectively resizing it).
     */
    width: number;
    /**
     * Returns a promise that will fulfill with a new Blob object representing a file containing the image in the OffscreenCanvas object.
     *
     * The argument, if provided, is a dictionary that controls the encoding options of the image file to be created. The type field specifies the file format and has a default value of "image/png"; that type is also used if the requested type isn't supported. If the image format supports variable quality (such as "image/jpeg"), then the quality field is a number in the range 0.0 to 1.0 inclusive indicating the desired quality level for the resulting image.
     */
    convertToBlob(options?: ImageEncodeOptions): Promise<Blob>;
    /**
     * Returns an object that exposes an API for drawing on the OffscreenCanvas object. contextId specifies the desired API: "2d", "bitmaprenderer", "webgl", or "webgl2". options is handled by that API.
     *
     * This specification defines the "2d" context below, which is similar but distinct from the "2d" context that is created from a canvas element. The WebGL specifications define the "webgl" and "webgl2" contexts. [WEBGL]
     *
     * Returns null if the canvas has already been initialized with another context type (e.g., trying to get a "2d" context after getting a "webgl" context).
     */
    getContext(contextId: "2d", options?: any): OffscreenCanvasRenderingContext2D | null;
    getContext(contextId: "bitmaprenderer", options?: any): ImageBitmapRenderingContext | null;
    getContext(contextId: "webgl", options?: any): WebGLRenderingContext | null;
    getContext(contextId: "webgl2", options?: any): WebGL2RenderingContext | null;
    getContext(contextId: OffscreenRenderingContextId, options?: any): OffscreenRenderingContext | null;
    /** Returns a newly created ImageBitmap object with the image in the OffscreenCanvas object. The image in the OffscreenCanvas object is replaced with a new blank image. */
    transferToImageBitmap(): ImageBitmap;
    addEventListener<K extends keyof OffscreenCanvasEventMap>(
        type: K,
        listener: (this: OffscreenCanvas, ev: OffscreenCanvasEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof OffscreenCanvasEventMap>(
        type: K,
        listener: (this: OffscreenCanvas, ev: OffscreenCanvasEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var OffscreenCanvas: {
    prototype: OffscreenCanvas;
    new (width: number, height: number): OffscreenCanvas;
};

interface OffscreenCanvasRenderingContext2D
    extends CanvasCompositing,
        CanvasDrawImage,
        CanvasDrawPath,
        CanvasFillStrokeStyles,
        CanvasFilters,
        CanvasImageData,
        CanvasImageSmoothing,
        CanvasPath,
        CanvasPathDrawingStyles,
        CanvasRect,
        CanvasShadowStyles,
        CanvasState,
        CanvasText,
        CanvasTextDrawingStyles,
        CanvasTransform {
    readonly canvas: OffscreenCanvas;
    commit(): void;
}

declare var OffscreenCanvasRenderingContext2D: {
    prototype: OffscreenCanvasRenderingContext2D;
    new (): OffscreenCanvasRenderingContext2D;
};
