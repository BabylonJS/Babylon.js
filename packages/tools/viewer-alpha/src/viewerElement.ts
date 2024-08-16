import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { Logger } from "core/Misc/logger";
import type { Nullable } from "core/types";
import type { Viewer } from "./viewer";
import { createViewerForCanvas } from "./viewerFactory";

// TODO: Use https://lit.dev/ to simplify this code and ease maintenance.

/**
 * Represents a custom element that displays a 3D model using the Babylon.js Viewer.
 */
@customElement("babylon-viewer")
export class HTML3DElement extends LitElement {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    //public static readonly observedAttributes = Object.freeze(["src", "env"] as const);

    /**
     * Gets the underlying Viewer object.
     */
    public viewer?: Viewer;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    static override styles = css`
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
    `;

    /**
     * The model URL.
     */
    @property()
    public src = "";

    /**
     * The environment URL.
     */
    @property()
    public env = "";

    @query("#renderCanvas")
    private _canvas: HTMLCanvasElement;

    // eslint-disable-next-line babylonjs/available
    override connectedCallback(): void {
        super.connectedCallback();
        this._setupViewer();
    }

    // eslint-disable-next-line babylonjs/available
    override firstUpdated(_changedProperties: PropertyValues): void {
        super.firstUpdated(_changedProperties);
        this._setupViewer();
    }

    // eslint-disable-next-line babylonjs/available
    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this._tearDownViewer();
    }

    // eslint-disable-next-line babylonjs/available
    override update(changedProperties: PropertyValues): void {
        super.update(changedProperties);

        if (changedProperties.has("src")) {
            this._updateModel();
        }

        if (changedProperties.has("env")) {
            this._updateEnv();
        }
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        return html`
            <div id="container">
                <canvas id="renderCanvas" touch-action="none"></canvas>
            </div>
        `;
    }

    private _setupViewer() {
        if (this._canvas && !this.viewer) {
            this.viewer = createViewerForCanvas(this._canvas);
            this._updateModel();
            this._updateEnv();
        }
    }

    private _tearDownViewer() {
        if (this.viewer) {
            this.viewer.dispose();
            this.viewer = undefined;
        }
    }

    private _updateModel() {
        if (this.src) {
            this.viewer?.loadModelAsync(this.src).catch(Logger.Log);
        } else {
            // TODO: Unload model?
        }
    }

    private _updateEnv() {
        this.viewer?.loadEnvironmentAsync(this.env || undefined).catch(Logger.Log);
    }
}
