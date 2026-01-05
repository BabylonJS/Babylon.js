import type { IDisposable, Nullable } from "core/index";
import type { PropertyValues } from "lit";

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
            --annotation-foreground-color: black;
            --annotation-background-color: white;
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

        .annotation {
            transform: translate(-50%, -135%);
            font-size: 14px;
            padding: 0px 6px;
            border-radius: 6px;
            color: var(--annotation-foreground-color);
            background-color: var(--annotation-background-color);
        }

        .annotation::after {
            content: "";
            position: absolute;
            left: 50%;
            height: 60%;
            aspect-ratio: 1;
            transform: translate(-50%, 110%) rotate(-45deg);
            background-color: inherit;
            clip-path: polygon(0 0, 100% 100%, 0 100%, 0 0);
        }
    `;

    private readonly _internals = this.attachInternals();
    private readonly _mutationObserver = new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.type === "childList")) {
            this._sanitizeInnerHTML();
        }
    });
    private _viewerAttachment: Nullable<IDisposable> = null;
    private _connectingAbortController: Nullable<AbortController> = null;
    private _updateAnnotation: Nullable<() => void> = null;

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

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
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

            this._mutationObserver.observe(this, { childList: true, characterData: true });
            this._sanitizeInnerHTML();

            const viewerElement = this.parentElement;
            const hotSpotResult = new ViewerHotSpotResult();
            const updateAnnotation = (this._updateAnnotation = () => {
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
            });

            this._updateAnnotation();
            viewerElement.addEventListener("viewerrender", updateAnnotation);
            this._viewerAttachment = {
                dispose() {
                    viewerElement.removeEventListener("viewerrender", updateAnnotation);
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

        this._updateAnnotation = null;
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override render() {
        return html` <slot><div aria-label="${this.hotSpot} annotation" part="annotation" class="annotation">${this.hotSpot}</div></slot> `;
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override update(changedProperties: PropertyValues<this>): void {
        super.update(changedProperties);
        if (changedProperties.has("hotSpot")) {
            this._updateAnnotation?.();
        }
    }

    private _sanitizeInnerHTML() {
        if (this.innerHTML.trim().length === 0) {
            this.innerHTML = "";
        }
    }
}
