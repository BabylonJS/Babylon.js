import type { IAction } from "core/Actions/action";
import { Constants } from "core/Engines/constants";
import { Color4 } from "core/Maths/math.color";
import { Mesh } from "core/Meshes/mesh";
import type { Node } from "core/node";
import type { Scene } from "core/scene";
import { HTMLTwinItem } from "./htmlTwinItem";

/**
 * A abstract layer to store the html twin tree structure. It is constructed from the BabylonJS scene entities that need to be accessible. It informs the parent-children relationship of html twin tree, and informs how to render: description, isActionable, onclick/onrightclick/onfocus/onblur.
 */
export class HTMLTwinNodeItem extends HTMLTwinItem {
    /**
     * The corresponding BabylonJS entity. Can be a Node or a Control.
     */
    public override entity: Node;

    constructor(entity: Node, scene: Scene) {
        super(entity, scene);
    }

    /**
     * If this entity is actionable (can be clicked).
     */
    public override get isActionable(): boolean {
        if (this._isActionable) {
            return this._isActionable;
        }

        // If defined onclick, override default.
        const eventHandler = (this.entity as Node).accessibilityTag?.eventHandler;
        if (eventHandler?.click || eventHandler?.contextmenu) {
            this._isActionable = true;
        } else {
            this._isActionable = (this.entity as Node)._getActionManagerForTrigger()?.hasPickTriggers!!;
        }

        return this._isActionable;
    }

    /**
     * If this entity is focusable (can be focused by tab key pressing).
     */
    public override get isFocusable(): boolean {
        if (this._isFocusable) {
            return this._isFocusable;
        } else {
            this._isFocusable = this.isActionable;
        }
        return this._isFocusable;
    }

    /**
     * Callback when the HTML element is focused. Show visual indication on BabylonJS entity.
     */
    public override focus(): void {
        // If defined eventHandler, override default.
        const eventHandler = (this.entity as Node).accessibilityTag?.eventHandler;
        if (eventHandler?.focus) {
            eventHandler.focus();
            return;
        }

        if (this.entity instanceof Mesh) {
            const mesh = this.entity as Mesh;
            mesh.enableEdgesRendering(0.999);
            mesh.edgesWidth = 5;
            mesh.edgesColor = new Color4(0.25, 0.5, 1, 1);
        }
    }

    /**
     * Callback when the HTML element is blured. Dismiss visual indication on BabylonJS entity.
     */
    public override blur(): void {
        // If defined eventHandler, override default.
        const eventHandler = (this.entity as Node).accessibilityTag?.eventHandler;
        if (eventHandler?.blur) {
            eventHandler.blur();
            return;
        }

        if (this.entity instanceof Mesh) {
            const mesh = this.entity as Mesh;
            mesh.disableEdgesRendering();
        }
    }

    /**
     * Callback when an event (e.g. click/right click) happens on the HTML element.
     * Implemented by child classes
     * @param eventType - Which event is triggered. E.g. "click", "contextmenu"
     */
    public override triggerEvent(eventType: string): void {
        const eventHandler = (this.entity as Node).accessibilityTag?.eventHandler;
        const actions: IAction[] = [];

        switch (eventType) {
            case "click":
                if (eventHandler?.click) {
                    eventHandler.click();
                    return;
                }
                actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnLeftPickTrigger));
                actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnPickTrigger));
                break;

            case "contextmenu":
                if (eventHandler?.contextmenu) {
                    eventHandler.contextmenu();
                    return;
                }
                actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnRightPickTrigger));
                actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnPickTrigger));
                break;

            default:
                break;
        }

        for (const action of actions) {
            action._executeCurrent();
        }
    }

    private _getTriggerActions(node: Node, trigger: number): IAction[] {
        const triggerActions = node._getActionManagerForTrigger(trigger)?.actions.filter((action) => action.trigger == trigger);
        return triggerActions ?? [];
    }
}
