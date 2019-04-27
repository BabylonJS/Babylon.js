import { Nullable } from "../types";

declare type Engine = import("./engine").Engine;
declare type Scene = import("../scene").Scene;

/**
 * The engine store class is responsible to hold all the instances of Engine and Scene created
 * during the life time of the application.
 */
export class EngineStore {
    /** Gets the list of created engines */
    public static Instances = new Array<Engine>();

    /** @hidden */
    public static _LastCreatedScene: Nullable<Scene> = null;

    /**
     * Gets the latest created engine
     */
    public static get LastCreatedEngine(): Nullable<Engine> {
        if (this.Instances.length === 0) {
            return null;
        }

        return this.Instances[this.Instances.length - 1];
    }

    /**
     * Gets the latest created scene
     */
    public static get LastCreatedScene(): Nullable<Scene> {
        return this._LastCreatedScene;
    }
}
