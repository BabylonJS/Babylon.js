// eslint-disable-next-line import/no-internal-modules
import type { Nullable } from "core/index";

import type { PropertyValues } from "lit";
import type { ViewerDetails, ViewerHotSpot, ViewerHotSpotQuery } from "./viewer";
import type { CanvasViewerOptions } from "./viewerFactory";

import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { AsyncLock } from "core/Misc/asyncLock";
import { Logger } from "core/Misc/logger";
import { createViewerForCanvas, getDefaultEngine } from "./viewerFactory";

// Icon SVG is pulled from https://fluentuipr.z22.web.core.windows.net/heads/master/public-docsite-v9/storybook/iframe.html?id=icons-catalog--page&viewMode=story
const playFilledIcon = "M17.22 8.68a1.5 1.5 0 0 1 0 2.63l-10 5.5A1.5 1.5 0 0 1 5 15.5v-11A1.5 1.5 0 0 1 7.22 3.2l10 5.5Z";
const pauseFilledIcon = "M5 2a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5Zm8 0a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2Z";

const allowedAnimationSpeeds = [0.5, 1, 1.5, 2] as const;

interface HTML3DElementEventMap extends HTMLElementEventMap {
    viewerready: Event;
    environmentchange: Event;
    environmenterror: ErrorEvent;
    modelchange: Event;
    modelerror: ErrorEvent;
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
    private _viewerDetails?: Readonly<ViewerDetails>;

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
            position: relative;
            width: 100%;
            height: 100%;
        }

        .children-slot {
            position: absolute;
            top: 0;
            background: transparent;
            pointer-events: none;
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
     * Gets the underlying viewer details (when the underlying viewer is in a loaded state).
     * This is useful for advanced scenarios where direct access to the viewer or Babylon scene is needed.
     */
    public get viewerDetails() {
        return this._viewerDetails;
    }

    /**
     * Get hotspot world and screen values from a named hotspot
     * @param name slot of the hot spot
     * @param result resulting world and screen positions
     * @returns world and screen space coordinates
     */
    public queryHotSpot(name: string, result: ViewerHotSpot): boolean {
        // Retrieve all hotspots inside the viewer element
        let resultFound = false;
        // Iterate through each hotspot to get the 'data-surface' and 'data-name' attributes
        if (this._viewerDetails) {
            const hotspot = this.hotspots?.[name];
            if (hotspot) {
                resultFound = this._viewerDetails.viewer.getHotSpotToRef(hotspot, result);
            }
        }
        return resultFound;
    }
    /**
     * The engine to use for rendering.
     */
    @property({ reflect: true })
    public engine: NonNullable<CanvasViewerOptions["engine"]> = getDefaultEngine();

    /**
     * The model URL.
     */
    @property({ reflect: true })
    public source: Nullable<string> = null;

    /**
     * Forces the model to be loaded with the specified extension.
     * @remarks
     * If this property is not set, the extension will be inferred from the model URL when possible.
     */
    @property({ reflect: true })
    public extension: Nullable<string> = null;

    /**
     * The environment URL.
     */
    @property({ reflect: true })
    public environment: Nullable<string> = null;

    /**
     * A string value that encodes one or more hotspots.
     */
    @property({
        type: "string",
        converter: (value) => {
            if (!value) {
                return null;
            }

            const array = value.split(/\s+/);
            if (array.length % 8 !== 0) {
                throw new Error(
                    `hotspots should be defined in sets of 8 elements: 'name meshIndex pointIndex1 pointIndex2 pointIndex3 barycentricCoord1 barycentricCoord2 barycentricCoord3', but a total of ${array.length} elements were found in '${value}'`
                );
            }

            const hotspots: Record<string, ViewerHotSpotQuery> = {};
            for (let offset = 0; offset < array.length; offset += 8) {
                hotspots[array[offset]] = {
                    meshIndex: Number(array[offset + 1]),
                    pointIndex: [Number(array[offset + 2]), Number(array[offset + 3]), Number(array[offset + 4])],
                    barycentric: [Number(array[offset + 5]), Number(array[offset + 6]), Number(array[offset + 7])],
                };
            }
            return hotspots;
        },
    })
    public hotspots: Nullable<Record<string, ViewerHotSpotQuery>> = null;

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

    @query("#canvasContainer")
    private _canvasContainer: HTMLDivElement | undefined;

    /**
     * Toggles the play/pause animation state if there is a selected animation.
     */
    public toggleAnimation() {
        this._viewerDetails?.viewer.toggleAnimation();
    }

    // eslint-disable-next-line babylonjs/available
    override connectedCallback(): void {
        super.connectedCallback();
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

        if (changedProperties.get("engine" satisfies keyof this)) {
            this._tearDownViewer();
            this._setupViewer();
        } else {
            if (changedProperties.has("animationSpeed")) {
                this._updateAnimationSpeed();
            }

            if (changedProperties.has("_selectedAnimation")) {
                this._updateSelectedAnimation();
            }

            if (changedProperties.has("source" satisfies keyof this)) {
                this._updateModel();
            }

            if (changedProperties.has("environment" satisfies keyof this)) {
                this._updateEnv();
            }
        }
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        // NOTE: The unnamed 'slot' element holds all child elements of the <babylon-viewer> that do not specify a 'slot' attribute.
        return html`
            <div class="full-size">
                <div id="canvasContainer" class="full-size"></div>
                <slot class="full-size children-slot"></slot>
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
    override addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        super.addEventListener(type as string, listener as EventListenerOrEventListenerObject, options as boolean | AddEventListenerOptions);
    }

    private _dispatchCustomEvent<TEvent extends keyof HTML3DElementEventMap>(type: TEvent, event: (type: TEvent) => HTML3DElementEventMap[TEvent]) {
        this.dispatchEvent(event(type));
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
        if (this._viewerDetails) {
            const input = event.target as HTMLInputElement;
            const value = Number(input.value);
            if (value !== this.animationProgress) {
                this._viewerDetails.viewer.animationProgress = value;
            }
        }
    }

    private _onProgressPointerDown(event: Event) {
        if (this._viewerDetails?.viewer.isAnimationPlaying) {
            this._viewerDetails.viewer.pauseAnimation();
            const input = event.target as HTMLInputElement;
            input.addEventListener("pointerup", () => this._viewerDetails?.viewer.playAnimation(), { once: true });
        }
    }

    private async _setupViewer() {
        await this._viewerLock.lockAsync(async () => {
            // The first time the element is connected, the canvas container may not be available yet.
            // Wait for the first update if needed.
            if (!this._canvasContainer) {
                await this.updateComplete;
            }

            if (this._canvasContainer && !this._viewerDetails) {
                const canvas = document.createElement("canvas");
                canvas.className = "full-size";
                canvas.setAttribute("touch-action", "none");
                this._canvasContainer.appendChild(canvas);

                await createViewerForCanvas(canvas, {
                    engine: this.engine,
                    onInitialized: (details) => {
                        this._viewerDetails = details;

                        details.viewer.onEnvironmentChanged.add(() => {
                            this._dispatchCustomEvent("environmentchange", (type) => new Event(type));
                        });

                        details.viewer.onEnvironmentError.add((error) => {
                            this._dispatchCustomEvent("environmenterror", (type) => new ErrorEvent(type, { error }));
                        });

                        details.viewer.onModelChanged.add(() => {
                            this._animations = [...details.viewer.animations];
                            this._dispatchCustomEvent("modelchange", (type) => new Event(type));
                        });

                        details.viewer.onModelError.add((error) => {
                            this._animations = [...details.viewer.animations];
                            this._dispatchCustomEvent("modelerror", (type) => new ErrorEvent(type, { error }));
                        });

                        details.viewer.onSelectedAnimationChanged.add(() => {
                            this._selectedAnimation = details.viewer.selectedAnimation ?? -1;
                            this._dispatchCustomEvent("selectedanimationchange", (type) => new Event(type));
                        });

                        details.viewer.onAnimationSpeedChanged.add(() => {
                            let speed = details.viewer.animationSpeed ?? 1;
                            speed = allowedAnimationSpeeds.reduce((prev, curr) => (Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev));
                            this.animationSpeed = speed;
                            this._dispatchCustomEvent("animationspeedchange", (type) => new Event(type));
                        });

                        details.viewer.onIsAnimationPlayingChanged.add(() => {
                            this._isAnimationPlaying = details.viewer.isAnimationPlaying ?? false;
                            this._dispatchCustomEvent("animationplayingchange", (type) => new Event(type));
                        });

                        details.viewer.onAnimationProgressChanged.add(() => {
                            this.animationProgress = details.viewer.animationProgress ?? 0;
                            this._dispatchCustomEvent("animationprogresschange", (type) => new Event(type));
                        });

                        this._updateSelectedAnimation();
                        this._updateAnimationSpeed();
                        this._updateModel();
                        this._updateEnv();

                        this._dispatchCustomEvent("viewerready", (type) => new Event(type));
                    },
                });
            }
        });
    }

    private async _tearDownViewer() {
        await this._viewerLock.lockAsync(async () => {
            if (this._viewerDetails) {
                this._viewerDetails.viewer.dispose();
                this._viewerDetails = undefined;
            }

            // We want to replace the canvas for two reasons:
            // 1. When the viewer element is reconnected to the DOM, we don't want to briefly see the last frame of the previous model.
            // 2. If we are changing engines (e.g. WebGL to WebGPU), we need to create a new canvas for the new engine.
            if (this._canvasContainer && this._canvasContainer.firstElementChild) {
                this._canvasContainer.removeChild(this._canvasContainer.firstElementChild);
            }
        });
    }

    private _updateAnimationSpeed() {
        if (this._viewerDetails) {
            this._viewerDetails.viewer.animationSpeed = this.animationSpeed;
        }
    }

    private _updateSelectedAnimation() {
        if (this._viewerDetails) {
            this._viewerDetails.viewer.selectedAnimation = this._selectedAnimation;
        }
    }

    private async _updateModel() {
        try {
            if (this.source) {
                await this._viewerDetails?.viewer.loadModel(this.source, { pluginExtension: this.extension ?? undefined });
            } else {
                await this._viewerDetails?.viewer.resetModel();
            }
        } catch (error) {
            Logger.Log(error);
        }
    }

    private async _updateEnv() {
        try {
            if (this.environment) {
                await this._viewerDetails?.viewer.loadEnvironment(this.environment);
            } else {
                await this._viewerDetails?.viewer.resetEnvironment();
            }
        } catch (error) {
            Logger.Log(error);
        }
    }
}
