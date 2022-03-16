import { Behavior } from "../behavior";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { Nullable } from "../../types";

/**
 * A behavior that when attached to a mesh will allow the mesh to fade in and out
 */
export class FadeInOutBehavior implements Behavior<Mesh> {
    /**
     * Time in milliseconds to delay before fading in (Default: 0)
     */
    public delay = 0;
    /**
     * Time in milliseconds for the mesh to fade in (Default: 300)
     */
    public fadeInTime = 300;

    private _millisecondsPerFrame = 1000 / 60;
    private _hovered = false;
    private _hoverValue = 0;
    private _ownerNode: Nullable<Mesh> = null;

    /**
     * Instantiates the FadeInOutBehavior
     */
    constructor() {
    }

    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "FadeInOut";
    }

    /**
     *  Initializes the behavior
     */
    public init() {
    }

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
        this._hovered = value;
        this._update();
    }

    private _update = () => {
        if (this._ownerNode) {
            this._hoverValue += this._hovered ? this._millisecondsPerFrame : -this._millisecondsPerFrame;

            this._setAllVisibility(this._ownerNode, (this._hoverValue - this.delay) / this.fadeInTime);

            if (this._ownerNode.visibility > 1) {
                this._setAllVisibility(this._ownerNode, 1);
                this._hoverValue = this.fadeInTime + this.delay;
                return;
            } else if (this._ownerNode.visibility < 0) {
                this._setAllVisibility(this._ownerNode, 0);
                if (this._hoverValue < 0) {
                    this._hoverValue = 0;
                    return;
                }
            }
            setTimeout(this._update, this._millisecondsPerFrame);
        }
    }

    private _setAllVisibility(mesh: AbstractMesh, value: number) {
        mesh.visibility = value;
        mesh.getChildMeshes().forEach((c) => {
            this._setAllVisibility(c, value);
        });
    }

}
