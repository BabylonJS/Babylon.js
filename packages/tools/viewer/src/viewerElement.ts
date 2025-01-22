// eslint-disable-next-line import/no-internal-modules
import type { ArcRotateCamera, Nullable, Observable } from "core/index";

import type { CSSResultGroup, PropertyValues, TemplateResult } from "lit";
import type { EnvironmentOptions, ToneMapping, ViewerDetails, ViewerHotSpotQuery } from "./viewer";
import type { CanvasViewerOptions } from "./viewerFactory";

import { LitElement, css, defaultConverter, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import { Color4 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { AsyncLock } from "core/Misc/asyncLock";
import { Deferred } from "core/Misc/deferred";
import { AbortError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";
import { isToneMapping, Viewer, ViewerHotSpotResult } from "./viewer";
import { createViewerForCanvas, getDefaultEngine } from "./viewerFactory";

// Icon SVG is pulled from https://iconcloud.design
const playFilledIcon =
    "M5 5.27368C5 3.56682 6.82609 2.48151 8.32538 3.2973L20.687 10.0235C22.2531 10.8756 22.2531 13.124 20.687 13.9762L8.32538 20.7024C6.82609 21.5181 5 20.4328 5 18.726V5.27368Z";
const pauseFilledIcon =
    "M5.74609 3C4.7796 3 3.99609 3.7835 3.99609 4.75V19.25C3.99609 20.2165 4.7796 21 5.74609 21H9.24609C10.2126 21 10.9961 20.2165 10.9961 19.25V4.75C10.9961 3.7835 10.2126 3 9.24609 3H5.74609ZM14.7461 3C13.7796 3 12.9961 3.7835 12.9961 4.75V19.25C12.9961 20.2165 13.7796 21 14.7461 21H18.2461C19.2126 21 19.9961 20.2165 19.9961 19.25V4.75C19.9961 3.7835 19.2126 3 18.2461 3H14.7461Z";
const arrowResetFilledIcon =
    "M7.20711 2.54289C7.59763 2.93342 7.59763 3.56658 7.20711 3.95711L5.41421 5.75H13.25C17.6683 5.75 21.25 9.33172 21.25 13.75C21.25 18.1683 17.6683 21.75 13.25 21.75C8.83172 21.75 5.25 18.1683 5.25 13.75C5.25 13.1977 5.69772 12.75 6.25 12.75C6.80228 12.75 7.25 13.1977 7.25 13.75C7.25 17.0637 9.93629 19.75 13.25 19.75C16.5637 19.75 19.25 17.0637 19.25 13.75C19.25 10.4363 16.5637 7.75 13.25 7.75H5.41421L7.20711 9.54289C7.59763 9.93342 7.59763 10.5666 7.20711 10.9571C6.81658 11.3476 6.18342 11.3476 5.79289 10.9571L2.29289 7.45711C1.90237 7.06658 1.90237 6.43342 2.29289 6.04289L5.79289 2.54289C6.18342 2.15237 6.81658 2.15237 7.20711 2.54289Z";
const targetFilledIcon =
    "M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14ZM6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z";

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

export type HotSpot = ViewerHotSpotQuery & {
    /**
     * An optional camera pose to associate with the hotspot.
     */
    cameraOrbit?: [alpha: number, beta: number, radius: number];
};

// Custom events for the HTML3DElement.
export interface ViewerElementEventMap extends HTMLElementEventMap {
    viewerready: Event;
    viewerrender: Event;
    environmentchange: Event;
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

/**
 * Base class for the viewer custom element.
 */
export abstract class ViewerElement<ViewerClass extends Viewer = Viewer> extends LitElement {
    private readonly _viewerLock = new AsyncLock();
    private _viewerDetails?: Readonly<ViewerDetails & { viewer: ViewerClass }>;

    protected constructor(private readonly _viewerClass: new (...args: ConstructorParameters<typeof Viewer>) => ViewerClass) {
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
    ] as const;

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
            this._viewerDetails.viewer.pauseAnimation();
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
    @property({
        converter: (value: string | null): ViewerElement["engine"] => {
            if (value === "WebGL" || value === "WebGPU") {
                return value;
            }
            return getDefaultEngine();
        },
    })
    public engine: NonNullable<CanvasViewerOptions["engine"]> = getDefaultEngine();

    /**
     * The model URL.
     */
    @property()
    public source: Nullable<string> = null;

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
        this.environmentLighting = url;
        this.environmentSkybox = url;
    }

    /**
     * The texture URL for lighting.
     */
    @property({ attribute: "environment-lighting" })
    public environmentLighting: Nullable<string> = null;

    /**
     * The texture URL for the skybox.
     */
    @property({ attribute: "environment-skybox" })
    public environmentSkybox: Nullable<string> = null;

    /**
     * A value between 0 and 2 that specifies the intensity of the environment lighting.
     */
    @property({ type: Number, attribute: "environment-intensity" })
    public environmentIntensity: Nullable<number> = null;

    /**
     * A value in degrees that specifies the rotation of the environment.
     */
    @property({
        type: Number,
        attribute: "environment-rotation",
    })
    public environmentRotation: Nullable<number> = null;

    /**
     * Wether or not the environment is visible.
     */
    @property({
        attribute: "environment-visible",
    })
    public environmentVisible: Nullable<boolean> = null;

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
    private _animations: readonly string[] = [];

    @state()
    private _isAnimationPlaying = false;

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
    public selectedMaterialVariant: Nullable<string> = null;

    @query("#canvasContainer")
    private _canvasContainer: HTMLDivElement | undefined;

    @query("#materialSelect")
    private _materialSelect: HTMLSelectElement | undefined;

    /**
     * Toggles the play/pause animation state if there is a selected animation.
     */
    public toggleAnimation() {
        this._viewerDetails?.viewer.toggleAnimation();
    }

    /**
     * Resets the camera to its initial pose.
     */
    public resetCamera() {
        this._viewerDetails?.viewer.resetCamera();
    }

    /** @internal */
    public override connectedCallback(): void {
        super.connectedCallback();
        this._setupViewer();
    }

    /** @internal */
    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this._tearDownViewer();
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected override update(changedProperties: PropertyValues<this>): void {
        super.update(changedProperties);

        if (this._materialSelect) {
            this._materialSelect.value = "";
        }

        if (changedProperties.get("engine")) {
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
        const showProgressBar = this.loadingProgress !== false;
        // If loadingProgress is true, then the progress bar is indeterminate so the value doesn't matter.
        const progressValue = typeof this.loadingProgress === "boolean" ? 0 : this.loadingProgress * 100;
        const isIndeterminate = this.loadingProgress === true;

        const progressBar = html`
            <div part="progress-bar" class="bar loading-progress-outer ${showProgressBar ? "" : "loading-progress-outer-inactive"}" aria-label="Loading Progress">
                <div
                    class="loading-progress-inner ${isIndeterminate ? "loading-progress-inner-indeterminate" : ""}"
                    style="${isIndeterminate ? "" : `width: ${progressValue}%`}"
                ></div>
            </div>
        `;

        // Setup the list of toolbar controls.
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
                <button aria-label="Reset Camera Pose" @click="${this.resetCamera}">
                    <svg viewBox="0 0 24 24">
                        <path d="${arrowResetFilledIcon}" fill="currentColor"></path>
                    </svg>
                </button>
            `);

            // If hotspots have been defined, add hotspot controls.
            if (this._hasHotSpots) {
                toolbarControls.push(html`
                    <div class="select-container">
                        <select id="materialSelect" aria-label="Select HotSpot" @change="${this._onHotSpotsChanged}">
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

        // NOTE: The unnamed 'slot' element holds all child elements of the <babylon-viewer> that do not specify a 'slot' attribute.
        return html`
            <div class="full-size">
                <div id="canvasContainer" class="full-size"></div>
                <slot class="full-size children-slot"></slot>
                <slot name="progress-bar"> ${progressBar}</slot>
                ${toolbarControls.length === 0
                    ? ""
                    : html`
                          <slot name="tool-bar">
                              <div part="tool-bar" class="bar ${this._hasAnimations ? "" : "bar-min"} tool-bar">${toolbarControls}</div>
                          </slot>
                      `}
            </div>
        `;
    }

    // eslint-disable-next-line babylonjs/available
    override addEventListener<K extends keyof ViewerElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: ViewerElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    override addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        super.addEventListener(type as string, listener as EventListenerOrEventListenerObject, options as boolean | AddEventListenerOptions);
    }

    protected _dispatchCustomEvent<TEvent extends keyof ViewerElementEventMap>(type: TEvent, event: (type: TEvent) => ViewerElementEventMap[TEvent]) {
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

    private _onMaterialVariantChanged(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        this.selectedMaterialVariant = selectElement.value;
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
            // Called to re-sync the HTML3DElement property with its corresponding attribute.
            syncToAttribute: () => {
                const descriptor = ViewerElement.elementProperties.get(property);
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

                {
                    const detailsDeferred = new Deferred<ViewerDetails>();
                    const viewer = await this._createViewer(canvas, {
                        engine: this.engine,
                        onInitialized: (details) => {
                            detailsDeferred.resolve(details);
                        },
                    });
                    const details = await detailsDeferred.promise;

                    this._viewerDetails = Object.assign(details, { viewer });
                }

                const details = this._viewerDetails;

                details.viewer.onEnvironmentChanged.add(() => {
                    this._dispatchCustomEvent("environmentchange", (type) => new Event(type));
                });

                details.viewer.onEnvironmentError.add((error) => {
                    this._dispatchCustomEvent("environmenterror", (type) => new ErrorEvent(type, { error }));
                });

                details.viewer.onModelChanged.add((source) => {
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
        });
    }

    protected async _createViewer(canvas: HTMLCanvasElement, options: CanvasViewerOptions): Promise<ViewerClass> {
        return createViewerForCanvas(canvas, Object.assign(options, { viewerClass: this._viewerClass }));
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
     */
    public constructor() {
        super(Viewer);
    }
}
