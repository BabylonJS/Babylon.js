import { Observable } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { PointerInfoBase } from 'babylonjs/Events/pointerEvents';

import { Button } from './button';
import { Control } from "./control";

/**
 * Class used to create toggle button controls
 */
export class Toggle extends Button {
    private _isActive = false;
    private _group = "";

    /**
     * Function called to generate the toActive animation
     */
    public toActiveAnimation: () => void;

    /**
     * Function called to generate the toActive animation
     */
    public toInactiveAnimation: () => void;

    /**
     * Function called to generate a pointer enter animation when the toggle is active.
     */
    public pointerEnterActiveAnimation: () => void;
    /**
     * Function called to generate a pointer out animation when the toggle is active.
     */
    public pointerOutActiveAnimation: () => void;
    /**
     * Function called to generate a pointer down animation when the toggle is active.
     */
    public pointerDownActiveAnimation: () => void;
    /**
     * Function called to generate a pointer up animation when the toggle is active.
     */
    public pointerUpActiveAnimation: () => void;

    /**
     * Function called to generate a pointer enter animation when the toggle is inactive.
     */
    public pointerEnterInactiveAnimation: () => void;
    /**
     * Function called to generate a pointer out animation when the toggle is inactive.
     */
    public pointerOutInactiveAnimation: () => void;
    /**
     * Function called to generate a pointer down animation when the toggle is inactive.
     */
    public pointerDownInactiveAnimation: () => void;
    /**
     * Function called to generate a pointer up animation when the toggle is inactive.
     */
    public pointerUpInactiveAnimation: () => void;

    /** Gets or sets group name this toggle belongs to */
    public get group(): string {
        return this._group;
    }
    public set group(value: string) {
        if (this._group === value) {
            return;
        }

        this._group = value;
    }

    /** Gets or sets a boolean indicating if the toogle button is active or not */
    public get isActive(): boolean {
        return this._isActive;
    }
    public set isActive(value: boolean) {
        // Function modeled after radioButton.ts
        if (this._isActive === value) {
            return;
        }

        this._isActive = value;

        // Update the visual state based on the new value
        if (this._isActive) {
            this.toActiveAnimation();
        } else {
            this.toInactiveAnimation();
        }

        this._markAsDirty();

        this.onIsActiveChangedObservable.notifyObservers(value);

        if (this._isActive && this._host) {
            // Update all controls from same group
            this._host.executeOnAllControls((control) => {
                if (control == this) {
                    return;
                }

                if ((<any>control).group === undefined) {
                    return;
                }
                const childToggle = <Toggle>control;
                // A toggle group should only have 1 active element at a given time. So if this toggle has a group, we need to ensure other toggles in this group get set to inactive
                if (childToggle.group === this.group) {
                    childToggle.isActive = false; // Set other toggles in group as inactive
                    childToggle.isEnabled = true; // set other toggles in group as enabled
                }
            });
        }
    }

    /** Observable raised when isActive is changed */
    public onIsActiveChangedObservable = new Observable<boolean>();

    /**
     * Creates a new Toggle
     * @param name defines the control name
     * @param group defines the toggle group this toggle belongs to
     */
    constructor(public name?: string, group?: string) {
        super(name);

        this._group = group ?? "";
    }

    protected _getTypeName(): string {
        return "Toggle";
    }

    /** @hidden */
    public _onPointerEnter(target: Control, pi: PointerInfoBase): boolean {
        if (!super._onPointerEnter(target, pi)) {
            return false;
        }

        if (this._isActive) {
            if (this.pointerEnterActiveAnimation) {
                this.pointerEnterActiveAnimation();
            }
        } else {
            if (this.pointerEnterInactiveAnimation) {
                this.pointerEnterInactiveAnimation();
            }
        }

        return true;
    }

    /** @hidden */
    public _onPointerOut(
        target: Control,
        pi: PointerInfoBase,
        force = false
    ): void {
        if (this._isActive) {
            if (this.pointerOutActiveAnimation) {
                this.pointerOutActiveAnimation();
            }
        } else {
            if (this.pointerOutInactiveAnimation) {
                this.pointerOutInactiveAnimation();
            }
        }

        super._onPointerOut(target, pi, force);
    }

    /** @hidden */
    public _onPointerDown(
        target: Control,
        coordinates: Vector2,
        pointerId: number,
        buttonIndex: number,
        pi: PointerInfoBase
    ): boolean {
        if (
            !super._onPointerDown(target, coordinates, pointerId, buttonIndex, pi)
        ) {
            return false;
        }

        if (this._isActive) {
            if (this.pointerDownActiveAnimation) {
                this.pointerDownActiveAnimation();
            }
        } else {
            if (this.pointerDownInactiveAnimation) {
                this.pointerDownInactiveAnimation();
            }
        }

        return true;
    }

    /** @hidden */
    public _onPointerUp(
        target: Control,
        coordinates: Vector2,
        pointerId: number,
        buttonIndex: number,
        notifyClick: boolean,
        pi: PointerInfoBase
    ): void {
        if (this._isActive) {
            if (this.pointerUpActiveAnimation) {
                this.pointerUpActiveAnimation();
            }
        } else {
            if (this.pointerUpInactiveAnimation) {
                this.pointerUpInactiveAnimation();
            }
        }

        super._onPointerUp(
            target,
            coordinates,
            pointerId,
            buttonIndex,
            notifyClick,
            pi
        );
    }
}

_TypeStore.RegisteredTypes["BABYLON.GUI.Toggle"] = Toggle;
