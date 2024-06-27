import type { Vector2 } from "core/Maths/math.vector";

import { Button } from "./button";
import type { Control } from "./control";
import { RegisterClass } from "core/Misc/typeStore";
import type { PointerInfoBase } from "core/Events/pointerEvents";
import type { IFocusableControl } from "./focusableControl";

/**
 * Class used to create a focusable button that can easily handle keyboard events
 * @since 5.0.0
 */
export class FocusableButton extends Button implements IFocusableControl {
    constructor(public override name?: string) {
        super(name);

        this._unfocusedColor = this.color;
    }

    /**
     * @internal
     */
    public override _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, pi: PointerInfoBase): boolean {
        if (!this.isReadOnly) {
            // Clicking on button should focus
            this.focus();
        }

        return super._onPointerDown(target, coordinates, pointerId, buttonIndex, pi);
    }
}
RegisterClass("BABYLON.GUI.FocusableButton", FocusableButton);
