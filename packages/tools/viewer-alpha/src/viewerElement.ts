import { Logger } from "core/Misc/logger";
import type { Nullable } from "core/types";
import type { Viewer } from "./viewer";
import { createViewerForCanvas } from "./viewerFactory";

// TODO: Use https://lit.dev/ to simplify this code and ease maintenance.

/**
 * Represents a custom element that displays a 3D model using the Babylon.js Viewer.
 */
export class HTML3DElement extends HTMLElement {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    public static readonly observedAttributes = Object.freeze(["src", "env"] as const);

    private readonly _viewer: Viewer;

    /**
     * Creates an instance of HTML3DElement.
     */
    public constructor() {
        super();

        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              width: 100%;
              height: 100%;
            }

            #container {
              display: block;
              width: 100%;
              height: 100%;
            }

            #renderCanvas {
              width: 100%;
              height: 100%;
              display: block;
              font-size: 0;
            }
          </style>
          <div id="container">
            <canvas id="renderCanvas" touch-action="none"></canvas>
          </div>
        `;

        const canvas = shadowRoot.querySelector("#renderCanvas") as HTMLCanvasElement;
        this._viewer = createViewerForCanvas(canvas);
    }

    /**
     * Gets the model URL.
     */
    public get src() {
        return this.getAttribute("src");
    }

    /**
     * Sets the model URL.
     */
    public set src(value: Nullable<string>) {
        if (value === null) {
            this.removeAttribute("src");
        } else {
            this.setAttribute("src", value);
        }
    }

    /**
     * Called each time the element is added to the document.
     * @remarks
     * See https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#custom_element_lifecycle_callbacks
     */
    public connectedCallback() {}

    /**
     * Called when attributes are changed, added, removed, or replaced.
     * @remarks
     * See https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#custom_element_lifecycle_callbacks
     * @param name The name of the attribute that changed.
     * @param oldValue The old value of the attribute.
     * @param newValue The new value of the attribute.
     */
    public attributeChangedCallback(name: (typeof HTML3DElement.observedAttributes)[number], oldValue: string, newValue: string) {
        switch (name) {
            case "src":
                this._viewer.loadModelAsync(newValue).catch(Logger.Log);
                break;
            case "env":
                this._viewer.loadEnvironmentAsync(newValue).catch(Logger.Log);
                break;
        }
    }
}

globalThis.customElements.define("babylon-viewer", HTML3DElement);
