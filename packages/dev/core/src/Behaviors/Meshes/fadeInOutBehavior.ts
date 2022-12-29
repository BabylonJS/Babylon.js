import type { Behavior } from "../behavior";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import type { Nullable } from "../../types";

/**
 * A behavior that when attached to a mesh will allow the mesh to fade in and out
 */
export class FadeInOutBehavior implements Behavior<Mesh> {
    /**
     * Time in milliseconds to delay before fading in (Default: 0)
     */
    public delay = 0;

    /**
     * Time in milliseconds to delay before fading out (Default: 0)
     */
    public fadeOutDelay = 0;

    /**
     * Time in milliseconds for the mesh to fade in (Default: 300)
     */
    public fadeInTime = 300;

    private _millisecondsPerFrame = 1000 / 60;
    private _hovered = false;
    private _hoverValue = 0;
    private _ownerNode: Nullable<Mesh> = null;
    private _timeoutHandle: Nullable<NodeJS.Timeout>;

    /**
     * Instantiates the FadeInOutBehavior
     */
    constructor() {}

    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "FadeInOut";
    }

    /**
     *  Initializes the behavior
     */
    public init() {}

    /**
     * Attaches the fade behavior on the passed in mesh
     * @param ownerNode The mesh that will be faded in/out once attached
     */
    public attach(ownerNode: Mesh): void {
        this._ownerNode = ownerNode;
        this._setAllVisibility(this._ownerNode, 0);
    }
    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        this._ownerNode = null;
    }

    /**
     * Triggers the mesh to begin fading in or out
     * @param value if the object should fade in or out (true to fade in)
     */
    public fadeIn(value: boolean) {
        // Otherwise the value has changed so abort the next update
        if (this._timeoutHandle) {
            // prevent any pending updates
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }

        if (this._ownerNode && 
            ((value && this._ownerNode.visibility >= 1) || 
            (!value && this._ownerNode.visibility <= 0))) {
            // If fading in and already visible or fading out and already not visible do nothing
            return;
        }

        this._hovered = value;

        // Reset the hoverValue.  This is neccessary becasue we may have been fading out, e.g. but not yet reached
        // the delay, so the hover value is greater than 1
        if (this._ownerNode!.visibility >= 1) {
            this._hoverValue = this.fadeInTime;
        } else if (this._ownerNode!.visibility <= 0) {
            this._hoverValue = 0;
        }
        this._update();
    }

    private _update = () => {
        if (this._ownerNode) {
            this._hoverValue += this._hovered ? this._millisecondsPerFrame : -this._millisecondsPerFrame;

            this._setAllVisibility(this._ownerNode, this._hovered ?
                // Keep the visibility value less than 0 until delay has elapsed
                (this._hoverValue - this.delay) / this.fadeInTime :
                // keep the visibility value greater than 1 until delay has elapsed
                (this._hoverValue + this.fadeOutDelay) / this.fadeInTime)

            if (this._ownerNode.visibility > 1) {
                this._setAllVisibility(this._ownerNode, 1);
                if (this._hoverValue > this.fadeInTime) {
                    this._hoverValue = this.fadeInTime;
                    return;
                }
            } else if (this._ownerNode.visibility < 0) {
                this._setAllVisibility(this._ownerNode, 0);
                if (this._hoverValue < 0) {
                    this._hoverValue = 0;
                    return;
                }
            }
            this._timeoutHandle = setTimeout(this._update, this._millisecondsPerFrame);
        }
    };

    private _setAllVisibility(mesh: AbstractMesh, value: number) {
        mesh.visibility = value;
        mesh.getChildMeshes().forEach((c) => {
            this._setAllVisibility(c, value);
        });
    }
}
