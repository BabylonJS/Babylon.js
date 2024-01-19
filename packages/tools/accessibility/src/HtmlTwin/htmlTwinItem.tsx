import { StandardMaterial } from "core/Materials/standardMaterial";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { Node } from "core/node";
import type { Scene } from "core/scene";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { Button } from "gui/2D/controls/button";
import { Container } from "gui/2D/controls/container";
import { Control } from "gui/2D/controls/control";
import type { IHTMLTwinRendererOptions } from "./htmlTwinRenderer";

/**
 * The BabylonJS entities that can be accessible. It can be a Node or a Control.
 */
export type AccessibilityEntity = Node | Control;

/**
 * Retrieve an instance of texture with accessible elements (AdvancedDynamicTexture)
 * @param item the item to retrieve the texture from
 * @returns an accessible texture if found, undefined otherwise
 */
export function getAccessibleTexture(item: AccessibilityEntity): AdvancedDynamicTexture | undefined {
    if (item instanceof AbstractMesh && item.material instanceof StandardMaterial) {
        const hasTexture = item.material.emissiveTexture || item.material.diffuseTexture;
        if (hasTexture) {
            const texture = item.material.emissiveTexture ?? item.material.diffuseTexture;
            if (texture instanceof AdvancedDynamicTexture) {
                return texture;
            }
        }
    }
    return undefined;
}

/**
 * Get the direct children of an accessible item.
 * @param item an accessible item
 * @returns a list of accessible items
 */
export function getDirectChildrenOf(item: AccessibilityEntity): AccessibilityEntity[] {
    if (item instanceof Node) {
        return item.getDescendants(true);
    } else if (item instanceof Container && !(item instanceof Button)) {
        return item.children;
    }
    return [];
}

/**
 * Given an accessible item, return if it's visible or not.
 * @param item an accessible item
 * @returns its visibility status
 */
export function isVisible(item: AccessibilityEntity): boolean {
    if (item instanceof Node) {
        return item.isEnabled();
    } else if (item instanceof Control) {
        return item.isEnabled && item.isVisible;
    }
    return false;
}

/**
 * A abstract layer to store the html twin tree structure. It is constructed from the BabylonJS scene entities that need to be accessible. It informs the parent-children relationship of html twin tree, and informs how to render: description, isActionable, onclick/onrightclick/onfocus/onblur.
 */
export class HTMLTwinItem {
    /**
     * The corresponding BabylonJS entity. Can be a Node or a Control.
     */
    public entity: AccessibilityEntity;

    /**
     * The BabylonJS scene that the corresponding BabylonJS entity is in.
     */
    public scene: Scene;

    /**
     * Constructor of HTMLTwinItem.
     * @param entity - The corresponding BabylonJS entity. Can be a Node or a Control.
     * @param scene - The BabylonJS scene that the corresponding BabylonJS entity is in.
     */
    constructor(entity: AccessibilityEntity, scene: Scene) {
        this.entity = entity;
        this.scene = scene;
    }

    /**
     * The text content displayed in HTML element.
     * Returns the description in accessibilityTag, if defined (returns "" by default).
     * @param _options - The options to render the HTML twin tree where this item is contained. Not used in this class, but in its children.
     * @returns the text content displayed in HTML element
     */
    public getDescription(_options: IHTMLTwinRendererOptions): string {
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
