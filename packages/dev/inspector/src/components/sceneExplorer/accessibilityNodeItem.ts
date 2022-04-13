import { Constants, IAction, Mesh, Node } from "babylonjs";
import { AccessibilityItem } from "./accessibilityItem";

/**
 * A abstract layer to store the accessibility tree structure. It is constructed from the BabylonJS scene entities that need to be accessible. It informs the parent-children relationship of accessibility tree, and informs how to render: description, isActionable, onclick/onrightclick/onfocus/onblur.
 */
export class AccessibilityNodeItem extends AccessibilityItem {
    /**
     * The corresponding BabylonJS entity. Can be a Node or a Control.
     */
    public entity: Node;

    /**
     * The children of this item in the accessibility tree.
     */
    public children: AccessibilityItem[];

    constructor(entity: Node, children: AccessibilityItem[]) {
        super(entity, children);
    }

    /**
     * The text content displayed in HTML element.
     */
    public get description(): string {
        return (this.entity as Node).accessibilityTag?.description ?? "";
    }

    /**
     * If this entity is actionable (can be clicked).
     */
    public get isActionable(): boolean {
        if (this._isActionable) {
            return this._isActionable;
        }

        this._isActionable = (this.entity as Node)._getActionManagerForTrigger()?.hasPickTriggers!!;
        return this._isActionable;
    }

    /**
     * If this entity is focusable (can be focused by tab key pressing).
     */
    public get isFocusable(): boolean {
        return true;
        // if (this._isFocusable) {
        //     return this._isFocusable;
        // }
        // return this.isActionable;
    }

    /**
     * Callback when the HTML element is focused. Show visual indication on BabylonJS entity.
     */
    public focus(): void {
        if (this.entity instanceof Mesh) {
            const mesh = this.entity as Mesh;
            mesh.enableEdgesRendering(0.999);
            mesh.edgesWidth = 5;
            mesh.edgesColor = new BABYLON.Color4(0.25, 0.5, 1, 1);
        }
    }

    /**
     * Callback when the HTML element is blured. Dismiss visual indication on BabylonJS entity.
     */
    public blur(): void {
        if (this.entity instanceof Mesh) {
            const mesh = this.entity as Mesh;
            mesh.disableEdgesRendering();
        }
    }

    /**
     * Callback when the HTML element is clicked. Apply that to BabylonJs entity.
     */
    public click(): void {
        let actions: IAction[] = [];

        actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnLeftPickTrigger));
        actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnPickTrigger));

        actions.forEach((action) => {
            action._executeCurrent();
        });
    }

    /**
     * Callback when the HTML element is right clicked. Apply that to BabylonJs entity.
     */
    public rightClick(): void {
        let actions: IAction[] = [];

        actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnRightPickTrigger));
        actions.push(...this._getTriggerActions(this.entity, Constants.ACTION_OnPickTrigger));

        actions.forEach((action) => {
            action._executeCurrent();
        });
    }

    private _getTriggerActions(node: Node, trigger: number): IAction[] {
        const triggerActions = node._getActionManagerForTrigger(trigger)?.actions.filter(action => action.trigger == trigger);
        return triggerActions?? [];
    }
}