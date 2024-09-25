import type { CoreScene } from "core/coreScene";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";

import type { AbstractEngine } from "./abstractEngine";

/**
 * The engine store class is responsible to hold all the instances of Engine and Scene created
 * during the life time of the application.
 */
export class EngineStore {
    /** Gets the list of created engines */
    public static Instances: AbstractEngine[] = [];

    /**
     * Notifies when an engine was disposed.
     * Mainly used for static/cache cleanup
     */
    public static OnEnginesDisposedObservable = new Observable<AbstractEngine>();

    /** @internal */
    public static _LastCreatedScene: Nullable<CoreScene> = null;

    /**
     * Gets the latest created engine
     */
    public static get LastCreatedEngine(): Nullable<AbstractEngine> {
        if (this.Instances.length === 0) {
            return null;
        }

        return this.Instances[this.Instances.length - 1];
    }

    /**
     * Gets the latest created scene
     */
    public static get LastCreatedScene(): Nullable<CoreScene> {
        return this._LastCreatedScene;
    }

    /**
     * Gets or sets a global variable indicating if fallback texture must be used when a texture cannot be loaded
     * @ignorenaming
     */
    public static UseFallbackTexture = true;

    /**
     * Texture content used if a texture cannot loaded
     * @ignorenaming
     */
    public static FallbackTexture = "";
}
