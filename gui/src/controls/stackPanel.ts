/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class StackPanel extends Container {
        private _isVertical = true;
        private _manualWidth = false;
        private _manualHeight = false;
        private _doNotTrackManualChanges = false;
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
       
        public set width(value: string | number ) {
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

        public set height(value: string | number ) {
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
                
        public get height(): string | number  {
            return this._height.toString(this._host);
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
            
            this._doNotTrackManualChanges = true;

            // Let stack panel width and height default to stackHeight and stackWidth if dimensions are not specified.
            // User can now define their own height and width for stack panel.

            let panelWidthChanged = false;
            let panelHeightChanged = false;

            let previousHeight = this.height;
            let previousWidth = this.width;

            if (!this._manualHeight) {
                // do not specify height if strictly defined by user
                this.height = stackHeight + "px";
            }
            if (!this._manualWidth) {
                // do not specify width if strictly defined by user
                this.width = stackWidth + "px";
            }

            panelWidthChanged = previousWidth !== this.width || !this._width.ignoreAdaptiveScaling;
            panelHeightChanged = previousHeight !== this.height || !this._height.ignoreAdaptiveScaling;

            if (panelHeightChanged) {
                this._height.ignoreAdaptiveScaling = true;
            }

            if (panelWidthChanged) {
                this._width.ignoreAdaptiveScaling = true;
            }

            this._doNotTrackManualChanges = false;

            if (panelWidthChanged || panelHeightChanged) {
                this._markAllAsDirty();
            }
            
            super._preMeasure(parentMeasure, context);
        }    
    }    
}