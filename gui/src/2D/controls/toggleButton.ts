import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math.vector";

import { Rectangle } from "./rectangle";
import { Control } from "./control";
import { TextBlock } from "./textBlock";
import { Image } from "./image";
import { _TypeStore } from "babylonjs/Misc/typeStore";
import { PointerInfoBase } from "babylonjs/Events/pointerEvents";

/**
 * Class used to create toggle buttons
 */
export class ToggleButton extends Rectangle {
    /**
     * Function called to generate the toActive animation
     */
    public toActiveAnimation: () => void;

    /**
     * Function called to generate the toInactive animation
     */
    public toInactiveAnimation: () => void;

    /**
     * Function called to generate a pointer enter animation when the toggle button is active.
     */
    public pointerEnterActiveAnimation: () => void;
    /**
     * Function called to generate a pointer out animation when the toggle button is active.
     */
    public pointerOutActiveAnimation: () => void;
    /**
     * Function called to generate a pointer down animation when the toggle button is active.
     */
    public pointerDownActiveAnimation: () => void;
    /**
     * Function called to generate a pointer up animation when the toggle button is active.
     */
    public pointerUpActiveAnimation: () => void;

    /**
     * Function called to generate a pointer enter animation when the toggle button is inactive.
     */
    public pointerEnterInactiveAnimation: () => void;
    /**
     * Function called to generate a pointer out animation when the toggle button is inactive.
     */
    public pointerOutInactiveAnimation: () => void;
    /**
     * Function called to generate a pointer down animation when the toggle button is inactive.
     */
    public pointerDownInactiveAnimation: () => void;
    /**
     * Function called to generate a pointer up animation when the toggle button is inactive.
     */
    public pointerUpInactiveAnimation: () => void;

    /** Observable raised when isActive is changed */
    public onIsActiveChangedObservable = new Observable<boolean>();

    /**
     * Gets or sets a boolean indicating that the toggle button will let internal controls handle picking instead of doing it directly using its bounding info
     */
    public delegatePickingToChildren = false;

    private _image: Nullable<Image>;
    /**
     * Returns the ToggleButton's image control if it exists
     */
    public get image(): Nullable<Image> {
        return this._image;
    }

    private _textBlock: Nullable<TextBlock>;
    /**
     * Returns the ToggleButton's child TextBlock control if it exists
     */
    public get textBlock(): Nullable<TextBlock> {
        return this._textBlock;
    }

    private _group: string;
    /** Gets or sets group name this toggle button belongs to */
    public get group(): string {
        return this._group;
    }
    public set group(value: string) {
        if (this._group === value) {
            return;
        }

        this._group = value;
    }

    private _isActive = false;
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
            this.toActiveAnimation?.();
        } else {
            this.toInactiveAnimation?.();
        }

        this._markAsDirty();

        this.onIsActiveChangedObservable.notifyObservers(value);

        if (this._isActive && this._host && this._group) {
            // A toggle button in a group can only have 1 active element at a given time.
            // If this toggle button has a group, set other toggle buttons in the group to inactive.
            this._host.executeOnAllControls((control) => {
                // Check for control type ToggleButton
                if (control.typeName === "ToggleButton") {
                    // Don't do anything to this toggle button
                    if (control === this) {
                        return;
                    }

                    const childToggle = <ToggleButton>control;
                    // If toggle button is in same group, set isActive to false
                    if (childToggle.group === this.group) {
                        childToggle.isActive = false;
                    }
                }
            });
        }
    }

    /**
     * Creates a new ToggleButton
     * @param name defines the control name
     * @param group defines the toggle group this toggle belongs to
     */
    constructor(public name?: string, group?: string) {
        super(name);
        this.group = group ?? "";

        this.thickness = 0;
        this.isPointerBlocker = true;

        let alphaStore: Nullable<number> = null;

        this.toActiveAnimation = () => {
            this.thickness = 1;
        };
        this.toInactiveAnimation = () => {
            this.thickness = 0;
        };

        this.pointerEnterActiveAnimation = () => {
            alphaStore = this.alpha;
            this.alpha -= 0.1;
        };

        this.pointerOutActiveAnimation = () => {
            if (alphaStore !== null) {
                this.alpha = alphaStore;
            }
        };

        this.pointerDownActiveAnimation = () => {
            this.scaleX -= 0.05;
            this.scaleY -= 0.05;
        };

        this.pointerUpActiveAnimation = () => {
            this.scaleX += 0.05;
            this.scaleY += 0.05;
        };

        this.pointerEnterInactiveAnimation = () => {
            alphaStore = this.alpha;
            this.alpha -= 0.1;
        };

        this.pointerOutInactiveAnimation = () => {
            if (alphaStore !== null) {
                this.alpha = alphaStore;
            }
        };

        this.pointerDownInactiveAnimation = () => {
            this.scaleX -= 0.05;
            this.scaleY -= 0.05;
        };

        this.pointerUpInactiveAnimation = () => {
            this.scaleX += 0.05;
            this.scaleY += 0.05;
        };
    }

    protected _getTypeName(): string {
        return "ToggleButton";
    }

    // While being a container, the toggle button behaves like a control.
    /** @hidden */
    public _processPicking(x: number, y: number, pi: PointerInfoBase, type: number, pointerId: number, buttonIndex: number, deltaX?: number, deltaY?: number): boolean {
        if (!this._isEnabled || !this.isHitTestVisible || !this.isVisible || this.notRenderable) {
            return false;
        }

        if (!super.contains(x, y)) {
            return false;
        }

        if (this.delegatePickingToChildren) {
            let contains = false;
            for (var index = this._children.length - 1; index >= 0; index--) {
                var child = this._children[index];
                if (child.isEnabled && child.isHitTestVisible && child.isVisible && !child.notRenderable && child.contains(x, y)) {
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                return false;
            }
        }

        this._processObservables(type, x, y, pi, pointerId, buttonIndex, deltaX, deltaY);

        return true;
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
    public _onPointerOut(target: Control, pi: PointerInfoBase, force = false): void {
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
    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, pi: PointerInfoBase): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex, pi)) {
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
    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean, pi: PointerInfoBase): void {
        if (this._isActive) {
            if (this.pointerUpActiveAnimation) {
                this.pointerUpActiveAnimation();
            }
        } else {
            if (this.pointerUpInactiveAnimation) {
                this.pointerUpInactiveAnimation();
            }
        }

        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick, pi);
    }
}

_TypeStore.RegisteredTypes["BABYLON.GUI.ToggleButton"] = ToggleButton;
