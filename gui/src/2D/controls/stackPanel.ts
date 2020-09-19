import { Tools } from "babylonjs/Misc/tools";

import { Container } from "./container";
import { Measure } from "../measure";
import { Control } from "./control";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/**
 * Class used to create a 2D stack panel container
 */
export class StackPanel extends Container {
    private _isVertical = true;
    private _manualWidth = false;
    private _manualHeight = false;
    private _doNotTrackManualChanges = false;

    /**
     * Gets or sets a boolean indicating that layou warnings should be ignored
     */
    public ignoreLayoutWarnings = false;

    /** Gets or sets a boolean indicating if the stack panel is vertical or horizontal*/
    public get isVertical(): boolean {
        return this._isVertical;
    }

    public set isVertical(value: boolean) {
        if (this._isVertical === value) {
            return;
        }

        this._isVertical = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets panel width.
     * This value should not be set when in horizontal mode as it will be computed automatically
     */
    public set width(value: string | number) {
        if (!this._doNotTrackManualChanges) {
            this._manualWidth = true;
        }

        if (this._width.toString(this._host) === value) {
            return;
        }

        if (this._width.fromString(value)) {
            this._markAsDirty();
        }
    }

    public get width(): string | number {
        return this._width.toString(this._host);
    }

    /**
     * Gets or sets panel height.
     * This value should not be set when in vertical mode as it will be computed automatically
     */
    public set height(value: string | number) {
        if (!this._doNotTrackManualChanges) {
            this._manualHeight = true;
        }

        if (this._height.toString(this._host) === value) {
            return;
        }

        if (this._height.fromString(value)) {
            this._markAsDirty();
        }
    }

    public get height(): string | number {
        return this._height.toString(this._host);
    }

    /**
     * Creates a new StackPanel
     * @param name defines control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "StackPanel";
    }

    /** @hidden */
    protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        for (var child of this._children) {
            if (this._isVertical) {
                child.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            } else {
                child.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            }
        }

        super._preMeasure(parentMeasure, context);
    }

    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.copyFrom(parentMeasure);

        this._measureForChildren.left = this._currentMeasure.left;
        this._measureForChildren.top = this._currentMeasure.top;

        if (!this.isVertical || this._manualWidth) {
            this._measureForChildren.width = this._currentMeasure.width;
        }

        if (this.isVertical || this._manualHeight) {
            this._measureForChildren.height = this._currentMeasure.height;
        }
    }

    protected _postMeasure(): void {
        var stackWidth = 0;
        var stackHeight = 0;
        for (var child of this._children) {
            if (!child.isVisible || child.notRenderable) {
                continue;
            }

            if (this._isVertical) {
                if (child.top !== stackHeight + "px") {
                    child.top = stackHeight + "px";
                    this._rebuildLayout = true;
                    child._top.ignoreAdaptiveScaling = true;
                }

                if (child._height.isPercentage && !child._automaticSize) {
                    if (!this.ignoreLayoutWarnings) {
                        Tools.Warn(`Control (Name:${child.name}, UniqueId:${child.uniqueId}) is using height in percentage mode inside a vertical StackPanel`);
                    }
                } else {
                    stackHeight += child._currentMeasure.height + child.paddingTopInPixels + child.paddingBottomInPixels;
                }
            } else {
                if (child.left !== stackWidth + "px") {
                    child.left = stackWidth + "px";
                    this._rebuildLayout = true;
                    child._left.ignoreAdaptiveScaling = true;
                }

                if (child._width.isPercentage && !child._automaticSize) {
                    if (!this.ignoreLayoutWarnings) {
                        Tools.Warn(`Control (Name:${child.name}, UniqueId:${child.uniqueId}) is using width in percentage mode inside a horizontal StackPanel`);
                    }
                } else {
                    stackWidth += child._currentMeasure.width + child.paddingLeftInPixels + child.paddingRightInPixels;
                }
            }
        }

        stackWidth += this.paddingLeftInPixels + this.paddingRightInPixels;
        stackHeight += this.paddingTopInPixels + this.paddingBottomInPixels;

        this._doNotTrackManualChanges = true;

        // Let stack panel width or height default to stackHeight and stackWidth if dimensions are not specified.
        // User can now define their own height and width for stack panel.

        let panelWidthChanged = false;
        let panelHeightChanged = false;

        if (!this._manualHeight && this._isVertical) { // do not specify height if strictly defined by user
            let previousHeight = this.height;
            this.height = stackHeight + "px";
            panelHeightChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;
        }
        if (!this._manualWidth && !this._isVertical) { // do not specify width if strictly defined by user
            let previousWidth = this.width;
            this.width = stackWidth + "px";
            panelWidthChanged = previousWidth !== this.width || !this._width.ignoreAdaptiveScaling;
        }

        if (panelHeightChanged) {
            this._height.ignoreAdaptiveScaling = true;
        }

        if (panelWidthChanged) {
            this._width.ignoreAdaptiveScaling = true;
        }

        this._doNotTrackManualChanges = false;

        if (panelWidthChanged || panelHeightChanged) {
            this._rebuildLayout = true;
        }

        super._postMeasure();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.StackPanel"] = StackPanel;