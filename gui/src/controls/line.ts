/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Line extends Control {
        private _lineWidth = 1;
        private _x1 = new ValueAndUnit(0);
        private _y1 = new ValueAndUnit(0);
        private _x2 = new ValueAndUnit(0);
        private _y2 = new ValueAndUnit(0);
        private _dash = new Array<number>();
        private _connectedControl: Control;
        private _connectedControlDirtyObserver: Nullable<Observer<Control>>;

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

        public get x1(): string | number  {
            return this._x1.toString(this._host);
        }

        public set x1(value: string | number ) {
            if (this._x1.toString(this._host) === value) {
                return;
            }

            if (this._x1.fromString(value)) {
                this._markAsDirty();
            }
        }    

        public get y1(): string | number  {
            return this._y1.toString(this._host);
        }

        public set y1(value: string | number ) {
            if (this._y1.toString(this._host) === value) {
                return;
            }

            if (this._y1.fromString(value)) {
                this._markAsDirty();
            }
        }     

        public get x2(): string | number  {
            return this._x2.toString(this._host);
        }

        public set x2(value: string | number ) {
            if (this._x2.toString(this._host) === value) {
                return;
            }

            if (this._x2.fromString(value)) {
                this._markAsDirty();
            }
        }    

        public get y2(): string | number  {
            return this._y2.toString(this._host);
        }

        public set y2(value: string | number ) {
            if (this._y2.toString(this._host) === value) {
                return;
            }

            if (this._y2.fromString(value)) {
                this._markAsDirty();
            }
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

        private get _effectiveX2(): number {
            return (this._connectedControl ? this._connectedControl.centerX : 0) + this._x2.getValue(this._host);
        }   

        private get _effectiveY2(): number {
            return (this._connectedControl ? this._connectedControl.centerY : 0) + this._y2.getValue(this._host);
        }           

        constructor(public name?: string) {
            super(name);

            this.isHitTestVisible = false;
            this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this._verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;            
        }

        protected _getTypeName(): string {
            return "Line";
        }              

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            if(this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY){
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {
                context.strokeStyle = this.color;
                context.lineWidth = this._lineWidth;
                context.setLineDash(this._dash);

                context.beginPath();
                context.moveTo(this._x1.getValue(this._host), this._y1.getValue(this._host));

                context.lineTo(this._effectiveX2, this._effectiveY2);

                context.stroke();
            }

            context.restore();
        }

        public _measure(): void {  
            // Width / Height
            this._currentMeasure.width = Math.abs(this._x1.getValue(this._host) - this._effectiveX2) + this._lineWidth;
            this._currentMeasure.height = Math.abs(this._y1.getValue(this._host) - this._effectiveY2) + this._lineWidth;
        }

        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {          
            this._currentMeasure.left = Math.min(this._x1.getValue(this._host), this._effectiveX2) - this._lineWidth / 2;
            this._currentMeasure.top = Math.min(this._y1.getValue(this._host), this._effectiveY2) - this._lineWidth / 2;            
        }   

        public _moveToProjectedPosition(projectedPosition: Vector3): void {
            this.x1 = (projectedPosition.x + this._linkOffsetX.getValue(this._host)) + "px";
            this.y1 = (projectedPosition.y + this._linkOffsetY.getValue(this._host)) + "px";

            this._x1.ignoreAdaptiveScaling = true;
            this._y1.ignoreAdaptiveScaling = true;
        }
    }    
}