import { StandardMaterial } from "core/Materials/standardMaterial";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { Node } from "core/node";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { Button } from "gui/2D/controls/button";
import { Container } from "gui/2D/controls/container";
import { Control } from "gui/2D/controls/control";
import { Image } from "gui/2D/controls/image";
import { TextBlock } from "gui/2D/controls/textBlock";
import type { ReactElement } from "react";
import type { IHTMLTwinRendererOptions } from "./htmlTwinRenderer";

export type AccessibilityEntity = Node | Control; // only these types have their html twin

// items are clickable if they are:
// a) buttons
// b) meshes with pick triggers
export function isClickable(item: AccessibilityEntity): boolean {
    if (item instanceof Button) {
        return true;
    } else if (item instanceof AbstractMesh) {
        return item.actionManager?.hasPickTriggers ?? false;
    }
    return false;
}

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

export function isAccessibleElement(item: AccessibilityEntity): boolean {
    const accessibleDescription = getDescriptionFromNode(item);
    if (accessibleDescription) {
        return true;
    }
    const accessibleTexture = getAccessibleTexture(item);
    if (accessibleTexture) {
        return true;
    }
    return false;
}

export function hasAccessibleElement(item: AccessibilityEntity): boolean {
    let result = false;
    const directChildren = getDirectChildrenOf(item);
    // console.log("children of node", item.name, directChildren);
    for (const child of directChildren) {
        result ||= hasAccessibleElement(child);
    }
    result ||= !!isAccessibleElement(item);
    // console.log("node", item.name, "has accessible element", result);
    return result;
}

export function hasChildren(item: AccessibilityEntity) {
    return getDirectChildrenOf(item).length > 0;
}

export function getDirectChildrenOf(item: AccessibilityEntity): AccessibilityEntity[] {
    if (item instanceof Node) {
        return item.getDescendants(true);
    } else if (item instanceof Container && !(item instanceof Button)) {
        return item.children;
    }
    return [];
}

export function isVisible(item: AccessibilityEntity): boolean {
    if (item instanceof Node) {
        return item.isEnabled();
    } else if (item instanceof Control) {
        return item.isEnabled && item.isVisible;
    }
    return false;
}

export function getDescriptionFromNode(node: AccessibilityEntity): string | undefined {
    const accessibleDescription = node.accessibilityTag?.description;
    if (accessibleDescription) {
        return accessibleDescription;
    }
    // check for text blocks
    if (node instanceof TextBlock) {
        return node.text;
    }
    if (node instanceof Image) {
        return node.alt;
    }
    if (node instanceof Button) {
        return node.textBlock?.text;
    }
}

/**
 *
 */
export function getAccessibleItemFromNode(node: AccessibilityEntity): Nullable<ReactElement> {
    const isAccessible = isAccessibleElement(node);
    const accessibleDescription = getDescriptionFromNode(node);
    const isClickableNode = isClickable(node);
    if (isAccessible) {
        if (isClickableNode) {
            return <button>{accessibleDescription}</button>;
        } else {
            return <div>{accessibleDescription}</div>;
        }
    } else {
        return null;
    }
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

    constructor(entity: AccessibilityEntity, scene: Scene) {
        this.entity = entity;
        this.scene = scene;
    }

    /**
     * The text content displayed in HTML element.
     * Returns the description in accessibilityTag, if defined (returns "" by default).
     */
    public getDescription(options: IHTMLTwinRendererOptions): string {
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
