/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Rectangle extends Container {
        private _thickness = 1;
        private _background: string;
        
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

       
        public get background(): string {
            return this._background;
        }

        public set background(value: string) {
            if (this._background === value) {
                return;
            }

            this._background = value;
            this._markAsDirty();
        }           
     
        constructor(public name: string) {
            super(name);
        }

        protected _localDraw(context: CanvasRenderingContext2D): void {
            context.save();

            if (this._background) {
                context.fillStyle = this._background;
                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }

            if (this._thickness) {
                if (this.color) {
                    context.strokeStyle = this.color;
                }
                context.lineWidth = this._thickness;
                context.strokeRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
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
    }    
}