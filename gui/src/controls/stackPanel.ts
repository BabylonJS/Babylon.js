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
    
        constructor(public name: string) {
            super(name);
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var stack = 0;
            for (var child of this._children) {
                if (this._isVertical) {
                    child.top = stack + "px";
                    stack += child._height.internalValue;
                    child.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                } else {
                    child.left = stack + "px";
                    stack += child._width.internalValue;
                    child.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

                }
            }

            if (this._isVertical) {
                this.height = stack + "px";
            } else {
                this.width = stack + "px";
            }

            super._additionalProcessing(parentMeasure, context);
        }    
    }    
}