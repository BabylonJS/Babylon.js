/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class ContentControl extends Control {
        private _child: Control;       

        public get child(): Control {
            return this._child;
        }

        public set child(control: Control) {
            if (this._child === control) {
                return;
            }

            this._child = control;
            control._setRoot(this._root);

            this._markAsDirty();
        }

        constructor(public name: string) {
            super(name);
        }

        protected _localDraw(context: CanvasRenderingContext2D): void {
            // Implemented by child to be injected inside main draw
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            this._currentMeasure = parentMeasure.copy();

            context.save();
            
            this.applyStates(context);

            this._localDraw(context);

            if (this._child) {
                this._child._draw(this._currentMeasure, context);
            }
            context.restore();
        }

        public _rescale(scaleX: number, scaleY: number) {
            super._rescale(scaleX, scaleY);

            if (this._child) {
                this._child._rescale(scaleX, scaleY);
            }
        }
    }    
}