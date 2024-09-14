import type { PropertyValues } from "lit";
import type { Viewer, ViewerDetails } from "./viewer";
import type { CanvasViewerOptions } from "./viewerFactory";

import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { AsyncLock } from "core/Misc/asyncLock";
import { Logger } from "core/Misc/logger";
import { createViewerForCanvas } from "./viewerFactory";

// Icon SVG is pulled from https://fluentuipr.z22.web.core.windows.net/heads/master/public-docsite-v9/storybook/iframe.html?id=icons-catalog--page&viewMode=story
const playFilledIcon = "M17.22 8.68a1.5 1.5 0 0 1 0 2.63l-10 5.5A1.5 1.5 0 0 1 5 15.5v-11A1.5 1.5 0 0 1 7.22 3.2l10 5.5Z";
const pauseFilledIcon = "M5 2a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5Zm8 0a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2Z";

const allowedAnimationSpeeds = [0.5, 1, 1.5, 2] as const;

interface HTML3DElementEventMap extends HTMLElementEventMap {
    viewerready: CustomEvent<ViewerDetails>;
    environmentchange: Event;
    environmenterror: Event;
    modelchange: Event;
    modelerror: Event;
    selectedanimationchange: Event;
    animationspeedchange: Event;
    animationplayingchange: Event;
    animationprogresschange: Event;
}

/**
 * Represents a custom element that displays a 3D model using the Babylon.js Viewer.
 */
@customElement("babylon-viewer")
export class HTML3DElement extends LitElement {
    private readonly _viewerLock = new AsyncLock();
    private _viewer?: Viewer;

    // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
    static override styles = css`
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

        * {
            box-sizing: border-box;
        }

        .full-size {
            display: block;
            width: 100%;
            height: 100%;
        }

        .tool-bar {
            position: absolute;
            display: flex;
            flex-direction: row;
            border-radius: 12px;
            border-color: var(--ui-foreground-color);
            height: 48px;
            width: calc(100% - 24px);
            min-width: 150px;
            max-width: 1280px;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--ui-background-color);
            color: var(--ui-foreground-color);
            -webkit-tap-highlight-color: transparent;
        }

        .tool-bar * {
            height: 100%;
            min-width: 48px;
        }

        .tool-bar select {
            background: none;
            min-width: 52px;
            max-width: 128px;
            border: 1px solid transparent;
            border-radius: inherit;
            color: inherit;
            font-size: 14px;
            padding: 12px;
            cursor: pointer;
            outline: none;
            appearance: none; /* Remove default styling */
            -webkit-appearance: none; /* Remove default styling for Safari */
            -moz-appearance: none; /* Remove default styling for Firefox */
        }

        .tool-bar select:hover,
        .tool-bar select:focus {
            background-color: var(--ui-background-color-hover);
        }

        .tool-bar select option {
            background-color: var(--ui-background-color);
            color: var(--ui-foreground-color);
        }

        .tool-bar select:focus-visible {
            border-color: inherit;
        }

        .tool-bar button {
            background: none;
            border: 1px solid transparent;
            border-radius: inherit;
            color: inherit;
            padding: 0;
            cursor: pointer;
            outline: none;
        }

        .tool-bar button:hover {
            background-color: var(--ui-background-color-hover);
        }

        .tool-bar button:focus-visible {
            border-color: inherit;
        }

        .tool-bar button svg {
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
            border-color: inherit;
        }

        .progress-wrapper {
            -webkit-appearance: none;
            cursor: pointer;
            width: 100%;
            height: 100%;
            outline: none;
            border: 1px solid transparent;
            border-radius: inherit;
            padding: 0 12px;
            background-color: transparent;
        }

        .progress-wrapper:focus-visible {
            border-color: inherit;
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
     * The engine to use for rendering.
     */
    @property({ reflect: true })
    public engine: CanvasViewerOptions["engine"];

    /**
     * The model URL.
     */
    @property({ reflect: true })
    public src: string | undefined;

    /**
     * Forces the model to be loaded with the specified extension.
     * @remarks
     * If this property is not set, the extension will be inferred from the model URL when possible.
     */
    @property({ reflect: true })
    public extension: string | undefined;

    /**
     * The environment URL.
     */
    @property({ reflect: true })
    public env: string | undefined;

    /**
     * The list of animation names for the currently loaded model.
     */
    public get animations(): readonly string[] {
        return this._animations;
    }

    /**
     * The currently selected animation index.
     */
    public get selectedAnimation(): number {
        return this._selectedAnimation;
    }

    /**
     * True if an animation is currently playing.
     */
    public get isAnimationPlaying(): boolean {
        return this._isAnimationPlaying;
    }

    /**
     * The speed scale at which animations are played.
     */
    @property({ attribute: "animation-speed", reflect: true })
    public animationSpeed = 1;

    /**
     * The current point on the selected animation timeline, normalized between 0 and 1.
     */
    @property({ attribute: false })
    public animationProgress = 0;

    @state()
    private _animations: string[] = [];

    @state()
    private _selectedAnimation = -1;

    @state()
    private _isAnimationPlaying = false;

    @query("#renderCanvas")
    private _canvas: HTMLCanvasElement;

    /**
     * Toggles the play/pause animation state if there is a selected animation.
     */
    public toggleAnimation() {
        this._viewer?.toggleAnimation();
    }

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

        if (changedProperties.has("engine" satisfies keyof this)) {
            this._tearDownViewer();
            this._setupViewer();
        } else {
            if (changedProperties.has("animationSpeed")) {
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
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        return html`
            <div class="full-size">
                <canvas id="renderCanvas" class="full-size" touch-action="none"></canvas>
                ${this.animations.length === 0
                    ? ""
                    : html`
                          <slot name="tool-bar">
                              <div part="tool-bar" class="tool-bar">
                                  <div class="progress-control">
                                      <button aria-label="${this.isAnimationPlaying ? "Pause" : "Play"}" @click="${this.toggleAnimation}">
                                          ${!this.isAnimationPlaying
                                              ? html`<svg viewBox="0 0 20 20">
                                                    <path d="${playFilledIcon}" fill="currentColor"></path>
                                                </svg>`
                                              : html`<svg viewBox="-3 -2 24 24">
                                                    <path d="${pauseFilledIcon}" fill="currentColor"></path>
                                                </svg>`}
                                      </button>
                                      <input
                                          aria-label="Animation Progress"
                                          class="progress-wrapper"
                                          type="range"
                                          min="0"
                                          max="1"
                                          step="0.0001"
                                          .value="${this.animationProgress}"
                                          @input="${this._onProgressChanged}"
                                          @pointerdown="${this._onProgressPointerDown}"
                                      />
                                  </div>
                                  <select aria-label="Select Animation Speed" @change="${this._onAnimationSpeedChanged}">
                                      ${allowedAnimationSpeeds.map((speed) => html`<option value="${speed}" .selected="${this.animationSpeed === speed}">${speed}x</option>`)}
                                  </select>
                                  ${this.animations.length > 1
                                      ? html`<select aria-label="Select Animation" @change="${this._onSelectedAnimationChanged}">
                                            ${this.animations.map((name, index) => html`<option value="${index}" .selected="${this.selectedAnimation == index}">${name}</option>`)}
                                        </select>`
                                      : ""}
                              </div>
                          </slot>
                      `}
            </div>
        `;
    }

    // eslint-disable-next-line babylonjs/available
    override addEventListener<K extends keyof HTML3DElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTML3DElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    override addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    override addEventListener(type: unknown, listener: unknown, options?: unknown): void {
        super.addEventListener(type as string, listener as EventListenerOrEventListenerObject, options as boolean | AddEventListenerOptions);
    }

    private _dispatchCustomEvent<TEvent extends keyof HTML3DElementEventMap>(
        ...args: HTML3DElementEventMap[TEvent] extends CustomEvent ? [type: TEvent, details: HTML3DElementEventMap[TEvent]["detail"]] : [type: TEvent]
    ) {
        const [type, details] = args;
        this.dispatchEvent(details ? new CustomEvent(type, { detail: details }) : new Event(type));
    }

    private _onSelectedAnimationChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this._selectedAnimation = Number(selectElement.value);
    }

    private _onAnimationSpeedChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.animationSpeed = Number(selectElement.value);
    }

    private _onProgressChanged(event: Event) {
        if (this._viewer) {
            const input = event.target as HTMLInputElement;
            const value = Number(input.value);
            if (value !== this.animationProgress) {
                this._viewer.animationProgress = value;
            }
        }
    }

    private _onProgressPointerDown(event: Event) {
        if (this._viewer?.isAnimationPlaying) {
            this._viewer.pauseAnimation();
            const input = event.target as HTMLInputElement;
            input.addEventListener("pointerup", () => this._viewer?.playAnimation(), { once: true });
        }
    }

    private async _setupViewer() {
        if (this._canvas) {
            await this._viewerLock.lockAsync(async () => {
                if (!this._viewer) {
                    await createViewerForCanvas(this._canvas, {
                        engine: this.engine,
                        onInitialized: (details) => {
                            this._viewer = details.viewer;

                            details.viewer.onEnvironmentChanged.add(() => {
                                this._dispatchCustomEvent("environmentchange");
                            });

                            details.viewer.onEnvironmentError.add(() => {
                                this._dispatchCustomEvent("environmenterror");
                            });

                            details.viewer.onModelChanged.add(() => {
                                this._animations = [...(this._viewer?.animations ?? [])];
                                this._dispatchCustomEvent("modelchange");
                            });

                            details.viewer.onModelError.add(() => {
                                this._dispatchCustomEvent("modelerror");
                            });

                            details.viewer.onSelectedAnimationChanged.add(() => {
                                this._selectedAnimation = this._viewer?.selectedAnimation ?? -1;
                                this._dispatchCustomEvent("selectedanimationchange");
                            });

                            details.viewer.onAnimationSpeedChanged.add(() => {
                                let speed = this._viewer?.animationSpeed ?? 1;
                                speed = allowedAnimationSpeeds.reduce((prev, curr) => (Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev));
                                this.animationSpeed = speed;
                                this._dispatchCustomEvent("animationspeedchange");
                            });

                            details.viewer.onIsAnimationPlayingChanged.add(() => {
                                this._isAnimationPlaying = this._viewer?.isAnimationPlaying ?? false;
                                this._dispatchCustomEvent("animationplayingchange");
                            });

                            details.viewer.onAnimationProgressChanged.add(() => {
                                this.animationProgress = this._viewer?.animationProgress ?? 0;
                                this._dispatchCustomEvent("animationprogresschange");
                            });

                            this._updateSelectedAnimation();
                            this._updateAnimationSpeed();
                            this._updateModel();
                            this._updateEnv();

                            this._dispatchCustomEvent("viewerready", details);
                        },
                    });
                }
            });
        }
    }

    private async _tearDownViewer() {
        await this._viewerLock.lockAsync(async () => {
            if (this._viewer) {
                this._viewer.dispose();
                this._viewer = undefined;
            }
        });
    }

    private _updateAnimationSpeed() {
        if (this._viewer) {
            this._viewer.animationSpeed = this.animationSpeed;
        }
    }

    private _updateSelectedAnimation() {
        if (this._viewer) {
            this._viewer.selectedAnimation = this._selectedAnimation;
        }
    }

    private async _updateModel() {
        try {
            if (this.src) {
                await this._viewer?.loadModelAsync(this.src, { pluginExtension: this.extension });
            } else {
                await this._viewer?.resetModelAsync();
            }
        } catch (error) {
            Logger.Log(error);
        }
    }

    private async _updateEnv() {
        try {
            if (this.env) {
                await this._viewer?.loadEnvironmentAsync(this.env);
            } else {
                await this._viewer?.resetEnvironmentAsync();
            }
        } catch (error) {
            Logger.Log(error);
        }
    }
}
