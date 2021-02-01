import { Observable } from "babylonjs/Misc/observable";
import { Engine } from "babylonjs/Engines/engine";


/**
 * The data structure of a telemetry event.
 */
export interface TelemetryData {
    event: string;
    session: string;
    date: Date;
    now: number;
    viewerId?: string;
    detail: any;
}

/**
 * Receives Telemetry events and raises events to the API
 */
export class TelemetryManager {

    public onEventBroadcastedObservable: Observable<TelemetryData> = new Observable();

    private _currentSessionId: string;

    private _event: (event: string, viewerId?: string, details?: any) => void = this._eventEnabled;

    /**
     * Receives a telemetry event
     * @param event The name of the Telemetry event
     * @param details An additional value, or an object containing a list of property/value pairs
     */
    public get broadcast() {
        return this._event;
    }

    /**
     * Log a Telemetry event for errors raised on the WebGL context.
     * @param engine The Babylon engine with the WebGL context.
     */
    public flushWebGLErrors(engine: Engine, viewerId?: string) {
        if (!engine) {
            return;
        }
        let logErrors = true;

        while (logErrors) {
            let error = engine.getError();
            if (error === 0) {
                logErrors = false;
            } else {
                this.broadcast("WebGL Error", viewerId, { error: error });
            }
        }
    }

    /**
     * Enable or disable telemetry events
     * @param enabled Boolan, true if events are enabled
     */
    public set enable(enabled: boolean) {
        if (enabled) {
            this._event = this._eventEnabled;
        } else {
            this._event = this._eventDisabled;
        }
    }

    /**
     * Called on event when disabled, typically do nothing here
     */
    private _eventDisabled(): void {
        // nothing to do
    }

    /**
     * Called on event when enabled
     * @param event - The name of the Telemetry event
     * @param details An additional value, or an object containing a list of property/value pairs
     */
    private _eventEnabled(event: string, viewerId?: string, details?: any): void {
        let telemetryData: TelemetryData = {
            viewerId,
            event: event,
            session: this.session,
            date: new Date(),
            now: window.performance ? window.performance.now() : Date.now(),
            detail: null
        };

        if (typeof details === "object") {
            for (var attr in details) {
                if (details.hasOwnProperty(attr)) {
                    telemetryData[attr] = details[attr];
                }
            }
        } else if (details) {
            telemetryData.detail = details;
        }

        this.onEventBroadcastedObservable.notifyObservers(telemetryData);
    }

    /**
     * Returns the current session ID or creates one if it doesn't exixt
     * @return The current session ID
     */
    public get session(): string {
        if (!this._currentSessionId) {
            //String + Timestamp + Random Integer
            this._currentSessionId = "SESSION_" + Date.now() + Math.floor(Math.random() * 0x10000);
        }
        return this._currentSessionId;
    }

    /**
     * Disposes the telemetry manager
     */
    public dispose() {
        this.onEventBroadcastedObservable.clear();
    }
}

export const telemetryManager = new TelemetryManager();
