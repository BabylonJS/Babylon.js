/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Ellipse extends Container {
        private _thickness = 1;       
        
        public get thickness(): number {
            return this._thickness;
        }

        public set thickness(value: number) {
            if (this._thickness === value) {
                return;
            }

            this._thickness = value;
            this._markAsDirty();
        }                
     
        constructor(public name?: string) {
            super(name);
        }

        protected _getTypeName(): string {
            return "Ellipse";
        }              

        protected _localDraw(context: CanvasRenderingContext2D): void {
            context.save();

            context.beginPath();
            context.ellipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, 
                            this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, 0, 0, 2 * Math.PI);
            context.closePath();

            if (this._background) {
                context.fillStyle = this._background;

                context.fill();
            }

            if (this._thickness) {
                if (this.color) {
                    context.strokeStyle = this.color;
                }
                context.lineWidth = this._thickness;

                context.stroke();
            }
        
            context.restore();
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {  
            super._additionalProcessing(parentMeasure, context);

            this._measureForChildren.width -= 2 * this._thickness;
            this._measureForChildren.height -= 2 * this._thickness;
            this._measureForChildren.left += this._thickness;
            this._measureForChildren.top += this._thickness;            
        }

       protected _clipForChildren(context: CanvasRenderingContext2D) {
            context.beginPath();
            context.ellipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2, this._currentMeasure.height / 2, 0, 0, 2 * Math.PI);
            context.clip();
        }
    }    
}