import type { PropertyValues } from "lit";
import type { Viewer } from "./viewer";

import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { Logger } from "core/Misc/logger";
import { createViewerForCanvas } from "./viewerFactory";

/**
 * Represents a custom element that displays a 3D model using the Babylon.js Viewer.
 */
@customElement("babylon-viewer")
export class HTML3DElement extends LitElement {
    /**
     * Gets the underlying Viewer object.
     */
    public viewer?: Viewer;

    // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
    static override styles = css`
        :host,
        #container,
        #renderCanvas {
            display: block;
            width: 100%;
            height: 100%;
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

    @state()
    private _animations: string[] = [];

    @state()
    private _currentAnimation = 0;

    @state()
    private _isAnimationPlaying = false;

    @state()
    private _animationProgress = 0;

    @state()
    private _animationSpeed = 1;

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

        if (changedProperties.has("_animationSpeed")) {
            this._updateAnimationSpeed();
        }

        if (changedProperties.has("_currentAnimation")) {
            this._updateCurrentAnimation();
        }

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
                ${this._animations.length > 0 &&
                html`
                    <div style="position: absolute; top: 10px;">
                        ${!this._isAnimationPlaying ? html`<button @click="${this._onPlayAnimationClicked}">Play</button>` : ""}
                        ${this._isAnimationPlaying ? html`<button @click="${this._onPauseAnimationClicked}">Pause</button>` : ""}
                        <p>Progress: ${Math.round(this._animationProgress * 100)}%</p>
                        <select @change="${this._onAnimationSpeedChanged}">
                            <option value="0.5">0.5x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                        </select>
                        <select @change="${this._onSelectedAnimationChanged}">
                            ${this._animations.map((name, index) => html`<option value="${index}">${name}</option>`)}
                        </select>
                    </div>
                `}
            </div>
        `;
    }

    private _onPlayAnimationClicked() {
        this.viewer?.playAnimation();
    }

    private _onPauseAnimationClicked() {
        this.viewer?.pauseAnimation();
    }

    private _onSelectedAnimationChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this._currentAnimation = Number(selectElement.value);
    }

    private _onAnimationSpeedChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this._animationSpeed = Number(selectElement.value);
    }

    private _setupViewer() {
        if (this._canvas && !this.viewer) {
            this.viewer = createViewerForCanvas(this._canvas);

            this.viewer.onModelLoaded.add(() => {
                this._animations = [...(this.viewer?.animations ?? [])];
                this._isAnimationPlaying = false;
                this._currentAnimation = 0;
                this._animationProgress = 0;
            });

            this.viewer.onIsAnimationPlayingChanged.add(() => {
                this._isAnimationPlaying = this.viewer?.isAnimationPlaying ?? false;
            });

            this.viewer.onAnimationProgressChanged.add(() => {
                this._animationProgress = this.viewer?.animationProgress ?? 0;
            });

            this._updateCurrentAnimation();
            this._updateAnimationSpeed();
            this._updateModel();
            this._updateEnv();
        }
    }

    private _tearDownViewer() {
        if (this.viewer) {
            this.viewer.dispose();
            this.viewer = undefined;
            this._isAnimationPlaying = false;
        }
    }

    private _updateAnimationSpeed() {
        if (this.viewer) {
            this.viewer.animationSpeed = this._animationSpeed;
        }
    }

    private _updateCurrentAnimation() {
        if (this.viewer) {
            this.viewer.selectedAnimation = this._currentAnimation;
        }
    }

    private async _updateModel() {
        if (this.src) {
            await this.viewer?.loadModelAsync(this.src).catch(Logger.Log);
        } else {
            // TODO: Unload model?
        }
    }

    private _updateEnv() {
        this.viewer?.loadEnvironmentAsync(this.env || undefined).catch(Logger.Log);
    }
}
