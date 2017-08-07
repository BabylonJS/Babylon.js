/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class StackPanel extends Container {
        private _isVertical = true;
        private _manualWidth = false;
        private _manualHeight = false;
        private _tempMeasureStore = Measure.Empty();

        public get isVertical(): boolean {
            return this._isVertical;
        }

        public get manualWidth(): boolean {
            return this._manualWidth;
        }

        public get manualHeight(): boolean {
            return this._manualHeight;
        }

        public set isVertical(value: boolean) {
            if (this._isVertical === value) {
                return;
            }

            this._isVertical = value;
            this._markAsDirty();
        }

        public set manualWidth(value: boolean) {
            if (this._manualWidth === value) {
                return;
            }

            this._manualWidth = value;
            this._markAsDirty();
        }  

        public set manualHeight(value: boolean) {
            if (this._manualHeight === value) {
                return;
            }

            this._manualHeight = value;
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
            // Let stack panel width and height default to stackHeight and stackWidth if dimensions are not specified.
            // User can now define their own height and width for stack panel.
            if(!this._manualHeight) {
                // do not specify height if strictly defined by user
                this.height = stackHeight + "px";
            }
            if(!this._manualWidth) {
                // do not specify width if strictly defined by user
                this.width = stackWidth + "px";
            }

            let panelChanged = false;
            if (this._isVertical) {
                let previousHeight = this.height;
                panelChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;

                this._height.ignoreAdaptiveScaling = true;
            } else {
                let previousWidth = this.width;
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