import { Control } from "./control";
import { Measure } from "../measure";
import { Nullable } from "babylonjs";
import { AdvancedDynamicTexture } from "../advancedDynamicTexture";

/**
 * Root class for 2D containers
 * @see http://doc.babylonjs.com/how_to/gui#containers
 */
export class Container extends Control {
    /** @hidden */
    protected _children = new Array<Control>();
    /** @hidden */
    protected _measureForChildren = Measure.Empty();
    /** @hidden */
    protected _background: string;
    /** @hidden */
    protected _adaptWidthToChildren = false;
    /** @hidden */
    protected _adaptHeightToChildren = false;

    /** Gets or sets a boolean indicating if the container should try to adapt to its children height */
    public get adaptHeightToChildren(): boolean {
        return this._adaptHeightToChildren;
    }

    public set adaptHeightToChildren(value: boolean) {
        if (this._adaptHeightToChildren === value) {
            return;
        }

        this._adaptHeightToChildren = value;

        if (value) {
            this.height = "100%";
        }

        this._markAsDirty();
    }

    /** Gets or sets a boolean indicating if the container should try to adapt to its children width */
    public get adaptWidthToChildren(): boolean {
        return this._adaptWidthToChildren;
    }

    public set adaptWidthToChildren(value: boolean) {
        if (this._adaptWidthToChildren === value) {
            return;
        }

        this._adaptWidthToChildren = value;

        if (value) {
            this.width = "100%";
        }

        this._markAsDirty();
    }

    /** Gets or sets background color */
    public get background(): string {
        return this._background;
    }

    public set background(value: string) {
        if (this._background === value) {
            return;
        }

        this._background = value;
        this._markAsDirty();
    }

    /** Gets the list of children */
    public get children(): Control[] {
        return this._children;
    }

    /**
     * Creates a new Container
     * @param name defines the name of the container
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Container";
    }

    public _flagDescendantsAsMatrixDirty(): void {
        for (var child of this.children) {
            child._markMatrixAsDirty();
        }
    }

    /**
     * Gets a child using its name
     * @param name defines the child name to look for
     * @returns the child control if found
     */
    public getChildByName(name: string): Nullable<Control> {
        for (var child of this.children) {
            if (child.name === name) {
                return child;
            }
        }

        return null;
    }

    /**
     * Gets a child using its type and its name
     * @param name defines the child name to look for
     * @param type defines the child type to look for
     * @returns the child control if found
     */
    public getChildByType(name: string, type: string): Nullable<Control> {
        for (var child of this.children) {
            if (child.typeName === type) {
                return child;
            }
        }

        return null;
    }

    /**
     * Search for a specific control in children
     * @param control defines the control to look for
     * @returns true if the control is in child list
     */
    public containsControl(control: Control): boolean {
        return this.children.indexOf(control) !== -1;
    }

    /**
     * Adds a new control to the current container
     * @param control defines the control to add
     * @returns the current container
     */
    public addControl(control: Nullable<Control>): Container {
        if (!control) {
            return this;
        }

        var index = this._children.indexOf(control);

        if (index !== -1) {
            return this;
        }
        control._link(this, this._host);

        control._markAllAsDirty();

        this._reOrderControl(control);

        this._markAsDirty();
        return this;
    }

    /**
     * Removes all controls from the current container
     * @returns the current container
     */
    public clearControls(): Container {
        let children = this._children.slice();

        for (var child of children) {
            this.removeControl(child);
        }

        return this;
    }

    /**
     * Removes a control from the current container
     * @param control defines the control to remove
     * @returns the current container
     */
    public removeControl(control: Control): Container {
        var index = this._children.indexOf(control);

        if (index !== -1) {
            this._children.splice(index, 1);

            control.parent = null;
        }

        control.linkWithMesh(null);

        if (this._host) {
            this._host._cleanControlAfterRemoval(control);
        }

        this._markAsDirty();
        return this;
    }

    /** @hidden */
    public _reOrderControl(control: Control): void {
        this.removeControl(control);

        for (var index = 0; index < this._children.length; index++) {
            if (this._children[index].zIndex > control.zIndex) {
                this._children.splice(index, 0, control);
                return;
            }
        }

        this._children.push(control);

        control.parent = this;

        this._markAsDirty();
    }

    /** @hidden */
    public _markAllAsDirty(): void {
        super._markAllAsDirty();

        for (var index = 0; index < this._children.length; index++) {
            this._children[index]._markAllAsDirty();
        }
    }

    /** @hidden */
    protected _localDraw(context: CanvasRenderingContext2D): void {
        if (this._background) {
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }

            context.fillStyle = this._background;
            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }
        }
    }

    /** @hidden */
    public _link(root: Nullable<Container>, host: AdvancedDynamicTexture): void {
        super._link(root, host);

        for (var child of this._children) {
            child._link(this, host);
        }
    }

    /** @hidden */
    public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        if (!this.isVisible || this.notRenderable) {
            return;
        }
        context.save();

        this._applyStates(context);

        if (this._processMeasures(parentMeasure, context)) {

            if (this.onBeforeDrawObservable.hasObservers()) {
                this.onBeforeDrawObservable.notifyObservers(this);
            }

            this._localDraw(context);

            if (this.clipChildren) {
                this._clipForChildren(context);
            }

            let computedWidth = -1;
            let computedHeight = -1;

            for (var child of this._children) {
                if (child.isVisible && !child.notRenderable) {
                    child._tempParentMeasure.copyFrom(this._measureForChildren);

                    child._draw(this._measureForChildren, context);

                    if (child.onAfterDrawObservable.hasObservers()) {
                        child.onAfterDrawObservable.notifyObservers(child);
                    }

                    if (this.adaptWidthToChildren && child._width.isPixel) {
                        computedWidth = Math.max(computedWidth, child._currentMeasure.width);
                    }
                    if (this.adaptHeightToChildren && child._height.isPixel) {
                        computedHeight = Math.max(computedHeight, child._currentMeasure.height);
                    }
                }
            }

            if (this.adaptWidthToChildren && computedWidth >= 0) {
                this.width = computedWidth + "px";
            }
            if (this.adaptHeightToChildren && computedHeight >= 0) {
                this.height = computedHeight + "px";
            }
        }
        context.restore();

        if (this.onAfterDrawObservable.hasObservers()) {
            this.onAfterDrawObservable.notifyObservers(this);
        }
    }

    /** @hidden */
    public _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number): boolean {
        if (!this.isVisible || this.notRenderable) {
            return false;
        }

        if (!super.contains(x, y)) {
            return false;
        }

        // Checking backwards to pick closest first
        for (var index = this._children.length - 1; index >= 0; index--) {
            var child = this._children[index];
            if (child._processPicking(x, y, type, pointerId, buttonIndex)) {
                if (child.hoverCursor) {
                    this._host._changeCursor(child.hoverCursor);
                }
                return true;
            }
        }

        if (!this.isHitTestVisible) {
            return false;
        }

        return this._processObservables(type, x, y, pointerId, buttonIndex);
    }

    /** @hidden */
    protected _clipForChildren(context: CanvasRenderingContext2D): void {
        // DO nothing
    }

    /** @hidden */
    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.copyFrom(this._currentMeasure);
    }

    /** Releases associated resources */
    public dispose() {
        super.dispose();

        for (var control of this._children) {
            control.dispose();
        }
    }
}