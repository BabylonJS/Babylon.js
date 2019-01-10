import { Nullable } from "../types";

/**
 * Interface used to define a behavior
 */
export interface Behavior<T> {
    /** gets or sets behavior's name */
    name: string;

    /**
     * Function called when the behavior needs to be initialized (after attaching it to a target)
     */
    init(): void;
    /**
     * Called when the behavior is attached to a target
     * @param target defines the target where the behavior is attached to
     */
    attach(target: T): void;
    /**
     * Called when the behavior is detached from its target
     */
    detach(): void;
}

/**
 * Interface implemented by classes supporting behaviors
 */
export interface IBehaviorAware<T> {
    /**
     * Attach a behavior
     * @param behavior defines the behavior to attach
     * @returns the current host
     */
    addBehavior(behavior: Behavior<T>): T;
    /**
     * Remove a behavior from the current object
     * @param behavior defines the behavior to detach
     * @returns the current host
     */
    removeBehavior(behavior: Behavior<T>): T;
    /**
     * Gets a behavior using its name to search
     * @param name defines the name to search
     * @returns the behavior or null if not found
     */
    getBehaviorByName(name: string): Nullable<Behavior<T>>;
}
