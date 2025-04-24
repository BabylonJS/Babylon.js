import type { Behavior } from "../behavior";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import type { Nullable } from "../../types";
import type { Observer } from "core/Misc/observable";
import type { Scene } from "core/scene";

/**
 * A behavior that when attached to a mesh will allow the mesh to fade in and out
 */
export class FadeInOutBehavior implements Behavior<Mesh> {
    /**
     * Time in milliseconds to delay before fading in (Default: 0)
     */
    public fadeInDelay = 0;

    /**
     * Time in milliseconds to delay before fading out (Default: 0)
     */
    public fadeOutDelay = 0;

    /**
     * Time in milliseconds for the mesh to fade in (Default: 300)
     */
    public fadeInTime = 300;

    /**
     * Time in milliseconds for the mesh to fade out (Default: 300)
     */
    public fadeOutTime = 300;

    /**
     * Time in milliseconds to delay before fading in (Default: 0)
     * Will set both fade in and out delay to the same value
     */
    public get delay(): number {
        return this.fadeInDelay;
    }

    public set delay(value: number) {
        this.fadeInDelay = value;
        this.fadeOutDelay = value;
    }

    private _millisecondsPerFrame = 1000 / 60;
    private _hovered = false;
    private _hoverValue = 0;
    private _ownerNode: Nullable<Mesh> = null;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>> | undefined;
    private _delay: number = 0;
    private _time: number = 300;

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
     * Triggers the mesh to begin fading in (or out)
     * @param fadeIn if the object should fade in or out (true to fade in)
     */
    public fadeIn(fadeIn: boolean = true) {
        this._delay = fadeIn ? this.fadeInDelay : this.fadeOutDelay;
        this._time = fadeIn ? this.fadeInTime : this.fadeOutTime;

        // Cancel any pending updates
        this._detachObserver();

        // If fading in and already visible or fading out and already not visible do nothing
        if (this._ownerNode && ((fadeIn && this._ownerNode.visibility >= 1) || (!fadeIn && this._ownerNode.visibility <= 0))) {
            return;
        }

        this._hovered = fadeIn;
        if (!this._hovered) {
            // Make the delay the negative of fadeout delay so the hoverValue is kept above 1 until
            // fadeOutDelay has elapsed
            this._delay *= -1;
        }

        // Reset the hoverValue.  This is necessary because we may have been fading out, e.g. but not yet reached
        // the delay, so the hover value is greater than 1
        if (this._ownerNode!.visibility >= 1) {
            this._hoverValue = this._time;
        } else if (this._ownerNode!.visibility <= 0) {
            this._hoverValue = 0;
        }
        this._update();
    }

    /**
     * Triggers the mesh to begin fading out
     */
    public fadeOut() {
        this.fadeIn(false);
    }

    private _update = () => {
        if (this._ownerNode) {
            this._hoverValue += this._hovered ? this._millisecondsPerFrame : -this._millisecondsPerFrame;

            this._setAllVisibility(this._ownerNode, (this._hoverValue - this._delay) / this._time);

            if (this._ownerNode.visibility > 1) {
                this._setAllVisibility(this._ownerNode, 1);
                if (this._hoverValue > this._time) {
                    this._hoverValue = this._time;
                    this._detachObserver();
                    return;
                }
            } else if (this._ownerNode.visibility < 0) {
                this._setAllVisibility(this._ownerNode, 0);
                if (this._hoverValue < 0) {
                    this._hoverValue = 0;
                    this._detachObserver();
                    return;
                }
            }

            this._attachObserver();
        }
    };

    private _setAllVisibility(mesh: AbstractMesh, value: number) {
        mesh.visibility = value;

        const children = mesh.getChildMeshes();

        for (const c of children) {
            this._setAllVisibility(c, value);
        }
    }

    private _attachObserver() {
        if (!this._onBeforeRenderObserver) {
            this._onBeforeRenderObserver = this._ownerNode?.getScene().onBeforeRenderObservable.add(this._update);
        }
    }

    private _detachObserver() {
        if (this._onBeforeRenderObserver) {
            this._ownerNode?.getScene().onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }
    }
}
