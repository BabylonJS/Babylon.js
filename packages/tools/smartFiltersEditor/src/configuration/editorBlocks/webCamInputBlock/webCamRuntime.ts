import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";
import { type ConnectionPointType, type IDisposable, type RuntimeData, Logger } from "@babylonjs/smart-filters";
import type { Nullable } from "@babylonjs/core/types";
import { WebCamSession } from "./webCamSession.js";

/**
 * Manages the runtime of WebCam input block, hooking it up to a texture, responding to changes in source,
 * and disposing of it when done.
 */
export class WebCamRuntime implements IDisposable {
    private readonly _engine: ThinEngine;
    private readonly _textureOutput: RuntimeData<ConnectionPointType.Texture>;
    private _currentSession: WebCamSession | undefined;

    /**
     * The device ID of the webcam to use. An empty string means default webcam.
     * Null means it hasn't been set yet.
     */
    private _deviceId: Nullable<string> = null;

    /**
     * The device ID of the webcam to use. An empty string means default webcam.
     * Null means it hasn't been set yet.
     */
    public get deviceId(): Nullable<string> {
        return this._deviceId;
    }

    /**
     * The device ID of the webcam to use. An empty string means default webcam.
     */
    public set deviceId(value: string) {
        if (this._deviceId !== value) {
            this._deviceId = value;
            this._refresh();
        }
    }

    /**
     * Creates a new WebCamRuntime instance.
     * @param engine - The engine to use
     * @param textureOutput - The output texture
     */
    constructor(engine: ThinEngine, textureOutput: RuntimeData<ConnectionPointType.Texture>) {
        this._engine = engine;
        this._textureOutput = textureOutput;
    }

    private _refresh(): void {
        if (this._currentSession) {
            this._currentSession.dispose();
            this._currentSession = undefined;
        }

        if (this._deviceId !== null) {
            this._currentSession = new WebCamSession(this._engine, this._textureOutput, this._deviceId);
            this._currentSession.load().catch((e: unknown) => {
                Logger.Error(`Failed to load webcam ${e}`);
            });
        }
    }

    /**
     * Disposes the webcam runtime.
     */
    public dispose(): void {
        if (this._currentSession) {
            this._currentSession.dispose();
            this._currentSession = undefined;
        }
    }
}
