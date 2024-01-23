import type { Nullable } from "core/types";
import { Logger } from "core/Misc/logger";

import { Control } from "./control";
import { Measure } from "../measure";
import type { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import { RegisterClass } from "core/Misc/typeStore";
import type { PointerInfoBase } from "core/Events/pointerEvents";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";
import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Constants } from "core/Engines/constants";
import { Observable } from "core/Misc/observable";
import type { BaseGradient } from "./gradient/BaseGradient";
import { Tools } from "core/Misc/tools";
import { Matrix2D } from "../math2D";

/**
 * Root class for 2D containers
 * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#containers
 */
export class Container extends Control {
    /** @internal */
    public _children = new Array<Control>();
    /** @internal */
    protected _measureForChildren = Measure.Empty();
    /** @internal */
    protected _background = "";
    /** @internal */
    protected _backgroundGradient: Nullable<BaseGradient> = null;
    /** @internal */
    protected _adaptWidthToChildren = false;
    /** @internal */
    protected _adaptHeightToChildren = false;
    /** @internal */
    protected _renderToIntermediateTexture: boolean = false;
    /** @internal */
    protected _intermediateTexture: Nullable<DynamicTexture> = null;

    /**
     * Gets or sets a boolean indicating that the container will let internal controls handle picking instead of doing it directly using its bounding info
     */
    @serialize()
    public delegatePickingToChildren = false;

    /** Gets or sets boolean indicating if children should be rendered to an intermediate texture rather than directly to host, useful for alpha blending */
    @serialize()
    public get renderToIntermediateTexture(): boolean {
        return this._renderToIntermediateTexture;
    }
    public set renderToIntermediateTexture(value: boolean) {
        if (this._renderToIntermediateTexture === value) {
            return;
        }
        this._renderToIntermediateTexture = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets a boolean indicating that layout cycle errors should be displayed on the console
     */
    public logLayoutCycleErrors = false;

    /**
     * Gets or sets the number of layout cycles (a change involved by a control while evaluating the layout) allowed
     */
    @serialize()
    public maxLayoutCycle = 3;

    /** Gets or sets a boolean indicating if the container should try to adapt to its children height */
    @serialize()
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
    @serialize()
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
    @serialize()
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

    /** Gets or sets background gradient color. Takes precedence over background */
    @serialize()
    public get backgroundGradient() {
        return this._backgroundGradient;
    }

    public set backgroundGradient(value: Nullable<BaseGradient>) {
        if (this._backgroundGradient === value) {
            return;
        }
        this._backgroundGradient = value;
        this._markAsDirty();
    }

    /** Gets the list of children */
    public get children(): Control[] {
        return this._children;
    }

    public get isReadOnly() {
        return this._isReadOnly;
    }

    public set isReadOnly(value: boolean) {
        this._isReadOnly = value;

        for (const child of this._children) {
            child.isReadOnly = value;
        }
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
        for (const child of this.children) {
            child._isClipped = false;
            child._markMatrixAsDirty();
        }
    }

    /**
     * Gets a child using its name
     * @param name defines the child name to look for
     * @returns the child control if found
     */
    public getChildByName(name: string): Nullable<Control> {
        for (const child of this.children) {
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
        for (const child of this.children) {
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

        const index = this._children.indexOf(control);

        if (index !== -1) {
            return this;
        }
        control._link(this._host);

        control._markAllAsDirty();

        this._reOrderControl(control);

        this._markAsDirty();

        this.onControlAddedObservable.notifyObservers(control);

        return this;
    }

    /**
     * Removes all controls from the current container
     * @returns the current container
     */
    public clearControls(): Container {
        const children = this.children.slice();

        for (const child of children) {
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
        const index = this._children.indexOf(control);

        if (index !== -1) {
            this._children.splice(index, 1);

            control.parent = null;
        }

        control.linkWithMesh(null);

        if (this._host) {
            this._host._cleanControlAfterRemoval(control);
        }

        this._markAsDirty();

        this.onControlRemovedObservable.notifyObservers(control);
        return this;
    }

    /**
     * An event triggered when any control is added to this container.
     */
    public onControlAddedObservable = new Observable<Nullable<Control>>();

    /**
     * An event triggered when any control is removed from this container.
     */
    public onControlRemovedObservable = new Observable<Nullable<Control>>();

    /**
     * @internal
     */
    public _reOrderControl(control: Control): void {
        const linkedMesh = control.linkedMesh;

        this.removeControl(control);

        let wasAdded = false;
        for (let index = 0; index < this._children.length; index++) {
            if (this._children[index].zIndex > control.zIndex) {
                this._children.splice(index, 0, control);
                wasAdded = true;
                break;
            }
        }

        if (!wasAdded) {
            this._children.push(control);
        }

        control.parent = this;

        if (linkedMesh) {
            control.linkWithMesh(linkedMesh);
        }

        this._markAsDirty();
    }

    /**
     * @internal
     */
    public _offsetLeft(offset: number) {
        super._offsetLeft(offset);

        for (const child of this._children) {
            child._offsetLeft(offset);
        }
    }

    /**
     * @internal
     */
    public _offsetTop(offset: number) {
        super._offsetTop(offset);

        for (const child of this._children) {
            child._offsetTop(offset);
        }
    }

    /** @internal */
    public _markAllAsDirty(): void {
        super._markAllAsDirty();

        for (let index = 0; index < this._children.length; index++) {
            this._children[index]._markAllAsDirty();
        }
    }

    protected _getBackgroundColor(context: ICanvasRenderingContext) {
        return this._backgroundGradient ? this._backgroundGradient.getCanvasGradient(context) : this._background;
    }

    /**
     * @internal
     */
    protected _localDraw(context: ICanvasRenderingContext): void {
        if (this._background || this._backgroundGradient) {
            context.save();
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }

            context.fillStyle = this._getBackgroundColor(context);

            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            context.restore();
        }
    }

    /**
     * @internal
     */
    public _link(host: AdvancedDynamicTexture): void {
        super._link(host);

        for (const child of this._children) {
            child._link(host);
        }
    }

    /** @internal */
    protected _beforeLayout() {
        // Do nothing
    }

    /**
     * @internal
     */
    protected _processMeasures(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
            super._processMeasures(parentMeasure, context);
            this._evaluateClippingState(parentMeasure);
            if (this._renderToIntermediateTexture) {
                if (this._intermediateTexture && this._host.getScene() != this._intermediateTexture.getScene()) {
                    this._intermediateTexture.dispose();
                    this._intermediateTexture = null;
                }
                if (!this._intermediateTexture) {
                    this._intermediateTexture = new DynamicTexture(
                        "",
                        { width: this._currentMeasure.width, height: this._currentMeasure.height },
                        this._host.getScene(),
                        false,
                        Texture.NEAREST_SAMPLINGMODE,
                        Constants.TEXTUREFORMAT_RGBA,
                        false
                    );
                    this._intermediateTexture.hasAlpha = true;
                } else {
                    this._intermediateTexture.scaleTo(this._currentMeasure.width, this._currentMeasure.height);
                }
            }
        }
    }

    /**
     * @internal
     */
    public _layout(parentMeasure: Measure, context: ICanvasRenderingContext): boolean {
        if (!this.isDirty && (!this.isVisible || this.notRenderable)) {
            return false;
        }

        this.host._numLayoutCalls++;

        if (this._isDirty) {
            this._currentMeasure.transformToRef(this._transformMatrix, this._prevCurrentMeasureTransformedIntoGlobalSpace);
        }

        let rebuildCount = 0;

        context.save();

        this._applyStates(context);

        this._beforeLayout();

        do {
            let computedWidth = -1;
            let computedHeight = -1;
            this._rebuildLayout = false;
            this._processMeasures(parentMeasure, context);

            if (!this._isClipped) {
                for (const child of this._children) {
                    child._tempParentMeasure.copyFrom(this._measureForChildren);

                    if (child._layout(this._measureForChildren, context)) {
                        if (child.isVisible && !child.notRenderable) {
                            if (this.adaptWidthToChildren && child._width.isPixel) {
                                computedWidth = Math.max(computedWidth, child._currentMeasure.width + child._paddingLeftInPixels + child._paddingRightInPixels);
                            }
                            if (this.adaptHeightToChildren && child._height.isPixel) {
                                computedHeight = Math.max(computedHeight, child._currentMeasure.height + child._paddingTopInPixels + child._paddingBottomInPixels);
                            }
                        }
                    }
                }

                if (this.adaptWidthToChildren && computedWidth >= 0) {
                    computedWidth += this.paddingLeftInPixels + this.paddingRightInPixels;
                    if (this.width !== computedWidth + "px") {
                        this.parent?._markAsDirty();
                        this.width = computedWidth + "px";
                        this._width.ignoreAdaptiveScaling = true;
                        this._rebuildLayout = true;
                    }
                }
                if (this.adaptHeightToChildren && computedHeight >= 0) {
                    computedHeight += this.paddingTopInPixels + this.paddingBottomInPixels;
                    if (this.height !== computedHeight + "px") {
                        this.parent?._markAsDirty();
                        this.height = computedHeight + "px";
                        this._height.ignoreAdaptiveScaling = true;
                        this._rebuildLayout = true;
                    }
                }

                this._postMeasure();
            }
            rebuildCount++;
        } while (this._rebuildLayout && rebuildCount < this.maxLayoutCycle);

        if (rebuildCount >= 3 && this.logLayoutCycleErrors) {
            Logger.Error(`Layout cycle detected in GUI (Container name=${this.name}, uniqueId=${this.uniqueId})`);
        }

        context.restore();

        if (this._isDirty) {
            this.invalidateRect();

            this._isDirty = false;
        }

        return true;
    }

    protected _postMeasure() {
        // Do nothing by default
    }

    private _inverseTransformMatrix = Matrix2D.Identity();
    private _inverseMeasure = new Measure(0, 0, 0, 0);

    /**
     * @internal
     */
    public _draw(context: ICanvasRenderingContext, invalidatedRectangle?: Measure): void {
        const renderToIntermediateTextureThisDraw = this._renderToIntermediateTexture && this._intermediateTexture;
        const contextToDrawTo = renderToIntermediateTextureThisDraw ? (<DynamicTexture>this._intermediateTexture).getContext() : context;

        if (renderToIntermediateTextureThisDraw) {
            contextToDrawTo.save();
            contextToDrawTo.translate(-this._currentMeasure.left, -this._currentMeasure.top);
            if (invalidatedRectangle) {
                this._transformMatrix.invertToRef(this._inverseTransformMatrix);
                invalidatedRectangle.transformToRef(this._inverseTransformMatrix, this._inverseMeasure);
                contextToDrawTo.clearRect(this._inverseMeasure.left, this._inverseMeasure.top, this._inverseMeasure.width, this._inverseMeasure.height);
            } else {
                contextToDrawTo.clearRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }
        }

        this._localDraw(contextToDrawTo);

        context.save();

        if (this.clipChildren) {
            this._clipForChildren(contextToDrawTo);
        }

        for (const child of this._children) {
            // Only redraw parts of the screen that are invalidated
            if (invalidatedRectangle) {
                if (!child._intersectsRect(invalidatedRectangle)) {
                    continue;
                }
            }
            child._render(contextToDrawTo, invalidatedRectangle);
        }

        if (renderToIntermediateTextureThisDraw) {
            contextToDrawTo.restore();
            context.save();
            context.globalAlpha = this.alpha;
            context.drawImage(contextToDrawTo.canvas, this._currentMeasure.left, this._currentMeasure.top);
            context.restore();
        }

        context.restore();
    }

    public getDescendantsToRef(results: Control[], directDescendantsOnly: boolean = false, predicate?: (control: Control) => boolean): void {
        if (!this.children) {
            return;
        }

        for (let index = 0; index < this.children.length; index++) {
            const item = this.children[index];

            if (!predicate || predicate(item)) {
                results.push(item);
            }

            if (!directDescendantsOnly) {
                item.getDescendantsToRef(results, false, predicate);
            }
        }
    }

    /**
     * @internal
     */
    public _processPicking(x: number, y: number, pi: Nullable<PointerInfoBase>, type: number, pointerId: number, buttonIndex: number, deltaX?: number, deltaY?: number): boolean {
        if (!this._isEnabled || !this.isVisible || this.notRenderable) {
            return false;
        }

        // checks if the picking position is within the container
        const contains = super.contains(x, y);

        // if clipChildren is off, we should still pass picking events to children even if we don't contain the pointer
        if (!contains && this.clipChildren) {
            return false;
        }

        if (this.delegatePickingToChildren) {
            let contains = false;
            for (let index = this._children.length - 1; index >= 0; index--) {
                const child = this._children[index];
                if (child.isEnabled && child.isHitTestVisible && child.isVisible && !child.notRenderable && child.contains(x, y)) {
                    contains = true;
                    break;
                }
            }

            if (!contains) {
                return false;
            }
        }

        // Checking backwards to pick closest first
        for (let index = this._children.length - 1; index >= 0; index--) {
            const child = this._children[index];
            if (child._processPicking(x, y, pi, type, pointerId, buttonIndex, deltaX, deltaY)) {
                if (child.hoverCursor) {
                    this._host._changeCursor(child.hoverCursor);
                }
                return true;
            }
        }

        if (!contains) {
            return false;
        }

        if (!this.isHitTestVisible) {
            return false;
        }

        return this._processObservables(type, x, y, pi, pointerId, buttonIndex, deltaX, deltaY);
    }

    /**
     * @internal
     */
    protected _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.copyFrom(this._currentMeasure);
    }

    protected _getAdaptDimTo(dim: "width" | "height"): boolean {
        if (dim === "width") {
            return this.adaptWidthToChildren;
        } else {
            return this.adaptHeightToChildren;
        }
    }

    public isDimensionFullyDefined(dim: "width" | "height"): boolean {
        if (this._getAdaptDimTo(dim)) {
            for (const child of this.children) {
                if (!child.isDimensionFullyDefined(dim)) {
                    return false;
                }
            }
            return true;
        }
        return super.isDimensionFullyDefined(dim);
    }

    /**
     * Serializes the current control
     * @param serializationObject defined the JSON serialized object
     * @param force force serialization even if isSerializable === false
     */
    public serialize(serializationObject: any, force: boolean = false) {
        super.serialize(serializationObject, force);
        if (!this.isSerializable && !force) {
            return;
        }

        if (this.backgroundGradient) {
            serializationObject.backgroundGradient = {};
            this.backgroundGradient.serialize(serializationObject.backgroundGradient);
        }

        if (!this.children.length) {
            return;
        }

        serializationObject.children = [];

        for (const child of this.children) {
            if (child.isSerializable || force) {
                const childSerializationObject = {};
                child.serialize(childSerializationObject);
                serializationObject.children.push(childSerializationObject);
            }
        }
    }

    /** Releases associated resources */
    public dispose() {
        super.dispose();

        for (let index = this.children.length - 1; index >= 0; index--) {
            this.children[index].dispose();
        }
        this._intermediateTexture?.dispose();
    }

    /**
     * @internal
     */
    public _parseFromContent(serializedObject: any, host: AdvancedDynamicTexture) {
        super._parseFromContent(serializedObject, host);
        this._link(host);

        // Gradient
        if (serializedObject.backgroundGradient) {
            const className = Tools.Instantiate("BABYLON.GUI." + serializedObject.backgroundGradient.className);
            this._backgroundGradient = new className();
            this._backgroundGradient?.parse(serializedObject.backgroundGradient);
        }

        if (!serializedObject.children) {
            return;
        }

        for (const childData of serializedObject.children) {
            this.addControl(Control.Parse(childData, host));
        }
    }

    public isReady(): boolean {
        for (const child of this.children) {
            if (!child.isReady()) {
                return false;
            }
        }

        return true;
    }
}
RegisterClass("BABYLON.GUI.Container", Container);
