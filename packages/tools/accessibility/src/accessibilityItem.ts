import { Node } from "core/node";
import { Control } from "gui/2D/controls/control";

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
     * The children of this item in the accessibility tree.
     */
    public children: AccessibilityItem[];

    constructor(entity: AccessibilityEntity, children: AccessibilityItem[]) {
        this.entity = entity;
        this.children = children;
    }

    /**
     * The text content displayed in HTML element.
     * Returns the description in accessibilityTag, if defined (returns "" by default).
     */
    public get description(): string {
        return this.entity.accessibilityTag?.description ?? "";;
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
    public focus(): void {
    }

    /**
     * Callback when the HTML element is blured. Dismiss visual indication on BabylonJS entity.
     * Implemented by child classes
     */
    public blur(): void {
    }

    /**
     * Callback when the HTML element is clicked. Apply that to BabylonJs entity.
     * Implemented by child classes
     */
    public click(): void {
    }

    /**
     * Callback when the HTML element is right clicked. Apply that to BabylonJs entity.
     * Implemented by child classes
     */
    public rightClick(): void {
    }

    // TODO: maybe remove this
    public toString(): string {
        return `{${this.entity.name}, [${this.children.map((child) => `${child.toString()}`).join(", ")}]}`;
    }

    protected _isActionable: boolean;
    protected _isFocusable: boolean;
}