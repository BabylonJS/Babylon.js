/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class StackPanel extends Container {
        private _isVertical = true;

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

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var stack = 0;
            for (var child of this._children) {
                child._currentMeasure.copyFrom(parentMeasure);
                child._measure();
                
                if (this._isVertical) {
                    child.top = stack + "px";
                    stack += child._currentMeasure.height;
                    child.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                } else {
                    child.left = stack + "px";
                    stack += child._currentMeasure.width;
                    child.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

                }
            }

            if (this._isVertical) {
                this.height = stack + "px";
                this._height.ignoreAdaptiveScaling = true;
            } else {
                this.width = stack + "px";
                this._width.ignoreAdaptiveScaling = true;
            }
            

            super._additionalProcessing(parentMeasure, context);
        }    
    }    
}