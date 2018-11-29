import { Measure } from "../measure";
import { Container } from "./container";
import { ValueAndUnit } from "../valueAndUnit";

/**
 * Class used to hold a the container for ScrollViewer
 * @hidden
*/
export class _ScrollViewerWindow extends Container {
    public parentClientWidth: number;
    public parentClientHeight: number;

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

        this._measureForChildren.left = this._currentMeasure.left;
        this._measureForChildren.top = this._currentMeasure.top;
        
        this._measureForChildren.width = this._currentMeasure.width;       
        this._measureForChildren.height = this._currentMeasure.height;
    }

    protected _postMeasure(): void {
        var maxWidth = this.parentClientWidth;
        var maxHeight = this.parentClientHeight;
        for (var child of this.children) {
            if (!child.isVisible || child.notRenderable) {
                continue;
            }

            maxWidth = Math.max(maxWidth, child._currentMeasure.width);
            maxHeight = Math.max(maxHeight, child._currentMeasure.height);
        }

        if (this._currentMeasure.width !== maxWidth) {
            this._width = new ValueAndUnit(maxWidth, ValueAndUnit.UNITMODE_PIXEL);
            this._currentMeasure.width = maxWidth;
            this._rebuildLayout = true;
        }

        if (this._currentMeasure.height !== maxHeight) {
            this._height = new ValueAndUnit(maxHeight, ValueAndUnit.UNITMODE_PIXEL);
            this._currentMeasure.height = maxHeight;
            this._rebuildLayout = true;
        }

        super._postMeasure();
    }

}