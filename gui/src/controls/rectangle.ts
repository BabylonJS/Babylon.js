/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Rectangle extends Container {
        private _thickness = 1;
        private _cornerRadius = 0;
        
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
        
        public get cornerRadius(): number {
            return this._cornerRadius;
        }

        public set cornerRadius(value: number) {
            if (value < 0) {
                value = 0;
            }

            if (this._cornerRadius === value) {
                return;
            }

            this._cornerRadius = value;
            this._markAsDirty();
        }   
       
        constructor(public name?: string) {
            super(name);
        }

        protected _getTypeName(): string {
            return "Rectangle";
        }              

        protected _localDraw(context: CanvasRenderingContext2D): void {
            context.save();

            if (this._background) {
                context.fillStyle = this._background;

                if (this._cornerRadius) {
                    this._drawRoundedRect(context, this._thickness / 2);
                    context.fill();
                } else {
                    context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                }
            }

            if (this._thickness) {
                if (this.color) {
                    context.strokeStyle = this.color;
                }
                context.lineWidth = this._thickness;

                if (this._cornerRadius) {
                    this._drawRoundedRect(context, this._thickness / 2);
                    context.stroke();
                } else {                
                    context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2, 
                                       this._currentMeasure.width - this._thickness, this._currentMeasure.height - this._thickness);
                }
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

        private _drawRoundedRect(context: CanvasRenderingContext2D, offset: number = 0): void {
            var x = this._currentMeasure.left + offset;
            var y = this._currentMeasure.top + offset;
            var width = this._currentMeasure.width - offset * 2;
            var height = this._currentMeasure.height - offset * 2;

            var radius = Math.min(height / 2 - 2, Math.min(width / 2 - 2, this._cornerRadius));

            context.beginPath();
            context.moveTo(x + radius, y);
            context.lineTo(x + width - radius, y);
            context.quadraticCurveTo(x + width, y, x + width, y + radius);
            context.lineTo(x + width, y + height - radius);
            context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            context.lineTo(x + radius, y + height);
            context.quadraticCurveTo(x, y + height, x, y + height - radius);
            context.lineTo(x, y + radius);
            context.quadraticCurveTo(x, y, x + radius, y);
            context.closePath();
        } 

        protected _clipForChildren(context: CanvasRenderingContext2D) {
            if (this._cornerRadius) {
                this._drawRoundedRect(context, this._thickness);
                context.clip();
            }
        }
    }    
}