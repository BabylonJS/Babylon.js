/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {

    export class MultiLine extends Control {

        private _lineWidth: number = 1;
        private _dash: number[];
        private _segments: Nullable<Segment>[];

        private _minX: Nullable<number>;
        private _minY: Nullable<number>;
        private _maxX: Nullable<number>;
        private _maxY: Nullable<number>;

        constructor(public name?: string) {
            super(name);

            this.isHitTestVisible = false;
            this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            this._verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

            this._dash = [];
            this._segments = [];
        }

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

        getAt(index: number): Segment {
            if (!this._segments[index]) {
                this._segments[index] = new Segment(this);
            }

            return this._segments[index] as Segment;
        }

        onSegmentUpdate = (): void => {
            this._markAsDirty();
        }

        add(...items: (AbstractMesh | Control | ValueAndUnitVector2)[]): void {
            items.forEach(item => {
                var segment: Segment = this.push();

                if (item instanceof AbstractMesh) {
                    segment.mesh = item;
                }
                else if (item instanceof Control) {
                    segment.control = item;
                }
                else if (item instanceof ValueAndUnitVector2) {
                    segment.x = item.x;
                    segment.y = item.y;
                }
            });
        }

        push(): Segment {
            return this.getAt(this._segments.length);
        }

        remove(value: number | Segment): void {
            var index: number;
            
            if (value instanceof Segment) {
                index = this._segments.indexOf(value);

                if (index === -1) {
                    return;
                }
            }
            else {
                index = value;
            }
            
            var segment: Nullable<Segment> = this._segments[index];

            if (!segment) {
                return;
            }

            segment.mesh = null;
            segment.control = null;

            this._segments.splice(index, 1);
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

        protected _getTypeName(): string {
            return "MultiLine";
        }              

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY){
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

                var first: boolean = true; //first index is not necessarily 0

                this._segments.forEach(segment => {
                    if (!segment) {
                        return;
                    }

                    if (first) {
                        context.moveTo(segment._point.x, segment._point.y);

                        first = false;
                    }
                    else {
                        context.lineTo(segment._point.x, segment._point.y);
                    }
                });

                context.stroke();
            }

            context.restore();
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            this._minX = null;
            this._minY = null;
            this._maxX = null;
            this._maxY = null;
            
            this._segments.forEach((segment, index) => {
                if (!segment) {
                    return;
                }

                segment.translate();

                if (this._minX == null || segment._point.x < this._minX) this._minX = segment._point.x;
                if (this._minY == null || segment._point.y < this._minY) this._minY = segment._point.y;
                if (this._maxX == null || segment._point.x > this._maxX) this._maxX = segment._point.x;
                if (this._maxY == null || segment._point.y > this._maxY) this._maxY = segment._point.y;
            });

            if (this._minX == null) this._minX = 0;
            if (this._minY == null) this._minY = 0;
            if (this._maxX == null) this._maxX = 0;
            if (this._maxY == null) this._maxY = 0;
        }

        public _measure(): void {
            if (this._minX == null || this._maxX == null || this._minY == null || this._maxY == null) {
                return;
            }

            this._currentMeasure.width = Math.abs(this._maxX - this._minX) + this._lineWidth;
            this._currentMeasure.height = Math.abs(this._maxY - this._minY) + this._lineWidth;
        }

        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            if (this._minX == null || this._minY == null) {
                return;
            }

            this._currentMeasure.left = this._minX - this._lineWidth / 2;
            this._currentMeasure.top = this._minY - this._lineWidth / 2;  
        }

        dispose(): void {
            while (this._segments.length > 0) {
                this.remove(this._segments.length - 1);
            }
        }

    }    
}