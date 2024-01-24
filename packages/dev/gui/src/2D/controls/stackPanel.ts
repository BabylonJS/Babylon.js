import { Container } from "./container";
import type { Measure } from "../measure";
import { Control } from "./control";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";
import type { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";
import { Logger } from "core/Misc/logger";

/**
 * Class used to create a 2D stack panel container
 */
export class StackPanel extends Container {
    private _isVertical = true;
    private _manualWidth = false;
    private _manualHeight = false;
    private _doNotTrackManualChanges = false;
    private _spacing = 0;

    /**
     * Gets or sets a boolean indicating that layout warnings should be ignored
     */
    @serialize()
    public ignoreLayoutWarnings = false;

    /** Gets or sets a boolean indicating if the stack panel is vertical or horizontal*/
    @serialize()
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
     * Gets or sets the spacing (in pixels) between each child.
     */
    @serialize()
    public get spacing(): number {
        return this._spacing;
    }

    public set spacing(value: number) {
        if (this._spacing === value) {
            return;
        }

        this._spacing = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets panel width.
     * This value should not be set when in horizontal mode as it will be computed automatically
     */
    @serialize()
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
    @serialize()
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

    /**
     * @internal
     */
    protected _preMeasure(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        for (const child of this._children) {
            if (this._isVertical) {
                child.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            } else {
                child.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            }
        }

        super._preMeasure(parentMeasure, context);
    }

    protected _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {
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
        let stackWidth = 0;
        let stackHeight = 0;
        const childrenCount = this._children.length;
        for (let index = 0; index < childrenCount; index++) {
            const child = this._children[index];
            if (!child.isVisible || child.notRenderable) {
                continue;
            }

            if (this._isVertical) {
                if (child.top !== stackHeight + "px") {
                    child.top = stackHeight + "px";
                    this._rebuildLayout = true;
                    child._top.ignoreAdaptiveScaling = true;
                }

                if (!this.ignoreLayoutWarnings && !child.isDimensionFullyDefined("height")) {
                    Logger.Warn(`Control (Name:${child.name}, UniqueId:${child.uniqueId}) is using height in percentage mode inside a vertical StackPanel`, 1);
                } else {
                    stackHeight += child._currentMeasure.height + child._paddingTopInPixels + child._paddingBottomInPixels + (index < childrenCount - 1 ? this._spacing : 0);
                }
            } else {
                if (child.left !== stackWidth + "px") {
                    child.left = stackWidth + "px";
                    this._rebuildLayout = true;
                    child._left.ignoreAdaptiveScaling = true;
                }

                if (!this.ignoreLayoutWarnings && !child.isDimensionFullyDefined("width")) {
                    Logger.Warn(`Control (Name:${child.name}, UniqueId:${child.uniqueId}) is using width in percentage mode inside a horizontal StackPanel`, 1);
                } else {
                    stackWidth += child._currentMeasure.width + child._paddingLeftInPixels + child._paddingRightInPixels + (index < childrenCount - 1 ? this._spacing : 0);
                }
            }
        }

        stackWidth += this._paddingLeftInPixels + this._paddingRightInPixels;
        stackHeight += this._paddingTopInPixels + this._paddingBottomInPixels;

        this._doNotTrackManualChanges = true;

        // Let stack panel width or height default to stackHeight and stackWidth if dimensions are not specified.
        // User can now define their own height and width for stack panel.

        let panelWidthChanged = false;
        let panelHeightChanged = false;

        if ((!this._manualHeight || this.adaptHeightToChildren) && this._isVertical) {
            // do not specify height if strictly defined by user
            const previousHeight = this.height;
            this.height = stackHeight + "px";
            panelHeightChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;
        }
        if ((!this._manualWidth || this.adaptWidthToChildren) && !this._isVertical) {
            // do not specify width if strictly defined by user
            const previousWidth = this.width;
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

    private _getManualDim(dim: "width" | "height") {
        if (dim === "width") {
            return this._manualWidth;
        } else {
            return this._manualHeight;
        }
    }

    public isDimensionFullyDefined(dim: "width" | "height"): boolean {
        if (dim === "height" ? this.isVertical : !this.isVertical && !this._getManualDim(dim)) {
            for (const child of this._children) {
                if (!child.isDimensionFullyDefined(dim)) {
                    return false;
                }
            }
            return true;
        }

        return this.getDimension(dim).isPixel || this._getAdaptDimTo(dim);
    }

    /**
     * Serializes the current control
     * @param serializationObject defined the JSON serialized object
     * @param force force serialization even if isSerializable === false
     */
    public serialize(serializationObject: any, force: boolean) {
        super.serialize(serializationObject, force);
        if (!this.isSerializable && !force) {
            return;
        }
        serializationObject.manualWidth = this._manualWidth;
        serializationObject.manualHeight = this._manualHeight;
    }

    /**
     * @internal
     */
    public _parseFromContent(serializedObject: any, host: AdvancedDynamicTexture) {
        this._manualWidth = serializedObject.manualWidth;
        this._manualHeight = serializedObject.manualHeight;

        super._parseFromContent(serializedObject, host);
    }
}
RegisterClass("BABYLON.GUI.StackPanel", StackPanel);
