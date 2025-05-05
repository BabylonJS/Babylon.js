/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Observable } from "core/index";
import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import type { CameraOrbit, EnvironmentOptions, HotSpot, ResetFlag, ToneMapping, ViewerDetails, ViewerHotSpotResult } from "./viewer";
import type { CanvasViewerOptions } from "./viewerFactory";

import { LitElement, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { ref } from "lit/directives/ref.js";

import { Color4 } from "core/Maths/math.color";
import { AsyncLock } from "core/Misc/asyncLock";
import { Deferred } from "core/Misc/deferred";
import { AbortError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";
import { IsToneMapping, Viewer } from "./viewer";
import { CreateViewerForCanvas } from "./viewerFactory";

// Icon SVG is pulled from https://iconcloud.design
const playFilledIcon =
    "M5 5.27368C5 3.56682 6.82609 2.48151 8.32538 3.2973L20.687 10.0235C22.2531 10.8756 22.2531 13.124 20.687 13.9762L8.32538 20.7024C6.82609 21.5181 5 20.4328 5 18.726V5.27368Z";
const pauseFilledIcon =
    "M5.74609 3C4.7796 3 3.99609 3.7835 3.99609 4.75V19.25C3.99609 20.2165 4.7796 21 5.74609 21H9.24609C10.2126 21 10.9961 20.2165 10.9961 19.25V4.75C10.9961 3.7835 10.2126 3 9.24609 3H5.74609ZM14.7461 3C13.7796 3 12.9961 3.7835 12.9961 4.75V19.25C12.9961 20.2165 13.7796 21 14.7461 21H18.2461C19.2126 21 19.9961 20.2165 19.9961 19.25V4.75C19.9961 3.7835 19.2126 3 18.2461 3H14.7461Z";
const arrowResetFilledIcon =
    "M7.20711 2.54289C7.59763 2.93342 7.59763 3.56658 7.20711 3.95711L5.41421 5.75H13.25C17.6683 5.75 21.25 9.33172 21.25 13.75C21.25 18.1683 17.6683 21.75 13.25 21.75C8.83172 21.75 5.25 18.1683 5.25 13.75C5.25 13.1977 5.69772 12.75 6.25 12.75C6.80228 12.75 7.25 13.1977 7.25 13.75C7.25 17.0637 9.93629 19.75 13.25 19.75C16.5637 19.75 19.25 17.0637 19.25 13.75C19.25 10.4363 16.5637 7.75 13.25 7.75H5.41421L7.20711 9.54289C7.59763 9.93342 7.59763 10.5666 7.20711 10.9571C6.81658 11.3476 6.18342 11.3476 5.79289 10.9571L2.29289 7.45711C1.90237 7.06658 1.90237 6.43342 2.29289 6.04289L5.79289 2.54289C6.18342 2.15237 6.81658 2.15237 7.20711 2.54289Z";
const targetFilledIcon =
    "M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14ZM6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z";
const arrowClockwiseFilledIcon =
    "M5 12C5 8.13401 8.13401 5 12 5C13.32 5 14.5542 5.36484 15.608 6H15C14.4477 6 14 6.44772 14 7C14 7.55228 14.4477 8 15 8H18C18.5523 8 19 7.55228 19 7C19 6 19 5 19 4C19 3.44772 18.5523 3 18 3C17.4477 3 17 3.44772 17 4V4.51575C15.5702 3.5588 13.85 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 11.6199 20.9764 11.2448 20.9304 10.8763C20.8621 10.3282 20.3624 9.93935 19.8144 10.0077C19.2663 10.076 18.8775 10.5757 18.9458 11.1237C18.9815 11.4104 19 11.7028 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12Z";

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

type ResetMode = "auto" | "reframe" | [ResetFlag, ...flags: ResetFlag[]];

function coerceEngineAttribute(value: string | null): ViewerElement["engine"] {
    if (value === "WebGL" || value === "WebGPU") {
        return value;
    }
    return undefined;
}

function coerceNumericAttribute(value: string | null): Nullable<number> {
    return value == null ? null : Number(value);
}

function coerceCameraOrbitOrTarget(value: string | null): Nullable<[number, number, number]> {
    if (!value) {
        return null;
    }

    const array = value.trim().split(/\s+/);
    if (array.length !== 3) {
        throw new Error(`Camera orbit and target should be defined as three space separated numbers, but was specified as "${value}".`);
    }

    return array.map((value) => Number(value)) as CameraOrbit;
}

function coerceToneMapping(value: string | null): Nullable<ToneMapping> {
    if (!value || !IsToneMapping(value)) {
        return null;
    }
    return value;
}

function coerceResetMode(value: string | null): ResetMode {
    if (!value || value === "auto") {
        return "auto";
    }

    if (value === "reframe") {
        return "reframe";
    }

    return value.trim().split(/\s+/) as ResetMode;
}

// Custom events for the HTML3DElement.
export interface ViewerElementEventMap extends HTMLElementEventMap {
    viewerready: Event;
    viewerrender: Event;
    environmentchange: Event;
    environmentconfigurationchange: Event;
    environmenterror: ErrorEvent;
    modelchange: CustomEvent<Nullable<string | File | ArrayBufferView>>;
    modelerror: ErrorEvent;
    loadingprogresschange: Event;
    selectedanimationchange: Event;
    animationspeedchange: Event;
    animationplayingchange: Event;
    animationprogresschange: Event;
    selectedmaterialvariantchange: Event;
}

// eslint-disable-next-line jsdoc/require-jsdoc
export interface ViewerElement {
    addEventListener<K extends keyof ViewerElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: ViewerElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;

    removeEventListener<K extends keyof ViewerElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: ViewerElementEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void;

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

/**
 * @experimental
 * Base class for the viewer custom element.
 */
export abstract class ViewerElement<ViewerClass extends Viewer = Viewer> extends LitElement {
    private readonly _viewerLock = new AsyncLock();
    private _animationSliderResizeObserver: Nullable<ResizeObserver> = null;
    private _viewerDetails?: Readonly<ViewerDetails & { viewer: ViewerClass }>;

    /**
     * @experimental
     * Creates an instance of a ViewerElement subclass.
     * @param _viewerClass The Viewer subclass to use when creating the Viewer instance.
     * @param _options The options to use when creating the Viewer and binding it to the specified canvas.
     */
    protected constructor(
        private readonly _viewerClass: new (...args: ConstructorParameters<typeof Viewer>) => ViewerClass,
        private readonly _options: CanvasViewerOptions = {}
    ) {
        super();
    }

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
            (details) => details.viewer.onEnvironmentConfigurationChanged,
            (details) => (details.viewer.environmentConfig = { blur: this.skyboxBlur ?? details.viewer.environmentConfig.blur }),
            (details) => (this.skyboxBlur = details.viewer.environmentConfig.blur)
        ),
        this._createPropertyBinding(
            "environmentIntensity",
            (details) => details.viewer.onEnvironmentConfigurationChanged,
            (details) => (details.viewer.environmentConfig = { intensity: this.environmentIntensity ?? details.viewer.environmentConfig.intensity }),
            (details) => (this.environmentIntensity = details.viewer.environmentConfig.intensity)
        ),
        this._createPropertyBinding(
            "environmentRotation",
            (details) => details.viewer.onEnvironmentConfigurationChanged,
            (details) => (details.viewer.environmentConfig = { rotation: this.environmentRotation ?? details.viewer.environmentConfig.rotation }),
            (details) => (this.environmentRotation = details.viewer.environmentConfig.rotation)
        ),
        this._createPropertyBinding(
            "environmentVisible",
            (details) => details.viewer.onEnvironmentConfigurationChanged,
            (details) => (details.viewer.environmentConfig = { visible: this.environmentVisible ?? details.viewer.environmentConfig.visible }),
            (details) => (this.environmentVisible = details.viewer.environmentConfig.visible)
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
        this._createPropertyBinding(
            "selectedMaterialVariant",
            (details) => details.viewer.onSelectedMaterialVariantChanged,
            (details) => (details.viewer.selectedMaterialVariant = this.selectedMaterialVariant ?? details.viewer.selectedMaterialVariant ?? ""),
            (details) => (this.selectedMaterialVariant = details.viewer.selectedMaterialVariant)
        ),
        this._createPropertyBinding(
            "hotSpots",
            (details) => details.viewer.onHotSpotsChanged,
            (details) => (details.viewer.hotSpots = this.hotSpots ?? details.viewer.hotSpots),
            (details) => (this.hotSpots = details.viewer.hotSpots)
        ),
        this._createPropertyBinding(
            "camerasAsHotSpots",
            (details) => details.viewer.onCamerasAsHotSpotsChanged,
            (details) => (details.viewer.camerasAsHotSpots = this.camerasAsHotSpots ?? details.viewer.camerasAsHotSpots),
            (details) => (this.camerasAsHotSpots = details.viewer.camerasAsHotSpots)
        ),
    ] as const;

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static override get observedAttributes(): string[] {
        // These attributes don't have corresponding properties, so they are managed directly.
        return [...super.observedAttributes, "camera-orbit", "camera-target"];
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static override styles: CSSResultGroup = css`
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

        .reload-button {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 25%;
            transform: translate(-50%, -50%);
            color: var(--ui-foreground-color);
            background-color: var(--ui-background-color);
            border: 1px solid transparent;
            border-radius: 24px;
            padding: 0;
            cursor: pointer;
            outline: none;
        }

        .reload-button:hover {
            background-color: var(--ui-background-color-hover);
        }

        .bar {
            position: absolute;
            width: calc(100% - 24px);
            min-width: 370px;
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
        if (this._viewerDetails) {
            return this._viewerDetails.viewer.queryHotSpot(name, result);
        }
        return false;
    }

    /**
     * Updates the camera to focus on a named hotspot.
     * @param name The name of the hotspot to focus on.
     * @returns true if the hotspot was found and the camera was updated, false otherwise.
     */
    public focusHotSpot(name: string): boolean {
        if (this._viewerDetails) {
            return this._viewerDetails.viewer.focusHotSpot(name);
        }
        return false;
    }

    @state()
    private _isFaultedBacking = false;

    protected get _isFaulted() {
        return this._isFaultedBacking;
    }

    /**
     * The engine to use for rendering.
     */
    @property({ converter: coerceEngineAttribute })
    public engine: CanvasViewerOptions["engine"] = this._options.engine;

    /**
     * When true, the scene will be rendered even if no scene state has changed.
     */
    @property({ attribute: "render-when-idle", type: Boolean })
    public renderWhenIdle: boolean = this._options.autoSuspendRendering === false;

    /**
     * The model URL.
     */
    @property()
    public source: Nullable<string> = this._options.source ?? null;

    /**
     * Forces the model to be loaded with the specified extension.
     * @remarks
     * If this property is not set, the extension will be inferred from the model URL when possible.
     */
    @property()
    public extension: Nullable<string> = null;

    /**
     * The texture URLs used for lighting and skybox. Setting this property will set both environmentLighting and environmentSkybox.
     */
    @property({
        hasChanged: (newValue: ViewerElement["environment"], oldValue: ViewerElement["environment"]) => {
            return newValue.lighting !== oldValue.lighting || newValue.skybox !== oldValue.skybox;
        },
    })
    public get environment(): { lighting: Nullable<string>; skybox: Nullable<string> } {
        return { lighting: this.environmentLighting, skybox: this.environmentSkybox };
    }
    public set environment(url: string) {
        this.environmentLighting = url || null;
        this.environmentSkybox = url || null;
    }

    /**
     * The texture URL for lighting.
     */
    @property({ attribute: "environment-lighting" })
    public environmentLighting: Nullable<string> = this._options.environmentLighting ?? null;

    /**
     * The texture URL for the skybox.
     */
    @property({ attribute: "environment-skybox" })
    public environmentSkybox: Nullable<string> = this._options.environmentSkybox ?? null;

    /**
     * A value between 0 and 2 that specifies the intensity of the environment lighting.
     */
    @property({ type: Number, attribute: "environment-intensity" })
    public environmentIntensity: Nullable<number> = this._options.environmentConfig?.intensity ?? null;

    /**
     * A value in radians that specifies the rotation of the environment.
     */
    @property({
        type: Number,
        attribute: "environment-rotation",
    })
    public environmentRotation: Nullable<number> = this._options.environmentConfig?.rotation ?? null;

    /**
     * Wether or not the environment is visible.
     */
    @property({
        attribute: "environment-visible",
    })
    public environmentVisible: Nullable<boolean> = this._options.environmentConfig?.visible ?? null;

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
    public skyboxBlur: Nullable<number> = this._options.environmentConfig?.blur ?? null;

    /**
     * The tone mapping to use for rendering the scene.
     */
    @property({
        attribute: "tone-mapping",
        converter: (value: string | null): ToneMapping => {
            if (!value || !IsToneMapping(value)) {
                return "neutral";
            }
            return value;
        },
    })
    public toneMapping: Nullable<ToneMapping> = this._options.postProcessing?.toneMapping ?? null;

    /**
     * The contrast applied to the scene.
     */
    @property()
    public contrast: Nullable<number> = this._options.postProcessing?.contrast ?? null;

    /**
     * The exposure applied to the scene.
     */
    @property()
    public exposure: Nullable<number> = this._options.postProcessing?.exposure ?? null;

    /**
     * The clear color (e.g. background color) for the viewer.
     */
    @property({
        attribute: "clear-color",
        converter: {
            fromAttribute: parseColor,
            toAttribute: (color: Nullable<Color4>) => (color ? color.toHexString() : null),
        },
    })
    public clearColor: Nullable<Color4> = this._options.clearColor
        ? new Color4(this._options.clearColor[0], this._options.clearColor[1], this._options.clearColor[2], this._options.clearColor[3] ?? 1)
        : null;

    /**
     * Enables or disables camera auto-orbit.
     */
    @property({
        attribute: "camera-auto-orbit",
        type: Boolean,
    })
    public cameraAutoOrbit = this._options.cameraAutoOrbit?.enabled ?? false;

    /**
     * The speed at which the camera auto-orbits around the target.
     */
    @property({
        attribute: "camera-auto-orbit-speed",
        type: Number,
    })
    public cameraAutoOrbitSpeed: Nullable<number> = this._options.cameraAutoOrbit?.speed ?? null;

    /**
     * The delay in milliseconds before the camera starts auto-orbiting.
     */
    @property({
        attribute: "camera-auto-orbit-delay",
        type: Number,
    })
    public cameraAutoOrbitDelay: Nullable<number> = this._options.cameraAutoOrbit?.delay ?? null;

    /**
     * The set of defined hot spots.
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
    public hotSpots: Record<string, HotSpot> = this._options.hotSpots ?? {};

    /**
     * @experimental
     * True if the viewer has any hotspots.
     */
    protected get _hasHotSpots(): boolean {
        return Object.keys(this.hotSpots).length > 0;
    }

    /**
     * True if the default animation should play automatically when a model is loaded.
     */
    @property({ attribute: "animation-auto-play", type: Boolean })
    public animationAutoPlay: boolean = !!this._options.animationAutoPlay;

    /**
     * The list of animation names for the currently loaded model.
     */
    public get animations(): readonly string[] {
        return this._animations;
    }

    /**
     * @experimental
     * True if the loaded model has any animations.
     */
    protected get _hasAnimations(): boolean {
        return this._animations.length > 0;
    }

    /**
     * The currently selected animation index.
     */
    @property({ attribute: "selected-animation", type: Number })
    public selectedAnimation: Nullable<number> = this._options.selectedAnimation ?? null;

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
    public animationSpeed = this._options.animationSpeed ?? 1;

    /**
     * The current point on the selected animation timeline, normalized between 0 and 1.
     */
    @property({ attribute: false })
    public animationProgress = 0;

    @state()
    private _animations: readonly string[] = [];

    @state()
    private _isAnimationPlaying = false;

    @state()
    private _showAnimationSlider = true;

    /**
     * The list of material variants for the currently loaded model.
     */
    public get materialVariants(): readonly string[] {
        return this._viewerDetails?.viewer.materialVariants ?? [];
    }

    /**
     * The currently selected material variant.
     */
    @property({ attribute: "material-variant" })
    public selectedMaterialVariant: Nullable<string> = this._options.selectedMaterialVariant ?? null;

    /**
     * True if scene cameras should be used as hotspots.
     */
    @property({ attribute: "cameras-as-hotspots", type: Boolean })
    public camerasAsHotSpots = false;

    /**
     * Determines the behavior of the reset function, and the associated default reset button.
     * @remarks
     * - "auto" - Resets the camera to the initial pose if it makes sense given other viewer state, such as the selected animation.
     * - "reframe" - Reframes the camera based on the current viewer state (ignores the initial pose).
     * - [ResetFlag] - A space separated list of reset flags that reset various aspects of the viewer state.
     */
    @property({ attribute: "reset-mode", converter: coerceResetMode })
    public resetMode: ResetMode = "auto";

    @query("#canvasContainer")
    private _canvasContainer: HTMLDivElement | undefined;

    @query("#hotSpotSelect")
    private _hotSpotSelect: HTMLSelectElement | undefined;

    /**
     * Toggles the play/pause animation state if there is a selected animation.
     */
    public toggleAnimation() {
        this._viewerDetails?.viewer.toggleAnimation();
    }

    /**
     * Resets the Viewer state based on the @see resetMode property.
     */
    public reset() {
        this._reset(this.resetMode);
    }

    private _reset(mode: ResetMode) {
        switch (mode) {
            case "auto":
                this._viewerDetails?.viewer.resetCamera(undefined);
                break;
            case "reframe":
                this._viewerDetails?.viewer.resetCamera(true);
                break;
            default:
                this._viewerDetails?.viewer.reset(...mode);
                break;
        }
    }

    /**
     * Resets the camera to its initial pose.
     */
    public resetCamera() {
        this._reset("reframe");
    }

    /**
     * Reloads the viewer. This is typically only needed when the viewer is in a faulted state (e.g. due to the context being lost).
     */
    public reload() {
        this._tearDownViewer();
        this._setupViewer();
    }

    /** @internal */
    public override connectedCallback(): void {
        super.connectedCallback();
        this._setupViewer();
    }

    /** @internal */
    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        // this._tearDownViewer();
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        super.attributeChangedCallback(name, oldValue, newValue);

        if (this.hasUpdated) {
            if (name == "camera-orbit") {
                const value = coerceCameraOrbitOrTarget(newValue);
                if (value) {
                    this._viewerDetails?.viewer.updateCamera({ alpha: value[0], beta: value[1], radius: value[2] });
                } else {
                    this._viewerDetails?.viewer.resetCamera(false);
                }
            } else if (name == "camera-target") {
                const value = coerceCameraOrbitOrTarget(newValue);
                if (value) {
                    this._viewerDetails?.viewer.updateCamera({ targetX: value[0], targetY: value[1], targetZ: value[2] });
                } else {
                    this._viewerDetails?.viewer.resetCamera(false);
                }
            }
        }
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override update(changedProperties: PropertyValues<this>): void {
        super.update(changedProperties);

        if (this._hotSpotSelect) {
            this._hotSpotSelect.value = "";
        }

        let needsReload = false;
        if (changedProperties.get("renderWhenIdle") != null) {
            needsReload = true;
        } else if (changedProperties.has("engine")) {
            const previous = changedProperties.get("engine");
            if (previous && this.engine !== previous) {
                needsReload = true;
            }
        }

        if (needsReload) {
            this._tearDownViewer();
            this._setupViewer();
        } else {
            this._propertyBindings.filter((binding) => changedProperties.has(binding.property)).forEach((binding) => binding.updateViewer());

            if (changedProperties.has("source")) {
                this._updateModel();
            }

            if (changedProperties.has("environmentLighting") || changedProperties.has("environmentSkybox")) {
                this._updateEnv({
                    lighting: changedProperties.has("environmentLighting"),
                    skybox: changedProperties.has("environmentSkybox"),
                });
            }
        }
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override render() {
        return html`
            <div class="full-size">
                <div id="canvasContainer" class="full-size"></div>
                ${this._renderOverlay()}
            </div>
        `;
    }

    /**
     * @experimental
     * Renders the progress bar.
     * @returns The template result for the progress bar.
     */
    protected _renderProgressBar(): TemplateResult {
        const showProgressBar = this.loadingProgress !== false;
        // If loadingProgress is true, then the progress bar is indeterminate so the value doesn't matter.
        const progressValue = typeof this.loadingProgress === "boolean" ? 0 : this.loadingProgress * 100;
        const isIndeterminate = this.loadingProgress === true;

        return html`
            <div part="progress-bar" class="bar loading-progress-outer ${showProgressBar ? "" : "loading-progress-outer-inactive"}" aria-label="Loading Progress">
                <div
                    class="loading-progress-inner ${isIndeterminate ? "loading-progress-inner-indeterminate" : ""}"
                    style="${isIndeterminate ? "" : `width: ${progressValue}%`}"
                ></div>
            </div>
        `;
    }

    /**
     * @experimental
     * Renders the toolbar.
     * @returns The template result for the toolbar.
     */
    protected _renderToolbar(): TemplateResult {
        let toolbarControls: TemplateResult[] = [];
        if (this._viewerDetails?.model != null) {
            // If the model has animations, add animation controls.
            if (this._hasAnimations) {
                toolbarControls.push(html`
                    <div class="animation-timeline">
                        <button aria-label="${this.isAnimationPlaying ? "Pause" : "Play"}" @click="${this.toggleAnimation}">
                            ${!this.isAnimationPlaying
                                ? html`
                                      <svg viewBox="0 0 24 24">
                                          <path d="${playFilledIcon}" fill="currentColor"></path>
                                      </svg>
                                  `
                                : html`
                                      <svg viewBox="0 0 24 24">
                                          <path d="${pauseFilledIcon}" fill="currentColor"></path>
                                      </svg>
                                  `}
                        </button>
                        <input
                            ${ref(this._onAnimationSliderChanged)}
                            aria-label="Animation Progress"
                            class="animation-timeline-input"
                            style="${this._showAnimationSlider ? "" : "visibility: hidden"}"
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
                        ${allowedAnimationSpeeds.map((speed) => html`<option value="${speed}" .selected="${this.animationSpeed === speed}">${speed}x</option> `)}
                    </select>
                    ${this.animations.length > 1
                        ? html`<select aria-label="Select Animation" @change="${this._onSelectedAnimationChanged}">
                              ${this.animations.map((name, index) => html`<option value="${index}" .selected="${this.selectedAnimation === index}">${name}</option>`)}
                          </select>`
                        : ""}
                `);
            }

            // If the model has material variants, add material variant controls.
            if (this.materialVariants.length > 1) {
                toolbarControls.push(html`
                    <select aria-label="Select Material Variant" @change="${this._onMaterialVariantChanged}">
                        ${this.materialVariants.map((name) => html`<option value="${name}" .selected="${this.selectedMaterialVariant === name}">${name}</option>`)}
                    </select>
                `);
            }

            // Always include a button to reset the camera pose.
            toolbarControls.push(html`
                <button aria-label="Reset Camera Pose" @click="${this.reset}">
                    <svg viewBox="0 0 24 24">
                        <path d="${arrowResetFilledIcon}" fill="currentColor"></path>
                    </svg>
                </button>
            `);

            // If hotspots have been defined, add hotspot controls.
            if (this._hasHotSpots) {
                toolbarControls.push(html`
                    <div class="select-container">
                        <select id="hotSpotSelect" aria-label="Select HotSpot" @change="${this._onHotSpotsChanged}">
                            <!-- When the select is forced to be less wide than the options, padding on the right is lost. Pad with white space. -->
                            ${Object.keys(this.hotSpots).map((name) => html`<option value="${name}">${name}&nbsp;&nbsp;</option>`)}
                        </select>
                        <!-- This button is not actually interactive, we want input to pass through to the select below. -->
                        <button style="pointer-events: none">
                            <svg viewBox="0 0 24 24">
                                <path d="${targetFilledIcon}" fill="currentColor"></path>
                            </svg>
                        </button>
                    </div>
                `);
            }

            // Add a vertical divider between each toolbar control.
            const controlCount = toolbarControls.length;
            const separator = html`<div class="divider"></div>`;
            toolbarControls = toolbarControls.reduce((toolbarControls, toolbarControl, index) => {
                if (index < controlCount - 1) {
                    return [...toolbarControls, toolbarControl, separator];
                } else {
                    return [...toolbarControls, toolbarControl];
                }
            }, new Array<TemplateResult>());
        }

        if (toolbarControls.length > 0) {
            return html` <div part="tool-bar" class="bar ${this._hasAnimations ? "" : "bar-min"} tool-bar">${toolbarControls}</div>`;
        } else {
            return html``;
        }
    }

    /**
     * @experimental
     * Renders the reload button.
     * @returns The template result for the reload button.
     */
    protected _renderReloadButton(): TemplateResult {
        return html`${this._isFaulted
            ? html`
                  <button aria-label="Reload" part="reload-button" class="reload-button" @click="${this.reload}">
                      <svg viewBox="0 0 24 24">
                          <path d="${arrowClockwiseFilledIcon}" fill="currentColor"></path>
                      </svg>
                  </button>
              `
            : ""}`;
    }

    /**
     * @experimental
     * Renders UI elements that overlay the viewer.
     * Override this method to provide additional rendering for the component.
     * @returns TemplateResult The rendered template result.
     */
    protected _renderOverlay(): TemplateResult {
        // NOTE: The unnamed 'slot' element holds all child elements of the <babylon-viewer> that do not specify a 'slot' attribute.
        return html`
            <slot class="full-size children-slot"></slot>
            <slot name="progress-bar">${this._renderProgressBar()}</slot>
            <slot name="tool-bar">${this._renderToolbar()}</slot>
            <slot name="reload-button">${this._renderReloadButton()}</slot>
        `;
    }

    /**
     * @experimental
     * Dispatches a custom event.
     * @param type The type of the event.
     * @param event A function that creates the event.
     */
    protected _dispatchCustomEvent<TEvent extends keyof ViewerElementEventMap>(type: TEvent, event: (type: TEvent) => ViewerElementEventMap[TEvent]) {
        this.dispatchEvent(event(type));
    }

    /**
     * @experimental
     * Handles changes to the selected animation.
     * @param event The change event.
     */
    protected _onSelectedAnimationChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedAnimation = Number(selectElement.value);
    }

    /**
     * @experimental
     * Handles changes to the animation speed.
     * @param event The change event.
     */
    protected _onAnimationSpeedChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.animationSpeed = Number(selectElement.value);
    }

    /**
     * @experimental
     * Handles changes to the animation timeline.
     * @param event The change event.
     */
    protected _onAnimationTimelineChanged(event: Event) {
        if (this._viewerDetails) {
            const input = event.target as HTMLInputElement;
            const value = Number(input.value);
            if (value !== this.animationProgress) {
                this._viewerDetails.viewer.animationProgress = value;
            }
        }
    }

    /**
     * @experimental
     * Handles pointer down events on the animation timeline.
     * @param event The pointer down event.
     */
    protected _onAnimationTimelinePointerDown(event: Event) {
        if (this._viewerDetails?.viewer.isAnimationPlaying) {
            this._viewerDetails.viewer.pauseAnimation();
            const input = event.target as HTMLInputElement;
            input.addEventListener("pointerup", () => this._viewerDetails?.viewer.playAnimation(), { once: true });
        }
    }

    /**
     * @experimental
     * Handles changes to the selected material variant.
     * @param event The change event.
     */
    protected _onMaterialVariantChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedMaterialVariant = selectElement.value;
    }

    /**
     * @experimental
     * Handles changes to the hot spot list.
     * @param event The change event.
     */
    protected _onHotSpotsChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        const hotSpotName = selectElement.value;
        // We don't actually want a selected value, this is just a one time trigger.
        selectElement.value = "";
        this.focusHotSpot(hotSpotName);
    }

    private _onAnimationSliderChanged(element?: Element) {
        this._animationSliderResizeObserver?.disconnect();
        if (element) {
            this._animationSliderResizeObserver = new ResizeObserver(() => {
                this._showAnimationSlider = element.clientWidth >= 80;
            });
            this._animationSliderResizeObserver.observe(element);
        }
    }

    // Helper function to simplify keeping Viewer properties in sync with HTML3DElement properties.
    private _createPropertyBinding(
        property: keyof ViewerElement,
        getObservable: (viewerDetails: NonNullable<this["viewerDetails"]>) => Observable<any>,
        updateViewer: (viewerDetails: NonNullable<this["viewerDetails"]>) => void,
        updateElement: (viewerDetails: NonNullable<this["viewerDetails"]>) => void
    ) {
        return {
            property,
            // Called each time a Viewer instance is created.
            onInitialized: (viewerDetails: NonNullable<this["viewerDetails"]>) => {
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

                {
                    const detailsDeferred = new Deferred<ViewerDetails>();
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    const viewerElement = this;
                    const viewer = await this._createViewer(canvas, {
                        get engine() {
                            return viewerElement.engine ?? viewerElement._options.engine;
                        },
                        get autoSuspendRendering() {
                            return !(viewerElement.hasAttribute("render-when-idle") || viewerElement._options.autoSuspendRendering === false);
                        },
                        get source() {
                            return viewerElement.getAttribute("source") ?? viewerElement._options.source;
                        },
                        get environmentLighting() {
                            return viewerElement.getAttribute("environment-lighting") ?? viewerElement.getAttribute("environment") ?? viewerElement._options.environmentLighting;
                        },
                        get environmentSkybox() {
                            return viewerElement.getAttribute("environment-skybox") ?? viewerElement.getAttribute("environment") ?? viewerElement._options.environmentSkybox;
                        },
                        get environmentConfig() {
                            return {
                                intensity: coerceNumericAttribute(viewerElement.getAttribute("environment-intensity")) ?? viewerElement._options.environmentConfig?.intensity,
                                blur: coerceNumericAttribute(viewerElement.getAttribute("skybox-blur")) ?? viewerElement._options.environmentConfig?.blur,
                                rotation: coerceNumericAttribute(viewerElement.getAttribute("environment-rotation")) ?? viewerElement._options.environmentConfig?.rotation,
                                visible: viewerElement.hasAttribute("environment-visible") || viewerElement._options.environmentConfig?.visible,
                            };
                        },
                        get cameraOrbit() {
                            return coerceCameraOrbitOrTarget(viewerElement.getAttribute("camera-orbit")) ?? viewerElement._options.cameraOrbit;
                        },
                        get cameraTarget() {
                            return coerceCameraOrbitOrTarget(viewerElement.getAttribute("camera-target")) ?? viewerElement._options.cameraTarget;
                        },
                        get cameraAutoOrbit() {
                            return {
                                enabled: viewerElement.hasAttribute("camera-auto-orbit") || viewerElement._options.cameraAutoOrbit?.enabled,
                                speed: coerceNumericAttribute(viewerElement.getAttribute("camera-auto-orbit-speed")) ?? viewerElement._options.cameraAutoOrbit?.speed,
                                delay: coerceNumericAttribute(viewerElement.getAttribute("camera-auto-orbit-delay")) ?? viewerElement._options.cameraAutoOrbit?.delay,
                            };
                        },
                        get animationAutoPlay() {
                            return viewerElement.hasAttribute("animation-auto-play") || viewerElement._options.animationAutoPlay;
                        },
                        get animationSpeed() {
                            return coerceNumericAttribute(viewerElement.getAttribute("animation-speed")) ?? viewerElement._options.animationSpeed;
                        },
                        get selectedAnimation() {
                            return coerceNumericAttribute(viewerElement.getAttribute("selected-animation")) ?? viewerElement._options.selectedAnimation;
                        },
                        get postProcessing() {
                            return {
                                toneMapping: coerceToneMapping(viewerElement.getAttribute("tone-mapping")) ?? viewerElement._options.postProcessing?.toneMapping,
                                contrast: coerceNumericAttribute(viewerElement.getAttribute("contrast")) ?? viewerElement._options.postProcessing?.contrast,
                                exposure: coerceNumericAttribute(viewerElement.getAttribute("exposure")) ?? viewerElement._options.postProcessing?.exposure,
                            };
                        },
                        get selectedMaterialVariant() {
                            return viewerElement.getAttribute("material-variant") ?? viewerElement._options.selectedMaterialVariant;
                        },
                        onInitialized: (details) => {
                            detailsDeferred.resolve(details);
                        },
                        onFaulted: () => {
                            this._isFaultedBacking = true;
                            this._tearDownViewer();
                        },
                    });
                    const details = await detailsDeferred.promise;

                    this._viewerDetails = Object.assign(details, { viewer });
                }

                const details = this._viewerDetails;

                details.viewer.onEnvironmentChanged.add(() => {
                    this._dispatchCustomEvent("environmentchange", (type) => new Event(type));
                });

                details.viewer.onEnvironmentConfigurationChanged.add(() => {
                    this._dispatchCustomEvent("environmentconfigurationchange", (type) => new Event(type));
                });

                details.viewer.onEnvironmentError.add((error) => {
                    this._dispatchCustomEvent("environmenterror", (type) => new ErrorEvent(type, { error }));
                });

                details.viewer.onModelChanged.add((source) => {
                    this._animations = [...details.viewer.animations];
                    this._dispatchCustomEvent("modelchange", (type) => new CustomEvent(type, { detail: source }));
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
                this._updateEnv({ lighting: true, skybox: true });

                this._propertyBindings.forEach((binding) => binding.onInitialized(details));

                this._dispatchCustomEvent("viewerready", (type) => new Event(type));
            }

            this._isFaultedBacking = false;
        });
    }

    /**
     * @experimental
     * Creates a viewer for the specified canvas.
     * @param canvas The canvas to create the viewer for.
     * @param options The options to use for the viewer.
     * @returns The created viewer.
     */
    protected async _createViewer(canvas: HTMLCanvasElement, options: CanvasViewerOptions): Promise<ViewerClass> {
        return CreateViewerForCanvas(canvas, Object.assign(options, { viewerClass: this._viewerClass }));
    }

    private async _tearDownViewer() {
        await this._viewerLock.lockAsync(async () => {
            if (this._viewerDetails) {
                this._viewerDetails.viewer.dispose();
                this._viewerDetails = undefined;
            }

            this._loadingProgress = false;

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
                    await this._viewerDetails.viewer.loadModel(this.source, {
                        pluginExtension: this.extension ?? undefined,
                    });
                } else {
                    await this._viewerDetails.viewer.resetModel();
                }
            } catch (error) {
                // If loadModel was aborted (e.g. because a new model load was requested before this one finished), we can just ignore the error.
                if (!(error instanceof AbortError)) {
                    Logger.Error(error);
                }
            }
        }
    }

    private async _updateEnv(options: EnvironmentOptions) {
        if (this._viewerDetails) {
            try {
                const updates: [url: Nullable<string>, options: EnvironmentOptions][] = [];

                if (options.lighting && options.skybox && this.environmentLighting === this.environmentSkybox) {
                    updates.push([this.environmentLighting, { lighting: true, skybox: true }]);
                } else {
                    if (options.lighting) {
                        updates.push([this.environmentLighting, { lighting: true }]);
                    }
                    if (options.skybox) {
                        updates.push([this.environmentSkybox, { skybox: true }]);
                    }
                }

                const promises = updates.map(async ([url, options]) => {
                    if (url) {
                        await this._viewerDetails?.viewer.loadEnvironment(url, options);
                    } else {
                        await this._viewerDetails?.viewer.resetEnvironment(options);
                    }
                });

                await Promise.all(promises);
            } catch (error) {
                // If loadEnvironment was aborted (e.g. because a new environment load was requested before this one finished), we can just ignore the error.
                if (!(error instanceof AbortError)) {
                    Logger.Error(error);
                }
            }
        }
    }
}

/**
 * Displays a 3D model using the Babylon.js Viewer.
 */
@customElement("babylon-viewer")
export class HTML3DElement extends ViewerElement {
    /**
     * Creates a new HTML3DElement.
     * @param options The options to use for the viewer. This is optional, and is only used when programmatically creating a viewer element.
     */
    public constructor(options?: CanvasViewerOptions) {
        super(Viewer, options);
    }
}

/**
 * Creates a custom HTML element that creates an HTML3DElement with the specified name and configuration.
 * @param elementName The name of the custom element.
 * @param options The options to use for the viewer.
 */
export function ConfigureCustomViewerElement(elementName: string, options: CanvasViewerOptions) {
    customElements.define(
        elementName,
        // eslint-disable-next-line jsdoc/require-jsdoc
        class extends HTML3DElement {
            public constructor() {
                super(options);
            }
        }
    );
}
