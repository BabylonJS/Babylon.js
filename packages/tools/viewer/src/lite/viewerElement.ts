/* eslint-disable @typescript-eslint/naming-convention */
import { customElement } from "lit/decorators.js";
import { ViewerElementBase } from "../viewerElementBase";
import { type CanvasViewerOptions, type Viewer, CreateViewerForCanvas } from "./viewer";

/**
 * Viewer custom element backed by the Babylon Lite engine (WebGPU-only).
 * Provides the same `<babylon-viewer>` tag as the full viewer — the two are mutually exclusive.
 */
export abstract class ViewerElement extends ViewerElementBase<Viewer, CanvasViewerOptions> {
    protected constructor(options: CanvasViewerOptions = {}) {
        super(options);
    }

    /**
     * Gets the underlying Viewer instance (when the viewer is in a loaded state).
     */
    public get viewer(): Viewer | undefined {
        return this._viewer;
    }

    protected override async _createViewer(canvas: HTMLCanvasElement, options: CanvasViewerOptions): Promise<Viewer> {
        return await CreateViewerForCanvas(canvas, options);
    }
}

/**
 * Displays a 3D model using the Babylon Lite Viewer (WebGPU-only).
 * @remarks
 * This element registers as `<babylon-viewer>` and is mutually exclusive with the full Babylon.js viewer element.
 * Import `@babylonjs/viewer/lite` instead of `@babylonjs/viewer` to use the Lite viewer.
 */
@customElement("babylon-viewer")
export class HTML3DElement extends ViewerElement {
    /**
     * Creates a new HTML3DElement backed by the Lite viewer.
     * @param options The options to use for the viewer.
     */
    public constructor(options?: Readonly<CanvasViewerOptions>) {
        super(options);
    }
}

/**
 * Creates a custom HTML element that creates an HTML3DElement with the specified name and configuration.
 * @param elementName The name of the custom element.
 * @param options The options to use for the viewer.
 */
export function ConfigureCustomViewerElement(elementName: string, options: Readonly<CanvasViewerOptions>) {
    customElements.define(
        elementName,
        // eslint-disable-next-line jsdoc/require-jsdoc
        class extends HTML3DElement {
            public constructor() {
                super(options);
            }
        }
    );
}
