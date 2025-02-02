// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ViewerElement } from "./viewerElement";
import { ViewerHotSpotResult } from "./viewer";

/**
 * Displays child elements at the screen space location of a hotspot in a babylon-viewer.
 * @remarks
 * The babylon-viewer-annotation element must be a child of a babylon-viewer element.
 */
@customElement("babylon-viewer-annotation")
export class HTML3DAnnotationElement extends LitElement {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static override styles = css`
        :host {
            display: inline-block;
            position: absolute;
            transition: opacity 0.25s;
        }
        :host([hidden]) {
            display: none;
        }
        :host(:state(back-facing)) {
            opacity: 0.2;
        }
        :host(:state(invalid)) {
            display: none;
        }
    `;

    private readonly _internals = this.attachInternals();
    private _viewerAttachment: Nullable<IDisposable> = null;
    private _connectingAbortController: Nullable<AbortController> = null;

    /**
     * The name of the hotspot to track.
     */
    @property({ attribute: "hotspot" })
    public hotSpot: string = "";

    /** @internal */
    public override connectedCallback(): void {
        super.connectedCallback();
        this._internals.states?.add("invalid");
        this._connectingAbortController?.abort();
        this._connectingAbortController = new AbortController();
        const abortSignal = this._connectingAbortController.signal;

        (async () => {
            // Custom element registration can happen at any time via a call to customElements.define, which means it is possible
            // the parent custom element hasn't been defined yet. This especially can happen if the order of imports and exports
            // results in the parent element being defined after the HTML3DAnnotationElement within the final JS bundle.
            if (this.parentElement?.matches(":not(:defined)")) {
                await customElements.whenDefined(this.parentElement?.tagName.toLowerCase());

                // If the element has since been disconnected or reconnected, abort this connection process.
                if (abortSignal.aborted) {
                    return;
                }
            }

            if (!(this.parentElement instanceof ViewerElement)) {
                // eslint-disable-next-line no-console
                console.warn("The babylon-viewer-annotation element must be a child of a babylon-viewer element.");
                return;
            }

            const viewerElement = this.parentElement;
            const hotSpotResult = new ViewerHotSpotResult();
            const onViewerRendered = () => {
                if (this.hotSpot) {
                    if (viewerElement.queryHotSpot(this.hotSpot, hotSpotResult)) {
                        const [screenX, screenY] = hotSpotResult.screenPosition;
                        this.style.transform = `translate(${screenX}px, ${screenY}px)`;
                        this._internals.states?.delete("invalid");

                        if (hotSpotResult.visibility <= 0) {
                            this._internals.states?.add("back-facing");
                        } else {
                            this._internals.states?.delete("back-facing");
                        }
                    } else {
                        this._internals.states?.add("invalid");
                    }
                }
            };

            viewerElement.addEventListener("viewerrender", onViewerRendered);
            this._viewerAttachment = {
                dispose() {
                    viewerElement.removeEventListener("viewerrender", onViewerRendered);
                },
            };
        })();
    }

    /** @internal */
    public override disconnectedCallback(): void {
        super.disconnectedCallback();

        this._connectingAbortController?.abort();
        this._connectingAbortController = null;

        this._viewerAttachment?.dispose();
        this._viewerAttachment = null;

        this._internals.states?.add("invalid");
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override render() {
        return html` <slot></slot> `;
    }
}
