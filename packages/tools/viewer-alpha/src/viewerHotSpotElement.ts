// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable, Observer, Scene } from "core/index";

import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HTML3DElement } from "./viewerElement";
import { ViewerHotSpotResult } from "./viewer";

const horizontalAlignment = ["left", "center", "right"] as const;
const verticalAlignment = ["top", "center", "bottom"] as const;
type HorizontalAlignment = (typeof horizontalAlignment)[number];
type VerticalAlignment = (typeof verticalAlignment)[number];

@customElement("babylon-viewer-hotspot")
export class HTMLHotSpotElement extends LitElement {
    // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
    static override styles = css`
        :host {
            display: inline-block;
        }
    `;

    private _viewerAttachment: Nullable<IDisposable> = null;

    @property({ attribute: "hotspot-name" })
    public hotSpotName: string = "";

    @property({
        converter: (value) => {
            if (!value) {
                return "center center";
            } else {
                let [horizontal = "center", vertical = "center"] = value.split(" ");

                if (!horizontalAlignment.includes(horizontal as HorizontalAlignment)) {
                    horizontal = "center";
                }
                if (!verticalAlignment.includes(vertical as VerticalAlignment)) {
                    vertical = "center";
                }

                return {
                    horizontal: horizontal as HorizontalAlignment,
                    vertical: vertical as VerticalAlignment,
                };
            }
        },
    })
    public alignment: Readonly<{ horizontal: HorizontalAlignment; vertical: VerticalAlignment }> = { horizontal: "center", vertical: "center" };

    @state()
    private _isValid = false;

    // eslint-disable-next-line babylonjs/available
    override connectedCallback(): void {
        super.connectedCallback();
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
                            // TODO: Raycast to the position and see if the expected triangle is hit. If not, don't show the hotspot.
                            // this would require updating bounds on every frame which is slow. is there a better way to determine whether the hotspot is visible? depth buffer?
                            //const offsetX = this.alignment.horizontal === "center" ? "-50%" : this.alignment.horizontal === "left" ? "0" : "-100%";
                            //const offsetY = this.alignment.vertical === "center" ? "-50%" : this.alignment.vertical === "top" ? "0" : "-100%";
                            //this.style.transform = `translate(${hotSpotResult.screenPosition[0]}px, ${hotSpotResult.screenPosition[1]}px) translate(${offsetX}, ${offsetY})`;
                            this.style.transform = `translate(${hotSpotResult.screenPosition[0]}px, ${hotSpotResult.screenPosition[1]}px)`;
                            this._isValid = true;
                        } else {
                            this._isValid = false;
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
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override render() {
        return html` <slot ?hidden="${!this._isValid}"></slot> `;
    }
}
