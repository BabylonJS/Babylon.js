import type { ScalarProperty, Vector2Property } from "../lottie/parsedTypes";
import { Node } from "./node";

/**
 * This represents a top node of the scenegraph in a Lottie animation.
 * Each top level layer in Lottie is represented by a control node node.
 */
export class ControlNode extends Node {
    private _inFrame: number;
    private _outFrame: number;

    /**
     * Constructs a new control node.
     * @param id Unique identifier for the node.
     * @param ignoreOpacityAnimations If there are no animations on opacity, mark this as true to ignore and optimize CPU usage.
     * @param inFrame Frame at which the node becomes active.
     * @param outFrame Frame at which the node becomes inactive.
     * @param position Position of the node in the scene.
     * @param rotation Rotation of the node in degrees.
     * @param scale Scale of the node in the scene.
     * @param opacity Opacity of the node, from 0 to 1.
     * @param parent Parent node in the scenegraph.
     */
    public constructor(
        id: string,
        ignoreOpacityAnimations: boolean,
        inFrame: number,
        outFrame: number,
        position?: Vector2Property,
        rotation?: ScalarProperty,
        scale?: Vector2Property,
        opacity?: ScalarProperty,
        parent?: Node
    ) {
        super(id, ignoreOpacityAnimations, position, rotation, scale, opacity, parent);
        this._inFrame = inFrame;
        this._outFrame = outFrame;

        this._isControl = true;
    }

    /**
     * Updates the node's properties based on the current frame of the animation.
     * This node will only be updated if the current frame is within the in and out range.
     * @param frame Frame number we are playing in the animation.
     * @param isParentUpdated Whether the parent node has been updated.
     * @param isReset Whether the node is being reset.
     * @returns True if the node was updated, false otherwise.
     */
    public override update(frame: number, isParentUpdated = false, isReset = false): boolean {
        // Only update if the frame is within the in and out range
        this.isVisible = frame >= this._inFrame && frame <= this._outFrame - 1;
        return super.update(frame, isParentUpdated, isReset);
    }
}
