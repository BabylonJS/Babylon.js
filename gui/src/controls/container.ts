/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Container extends Control {
        private _children = new Array<Control>();
        protected _measureForChildren = Measure.Empty();     

        constructor(public name: string) {
            super(name);
        }

       public addControl(control: Control): Container {
           var index = this._children.indexOf(control);

            if (index !== -1) {
                return this;
            }
            control._link(this, this._host);

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

        protected _localDraw(context: CanvasRenderingContext2D): void {
            // Implemented by child to be injected inside main draw
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();
            super._processMeasures(parentMeasure, context);
           
            this.applyStates(context);

            this._localDraw(context);

            for (var child of this._children) {
                child._draw(this._measureForChildren, context);
            }
            context.restore();
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {  
            super._additionalProcessing(parentMeasure, context);

            this._measureForChildren.copyFrom(this._currentMeasure);
        }
    }    
}