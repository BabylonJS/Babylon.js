import { type IReadonlyObservable } from "core/index";
import { type ModularToolOptions } from "shared-ui-components/modularTool/modularTool";

type LayoutMode = "inline" | "overlay";

/**
 * Options for configuring the inspector.
 */
export type InspectorOptions = Omit<ModularToolOptions, "namespace" | "toolbarMode"> & {
    /**
     * Whether to automatically resize the engine when the inspector layout changes. Defaults to true.
     */
    autoResizeEngine?: boolean;

    /**
     * The layout mode for the inspector.
     * - "inline": The inspector is embedded within the same container as the rendering canvas, and re-hosts the canvas.
     * - "overlay": The inspector is rendered as an overlay on top of the rendering canvas.
     * Defaults to "overlay".
     */
    layoutMode?: LayoutMode;
};

/**
 * A token returned by `ShowInspector` that can be used to dispose the inspector and observe its disposal.
 */
export type InspectorToken = {
    /**
     * Disposes the inspector. The returned promise resolves once all cleanup
     * (including asynchronous React unmount and ServiceContainer disposal) is complete.
     */
    dispose(): Promise<void>;

    /**
     * Whether the inspector has been disposed.
     */
    readonly isDisposed: boolean;

    /**
     * An observable that fires when the inspector is disposed.
     */
    readonly onDisposed: IReadonlyObservable<void>;
};
