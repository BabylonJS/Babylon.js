/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class StackPanel extends Container {
    
        constructor(public name: string) {
            super(name);
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var top = 0;
            for (var child of this._children) {
                child._measure();
                child.top = top + "px";
                top += child._currentMeasure.height;
                child.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            }

            this.height = top + "px";

            super._additionalProcessing(parentMeasure, context);
        }    
    }    
}