import type { ThinSprite } from "core/Sprites/thinSprite";

import type { ScalarProperty, Vector2Property } from "../lottie/parsedTypes";

import { Node } from "../rendering/node";

/**
 * Temporary scale vector used during sprite updates for matrix decomposition.
 */
const TempScale = { x: 1, y: 1 };

/**
 * Represents a sprite in the scene graph.
 */
export class SpriteNode extends Node {
    private _sprite: ThinSprite;
    private _originalWidth: number;
    private _originalHeight: number;

    private _firstTime = true;

    /**
     * Creates a new SpriteNode instance.
     * @param id Unique identifier for the sprite node.
     * @param ignoreOpacityAnimations If there are no animations on opacity, mark this as true to ignore and optimize CPU usage.
     * @param sprite The sprite associated with this node.
     * @param position The position of the sprite in the scene.
     * @param rotation The rotation of the sprite in degrees.
     * @param scale The scale of the sprite in the scene.
     * @param opacity The opacity of the sprite.
     * @param parent The parent node in the scene graph.
     */
    public constructor(
        id: string,
        ignoreOpacityAnimations: boolean,
        sprite: ThinSprite,
        position?: Vector2Property,
        rotation?: ScalarProperty,
        scale?: Vector2Property,
        opacity?: ScalarProperty,
        parent?: Node
    ) {
        super(id, ignoreOpacityAnimations, position, rotation, scale, opacity, parent);

        this._sprite = sprite;
        this._originalWidth = sprite.width;
        this._originalHeight = sprite.height;

        this._isShape = true;
    }

    /**
     * Updates the node's properties based on the current frame of the animation.
     * @param frame Frame number we are playing in the animation.
     * @param isParentUpdated Whether the parent node has been updated.
     * @param isReset Whether the node is being reset.
     * @returns True if the node was updated, false otherwise.
     */
    public override update(frame: number, isParentUpdated = false, isReset = false): boolean {
        const isDirty = super.update(frame, isParentUpdated, isReset) || this._firstTime;
        this._firstTime = false;

        if (isDirty) {
            const rotation = this.worldMatrix.decompose(TempScale, this._sprite.position);

            // Apply scaling to the original sprite dimensions
            this._sprite.width = this._originalWidth * TempScale.x;
            this._sprite.height = this._originalHeight * TempScale.y;

            // Rotation
            this._sprite.angle = rotation;
        }

        // Opacity
        this._sprite.color.a = this.opacity;

        return isDirty;
    }
}
