import type { PropertyValues } from "lit";
import type { Viewer } from "./viewer";

import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { Logger } from "core/Misc/logger";
import { createViewerForCanvas } from "./viewerFactory";

// Icon SVG is pulled from https://fluentuipr.z22.web.core.windows.net/heads/master/public-docsite-v9/storybook/iframe.html?id=icons-catalog--page&viewMode=story
const playFilledIcon = "M17.22 8.68a1.5 1.5 0 0 1 0 2.63l-10 5.5A1.5 1.5 0 0 1 5 15.5v-11A1.5 1.5 0 0 1 7.22 3.2l10 5.5Z";
const pauseFilledIcon = "M5 2a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5Zm8 0a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2Z";

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
        .full-size {
            display: block;
            width: 100%;
            height: 100%;
        }

        :host {
            --ui-foreground-color: white;
            --ui-background-hue: 233;
            --ui-background-saturation: 8%;
            --ui-background-lightness: 39%;
            --ui-background-opacity: 0.75;
            --ui-background-color: hsla(var(--ui-background-hue), var(--ui-background-saturation), var(--ui-background-lightness), var(--ui-background-opacity));
            --ui-background-color-hover: hsla(
                var(--ui-background-hue),
                var(--ui-background-saturation),
                calc(var(--ui-background-lightness) - 10%),
                calc(var(--ui-background-opacity) - 0.1)
            );
        }

        :host(.full-size) {
        }

        .animation-bar {
            position: absolute;
            display: flex;
            flex-direction: row;
            border-radius: 12px;
            height: 48px;
            width: 80%;
            max-width: 1280px;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            justify-content: center;
            background-color: var(--ui-background-color);
            color: var(--ui-foreground-color);
        }

        .animation-bar select {
            background: none;
            border: 1px solid transparent;
            border-radius: inherit;
            color: inherit;
            padding: 12px;
            height: 100%;
            min-width: 48px;
            cursor: pointer;
            outline: none;
            appearance: none; /* Remove default styling */
            -webkit-appearance: none; /* Remove default styling for Safari */
            -moz-appearance: none; /* Remove default styling for Firefox */
        }

        .animation-bar select:hover {
            background-color: var(--ui-background-color-hover);
        }

        .animation-bar select:active {
            border: 1px solid transparent;
        }

        .animation-bar select:focus-visible {
            border: 1px solid;
        }

        .animation-bar button {
            background: none;
            border: 1px solid transparent;
            border-radius: inherit;
            color: inherit;
            margin: 0;
            padding: 0;
            height: 100%;
            min-width: 48px;
            cursor: pointer;
            outline: none;
        }

        .animation-bar button:hover {
            background-color: var(--ui-background-color-hover);
        }

        .animation-bar button:focus-visible {
            border: 1px solid;
        }

        .animation-bar button svg {
            width: 32px;
            height: 32px;
        }

        .progress-control {
            display: flex;
            flex: 1;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            align-items: center;
            border-radius: inherit;
        }

        .progress-wrapper {
            -webkit-appearance: none;
            cursor: pointer;
            width: 100%;
            height: 95%;
            outline: none;
            border: 1px solid transparent;
            border-radius: inherit;
            padding: 0 12px;
            background-color: transparent;
        }

        .progress-wrapper:focus-visible {
            border: 1px solid var(--ui-foreground-color);
        }

        /*Chrome -webkit */

        .progress-wrapper::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border: 2px solid;
            color: var(--ui-foreground-color);
            border-radius: 50%;
            background: hsla(var(--ui-background-hue), var(--ui-background-saturation), var(--ui-background-lightness), 1);
            margin-top: -10px;
        }

        .progress-wrapper::-webkit-slider-runnable-track {
            height: 2px;
            -webkit-appearance: none;
            background-color: var(--ui-foreground-color);
        }

        /** FireFox -moz */

        .progress-wrapper::-moz-range-progress {
            height: 2px;
            background-color: var(--ui-foreground-color);
        }

        .progress-wrapper::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border: 2px solid var(--ui-foreground-color);
            border-radius: 50%;
            background: hsla(var(--ui-background-hue), var(--ui-background-saturation), var(--ui-background-lightness), 1);
        }

        .progress-wrapper::-moz-range-track {
            height: 2px;
            background: var(--ui-foreground-color);
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
    private _selectedAnimation = -1;

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

        if (changedProperties.has("_selectedAnimation")) {
            this._updateSelectedAnimation();
        }

        if (changedProperties.has("src" satisfies keyof this)) {
            this._updateModel();
        }

        if (changedProperties.has("env" satisfies keyof this)) {
            this._updateEnv();
        }
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        return html`
            <div class="full-size">
                <canvas id="renderCanvas" class="full-size" touch-action="none"></canvas>
                ${this._animations.length > 0 &&
                html`
                    <div class="animation-bar">
                        ${this._animations.length > 1
                            ? html`<select @change="${this._onSelectedAnimationChanged}">
                                  ${this._animations.map((name, index) => html`<option value="${index}" .selected="${this._selectedAnimation == index}">${name}</option>`)}
                              </select>`
                            : ""}
                        <div class="progress-control">
                            <button @click="${this._onPlayPauseAnimationClicked}">
                                ${!this._isAnimationPlaying
                                    ? html`<svg viewBox="0 0 20 20">
                                          <path d="${playFilledIcon}" fill="currentColor"></path>
                                      </svg>`
                                    : html`<svg viewBox="-3 -2 24 24">
                                          <path d="${pauseFilledIcon}" fill="currentColor"></path>
                                      </svg>`}
                            </button>
                            <input
                                class="progress-wrapper"
                                type="range"
                                min="0"
                                max="1"
                                step="0.0001"
                                .value="${this._animationProgress}"
                                @input="${this._onProgressChanged}"
                                @pointerdown="${this._onProgressPointerDown}"
                            />
                        </div>
                        <select @change="${this._onAnimationSpeedChanged}">
                            <option value="0.5" .selected="${this._animationSpeed === 0.5}">0.5x</option>
                            <option value="1" .selected="${this._animationSpeed === 1}">1x</option>
                            <option value="1.5" .selected="${this._animationSpeed === 1.5}">1.5x</option>
                            <option value="2" .selected="${this._animationSpeed === 2}">2x</option>
                        </select>
                    </div>
                `}
            </div>
        `;
    }

    private _onPlayPauseAnimationClicked() {
        if (this._isAnimationPlaying) {
            this.viewer?.pauseAnimation();
        } else {
            this.viewer?.playAnimation();
        }
    }

    private _onSelectedAnimationChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this._selectedAnimation = Number(selectElement.value);
    }

    private _onAnimationSpeedChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this._animationSpeed = Number(selectElement.value);
    }

    private _onProgressChanged(event: Event) {
        if (this.viewer) {
            const input = event.target as HTMLInputElement;
            const value = Number(input.value);
            if (value !== this._animationProgress) {
                this.viewer.animationProgress = value;
            }
        }
    }

    private _onProgressPointerDown(event: Event) {
        if (this.viewer?.isAnimationPlaying) {
            this.viewer.pauseAnimation();
            const input = event.target as HTMLInputElement;
            input.addEventListener("pointerup", () => this.viewer?.playAnimation(), { once: true });
        }
    }

    private _setupViewer() {
        if (this._canvas && !this.viewer) {
            this.viewer = createViewerForCanvas(this._canvas);

            this.viewer.onModelLoaded.add(() => {
                this._animations = [...(this.viewer?.animations ?? [])];
            });

            this.viewer.onSelectedAnimationChanged.add(() => {
                this._selectedAnimation = this.viewer?.selectedAnimation ?? 0;
            });

            this.viewer.onAnimationSpeedChanged.add(() => {
                this._animationSpeed = this.viewer?.animationSpeed ?? 1;
            });

            this.viewer.onIsAnimationPlayingChanged.add(() => {
                this._isAnimationPlaying = this.viewer?.isAnimationPlaying ?? false;
            });

            this.viewer.onAnimationProgressChanged.add(() => {
                this._animationProgress = this.viewer?.animationProgress ?? 0;
            });

            this._updateSelectedAnimation();
            this._updateAnimationSpeed();
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

    private _updateAnimationSpeed() {
        if (this.viewer) {
            this.viewer.animationSpeed = this._animationSpeed;
        }
    }

    private _updateSelectedAnimation() {
        if (this.viewer) {
            this.viewer.selectedAnimation = this._selectedAnimation;
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
