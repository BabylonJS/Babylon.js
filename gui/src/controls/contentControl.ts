/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class ContentControl extends Control {
        private _child: Control;  
        protected _measureForChild = Measure.Empty();     

        public get child(): Control {
            return this._child;
        }

        public set child(control: Control) {
            if (this._child === control) {
                return;
            }

            this._child = control;
            control._link(this._root, this._host);

            this._markAsDirty();
        }

        constructor(public name: string) {
            super(name);
        }

        protected _localDraw(context: CanvasRenderingContext2D): void {
            // Implemented by child to be injected inside main draw
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            super._processMeasures(parentMeasure, context);
           
            this.applyStates(context);

            this._localDraw(context);

            if (this._child) {
                this._child._draw(this._measureForChild, context);
            }
            context.restore();
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {  
            super._additionalProcessing(parentMeasure, context);

            this._measureForChild.copyFrom(this._currentMeasure);
        }
    }    
}