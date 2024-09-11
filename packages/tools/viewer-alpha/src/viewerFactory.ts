import { Engine } from "core/Engines/engine";
import type { EngineOptions } from "core/Engines";

import type { ViewerOptions } from "./viewer";
import { Viewer } from "./viewer";

type CanvasViewerOptions = ViewerOptions & ({ engine?: "WebGL" } & EngineOptions);
const defaultCanvasViewerOptions: CanvasViewerOptions = {
    engine: "WebGL",
};

/**
 * Creates a Viewer instance that is bound to an HTML canvas.
 * @remarks
 * This function can be shared across multiple UI integrations (e.g. Web Components, React, etc.).
 * @param canvas The canvas element to bind the Viewer to.
 * @param options The options to use when creating the Viewer and binding it to the specified canvas.
 * @returns A Viewer instance that is bound to the specified canvas.
 */
export function createViewerForCanvas(canvas: HTMLCanvasElement, options?: CanvasViewerOptions): Viewer {
    const finalOptions = { ...defaultCanvasViewerOptions, ...options };
    const disposeActions: (() => void)[] = [];

    // If the canvas is resized, note that the engine needs a resize, but don't resize it here as it will result in flickering.
    let needsResize = false;
    const resizeObserver = new ResizeObserver(() => (needsResize = true));
    resizeObserver.observe(canvas);
    disposeActions.push(() => resizeObserver.disconnect());

    // Create an engine instance.
    // TODO: Create a WebGL or WebGPUEngine based on the engine option.
    const engine = new Engine(canvas, undefined, options);

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

        // Call the original onInitialized callback, if one was provided.
        onInitialized?.(details);
    };

    // Instantiate the Viewer with the engine and options.
    const viewer = new Viewer(engine, finalOptions);
    disposeActions.push(viewer.dispose.bind(viewer));

    disposeActions.push(() => engine.dispose());

    // Override the Viewer's dispose method to add in additional cleanup.
    viewer.dispose = () => disposeActions.forEach((dispose) => dispose());

    // TODO: Creating an engine instance will be async if we use a dynamic import for choosing either Engine or WebGPUEngine,
    //       or even when just creating a WebGPUEngine since we have to call initAsync. To keep the UI integration layer
    //       simple (e.g. not have to deal with asynchronous creation of the Viewer), should we also be able to pass Promise<AbstractEngine> to the Viewer constructor?

    return viewer;
}
