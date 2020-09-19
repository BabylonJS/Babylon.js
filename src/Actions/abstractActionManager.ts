import { IDisposable } from "../scene";
import { IActionEvent } from "./actionEvent";
import { IAction } from "./action";
import { Constants } from "../Engines/constants";
import { Nullable } from "../types";

/**
 * Abstract class used to decouple action Manager from scene and meshes.
 * Do not instantiate.
 * @see https://doc.babylonjs.com/how_to/how_to_use_actions
 */
export abstract class AbstractActionManager implements IDisposable {

    /** Gets the list of active triggers */
    public static Triggers: { [key: string]: number } = {};

    /** Gets the cursor to use when hovering items */
    public hoverCursor: string = '';

    /** Gets the list of actions */
    public actions = new Array<IAction>();

    /**
     * Gets or sets a boolean indicating that the manager is recursive meaning that it can trigger action from children
     */
    public isRecursive = false;

    /**
     * Releases all associated resources
     */
    public abstract dispose(): void;

    /**
     * Does this action manager has pointer triggers
     */
    public abstract get hasPointerTriggers(): boolean;

    /**
     * Does this action manager has pick triggers
     */
    public abstract get hasPickTriggers(): boolean;

    /**
     * Process a specific trigger
     * @param trigger defines the trigger to process
     * @param evt defines the event details to be processed
     */
    public abstract processTrigger(trigger: number, evt?: IActionEvent): void;

    /**
     * Does this action manager handles actions of any of the given triggers
     * @param triggers defines the triggers to be tested
     * @return a boolean indicating whether one (or more) of the triggers is handled
     */
    public abstract hasSpecificTriggers(triggers: number[]): boolean;

    /**
     * Does this action manager handles actions of any of the given triggers. This function takes two arguments for
     * speed.
     * @param triggerA defines the trigger to be tested
     * @param triggerB defines the trigger to be tested
     * @return a boolean indicating whether one (or more) of the triggers is handled
     */
    public abstract hasSpecificTriggers2(triggerA: number, triggerB: number): boolean;

    /**
     * Does this action manager handles actions of a given trigger
     * @param trigger defines the trigger to be tested
     * @param parameterPredicate defines an optional predicate to filter triggers by parameter
     * @return whether the trigger is handled
     */
    public abstract hasSpecificTrigger(trigger: number, parameterPredicate?: (parameter: any) => boolean): boolean;

    /**
     * Serialize this manager to a JSON object
     * @param name defines the property name to store this manager
     * @returns a JSON representation of this manager
     */
    public abstract serialize(name: string): any;

    /**
     * Registers an action to this action manager
     * @param action defines the action to be registered
     * @return the action amended (prepared) after registration
     */
    public abstract registerAction(action: IAction): Nullable<IAction>;

    /**
     * Unregisters an action to this action manager
     * @param action defines the action to be unregistered
     * @return a boolean indicating whether the action has been unregistered
     */
    public abstract unregisterAction(action: IAction): Boolean;

    /**
     * Does exist one action manager with at least one trigger
     **/
    public static get HasTriggers(): boolean {
        for (var t in AbstractActionManager.Triggers) {
            if (AbstractActionManager.Triggers.hasOwnProperty(t)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Does exist one action manager with at least one pick trigger
     **/
    public static get HasPickTriggers(): boolean {
        for (var t in AbstractActionManager.Triggers) {
            if (AbstractActionManager.Triggers.hasOwnProperty(t)) {
                let t_int = parseInt(t);
                if (t_int >= Constants.ACTION_OnPickTrigger && t_int <= Constants.ACTION_OnPickUpTrigger) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Does exist one action manager that handles actions of a given trigger
     * @param trigger defines the trigger to be tested
     * @return a boolean indicating whether the trigger is handeled by at least one action manager
    **/
    public static HasSpecificTrigger(trigger: number): boolean {
        for (var t in AbstractActionManager.Triggers) {
            if (AbstractActionManager.Triggers.hasOwnProperty(t)) {
                let t_int = parseInt(t);
                if (t_int === trigger) {
                    return true;
                }
            }
        }
        return false;
    }
}