// eslint-disable-next-line import/no-internal-modules
import type { ArcRotateCamera, Nullable, Observable } from "core/index";

import type { PropertyValues } from "lit";
import type { ToneMapping, ViewerDetails, ViewerHotSpotQuery } from "./viewer";
import type { CanvasViewerOptions } from "./viewerFactory";

import { LitElement, css, defaultConverter, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { Color4 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { AsyncLock } from "core/Misc/asyncLock";
import { Logger } from "core/Misc/logger";
import { isToneMapping, ViewerHotSpotResult } from "./viewer";
import { createViewerForCanvas, getDefaultEngine } from "./viewerFactory";

// Icon SVG is pulled from https://react.fluentui.dev/?path=/docs/icons-catalog--docs
const playFilledIcon = "M17.22 8.68a1.5 1.5 0 0 1 0 2.63l-10 5.5A1.5 1.5 0 0 1 5 15.5v-11A1.5 1.5 0 0 1 7.22 3.2l10 5.5Z";
const pauseFilledIcon = "M5 2a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5Zm8 0a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2Z";
const targetFilledIcon =
    "M10 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Zm5-3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z";

const allowedAnimationSpeeds = [0.5, 1, 1.5, 2] as const;

// Converts any standard html color string to a Color4 object.
function parseColor(color: string | null | undefined): Nullable<Color4> {
    if (!color) {
        return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to get 2d context for parseColor");
    }

    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);

    const data = context.getImageData(0, 0, 1, 1).data;
    return new Color4(data[0] / 255, data[1] / 255, data[2] / 255, data[3] / 255);
}

type HotSpot = ViewerHotSpotQuery & { cameraOrbit?: [alpha: number, beta: number, radius: number] };

// Custom events for the HTML3DElement.
interface HTML3DElementEventMap extends HTMLElementEventMap {
    viewerready: Event;
    viewerrender: Event;
    environmentchange: Event;
    environmenterror: ErrorEvent;
    modelchange: Event;
    modelerror: ErrorEvent;
    loadingprogresschange: Event;
    selectedanimationchange: Event;
    animationspeedchange: Event;
    animationplayingchange: Event;
    animationprogresschange: Event;
}

/**
 * Displays a 3D model using the Babylon.js Viewer.
 */
@customElement("babylon-viewer")
export class HTML3DElement extends LitElement {
    private readonly _viewerLock = new AsyncLock();
    private _viewerDetails?: Readonly<ViewerDetails>;

    // Bindings for properties that are synchronized both ways between the lower level Viewer and the HTML3DElement.
    private readonly _propertyBindings = [
        this._createPropertyBinding(
            "clearColor",
            (details) => details.scene.onClearColorChangedObservable,
            (details) => (details.scene.clearColor = this.clearColor ?? new Color4(0, 0, 0, 0)),
            (details) => (this.clearColor = details.scene.clearColor)
        ),
        this._createPropertyBinding(
            "skyboxBlur",
            (details) => details.viewer.onSkyboxBlurChanged,
            (details) => (details.viewer.skyboxBlur = this.skyboxBlur ?? details.viewer.skyboxBlur),
            (details) => (this.skyboxBlur = details.viewer.skyboxBlur)
        ),
        this._createPropertyBinding(
            "toneMapping",
            (details) => details.viewer.onPostProcessingChanged,
            (details) => {
                if (this.toneMapping) {
                    details.viewer.postProcessing = { toneMapping: this.toneMapping };
                }
            },
            (details) => (this.toneMapping = details.viewer.postProcessing?.toneMapping)
        ),
        this._createPropertyBinding(
            "contrast",
            (details) => details.viewer.onPostProcessingChanged,
            (details) => (details.viewer.postProcessing = { contrast: this.contrast ?? undefined }),
            (details) => (this.contrast = details.viewer.postProcessing.contrast)
        ),
        this._createPropertyBinding(
            "exposure",
            (details) => details.viewer.onPostProcessingChanged,
            (details) => (details.viewer.postProcessing = { exposure: this.exposure ?? undefined }),
            (details) => (this.exposure = details.viewer.postProcessing.exposure)
        ),
        this._createPropertyBinding(
            "cameraAutoOrbit",
            (details) => details.viewer.onCameraAutoOrbitChanged,
            (details) => (details.viewer.cameraAutoOrbit = { enabled: this.cameraAutoOrbit }),
            (details) => (this.cameraAutoOrbit = details.viewer.cameraAutoOrbit.enabled)
        ),
        this._createPropertyBinding(
            "cameraAutoOrbitSpeed",
            (details) => details.viewer.onCameraAutoOrbitChanged,
            (details) => (details.viewer.cameraAutoOrbit = { speed: this.cameraAutoOrbitSpeed ?? undefined }),
            (details) => (this.cameraAutoOrbitSpeed = details.viewer.cameraAutoOrbit.speed)
        ),
        this._createPropertyBinding(
            "cameraAutoOrbitDelay",
            (details) => details.viewer.onCameraAutoOrbitChanged,
            (details) => (details.viewer.cameraAutoOrbit = { delay: this.cameraAutoOrbitDelay ?? undefined }),
            (details) => (this.cameraAutoOrbitDelay = details.viewer.cameraAutoOrbit.delay)
        ),
        this._createPropertyBinding(
            "animationSpeed",
            (details) => details.viewer.onAnimationSpeedChanged,
            (details) => (details.viewer.animationSpeed = this.animationSpeed),
            (details) => {
                let speed = details.viewer.animationSpeed;
                speed = allowedAnimationSpeeds.reduce((prev, curr) => (Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev));
                this.animationSpeed = speed;
                this._dispatchCustomEvent("animationspeedchange", (type) => new Event(type));
            }
        ),
        this._createPropertyBinding(
            "selectedAnimation",
            (details) => details.viewer.onSelectedAnimationChanged,
            (details) => (details.viewer.selectedAnimation = this.selectedAnimation ?? details.viewer.selectedAnimation),
            (details) => (this.selectedAnimation = details.viewer.selectedAnimation)
        ),
    ] as const;

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
            all: inherit;
            overflow: hidden;
        }

        .full-size {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        .canvas {
            outline: none;
        }

        .children-slot {
            position: absolute;
            top: 0;
            background: transparent;
            pointer-events: none;
        }

        .bar {
            position: absolute;
            width: calc(100% - 24px);
            min-width: 150px;
            max-width: 1280px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--ui-background-color);
        }

        .bar-min {
            width: unset;
            min-width: unset;
            max-width: unset;
        }

        .loading-progress-outer {
            height: 4px;
            border-radius: 4px;
            border: 1px solid var(--ui-background-color);
            outline: none;
            top: 12px;
            pointer-events: none;
            transition: opacity 0.5s ease;
        }

        .loading-progress-outer-inactive {
            opacity: 0;
            /* Set the background color to the foreground color while in the inactive state so that the color seen is correct while fading out the opacity. */
            background-color: var(--ui-foreground-color);
        }

        .loading-progress-inner {
            width: 0;
            height: 100%;
            border-radius: inherit;
            background-color: var(--ui-foreground-color);
            transition: width 0.3s linear;
        }

        /* The right side of the inner progress bar starts aligned with the left side of the outer progress bar (container).
           So, if the width is 30%, then the left side of the inner progress bar moves a total of 130% of the width of the container.
           This is why the first keyframe is at 23% ((100/130)*30).
         */
        @keyframes indeterminate {
            0% {
                left: 0%;
                width: 0%;
            }
            23% {
                left: 0%;
                width: 30%;
            }
            77% {
                left: 70%;
                width: 30%;
            }
            100% {
                left: 100%;
                width: 0%;
            }
        }

        .loading-progress-inner-indeterminate {
            position: absolute;
            animation: indeterminate 1.5s infinite;
            animation-timing-function: linear;
        }

        .tool-bar {
            display: flex;
            flex-direction: row;
            align-items: center;
            border-radius: 12px;
            border-color: var(--ui-foreground-color);
            height: 48px;
            bottom: 12px;
            color: var(--ui-foreground-color);
            -webkit-tap-highlight-color: transparent;
        }

        .tool-bar * {
            height: 100%;
            min-width: 48px;
        }

        .tool-bar .divider {
            min-width: 1px;
            margin: 0px 6px;
            height: 66%;
            background-color: var(--ui-foreground-color);
        }

        .tool-bar select {
            background: none;
            min-width: 52px;
            max-width: 128px;
            border: 1px solid transparent;
            border-radius: inherit;
            color: inherit;
            font-size: 14px;
            padding: 0px 12px;
            cursor: pointer;
            outline: none;
            appearance: none; /* Remove default styling */
            -webkit-appearance: none; /* Remove default styling for Safari */
        }

        .tool-bar .select-container {
            position: relative;
            display: flex;
            border-radius: inherit;
            border-width: 0;
            padding: 0;
        }

        .tool-bar .select-container select {
            position: absolute;
            min-width: 0;
            width: 100%;
        }

        .tool-bar .select-container button {
            position: absolute;
            border-width: 0;
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

        .animation-timeline {
            display: flex;
            flex: 1;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            align-items: center;
            border-radius: inherit;
            border-color: inherit;
        }

        .animation-timeline-input {
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

        .animation-timeline-input:focus-visible {
            border-color: inherit;
        }

        /*Chrome -webkit */

        .animation-timeline-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border: 2px solid;
            color: var(--ui-foreground-color);
            border-radius: 50%;
            background: hsla(var(--ui-background-hue), var(--ui-background-saturation), var(--ui-background-lightness), 1);
            margin-top: -10px;
        }

        .animation-timeline-input::-webkit-slider-runnable-track {
            height: 2px;
            -webkit-appearance: none;
            background-color: var(--ui-foreground-color);
        }

        /** FireFox -moz */

        .animation-timeline-input::-moz-range-progress {
            height: 2px;
            background-color: var(--ui-foreground-color);
        }

        .animation-timeline-input::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border: 2px solid var(--ui-foreground-color);
            border-radius: 50%;
            background: hsla(var(--ui-background-hue), var(--ui-background-saturation), var(--ui-background-lightness), 1);
        }

        .animation-timeline-input::-moz-range-track {
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
     * @returns world position, world normal and screen space coordinates
     */
    public queryHotSpot(name: string, result: ViewerHotSpotResult): boolean {
        return this._queryHotSpot(name, result) != null;
    }

    private _queryHotSpot(name: string, result: ViewerHotSpotResult): Nullable<HotSpot> {
        if (this._viewerDetails) {
            const hotSpot = this.hotSpots?.[name];
            if (hotSpot) {
                if (this._viewerDetails.viewer.getHotSpotToRef(hotSpot, result)) {
                    return hotSpot;
                }
            }
        }
        return null;
    }

    /**
     * Updates the camera to focus on a named hotspot.
     * @param name The name of the hotspot to focus on.
     * @returns true if the hotspot was found and the camera was updated, false otherwise.
     */
    public focusHotSpot(name: string): boolean {
        const result = new ViewerHotSpotResult();
        const query = this._queryHotSpot(name, result);
        if (query && this._viewerDetails) {
            const cameraOrbit = query.cameraOrbit ?? [undefined, undefined, undefined];
            this._viewerDetails.camera.interpolateTo(
                cameraOrbit[0],
                cameraOrbit[1],
                cameraOrbit[2],
                new Vector3(result.worldPosition[0], result.worldPosition[1], result.worldPosition[2])
            );
            return true;
        }
        return false;
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

    @state()
    private _loadingProgress: boolean | number = false;

    /**
     * Gets information about loading activity.
     * @remarks
     * false indicates no loading activity.
     * true indicates loading activity with no progress information.
     * A number between 0 and 1 indicates loading activity with progress information.
     */
    public get loadingProgress(): boolean | number {
        return this._loadingProgress;
    }

    /**
     * A value between 0 and 1 that specifies how much to blur the skybox.
     */
    @property({ attribute: "skybox-blur" })
    public skyboxBlur: Nullable<number> = null;

    /**
     * The tone mapping to use for rendering the scene.
     */
    @property({
        attribute: "tone-mapping",
        converter: (value: string | null): ToneMapping => {
            if (!value || !isToneMapping(value)) {
                return "neutral";
            }
            return value;
        },
    })
    public toneMapping: Nullable<ToneMapping> = null;

    /**
     * The contrast applied to the scene.
     */
    @property()
    public contrast: Nullable<number> = null;

    /**
     * The exposure applied to the scene.
     */
    @property()
    public exposure: Nullable<number> = null;

    /**
     * The clear color (e.g. background color) for the viewer.
     */
    @property({
        attribute: "clear-color",
        reflect: true,
        converter: {
            fromAttribute: parseColor,
            toAttribute: (color: Nullable<Color4>) => (color ? color.toHexString() : null),
        },
    })
    public clearColor: Nullable<Color4> = null;

    /**
     * Enables or disables camera auto-orbit.
     */
    @property({
        attribute: "camera-auto-orbit",
        type: Boolean,
    })
    public cameraAutoOrbit = false;

    /**
     * The speed at which the camera auto-orbits around the target.
     */
    @property({
        attribute: "camera-auto-orbit-speed",
        type: Number,
    })
    public cameraAutoOrbitSpeed: Nullable<number> = null;

    /**
     * The delay in milliseconds before the camera starts auto-orbiting.
     */
    @property({
        attribute: "camera-auto-orbit-delay",
        type: Number,
    })
    public cameraAutoOrbitDelay: Nullable<number> = null;

    /**
     * Camera orbit can only be set as an attribute, and is set on the camera each time a new model is loaded.
     * For access to the real time camera properties, use viewerDetails.camera.
     */
    @property({
        attribute: "camera-orbit",
        converter: (value) => {
            if (!value) {
                return null;
            }

            const array = value.split(/\s+/);
            if (array.length !== 3) {
                throw new Error("cameraOrbit should be defined as 'alpha beta radius'");
            }

            return (camera: ArcRotateCamera) => {
                for (const [index, property] of (["alpha", "beta", "radius"] as const).entries()) {
                    const value = array[index];
                    if (value !== "auto") {
                        camera[property] = Number(value);
                    }
                }
            };
        },
    })
    private _cameraOrbitCoercer: Nullable<(camera: ArcRotateCamera) => void> = null;

    /**
     * Camera target can only be set as an attribute, and is set on the camera each time a new model is loaded.
     * For access to the real time camera properties, use viewerDetails.camera.
     */
    @property({
        attribute: "camera-target",
        converter: (value) => {
            if (!value) {
                return null;
            }

            const array = value.split(/\s+/);
            if (array.length !== 3) {
                throw new Error("cameraTarget should be defined as 'x y z'");
            }

            return (camera: ArcRotateCamera) => {
                const target = camera.target;
                for (const [index, property] of (["x", "y", "z"] as const).entries()) {
                    const value = array[index];
                    if (value !== "auto") {
                        target[property] = Number(value);
                    }
                }
                camera.target = target.clone();
            };
        },
    })
    private _cameraTargetCoercer: Nullable<(camera: ArcRotateCamera) => void> = null;

    /**
     * A string value that encodes one or more hotspots.
     */
    @property({
        attribute: "hotspots",
        converter: (value) => {
            if (!value) {
                return {};
            }

            return JSON.parse(value);
        },
    })
    public hotSpots: Readonly<Record<string, HotSpot>> = {};

    private get _hasHotSpots(): boolean {
        return Object.keys(this.hotSpots).length > 0;
    }

    /**
     * True if the default animation should play automatically when a model is loaded.
     */
    @property({ attribute: "animation-auto-play", reflect: true, type: Boolean })
    public animationAutoPlay = false;

    /**
     * The list of animation names for the currently loaded model.
     */
    public get animations(): readonly string[] {
        return this._animations;
    }

    private get _hasAnimations(): boolean {
        return this._animations.length > 0;
    }

    /**
     * The currently selected animation index.
     */
    @property({ attribute: "selected-animation", type: Number })
    public selectedAnimation: Nullable<number> = null;

    /**
     * True if an animation is currently playing.
     */
    public get isAnimationPlaying(): boolean {
        return this._isAnimationPlaying;
    }

    /**
     * The speed scale at which animations are played.
     */
    @property({ attribute: "animation-speed" })
    public animationSpeed = 1;

    /**
     * The current point on the selected animation timeline, normalized between 0 and 1.
     */
    @property({ attribute: false })
    public animationProgress = 0;

    @state()
    private _animations: string[] = [];

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
    override update(changedProperties: PropertyValues<this>): void {
        super.update(changedProperties);

        if (changedProperties.get("engine")) {
            this._tearDownViewer();
            this._setupViewer();
        } else {
            this._propertyBindings.filter((binding) => changedProperties.has(binding.property)).forEach((binding) => binding.updateViewer());

            if (changedProperties.has("source")) {
                this._updateModel();
            }

            if (changedProperties.has("environment")) {
                this._updateEnv();
            }
        }
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        const showProgressBar = this.loadingProgress !== false;
        // If loadingProgress is true, then the progress bar is indeterminate so the value doesn't matter.
        const progressValue = typeof this.loadingProgress === "boolean" ? 0 : this.loadingProgress * 100;
        const isIndeterminate = this.loadingProgress === true;

        // NOTE: The unnamed 'slot' element holds all child elements of the <babylon-viewer> that do not specify a 'slot' attribute.
        return html`
            <div class="full-size">
                <div id="canvasContainer" class="full-size"></div>
                <slot class="full-size children-slot"></slot>
                <slot name="progress-bar">
                    <div part="progress-bar" class="bar loading-progress-outer ${showProgressBar ? "" : "loading-progress-outer-inactive"}" aria-label="Loading Progress">
                        <div
                            class="loading-progress-inner ${isIndeterminate ? "loading-progress-inner-indeterminate" : ""}"
                            style="${isIndeterminate ? "" : `width: ${progressValue}%`}"
                        ></div>
                    </div>
                </slot>
                ${this._viewerDetails?.model == null || (!this._hasAnimations && !this._hasHotSpots)
                    ? ""
                    : html`
                          <slot name="tool-bar">
                              <div part="tool-bar" class="bar ${this._hasAnimations ? "" : "bar-min"} tool-bar">
                                  ${!this._hasAnimations
                                      ? ""
                                      : html`<div class="animation-timeline">
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
                                                    class="animation-timeline-input"
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.0001"
                                                    .value="${this.animationProgress}"
                                                    @input="${this._onAnimationTimelineChanged}"
                                                    @pointerdown="${this._onAnimationTimelinePointerDown}"
                                                />
                                            </div>
                                            <select aria-label="Select Animation Speed" @change="${this._onAnimationSpeedChanged}">
                                                ${allowedAnimationSpeeds.map(
                                                    (speed) => html`<option value="${speed}" .selected="${this.animationSpeed === speed}">${speed}x</option>`
                                                )}
                                            </select> `}
                                  ${this.animations.length > 1
                                      ? html`<select aria-label="Select Animation" @change="${this._onSelectedAnimationChanged}">
                                            ${this.animations.map((name, index) => html`<option value="${index}" .selected="${this.selectedAnimation === index}">${name}</option>`)}
                                        </select>`
                                      : ""}
                                  ${this._hasAnimations && this._hasHotSpots ? html`<div class="divider"></div>` : ""}
                                  ${this._hasHotSpots
                                      ? html`<div class="select-container">
                                            <select id="hotspotsSelect" aria-label="Select HotSpot" @change="${this._onHotSpotsChanged}">
                                                <option value="" hidden selected></option>
                                                <!-- When the select is forced to be less wide than the options, padding on the right is lost. Pad with white space. -->
                                                ${Object.keys(this.hotSpots).map((name) => html`<option value="${name}">${name}&nbsp;&nbsp;</option>`)}
                                            </select>
                                            <!-- This button is not actually interactive, we want input to pass through to the select below. -->
                                            <button style="pointer-events: none">
                                                <svg viewBox="0 0 20 20">
                                                    <path d="${targetFilledIcon}" fill="currentColor"></path>
                                                </svg>
                                            </button>
                                        </div> `
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
        this.selectedAnimation = Number(selectElement.value);
    }

    private _onAnimationSpeedChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.animationSpeed = Number(selectElement.value);
    }

    private _onAnimationTimelineChanged(event: Event) {
        if (this._viewerDetails) {
            const input = event.target as HTMLInputElement;
            const value = Number(input.value);
            if (value !== this.animationProgress) {
                this._viewerDetails.viewer.animationProgress = value;
            }
        }
    }

    private _onAnimationTimelinePointerDown(event: Event) {
        if (this._viewerDetails?.viewer.isAnimationPlaying) {
            this._viewerDetails.viewer.pauseAnimation();
            const input = event.target as HTMLInputElement;
            input.addEventListener("pointerup", () => this._viewerDetails?.viewer.playAnimation(), { once: true });
        }
    }

    private _onHotSpotsChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        const hotSpotName = selectElement.value;
        // We don't actually want a selected value, this is just a one time trigger.
        selectElement.value = "";
        this.focusHotSpot(hotSpotName);
    }

    // Helper function to simplify keeping Viewer properties in sync with HTML3DElement properties.
    private _createPropertyBinding(
        property: keyof HTML3DElement,
        getObservable: (viewerDetails: Readonly<ViewerDetails>) => Observable<any>,
        updateViewer: (viewerDetails: Readonly<ViewerDetails>) => void,
        updateElement: (viewerDetails: Readonly<ViewerDetails>) => void
    ) {
        return {
            property,
            // Called each time a Viewer instance is created.
            onInitialized: (viewerDetails: Readonly<ViewerDetails>) => {
                getObservable(viewerDetails).add(() => {
                    updateElement(viewerDetails);
                });
                updateViewer(viewerDetails);
            },
            // Called when the HTML3DElement property should be propagated to the Viewer.
            updateViewer: () => {
                if (this._viewerDetails) {
                    updateViewer(this._viewerDetails);
                }
            },
            // Called to re-sync the HTML3DElement property with its corresponding attribute.
            syncToAttribute: () => {
                const descriptor = HTML3DElement.elementProperties.get(property);
                if (descriptor) {
                    if (descriptor.attribute) {
                        const attributeName = descriptor.attribute === true ? property : descriptor.attribute;
                        if (this.hasAttribute(attributeName)) {
                            const attributeValue = this.getAttribute(attributeName);

                            const converter =
                                typeof descriptor.converter === "function"
                                    ? descriptor.converter
                                    : descriptor.converter?.fromAttribute !== undefined
                                      ? descriptor.converter.fromAttribute
                                      : defaultConverter.fromAttribute;

                            (this as any)[property] = converter ? converter(attributeValue, descriptor.type) : attributeValue;
                        }
                    }
                }
            },
        };
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
                canvas.className = "full-size canvas";
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

                            // When attributes are explicitly set, they are re-applied when a new model is loaded.
                            this._propertyBindings.forEach((binding) => binding.syncToAttribute());

                            // The same goes for camera pose attributes, but it is handled a little differently because there are no corresponding public properties
                            // (since the underlying Babylon camera already has these properties).
                            this._cameraOrbitCoercer?.(details.camera);
                            this._cameraTargetCoercer?.(details.camera);

                            // If animation auto play was set, then start the default animation (if possible).
                            if (this.animationAutoPlay) {
                                details.viewer.playAnimation();
                            }

                            this._dispatchCustomEvent("modelchange", (type) => new Event(type));
                        });

                        details.viewer.onModelError.add((error) => {
                            this._animations = [...details.viewer.animations];
                            this._dispatchCustomEvent("modelerror", (type) => new ErrorEvent(type, { error }));
                        });

                        details.viewer.onLoadingProgressChanged.add(() => {
                            this._loadingProgress = details.viewer.loadingProgress;
                            this._dispatchCustomEvent("loadingprogresschange", (type) => new Event(type));
                        });

                        details.viewer.onIsAnimationPlayingChanged.add(() => {
                            this._isAnimationPlaying = details.viewer.isAnimationPlaying ?? false;
                            this._dispatchCustomEvent("animationplayingchange", (type) => new Event(type));
                        });

                        details.viewer.onAnimationProgressChanged.add(() => {
                            this.animationProgress = details.viewer.animationProgress ?? 0;
                            this._dispatchCustomEvent("animationprogresschange", (type) => new Event(type));
                        });

                        details.scene.onAfterRenderCameraObservable.add(() => {
                            this._dispatchCustomEvent("viewerrender", (type) => new Event(type));
                        });

                        this._updateModel();
                        this._updateEnv();

                        this._propertyBindings.forEach((binding) => binding.onInitialized(details));

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

    private async _updateModel() {
        if (this._viewerDetails) {
            try {
                if (this.source) {
                    await this._viewerDetails.viewer.loadModel(this.source, { pluginExtension: this.extension ?? undefined, defaultAnimation: this.selectedAnimation ?? 0 });
                } else {
                    await this._viewerDetails.viewer.resetModel();
                }
            } catch (error) {
                Logger.Log(error);
            }
        }
    }

    private async _updateEnv() {
        if (this._viewerDetails) {
            try {
                if (this.environment) {
                    await this._viewerDetails.viewer.loadEnvironment(this.environment);
                } else {
                    await this._viewerDetails.viewer.resetEnvironment();
                }
            } catch (error) {
                Logger.Log(error);
            }
        }
    }
}
