/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Container extends Control {
        private _children = new Array<Control>();

        constructor(public name: string) {
            super(name);
        }

       public addControl(control: Control): Container {
           var index = this._children.indexOf(control);

            if (index !== -1) {
                return this;
            }
            control._setRoot(this);

            this._reOrderControl(control);

            this._markAsDirty();
            return this;
        }

        public removeControl(control: Control): Container {
            var index = this._children.indexOf(control);

            if (index !== -1) {
                this._children.splice(index, 1);
            }

            this._markAsDirty();
            return this;
        }

        public _reOrderControl(control: Control): void {
            this.removeControl(control);

            for (var index = 0; index < this._children.length; index++) {
                if (this._children[index].zIndex > control.zIndex) {
                    this._children.splice(index, 0, control);
                    return;
                }
            }

            this._children.push(control);

            this._markAsDirty();
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            this._currentMeasure = parentMeasure.copy();

            context.save();
            
            this.applyStates(context);

            for (var child of this._children) {
                child._draw(this._currentMeasure, context);
            }
            context.restore();
        }

        public _rescale(scaleX: number, scaleY: number) {
            super._rescale(scaleX, scaleY);

            for (var child of this._children) {
                child._rescale(scaleX, scaleY);
            }
        }
    }    
}