import { Engine, type EngineOptions } from "core/Engines";

import type { ViewerOptions } from "./viewer";
import { Viewer } from "./viewer";

type CanvasViewerOptions = ViewerOptions & ({ engine: "WebGL" } & EngineOptions);
const defaultCanvasViewerOptions: CanvasViewerOptions = {
    engine: "WebGL",
};

// Binds to a canvas element.
// Can be shared between multiple UI integrations (e.g. Web Components, React, etc.).
export function createViewerForCanvas(canvas: HTMLCanvasElement, options?: CanvasViewerOptions): Viewer {
    const finalOptions = { ...defaultCanvasViewerOptions, ...options };
    const disposeActions: (() => void)[] = [];

    let needsResize = false;
    const resizeObserver = new ResizeObserver(() => (needsResize = true));
    resizeObserver.observe(canvas);
    disposeActions.push(() => resizeObserver.disconnect());

    const engine = new Engine(canvas, undefined, options);

    const onInitialized = finalOptions.onInitialized;
    finalOptions.onInitialized = (details) => {
        const beforeRenderObserver = details.scene.onBeforeRenderObservable.add(() => {
            if (needsResize) {
                engine.resize();
                needsResize = false;
            }
        });
        disposeActions.push(() => beforeRenderObserver.remove());

        if (onInitialized) {
            onInitialized(details);
        }
    };

    const viewer = new Viewer(engine, finalOptions);
    disposeActions.push(viewer.dispose.bind(viewer));

    disposeActions.push(() => engine.dispose());

    viewer.dispose = () => disposeActions.forEach((dispose) => dispose());

    // TODO: Creating an engine instance will be async if we use a dynamic import for choosing either Engine or WebGPUEngine,
    //       or even when just creating a WebGPUEngine since we have to call initAsync. To keep the UI integration layer
    //       simple (e.g. not have to deal with asynchronous creation of the Viewer), should we also be able to pass Promise<AbstractEngine> to the Viewer constructor?

    return viewer;
}
