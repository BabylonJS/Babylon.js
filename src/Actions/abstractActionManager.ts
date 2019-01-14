import { IDisposable } from 'scene';
import { IActionEvent } from './actionEvent';
import { IAction } from './action';
import { Constants } from "../Engines/constants";

/**
 * Abstract class used to decouple action Manager from scene and meshes.
 * Do not instantiate.
 * @see http://doc.babylonjs.com/how_to/how_to_use_actions
 */
export abstract class AbstractActionManager implements IDisposable {
    /**
       * Nothing
       * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
       */
    public static readonly NothingTrigger = Constants.ACTION_NothingTrigger;

    /**
     * On pick
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickTrigger = Constants.ACTION_OnPickTrigger;

    /**
     * On left pick
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnLeftPickTrigger = Constants.ACTION_OnLeftPickTrigger;

    /**
     * On right pick
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnRightPickTrigger = Constants.ACTION_OnRightPickTrigger;

    /**
     * On center pick
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnCenterPickTrigger = Constants.ACTION_OnCenterPickTrigger;

    /**
     * On pick down
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickDownTrigger = Constants.ACTION_OnPickDownTrigger;

    /**
     * On double pick
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnDoublePickTrigger = Constants.ACTION_OnDoublePickTrigger;

    /**
     * On pick up
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickUpTrigger = Constants.ACTION_OnPickUpTrigger;
    /**
     * On pick out.
     * This trigger will only be raised if you also declared a OnPickDown
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPickOutTrigger = Constants.ACTION_OnPickOutTrigger;

    /**
     * On long press
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnLongPressTrigger = Constants.ACTION_OnLongPressTrigger;

    /**
     * On pointer over
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPointerOverTrigger = Constants.ACTION_OnPointerOverTrigger;

    /**
     * On pointer out
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnPointerOutTrigger = Constants.ACTION_OnPointerOutTrigger;

    /**
     * On every frame
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnEveryFrameTrigger = Constants.ACTION_OnEveryFrameTrigger;
    /**
     * On intersection enter
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnIntersectionEnterTrigger = Constants.ACTION_OnIntersectionEnterTrigger;

    /**
     * On intersection exit
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnIntersectionExitTrigger = Constants.ACTION_OnIntersectionExitTrigger;

    /**
     * On key down
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnKeyDownTrigger = Constants.ACTION_OnKeyDownTrigger;

    /**
     * On key up
     * @see http://doc.babylonjs.com/how_to/how_to_use_actions#triggers
     */
    public static readonly OnKeyUpTrigger = 15;

    /** Gets the list of active triggers */
    public static Triggers: { [key: string]: number } = {};

    /** Gets the cursor to use when hovering items */
    public hoverCursor: string = '';

    /** Gets the list of actions */
    public actions = new Array<IAction>();

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
                if (t_int >= AbstractActionManager.OnPickTrigger && t_int <= AbstractActionManager.OnPickUpTrigger) {
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