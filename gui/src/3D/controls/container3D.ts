import { Nullable } from "babylonjs/types";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";

import { Control3D } from "./control3D";

/**
 * Class used to create containers for controls
 */
export class Container3D extends Control3D {
    private _blockLayout = false;

    /**
     * Gets the list of child controls
     */
    protected _children = new Array<Control3D>();

    /**
     * Gets the list of child controls
     */
    public get children(): Array<Control3D> {
        return this._children;
    }

    /**
     * Gets or sets a boolean indicating if the layout must be blocked (default is false).
     * This is helpful to optimize layout operation when adding multiple children in a row
     */
    public get blockLayout(): boolean {
        return this._blockLayout;
    }

    public set blockLayout(value: boolean) {
        if (this._blockLayout === value) {
            return;
        }

        this._blockLayout = value;

        if (!this._blockLayout) {
            this._arrangeChildren();
        }
    }

    /**
     * Creates a new container
     * @param name defines the container name
     */
    constructor(name?: string) {
        super(name);
    }

    /**
     * Force the container to update the layout. Please note that it will not take blockLayout property in account
     * @returns the current container
     */
    public updateLayout(): Container3D {
        this._arrangeChildren();
        return this;
    }

    /**
     * Gets a boolean indicating if the given control is in the children of this control
     * @param control defines the control to check
     * @returns true if the control is in the child list
     */
    public containsControl(control: Control3D): boolean {
        return this._children.indexOf(control) !== -1;
    }

    /**
     * Adds a control to the children of this control
     * @param control defines the control to add
     * @returns the current container
     */
    public addControl(control: Control3D): Container3D {
        var index = this._children.indexOf(control);

        if (index !== -1) {
            return this;
        }
        control.parent = this;
        control._host = this._host;

        this._children.push(control);

        if (this._host.utilityLayer) {
            control._prepareNode(this._host.utilityLayer.utilityLayerScene);

            if (control.node) {
                control.node.parent = this.node;
            }

            if (!this.blockLayout) {
                this._arrangeChildren();
            }
        }

        return this;
    }

    /**
     * This function will be called everytime a new control is added
     */
    protected _arrangeChildren() {
    }

    protected _createNode(scene: Scene): Nullable<TransformNode> {
        return new TransformNode("ContainerNode", scene);
    }

    /**
     * Removes a control from the children of this control
     * @param control defines the control to remove
     * @returns the current container
     */
    public removeControl(control: Control3D): Container3D {
        var index = this._children.indexOf(control);

        if (index !== -1) {
            this._children.splice(index, 1);

            control.parent = null;
            control._disposeNode();
        }

        return this;
    }

    protected _getTypeName(): string {
        return "Container3D";
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        for (var control of this._children) {
            control.dispose();
        }

        this._children = [];

        super.dispose();
    }

    /** Control rotation will remain unchanged  */
    public static readonly UNSET_ORIENTATION = 0;

    /** Control will rotate to make it look at sphere central axis */
    public static readonly FACEORIGIN_ORIENTATION = 1;

    /** Control will rotate to make it look back at sphere central axis */
    public static readonly FACEORIGINREVERSED_ORIENTATION = 2;

    /** Control will rotate to look at z axis (0, 0, 1) */
    public static readonly FACEFORWARD_ORIENTATION = 3;

    /** Control will rotate to look at negative z axis (0, 0, -1) */
    public static readonly FACEFORWARDREVERSED_ORIENTATION = 4;

}
