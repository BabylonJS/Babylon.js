/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable } from "core/index";
import { type ViewerDetails, Viewer } from "./viewer";
import { type CanvasViewerOptions, CreateViewerForCanvas } from "./viewerFactory";
import { ViewerElementBase, parseColor } from "../viewerElementBase";

import { customElement, property } from "lit/decorators.js";

import { Color4 } from "core/Maths/math.color";
import { Deferred } from "core/Misc/deferred";

function coerceEngineAttribute(value: string | null): ViewerElement["engine"] {
    if (value === "WebGL" || value === "WebGPU") {
        return value;
    }
    return undefined;
}

// Converts any standard html color string to a Color4 object.
function parseColorAsColor4(color: string | null | undefined): Nullable<Color4> {
    const parsed = parseColor(color);
    return parsed ? new Color4(parsed.r, parsed.g, parsed.b, parsed.a) : null;
}

/**
 * Viewer custom element backed by the full Babylon.js engine.
 * Extends ViewerElementBase with Color4-typed clearColor, viewerDetails, and engine selection.
 */
export abstract class ViewerElement<ViewerClass extends Viewer = Viewer> extends ViewerElementBase<ViewerClass, CanvasViewerOptions> {
    private _viewerDetails?: Readonly<ViewerDetails & { viewer: ViewerClass }>;

    /**
     * Creates an instance of a ViewerElement subclass.
     * @param _viewerClass The Viewer subclass to use when creating the Viewer instance.
     * @param options The options to use when creating the Viewer and binding it to the specified canvas.
     */
    protected constructor(
        private readonly _viewerClass: new (...args: ConstructorParameters<typeof Viewer>) => ViewerClass,
        options: CanvasViewerOptions = {}
    ) {
        super(options);
    }

    /**
     * Gets the underlying viewer details (when the underlying viewer is in a loaded state).
     * This is useful for advanced scenarios where direct access to the viewer or Babylon scene is needed.
     */
    public get viewerDetails() {
        return this._viewerDetails;
    }

    /**
     * The clear color (e.g. background color) for the viewer.
     */
    @property({
        attribute: "clear-color",
        converter: {
            fromAttribute: parseColorAsColor4,
            toAttribute: (color: Nullable<Color4>) => (color ? color.toHexString() : null),
        },
    })
    public override accessor clearColor: Nullable<Color4> = this._options.clearColor
        ? new Color4(this._options.clearColor[0], this._options.clearColor[1], this._options.clearColor[2], this._options.clearColor[3] ?? 1)
        : null;

    /**
     * The engine to use for rendering.
     */
    @property({ converter: coerceEngineAttribute })
    public accessor engine: CanvasViewerOptions["engine"] = this._options.engine;

    protected override _needsReload(changedProperties: Map<PropertyKey, unknown>): boolean {
        if (super._needsReload(changedProperties)) {
            return true;
        }
        if (changedProperties.has("engine")) {
            const previous = changedProperties.get("engine");
            if (previous && this.engine !== previous) {
                return true;
            }
        }
        return false;
    }

    protected override async _createViewer(canvas: HTMLCanvasElement, options: CanvasViewerOptions): Promise<ViewerClass> {
        const detailsDeferred = new Deferred<ViewerDetails>();

        // Wrap the base class's proxied options to add engine and onInitialized interception.
        const fullOptions = new Proxy(options, {
            get: (target: any, prop: string) => {
                switch (prop) {
                    case "engine":
                        return this.engine ?? target.engine;
                    case "onInitialized":
                        return (details: Readonly<ViewerDetails>) => {
                            target.onInitialized?.(details);
                            detailsDeferred.resolve(details);
                        };
                    default:
                        return target[prop];
                }
            },
        });

        const viewer = (await CreateViewerForCanvas(canvas, Object.assign(fullOptions, { viewerClass: this._viewerClass }))) as ViewerClass;
        const details = await detailsDeferred.promise;
        this._viewerDetails = Object.assign(details, { viewer }) as Readonly<ViewerDetails & { viewer: ViewerClass }>;

        return viewer;
    }

    protected override _onViewerTornDown(): void {
        this._viewerDetails = undefined;
    }
}

/**
 * Displays a 3D model using the Babylon.js Viewer.
 */
@customElement("babylon-viewer")
export class HTML3DElement extends ViewerElement {
    /**
     * Creates a new HTML3DElement.
     * @param options The options to use for the viewer. This is optional, and is only used when programmatically creating a viewer element.
     */
    public constructor(options?: Readonly<CanvasViewerOptions>) {
        super(Viewer, options);
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
