/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var DOMImage = Image;

module BABYLON.GUI {
    export class Line extends Control {
        private _lineWidth = 1;
        private _background: string;
        private _x1 = 0;
        private _y1 = 0;
        private _x2 = 0;
        private _y2 = 0;
        private _dash = new Array<number>();
        private _connectedControl: Control;
        private _connectedControlDirtyObserver: Observer<Control>;

        public get dash(): Array<number> {
            return this._dash;
        }

        public set dash(value: Array<number>) {
            if (this._dash === value) {
                return;
            }

            this._dash = value;
            this._markAsDirty();
        }     

        public get connectedControl(): Control {
            return this._connectedControl;
        }

        public set connectedControl(value: Control) {
            if (this._connectedControl === value) {
                return;
            }

            if (this._connectedControlDirtyObserver && this._connectedControl) {
                this._connectedControl.onDirtyObservable.remove(this._connectedControlDirtyObserver);
                this._connectedControlDirtyObserver = null;
            }

            if (value) {
                this._connectedControlDirtyObserver = value.onDirtyObservable.add(() => this._markAsDirty());
            }            

            this._connectedControl = value;
            this._markAsDirty();
        }              

        public get x1(): number {
            return this._x1;
        }

        public set x1(value: number) {
            if (this._x1 === value) {
                return;
            }

            this._x1 = value;
            this._markAsDirty();
        }    

        public get y1(): number {
            return this._y1;
        }

        public set y1(value: number) {
            if (this._y1 === value) {
                return;
            }

            this._y1 = value;
            this._markAsDirty();
        }     

        public get x2(): number {
            if (this._connectedControl) {
                return this._connectedControl.centerX + this._x2;
            }
            return this._x2;
        }

        public set x2(value: number) {
            if (this._x2 === value) {
                return;
            }

            this._x2 = value;
            this._markAsDirty();
        }    

        public get y2(): number {
            if (this._connectedControl) {
                return this._connectedControl.centerY + this._y2;
            }
            return this._y2;
        }

        public set y2(value: number) {
            if (this._y2 === value) {
                return;
            }

            this._y2 = value;
            this._markAsDirty();
        }                       
        
        public get lineWidth(): number {
            return this._lineWidth;
        }

        public set lineWidth(value: number) {
            if (this._lineWidth === value) {
                return;
            }

            this._lineWidth = value;
            this._markAsDirty();
        }   

        public set horizontalAlignment(value: number) {
            return;
        } 

        public set verticalAlignment(value: number) {
            return;
        }         

        constructor(public name: string) {
            super(name);

            this.isHitTestVisible = false;
            this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this._verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;            
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {
                context.strokeStyle = this.color;
                context.lineWidth = this._lineWidth;
                context.setLineDash(this._dash);

                context.beginPath();
                context.moveTo(this._x1, this._y1);
                context.lineTo(this.x2, this.y2);

                context.stroke();
            }

            context.restore();
        }

        public _measure(): void {  
            // Width / Height
            this._currentMeasure.width = Math.abs(this._x1 - this.x2) + this._lineWidth;
            this._currentMeasure.height = Math.abs(this._y1 - this.y2) + this._lineWidth;
        }

        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {          
            this._currentMeasure.left = Math.min(this._x1, this.x2) - this._lineWidth / 2;
            this._currentMeasure.top = Math.min(this._y1, this.y2) - this._lineWidth / 2;            
        }   

        public _moveToProjectedPosition(projectedPosition: Vector3): void {
            this.x1 = projectedPosition.x + this.linkOffsetX;
            this.y1 = projectedPosition.y + this.linkOffsetY;
        }
    }    
}