// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { HTML3DElement } from "./viewerElement";
import { ViewerHotSpotResult } from "./viewer";

/**
 * Displays child elements at the screen space location of a hotspot in a babylon-viewer.
 * @remarks
 * The babylon-viewer-annotation element must be a child of a babylon-viewer element.
 */
@customElement("babylon-viewer-annotation")
export class HTML3DAnnotationElement extends LitElement {
    // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
    static override styles = css`
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

    /**
     * The name of the hotspot to track.
     */
    @property({ attribute: "hotspot" })
    public hotSpot: string = "";

    // eslint-disable-next-line babylonjs/available
    override connectedCallback(): void {
        super.connectedCallback();
        this._internals.states?.add("invalid");

        if (!(this.parentElement instanceof HTML3DElement)) {
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
    }

    // eslint-disable-next-line babylonjs/available
    override disconnectedCallback(): void {
        super.disconnectedCallback();

        this._viewerAttachment?.dispose();
        this._viewerAttachment = null;

        this._internals.states?.add("invalid");
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override render() {
        return html` <slot></slot> `;
    }
}
