/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class StackPanel extends Container {
        private _isVertical = true;
        private _tempMeasureStore = Measure.Empty();

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
    
        constructor(public name?: string) {
            super(name);
        }

        protected _getTypeName(): string {
            return "StackPanel";
        }              

        protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var stackWidth = 0;
            var stackHeight = 0;
            for (var child of this._children) {
                this._tempMeasureStore.copyFrom(child._currentMeasure);
                child._currentMeasure.copyFrom(parentMeasure);
                child._measure();
                
                if (this._isVertical) {
                    child.top = stackHeight + "px";
                    if (!child._top.ignoreAdaptiveScaling) {
                        child._markAsDirty();
                    }
                    child._top.ignoreAdaptiveScaling = true;
                    stackHeight += child._currentMeasure.height;
                    if(child._currentMeasure.width > stackWidth) {
                        stackWidth = child._currentMeasure.width;                        
                    }
                    child.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                } else {
                    child.left = stackWidth + "px";
                    if (!child._left.ignoreAdaptiveScaling) {
                        child._markAsDirty();
                    }                    
                    child._left.ignoreAdaptiveScaling = true;
                    stackWidth += child._currentMeasure.width;
                    if(child._currentMeasure.height > stackHeight) {
                        stackHeight = child._currentMeasure.height;                        
                    }
                    child.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                }

                child._currentMeasure.copyFrom(this._tempMeasureStore);
            }

            let panelChanged = false;
            if (this._isVertical) {
                let previousHeight = this.height;
                this.height = stackHeight + "px";
                this.width = stackWidth + "px";
                
                panelChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;

                this._height.ignoreAdaptiveScaling = true;
            } else {
                let previousWidth = this.width;
                this.width = stackWidth + "px";
                this.height = stackHeight + "px";
                panelChanged = previousWidth !== this.width || !this._width.ignoreAdaptiveScaling;

                this._width.ignoreAdaptiveScaling = true;
            }

            if (panelChanged) {
                this._markAllAsDirty();
            }
            
            super._preMeasure(parentMeasure, context);
        }    
    }    
}