import { Measure } from "../../measure";
import { Container } from "../container";
import { ValueAndUnit } from "../../valueAndUnit";
import { Control } from "../control";

/**
 * Class used to hold a the container for ScrollViewer
 * @hidden
*/
export class _ScrollViewerWindow extends Container {
    public parentClientWidth: number;
    public parentClientHeight: number;

    private _freezeControls = false;
    private _parentMeasure: Measure;
    private _oldLeft: number | null;
    private _oldTop: number | null;

    public get freezeControls(): boolean {
        return this._freezeControls;
    }

    public set freezeControls(value: boolean) {
        if (this._freezeControls === value) {
            return;
        }

        if (!value) {
            this._restoreMeasures();
        }

        // trigger a full normal layout calculation to be sure all children have their measures up to date
        this._freezeControls = false;

        var textureSize = this.host.getSize();
        var renderWidth = textureSize.width;
        var renderHeight = textureSize.height;

        var context = this.host.getContext();

        var measure = new Measure(0, 0, renderWidth, renderHeight);

        this.host._numLayoutCalls = 0;

        this.host._rootContainer._layout(measure, context);

        // in freeze mode, prepare children measures accordingly
        if (value) {
            this._updateMeasures();
            if (this._useBuckets()) {
                this._makeBuckets();
            }
        }

        this._freezeControls = value;

        this.host.markAsDirty(); // redraw with the (new) current settings
    }

    private _bucketWidth: number = 0;
    private _bucketHeight: number = 0;
    private _buckets: { [key: number]: Array<Control> } = {};
    private _bucketLen: number;

    public get bucketWidth(): number {
        return this._bucketWidth;
    }

    public get bucketHeight(): number {
        return this._bucketHeight;
    }

    public setBucketSizes(width: number, height: number): void {
        this._bucketWidth = width;
        this._bucketHeight = height;

        if (this._useBuckets()) {
            if (this._freezeControls) {
                this._makeBuckets();
            }
        } else {
            this._buckets = {};
        }
    }

    private _useBuckets(): boolean {
        return this._bucketWidth > 0 && this._bucketHeight > 0;
    }

    private _makeBuckets(): void {
        this._buckets = {};
        this._bucketLen = Math.ceil(this.widthInPixels / this._bucketWidth);
        this._dispatchInBuckets(this._children);
        this._oldLeft = null;
        this._oldTop = null;
    }

    private _dispatchInBuckets(children: Control[]): void {
        for (let i = 0; i < children.length; ++i) {
            let child = children[i];

            let bStartX = Math.max(0, Math.floor((child._customData._origLeft - this._customData.origLeft) / this._bucketWidth)),
                bEndX = Math.floor((child._customData._origLeft - this._customData.origLeft + child._currentMeasure.width - 1) / this._bucketWidth),
                bStartY = Math.max(0, Math.floor((child._customData._origTop - this._customData.origTop) / this._bucketHeight)),
                bEndY = Math.floor((child._customData._origTop - this._customData.origTop + child._currentMeasure.height - 1) / this._bucketHeight);

            while (bStartY <= bEndY) {
                for (let x = bStartX; x <= bEndX; ++x) {
                    let bucket = bStartY * this._bucketLen + x,
                        lstc = this._buckets[bucket];

                    if (!lstc) {
                        lstc = [];
                        this._buckets[bucket] = lstc;
                    }

                    lstc.push(child);
                }
                bStartY++;
            }

            if (child instanceof Container && child._children.length > 0) {
                this._dispatchInBuckets(child._children);
            }
        }
    }

    // reset left and top measures for the window and all its children
    private _updateMeasures(): void {
        let left = this.leftInPixels | 0,
            top = this.topInPixels | 0;

        this._measureForChildren.left -= left;
        this._measureForChildren.top -= top;
        this._currentMeasure.left -= left;
        this._currentMeasure.top -= top;

        this._customData.origLeftForChildren = this._measureForChildren.left;
        this._customData.origTopForChildren = this._measureForChildren.top;
        this._customData.origLeft = this._currentMeasure.left;
        this._customData.origTop = this._currentMeasure.top;

        this._updateChildrenMeasures(this._children, left, top);
    }

    private _updateChildrenMeasures(children: Control[], left: number, top: number): void {
        for (let i = 0; i < children.length; ++i) {
            let child = children[i];

            child._currentMeasure.left -= left;
            child._currentMeasure.top -= top;

            child._customData._origLeft = child._currentMeasure.left; // save the original left and top values for each child
            child._customData._origTop = child._currentMeasure.top;

            if (child instanceof Container && child._children.length > 0) {
                this._updateChildrenMeasures(child._children, left, top);
            }
        }
    }

    private _restoreMeasures(): void {
        let left = this.leftInPixels | 0,
            top = this.topInPixels | 0;

        this._measureForChildren.left = this._customData.origLeftForChildren + left;
        this._measureForChildren.top = this._customData.origTopForChildren + top;
        this._currentMeasure.left = this._customData.origLeft + left;
        this._currentMeasure.top = this._customData.origTop + top;
    }

    /**
    * Creates a new ScrollViewerWindow
    * @param name of ScrollViewerWindow
    */
    constructor(name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "ScrollViewerWindow";
    }

    /** @hidden */
    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._parentMeasure = parentMeasure;

        this._measureForChildren.left = this._currentMeasure.left;
        this._measureForChildren.top = this._currentMeasure.top;

        this._measureForChildren.width = parentMeasure.width;
        this._measureForChildren.height = parentMeasure.height;
    }

    /** @hidden */
    public _layout(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean {
        if (this._freezeControls) {
            this.invalidateRect(); // will trigger a redraw of the window
            return false;
        }

        return super._layout(parentMeasure, context);
    }

    private _scrollChildren(children: Control[], left: number, top: number): void {
        for (let i = 0; i < children.length; ++i) {
            let child = children[i];

            child._currentMeasure.left = child._customData._origLeft + left;
            child._currentMeasure.top = child._customData._origTop + top;
            child._isClipped = false; // clipping will be handled by _draw and the call to _intersectsRect()

            if (child instanceof Container && child._children.length > 0) {
                this._scrollChildren(child._children, left, top);
            }
        }
    }

    private _scrollChildrenWithBuckets(left: number, top: number, scrollLeft: number, scrollTop: number): void {
        let bStartX = Math.max(0, Math.floor(-left / this._bucketWidth)),
            bEndX = Math.floor((-left + this._parentMeasure.width - 1) / this._bucketWidth),
            bStartY = Math.max(0, Math.floor(-top / this._bucketHeight)),
            bEndY = Math.floor((-top + this._parentMeasure.height - 1) / this._bucketHeight);

        while (bStartY <= bEndY) {
            for (let x = bStartX; x <= bEndX; ++x) {
                let bucket = bStartY * this._bucketLen + x,
                    lstc = this._buckets[bucket];

                if (lstc) {
                    for (let i = 0; i < lstc.length; ++i) {
                        let child = lstc[i];
                        child._currentMeasure.left = child._customData._origLeft + scrollLeft;
                        child._currentMeasure.top = child._customData._origTop + scrollTop;
                        child._isClipped = false; // clipping will be handled by _draw and the call to _intersectsRect()
                    }
                }
            }
            bStartY++;
        }
    }

    /** @hidden */
    public _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Measure): void {
        if (!this._freezeControls) {
            super._draw(context, invalidatedRectangle);
            return;
        }

        this._localDraw(context);

        if (this.clipChildren) {
            this._clipForChildren(context);
        }

        let left = this.leftInPixels | 0,
            top = this.topInPixels | 0;

        if (this._useBuckets()) {
            if (this._oldLeft !== null && this._oldTop !== null) {
                this._scrollChildrenWithBuckets(this._oldLeft, this._oldTop, left, top);
                this._scrollChildrenWithBuckets(left, top, left, top);
            } else {
                this._scrollChildren(this._children, left, top);
            }
        } else {
            this._scrollChildren(this._children, left, top);
        }

        this._oldLeft = left;
        this._oldTop = top;

        for (var child of this._children) {
            if (!child._intersectsRect(this._parentMeasure)) {
                continue;
            }
            child._render(context, this._parentMeasure);
        }
    }

    protected _postMeasure(): void {
        if (this._freezeControls) {
            super._postMeasure();
            return;
        }

        var maxWidth = this.parentClientWidth;
        var maxHeight = this.parentClientHeight;
        for (var child of this.children) {
            if (!child.isVisible || child.notRenderable) {
                continue;
            }

            if (child.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER) {
                child._offsetLeft(this._currentMeasure.left - child._currentMeasure.left);
            }

            if (child.verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER) {
                child._offsetTop(this._currentMeasure.top - child._currentMeasure.top);
            }

            maxWidth = Math.max(maxWidth, child._currentMeasure.left - this._currentMeasure.left + child._currentMeasure.width);
            maxHeight = Math.max(maxHeight, child._currentMeasure.top - this._currentMeasure.top + child._currentMeasure.height);
        }

        if (this._currentMeasure.width !== maxWidth) {
            this._width.updateInPlace(maxWidth, ValueAndUnit.UNITMODE_PIXEL);
            this._currentMeasure.width = maxWidth;
            this._rebuildLayout = true;
            this._isDirty = true;
        }

        if (this._currentMeasure.height !== maxHeight) {
            this._height.updateInPlace(maxHeight, ValueAndUnit.UNITMODE_PIXEL);
            this._currentMeasure.height = maxHeight;
            this._rebuildLayout = true;
            this._isDirty = true;
        }

        super._postMeasure();
    }

}