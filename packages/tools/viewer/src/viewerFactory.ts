import type { AbstractEngine, AbstractEngineOptions, EngineOptions, IDisposable, Nullable, WebGPUEngineOptions } from "core/index";
import type { ViewerDetails, ViewerOptions } from "./viewer";

import { Deferred } from "core/Misc/deferred";
import { Viewer } from "./viewer";

/**
 * Options for creating a Viewer instance that is bound to an HTML canvas.
 */
export type CanvasViewerOptions = ViewerOptions & { onFaulted?: (error: Error) => void } & (
        | ({ engine?: undefined } & AbstractEngineOptions)
        | ({ engine: "WebGL" } & EngineOptions)
        | ({ engine: "WebGPU" } & WebGPUEngineOptions)
    );

const DefaultCanvasViewerOptions = {
    antialias: true,
    adaptToDeviceRatio: true,
    enableAllFeatures: true,
    setMaximumLimits: true,
} as const satisfies CanvasViewerOptions;

/**
 * Chooses a default engine for the current browser environment.
 * @returns The default engine to use.
 */
export function GetDefaultEngine(): NonNullable<CanvasViewerOptions["engine"]> {
    // TODO: There are some difficult to repro timing issues with WebGPU + snapshot rendering.
    //       We need to do deeper diagnosis to understand the issues and make this more reliable.
    //       For now, we will default to WebGL.

    // // First check for WebGPU support.
    // if ("gpu" in navigator) {
    //     // For now, only use WebGPU with chromium-based browsers.
    //     // WebGPU can be enabled in other browsers once they are fully functional and the performance is at least as good as WebGL.
    //     if ("chrome" in window) {
    //         return "WebGPU";
    //     }
    // }

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
    options: Readonly<
        CanvasViewerOptions & {
            /**
             * The Viewer subclass to use when creating the Viewer instance.
             */
            viewerClass: new (...args: ConstructorParameters<typeof Viewer>) => DerivedViewer;
        }
    >
): Promise<DerivedViewer>;
export function CreateViewerForCanvas(canvas: HTMLCanvasElement, options?: CanvasViewerOptions): Promise<Viewer>;

/**
 * @internal
 */
export async function CreateViewerForCanvas(
    canvas: HTMLCanvasElement,
    options: Readonly<CanvasViewerOptions & { viewerClass?: new (...args: ConstructorParameters<typeof Viewer>) => Viewer }> = {}
): Promise<Viewer> {
    const detailsDeferred = new Deferred<Readonly<ViewerDetails>>();

    options = new Proxy(options as CanvasViewerOptions & EngineOptions & WebGPUEngineOptions, {
        get(target, prop: keyof (CanvasViewerOptions & EngineOptions & WebGPUEngineOptions)) {
            switch (prop) {
                case "antialias":
                    return target.antialias ?? DefaultCanvasViewerOptions.antialias;
                case "adaptToDeviceRatio":
                    return target.adaptToDeviceRatio ?? DefaultCanvasViewerOptions.adaptToDeviceRatio;
                case "enableAllFeatures":
                    return target.enableAllFeatures ?? DefaultCanvasViewerOptions.enableAllFeatures;
                case "setMaximumLimits":
                    return target.setMaximumLimits ?? DefaultCanvasViewerOptions.setMaximumLimits;
                case "onInitialized":
                    return (details: ViewerDetails) => {
                        target.onInitialized?.(details);
                        detailsDeferred.resolve(details);
                    };
                default:
                    return target[prop];
            }
        },
    });

    const disposeActions: (() => void)[] = [];

    // Create an engine instance.
    let engine: AbstractEngine;
    switch (options.engine ?? GetDefaultEngine()) {
        case "WebGL": {
            const { Engine } = await import("core/Engines/engine");
            engine = new Engine(canvas, undefined, options);
            break;
        }
        case "WebGPU": {
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

    // Instantiate the Viewer with the engine and options.
    const viewerClass = options?.viewerClass ?? Viewer;
    const viewer = new viewerClass(engine, options);

    {
        const details = await detailsDeferred.promise;
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
    }

    disposeActions.push(viewer.dispose.bind(viewer));

    disposeActions.push(() => engine.dispose());

    // Override the Viewer's dispose method to add in additional cleanup.
    viewer.dispose = () => disposeActions.forEach((dispose) => dispose());

    return viewer;
}
