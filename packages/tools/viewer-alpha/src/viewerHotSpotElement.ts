// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable, Observer, Scene } from "core/index";

import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HTML3DElement } from "./viewerElement";
import { ViewerHotSpotResult } from "./viewer";

@customElement("babylon-viewer-hotspot")
export class HTMLHotSpotElement extends LitElement {
    // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
    static override styles = css`
        :host {
            display: inline-block;
            transition: opacity 0.2s;
        }
        :host([hidden]) {
            opacity: 0.3;
        }
        :host(:state(invalid)) {
            display: none;
        }
    `;

    private readonly _internals = this.attachInternals();
    private _viewerAttachment: Nullable<IDisposable> = null;

    @property({ attribute: "hotspot-name" })
    public hotSpotName: string = "";

    // eslint-disable-next-line babylonjs/available
    override connectedCallback(): void {
        super.connectedCallback();
        this._internals.states.add("invalid");

        if (!(this.parentElement instanceof HTML3DElement)) {
            // eslint-disable-next-line no-console
            console.warn("The babylon-viewer-hotspot element must be a child of a babylon-viewer element.");
            return;
        }

        const viewerElement = this.parentElement;
        const hotSpotResult = new ViewerHotSpotResult();
        let sceneRenderObserver: Nullable<Observer<Scene>> = null;
        const registerSceneRender = () => {
            sceneRenderObserver?.remove();
            sceneRenderObserver = null;

            if (viewerElement.viewerDetails) {
                sceneRenderObserver = viewerElement.viewerDetails.scene.onAfterRenderObservable.add(() => {
                    if (this.hotSpotName) {
                        if (viewerElement.queryHotSpot(this.hotSpotName, hotSpotResult)) {
                            this.style.transform = `translate(${hotSpotResult.screenPosition[0]}px, ${hotSpotResult.screenPosition[1]}px)`;
                            this._internals.states.delete("invalid");
                            this.hidden = hotSpotResult.visibility <= 0;
                        } else {
                            this._internals.states.add("invalid");
                        }
                    }
                });
            }
        };

        registerSceneRender();
        viewerElement.addEventListener("viewerready", registerSceneRender);

        this._viewerAttachment = {
            dispose() {
                viewerElement.removeEventListener("viewerready", registerSceneRender);
                sceneRenderObserver?.remove();
                sceneRenderObserver = null;
            },
        };
    }

    // eslint-disable-next-line babylonjs/available
    override disconnectedCallback(): void {
        super.disconnectedCallback();

        this._viewerAttachment?.dispose();
        this._viewerAttachment = null;

        this._internals.states.add("invalid");
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override render() {
        return html` <slot></slot> `;
    }
}
