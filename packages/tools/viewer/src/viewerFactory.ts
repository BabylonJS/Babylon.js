// eslint-disable-next-line import/no-internal-modules
import type { AbstractEngine, AbstractEngineOptions, EngineOptions, IDisposable, Nullable, WebGPUEngineOptions } from "core/index";
import type { ViewerOptions } from "./viewer";

import { Viewer } from "./viewer";

/**
 * Options for creating a Viewer instance that is bound to an HTML canvas.
 */
export type CanvasViewerOptions = ViewerOptions & { onFaulted?: (error: Error) => void } & (
        | ({ engine?: undefined } & AbstractEngineOptions)
        | ({ engine: "WebGL" } & EngineOptions)
        | ({ engine: "WebGPU" } & WebGPUEngineOptions)
    );

const defaultCanvasViewerOptions: CanvasViewerOptions = {
    antialias: true,
    adaptToDeviceRatio: true,
};

/**
 * Chooses a default engine for the current browser environment.
 * @returns The default engine to use.
 */
export function GetDefaultEngine(): NonNullable<CanvasViewerOptions["engine"]> {
    // First check for WebGPU support.
    if ("gpu" in navigator) {
        // For now, only use WebGPU with chromium-based browsers.
        // WebGPU can be enabled in other browsers once they are fully functional and the performance is at least as good as WebGL.
        if ("chrome" in window) {
            return "WebGPU";
        }
    }

    return "WebGL";
}

/**
 * @experimental
 * Creates a Viewer instance that is bound to an HTML canvas.
 * @remarks
 * This function can be shared across multiple UI integrations (e.g. Web Components, React, etc.).
 * @param canvas The canvas element to bind the Viewer to.
 * @param options The options to use when creating the Viewer and binding it to the specified canvas.
 * @returns A Viewer instance that is bound to the specified canvas.
 */
export function CreateViewerForCanvas<DerivedViewer extends Viewer>(
    canvas: HTMLCanvasElement,
    options: CanvasViewerOptions & {
        /**
         * The Viewer subclass to use when creating the Viewer instance.
         */
        viewerClass: new (...args: ConstructorParameters<typeof Viewer>) => DerivedViewer;
    }
): Promise<DerivedViewer>;
export function CreateViewerForCanvas(canvas: HTMLCanvasElement, options?: CanvasViewerOptions): Promise<Viewer>;

/**
 * @internal
 */
export async function CreateViewerForCanvas(
    canvas: HTMLCanvasElement,
    options?: CanvasViewerOptions & { viewerClass?: new (...args: ConstructorParameters<typeof Viewer>) => Viewer }
): Promise<Viewer> {
    options = { ...defaultCanvasViewerOptions, ...options };
    const disposeActions: (() => void)[] = [];

    // Create an engine instance.
    let engine: AbstractEngine;
    switch (options.engine ?? GetDefaultEngine()) {
        case "WebGL": {
            // eslint-disable-next-line @typescript-eslint/naming-convention, no-case-declarations
            const { Engine } = await import("core/Engines/engine");
            engine = new Engine(canvas, undefined, options);
            break;
        }
        case "WebGPU": {
            // eslint-disable-next-line @typescript-eslint/naming-convention, no-case-declarations
            const { WebGPUEngine } = await import("core/Engines/webgpuEngine");
            const webGPUEngine = new WebGPUEngine(canvas, options);
            await webGPUEngine.initAsync();
            engine = webGPUEngine;
            break;
        }
    }

    if (options.onFaulted) {
        const onFaulted = options.onFaulted;
        const contextLostObserver = engine.onContextLostObservable.addOnce(() => {
            onFaulted(new Error("The engine context was lost."));
        });
        disposeActions.push(() => contextLostObserver.remove());
    }

    // Override the onInitialized callback to add in some specific behavior.
    const onInitialized = options.onInitialized;
    options.onInitialized = (details) => {
        // If the canvas is resized, note that the engine needs a resize, but don't resize it here as it will result in flickering.
        let needsResize = false;
        const resizeObserver = new ResizeObserver(() => {
            needsResize = true;
            details.markSceneMutated();
        });
        resizeObserver.observe(canvas);
        disposeActions.push(() => resizeObserver.disconnect());

        // Resize if needed right before rendering the Viewer scene to avoid any flickering.
        const beforeRenderObserver = details.scene.onBeforeRenderObservable.add(() => {
            if (needsResize) {
                engine.resize();
                needsResize = false;
            }
        });
        disposeActions.push(() => beforeRenderObserver.remove());

        // If the canvas is not visible, suspend rendering.
        let offscreenRenderingSuspension: Nullable<IDisposable> = null;
        const intersectionObserver = new IntersectionObserver((entries) => {
            if (entries.length > 0) {
                if (entries[entries.length - 1].isIntersecting) {
                    offscreenRenderingSuspension?.dispose();
                    offscreenRenderingSuspension = null;
                } else {
                    offscreenRenderingSuspension = details.suspendRendering();
                }
            }
        });
        intersectionObserver.observe(canvas);
        disposeActions.push(() => intersectionObserver.disconnect());

        // Call the original onInitialized callback, if one was provided.
        onInitialized?.(details);
    };

    // Instantiate the Viewer with the engine and options.
    const viewerClass = options?.viewerClass ?? Viewer;
    const viewer = new viewerClass(engine, options);
    disposeActions.push(viewer.dispose.bind(viewer));

    disposeActions.push(() => engine.dispose());

    // Override the Viewer's dispose method to add in additional cleanup.
    viewer.dispose = () => disposeActions.forEach((dispose) => dispose());

    return viewer;
}
