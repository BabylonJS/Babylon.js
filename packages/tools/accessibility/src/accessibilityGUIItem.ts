import { Vector2 } from "core/Maths/math";
import { Button } from "gui/2D/controls/button";
import type { Control } from "gui/2D/controls/control";
import { Image } from "gui/2D/controls/image";
import { TextBlock } from "gui/2D/controls/textBlock";
import { Vector2WithInfo } from "gui/2D/math2D";
import { AccessibilityItem } from "./accessibilityItem";

/**
 * A abstract layer to store the accessibility tree structure. It is constructed from the BabylonJS scene entities that need to be accessible. It informs the parent-children relationship of accessibility tree, and informs how to render: description, isActionable, onclick/onrightclick/onfocus/onblur.
 */
export class AccessibilityGUIItem extends AccessibilityItem {
    /**
     * The corresponding BabylonJS entity. Can be a Node or a Control.
     */
    public entity: Control;

    /**
     * The children of this item in the accessibility tree.
     */
    public children: AccessibilityGUIItem[];

    constructor(entity: Control, children: AccessibilityGUIItem[]) {
        super(entity, children);
    }

    /**
     * The text content displayed in HTML element.
     */
    public override get description(): string {
        let description = "";
        if (this.entity.accessibilityTag?.description) {
            description = this.entity.accessibilityTag.description;
        } else if (this.entity instanceof TextBlock) {
            description = (this.entity as TextBlock).text;
        } else if (this.entity instanceof Button) {
            description = (this.entity as Button).textBlock?.text ?? "";
        } else if (this.entity instanceof Image) {
            description = (this.entity as Image).alt ?? "";
        }
        return description;
    }

    /**
     * If this entity is actionable (can be clicked).
     */
    public override get isActionable(): boolean {
        if (this._isActionable) {
            return this._isActionable;
        }

        // If defined onclick, override default.
        const eventHandler = (this.entity as Control).accessibilityTag?.eventHandler;
        if (eventHandler?.onclick || eventHandler?.oncontextmenu) {
            this._isActionable = true;
        } else {
            if (this.entity instanceof Button) {
                this._isActionable = true;
            } else {
                this._isActionable = false;
            }
        }

        return this._isActionable;
    }

    /**
     * If this entity is focusable (can be focused by tab key pressing).
     */
    public override get isFocusable(): boolean {
        // TODO: change back
        // return true;
        if (this._isFocusable) {
            return this._isFocusable;
        }

        if (this.entity instanceof Button) {
            this._isFocusable = true;
        } else {
            this._isFocusable = false;
        }
        return this._isFocusable;
    }

    /**
     * Callback when the HTML element is focused. Show visual indication on BabylonJS entity.
     */
    public override focus(): void {
        // If defined eventHandler, override default.
        const eventHandler = (this.entity as Control).accessibilityTag?.eventHandler;
        if (eventHandler?.onfocus) {
            eventHandler.onfocus();
            return;
        }

        const control = this.entity as Control;
        control.highlightLineWidth = 10;
        control.isHighlighted = true;
    }

    /**
     * Callback when the HTML element is blured. Dismiss visual indication on BabylonJS entity.
     */
    public override blur(): void {
        // If defined eventHandler, override default.
        const eventHandler = (this.entity as Control).accessibilityTag?.eventHandler;
        if (eventHandler?.onblur) {
            eventHandler.onblur();
            return;
        }

        const control = this.entity as Control;
        control.isHighlighted = false;
    }

    /**
     * Callback when the HTML element is clicked. Apply that to BabylonJs entity.
     */
    public override click(): void {
        // If defined eventHandler, override default.
        const eventHandler = (this.entity as Control).accessibilityTag?.eventHandler;
        if (eventHandler?.onclick) {
            eventHandler.onclick();
            return;
        }

        if (!this.isActionable) return;
        this.entity.onPointerClickObservable.notifyObservers(new Vector2WithInfo(new Vector2()));
    }

    /**
     * Callback when the HTML element is right clicked. Apply that to BabylonJs entity.
     */
    public override rightClick(): void {
        const eventHandler = (this.entity as Control).accessibilityTag?.eventHandler;
        if (eventHandler?.oncontextmenu) {
            eventHandler.oncontextmenu();
            return;
        }
    }
}
