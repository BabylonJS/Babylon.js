import type { Node } from "core/node";
import type { Scene } from "core/scene";
import type { Control } from "gui/2D/controls/control";

export type AccessibilityEntity = Node | Control;

/**
 * A abstract layer to store the accessibility tree structure. It is constructed from the BabylonJS scene entities that need to be accessible. It informs the parent-children relationship of accessibility tree, and informs how to render: description, isActionable, onclick/onrightclick/onfocus/onblur.
 */
export class AccessibilityItem {
    /**
     * The corresponding BabylonJS entity. Can be a Node or a Control.
     */
    public entity: AccessibilityEntity;

    /**
     * The BabylonJS scene that the corresponding BabylonJS entity is in.
     */
    public scene: Scene;

    /**
     * The children of this item in the accessibility tree.
     */
    public children: AccessibilityItem[];

    constructor(entity: AccessibilityEntity, scene: Scene, children: AccessibilityItem[]) {
        this.entity = entity;
        this.children = children;
    }

    /**
     * The text content displayed in HTML element.
     * Returns the description in accessibilityTag, if defined (returns "" by default).
     */
    public get description(): string {
        return this.entity.accessibilityTag?.description ?? "";
    }

    /**
     * If this entity is actionable (can be clicked).
     * Implemented by child classes
     */
    public get isActionable(): boolean {
        return this._isActionable;
    }

    /**
     * If this entity is focusable (can be focused by tab key pressing).
     * Implemented by child classes
     */
    public get isFocusable(): boolean {
        return this._isFocusable;
    }

    /**
     * Callback when the HTML element is focused. Show visual indication on BabylonJS entity.
     * Implemented by child classes
     */
    public focus(): void {}

    /**
     * Callback when the HTML element is blured. Dismiss visual indication on BabylonJS entity.
     * Implemented by child classes
     */
    public blur(): void {}

    /**
     * Callback when an event (e.g. click/right click) happens on the HTML element.
     * Implemented by child classes
     * @param _eventType - Which event is triggered. E.g. "click", "contextmenu"
     */
    public triggerEvent(_eventType: string): void {}

    protected _isActionable: boolean;
    protected _isFocusable: boolean;
}
