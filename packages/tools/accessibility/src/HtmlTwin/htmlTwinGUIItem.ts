import { Vector2 } from "core/Maths/math";
import type { Scene } from "core/scene";
import { Button } from "gui/2D/controls/button";
import type { Control } from "gui/2D/controls/control";
import { Image } from "gui/2D/controls/image";
import { TextBlock } from "gui/2D/controls/textBlock";
import { Vector2WithInfo } from "gui/2D/math2D";
import { HTMLTwinItem } from "./htmlTwinItem";
import type { IHTMLTwinRendererOptions } from "./htmlTwinRenderer";

/**
 * A abstract layer to store the html twin tree structure. It is constructed from the BabylonJS scene entities that need to be accessible. It informs the parent-children relationship of html twin tree, and informs how to render: description, isActionable, onclick/onrightclick/onfocus/onblur.
 */
export class HTMLTwinGUIItem extends HTMLTwinItem {
    /**
     * The corresponding BabylonJS entity. Can be a Node or a Control.
     */
    public entity: Control;

    constructor(entity: Control, scene: Scene) {
        super(entity, scene);
    }

    /**
     * The text content displayed in HTML element.
     * @param options - Options to render HTML twin tree where this element is contained.
     * @returns The text content displayed in HTML element.
     */
    public override getDescription(options: IHTMLTwinRendererOptions): string {
        let description = "";
        if (this.entity?.accessibilityTag?.description) {
            description = this.entity.accessibilityTag.description;
        } else if (options.addAllControls && this.entity instanceof TextBlock) {
            description = (this.entity as TextBlock).text;
        } else if (options.addAllControls && this.entity instanceof Button) {
            description = (this.entity as Button).textBlock?.text ?? "";
        } else if (options.addAllControls && this.entity instanceof Image) {
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
        if (eventHandler?.click || eventHandler?.contextmenu) {
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
        if (eventHandler?.focus) {
            eventHandler.focus();
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
        if (eventHandler?.blur) {
            eventHandler.blur();
            return;
        }

        const control = this.entity as Control;
        control.isHighlighted = false;
    }

    /**
     * Callback when an event (e.g. click/right click) happens on the HTML element.
     * Implemented by child classes
     * @param eventType - Which event is triggered. E.g. "click", "contextmenu"
     */
    public override triggerEvent(eventType: string): void {
        const eventHandler = (this.entity as Control).accessibilityTag?.eventHandler;

        switch (eventType) {
            case "click":
                if (eventHandler?.click) {
                    eventHandler.click();
                    return;
                }

                if (!this.isActionable) return;
                this.entity.onPointerClickObservable.notifyObservers(new Vector2WithInfo(new Vector2(this.scene.pointerX, this.scene.pointerY)));
                break;

            case "contextmenu":
                if (eventHandler?.contextmenu) {
                    eventHandler.contextmenu();
                    return;
                }
                break;

            default:
                break;
        }
    }
}
