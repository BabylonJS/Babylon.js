import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";
import { WebCamRuntime } from "./webCamRuntime.js";
import {
    ConnectionPointType,
    type SmartFilter,
    InputBlock,
    createStrongRef,
    editableInPropertyPage,
    PropertyTypeForEdition,
    type IEditablePropertyListOption,
    Logger,
} from "@babylonjs/smart-filters";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import { WebCamInputBlockName } from "../blockNames.js";

/**
 * The source of a webcam
 */
export type WebCamSource = {
    /** The friendly name of the device */
    label: string;
    /** The deviceId */
    value: string;
};

const LocalStorageWebcamIdKey = "webCamDeviceId";
const LocalStorageNameKey = "webCamName";
const DefaultWebCamSource: WebCamSource = {
    label: "Default",
    value: "",
};

/**
 * A utility class to manage the webcam sources for the WebCamInputBlock
 */
class WebcamSourceManager {
    /**
     * The list of available webcam sources
     */
    public sources: WebCamSource[] = [];

    /**
     * An observable that notifies when the sources have been loaded
     */
    public onSourcesLoaded: Observable<WebCamSource[]> = new Observable(undefined, true);

    /**
     * Creates a new WebcamSourceManager
     */
    constructor() {
        this._updateWebcamSources();
        navigator.mediaDevices?.addEventListener("devicechange", () => {
            this._updateWebcamSources();
        });
    }

    private async _updateWebcamSources(): Promise<void> {
        if (!navigator.mediaDevices) {
            Logger.Warn("Webcam not supported by this browser");
            return;
        }

        let foundDefault = false;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const sources = devices
            .filter((device: MediaDeviceInfo) => device.kind === "videoinput")
            .map((device: MediaDeviceInfo) => {
                if (device.deviceId === "") {
                    foundDefault = true;
                    return DefaultWebCamSource;
                }
                return {
                    label: device.label,
                    value: device.deviceId,
                };
            });
        if (!foundDefault) {
            sources.unshift(DefaultWebCamSource);
        }

        // Only update if the sources have changed (sometimes, they don't)
        if (JSON.stringify(this.sources) !== JSON.stringify(sources)) {
            this.sources = sources;
            this.onSourcesLoaded.notifyObservers(this.sources);
        }
    }
}

/**
 * A special Texture InputBlock which is only for use in the Editor
 * as a convenient way to select a webcam source. In a real application, this should not be used.
 * Instead, that hosting application should manage the webcam itself and provide the texture to the Smart Filter
 * via a regular Texture InputBlock.
 */
export class WebCamInputBlock extends InputBlock<ConnectionPointType.Texture> {
    private static _WebCamSourceManager: WebcamSourceManager = new WebcamSourceManager();
    private _webCamRuntime: WebCamRuntime | undefined;
    private _webCamSource: WebCamSource;

    /**
     * The source of the webcam
     */
    public get webcamSource(): WebCamSource {
        return this._webCamSource;
    }

    /**
     * The source of the webcam
     */
    public set webcamSource(webcamSource: WebCamSource) {
        if (this._webCamRuntime) {
            this._webCamRuntime.deviceId = webcamSource.value;
        }
        this._webCamSource = webcamSource;

        // Save the last used webcam source
        localStorage.setItem(LocalStorageWebcamIdKey, webcamSource.value);
        localStorage.setItem(LocalStorageNameKey, webcamSource.label);
    }

    /**
     * The source ID of the webcam
     */
    @editableInPropertyPage("Source", PropertyTypeForEdition.List, "PROPERTIES", {
        notifiers: { update: true },
        options: WebCamInputBlock._WebCamSourceManager.onSourcesLoaded as Observable<IEditablePropertyListOption[]>,
        valuesAreStrings: true,
    })
    public set webcamSourceId(id: string) {
        const source = WebCamInputBlock._WebCamSourceManager.sources.find((source) => source.value === id);
        this.webcamSource = source ?? this.webcamSource;
    }

    /**
     * The source ID of the webcam
     */
    public get webcamSourceId(): string {
        return this._webCamSource.value;
    }

    /**
     * Creates a new WebCamInputBlock
     * @param smartFilter - the smart filter
     */
    constructor(smartFilter: SmartFilter) {
        super(smartFilter, WebCamInputBlockName, ConnectionPointType.Texture, createStrongRef(null));

        // Load the last used webcam source
        const lastWebCamId = localStorage.getItem(LocalStorageWebcamIdKey);
        const lastWebCamName = localStorage.getItem(LocalStorageNameKey);
        if (lastWebCamId && lastWebCamName) {
            this._webCamSource = {
                label: lastWebCamName,
                value: lastWebCamId,
            };
        } else {
            this._webCamSource = DefaultWebCamSource;
        }
    }

    /**
     * Initializes the webcam runtime
     * @param engine - the engine to use
     * @returns the initialized WebCamRuntime
     */
    public initializeWebCamRuntime(engine: ThinEngine): WebCamRuntime {
        if (this._webCamRuntime) {
            this._webCamRuntime.dispose();
        }
        this._webCamRuntime = new WebCamRuntime(engine, this.runtimeValue);
        this._webCamRuntime.deviceId = this._webCamSource.value;
        return this._webCamRuntime;
    }
}
