import { Action } from "./action";
import { RegisterClass } from "../Misc/typeStore";

import type { ActionManager } from "./actionManager";

/**
 * A Condition applied to an Action
 */
export class Condition {
    /**
     * Internal only - manager for action
     * @internal
     */
    public _actionManager: ActionManager;

    /**
     * @internal
     */
    public _evaluationId: number;

    /**
     * @internal
     */
    public _currentResult: boolean;

    /**
     * Creates a new Condition
     * @param actionManager the manager of the action the condition is applied to
     */
    constructor(actionManager: ActionManager) {
        this._actionManager = actionManager;
    }

    /**
     * Check if the current condition is valid
     * @returns a boolean
     */
    public isValid(): boolean {
        return true;
    }

    /**
     * @internal
     */
    public _getProperty(propertyPath: string): string {
        return this._actionManager._getProperty(propertyPath);
    }

    /**
     * @internal
     */
    public _getEffectiveTarget(target: any, propertyPath: string): any {
        return this._actionManager._getEffectiveTarget(target, propertyPath);
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Serialize placeholder for child classes
     * @returns the serialized object
     */
    public serialize(): any {}

    /**
     * @internal
     */
    protected _serialize(serializedCondition: any): any {
        return {
            type: 2, // Condition
            children: [],
            name: serializedCondition.name,
            properties: serializedCondition.properties,
        };
    }
}

/**
 * Defines specific conditional operators as extensions of Condition
 */
export class ValueCondition extends Condition {
    private static _IsEqual = 0;
    private static _IsDifferent = 1;
    private static _IsGreater = 2;
    private static _IsLesser = 3;

    /**
     * returns the number for IsEqual
     */
    public static get IsEqual(): number {
        return ValueCondition._IsEqual;
    }

    /**
     * Returns the number for IsDifferent
     */
    public static get IsDifferent(): number {
        return ValueCondition._IsDifferent;
    }

    /**
     * Returns the number for IsGreater
     */
    public static get IsGreater(): number {
        return ValueCondition._IsGreater;
    }

    /**
     * Returns the number for IsLesser
     */
    public static get IsLesser(): number {
        return ValueCondition._IsLesser;
    }

    /**
     * Internal only The action manager for the condition
     * @internal
     */
    public _actionManager: ActionManager;

    private _target: any;
    private _effectiveTarget: any;
    private _property: string;

    /**
     * Creates a new ValueCondition
     * @param actionManager manager for the action the condition applies to
     * @param target for the action
     * @param propertyPath path to specify the property of the target the conditional operator uses
     * @param value the value compared by the conditional operator against the current value of the property
     * @param operator the conditional operator, default ValueCondition.IsEqual
     */
    constructor(
        actionManager: ActionManager,
        target: any,
        /** path to specify the property of the target the conditional operator uses  */
        public propertyPath: string,
        /** the value compared by the conditional operator against the current value of the property */
        public value: any,
        /** the conditional operator, default ValueCondition.IsEqual */
        public operator: number = ValueCondition.IsEqual
    ) {
        super(actionManager);

        this._target = target;
        this._effectiveTarget = this._getEffectiveTarget(target, this.propertyPath);
        this._property = this._getProperty(this.propertyPath);
    }

    /**
     * Compares the given value with the property value for the specified conditional operator
     * @returns the result of the comparison
     */
    public isValid(): boolean {
        switch (this.operator) {
            case ValueCondition.IsGreater:
                return this._effectiveTarget[this._property] > this.value;
            case ValueCondition.IsLesser:
                return this._effectiveTarget[this._property] < this.value;
            case ValueCondition.IsEqual:
            case ValueCondition.IsDifferent: {
                let check: boolean;

                if (this.value.equals) {
                    check = this.value.equals(this._effectiveTarget[this._property]);
                } else {
                    check = this.value === this._effectiveTarget[this._property];
                }
                return this.operator === ValueCondition.IsEqual ? check : !check;
            }
        }

        return false;
    }

    /**
     * Serialize the ValueCondition into a JSON compatible object
     * @returns serialization object
     */
    public serialize(): any {
        return this._serialize({
            name: "ValueCondition",
            properties: [
                Action._GetTargetProperty(this._target),
                { name: "propertyPath", value: this.propertyPath },
                { name: "value", value: Action._SerializeValueAsString(this.value) },
                { name: "operator", value: ValueCondition.GetOperatorName(this.operator) },
            ],
        });
    }

    /**
     * Gets the name of the conditional operator for the ValueCondition
     * @param operator the conditional operator
     * @returns the name
     */
    public static GetOperatorName(operator: number): string {
        switch (operator) {
            case ValueCondition._IsEqual:
                return "IsEqual";
            case ValueCondition._IsDifferent:
                return "IsDifferent";
            case ValueCondition._IsGreater:
                return "IsGreater";
            case ValueCondition._IsLesser:
                return "IsLesser";
            default:
                return "";
        }
    }
}

/**
 * Defines a predicate condition as an extension of Condition
 */
export class PredicateCondition extends Condition {
    /**
     * Internal only - manager for action
     * @internal
     */
    public _actionManager: ActionManager;

    /**
     * Creates a new PredicateCondition
     * @param actionManager manager for the action the condition applies to
     * @param predicate defines the predicate function used to validate the condition
     */
    constructor(
        actionManager: ActionManager,
        /** defines the predicate function used to validate the condition */
        public predicate: () => boolean
    ) {
        super(actionManager);
    }

    /**
     * @returns the validity of the predicate condition
     */
    public isValid(): boolean {
        return this.predicate();
    }
}

/**
 * Defines a state condition as an extension of Condition
 */
export class StateCondition extends Condition {
    /**
     * Internal only - manager for action
     * @internal
     */
    public _actionManager: ActionManager;

    private _target: any;

    /**
     * Creates a new StateCondition
     * @param actionManager manager for the action the condition applies to
     * @param target of the condition
     * @param value to compare with target state
     */
    constructor(
        actionManager: ActionManager,
        target: any,
        /** Value to compare with target state  */
        public value: string
    ) {
        super(actionManager);

        this._target = target;
    }

    /**
     * Gets a boolean indicating if the current condition is met
     * @returns the validity of the state
     */
    public isValid(): boolean {
        return this._target.state === this.value;
    }

    /**
     * Serialize the StateCondition into a JSON compatible object
     * @returns serialization object
     */
    public serialize(): any {
        return this._serialize({
            name: "StateCondition",
            properties: [Action._GetTargetProperty(this._target), { name: "value", value: this.value }],
        });
    }
}

RegisterClass("BABYLON.ValueCondition", ValueCondition);
RegisterClass("BABYLON.PredicateCondition", PredicateCondition);
RegisterClass("BABYLON.StateCondition", StateCondition);
