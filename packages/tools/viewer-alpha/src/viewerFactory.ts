// eslint-disable-next-line import/no-internal-modules
import type { AbstractEngine, AbstractEngineOptions, EngineOptions, IDisposable, Nullable, WebGPUEngineOptions } from "core/index";

import type { ViewerOptions } from "./viewer";
import { Viewer } from "./viewer";

/**
 * Options for creating a Viewer instance that is bound to an HTML canvas.
 */
export type CanvasViewerOptions = ViewerOptions &
    (({ engine?: undefined } & AbstractEngineOptions) | ({ engine: "WebGL" } & EngineOptions) | ({ engine: "WebGPU" } & WebGPUEngineOptions));
const defaultCanvasViewerOptions: CanvasViewerOptions = {};

/**
 * Chooses a default engine for the current browser environment.
 * @returns The default engine to use.
 */
export function getDefaultEngine(): NonNullable<CanvasViewerOptions["engine"]> {
    // TODO: When WebGPU is fully production ready, we may want to prefer it if it is supported by the browser.
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
export function createViewerForCanvas<DerivedViewer extends Viewer>(
    canvas: HTMLCanvasElement,
    options: CanvasViewerOptions & {
        /**
         * The Viewer subclass to use when creating the Viewer instance.
         */
        viewerClass: new (...args: ConstructorParameters<typeof Viewer>) => DerivedViewer;
    }
): Promise<DerivedViewer>;
export function createViewerForCanvas(canvas: HTMLCanvasElement, options?: CanvasViewerOptions): Promise<Viewer>;

/**
 * @internal
 */
export async function createViewerForCanvas(
    canvas: HTMLCanvasElement,
    options?: CanvasViewerOptions & { viewer?: new (...args: ConstructorParameters<typeof Viewer>) => Viewer }
): Promise<Viewer> {
    const finalOptions = { ...defaultCanvasViewerOptions, ...options };
    const disposeActions: (() => void)[] = [];

    // If the canvas is resized, note that the engine needs a resize, but don't resize it here as it will result in flickering.
    let needsResize = false;
    const resizeObserver = new ResizeObserver(() => (needsResize = true));
    resizeObserver.observe(canvas);
    disposeActions.push(() => resizeObserver.disconnect());

    // Create an engine instance.
    let engine: AbstractEngine;
    switch (finalOptions.engine ?? getDefaultEngine()) {
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

    // Override the onInitialized callback to add in some specific behavior.
    const onInitialized = finalOptions.onInitialized;
    finalOptions.onInitialized = (details) => {
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
    const viewerClass = options?.viewer ?? Viewer;
    const viewer = new viewerClass(engine, finalOptions);
    disposeActions.push(viewer.dispose.bind(viewer));

    disposeActions.push(() => engine.dispose());

    // Override the Viewer's dispose method to add in additional cleanup.
    viewer.dispose = () => disposeActions.forEach((dispose) => dispose());

    return viewer;
}
