/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {

    export class ComplexLine extends Control {

        private _lineWidth: number = 1;
        private _dash: number[];
        private _trackers: Nullable<Tracker>[];

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
            this._trackers = [];
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

        getX(index: number): string | number  {
            return this.getTracker(index).x.toString(this._host);
        }

        setX(index: number, value: string | number): void {
            var point: Tracker = this.getTracker(index);

            if (point.x.toString(this._host) === value) {
                return;
            }

            if (point.x.fromString(value)) {
                this._markAsDirty();
            }
        }

        getY(index: number): string | number  {
            return this.getTracker(index).y.toString(this._host);
        }

        setY(index: number, value: string | number): void {
            var tracker: Tracker = this.getTracker(index);

            if (tracker.y.toString(this._host) === value) {
                return;
            }

            if (tracker.y.fromString(value)) {
                this._markAsDirty();
            }
        }

        getControl(index: number): Nullable<Control> {
            return this.getTracker(index).control;
        }

        setControl(index: number, value: Nullable<Control> = null) {
            var tracker: Tracker = this.getTracker(index);

            if (tracker.control === value) {
                return;
            }

            if (tracker.control) {
                tracker.control.onDirtyObservable.removeCallback(this.onTrackerUpdate);
            }

            tracker.control = value;

            if (tracker.control) {
                tracker.control.onDirtyObservable.add(this.onTrackerUpdate);
            }

            this._markAsDirty();
        }

        getMesh(index: number): Nullable<BABYLON.AbstractMesh> {
            return this.getTracker(index).mesh;
        }

        setMesh(index: number, value: Nullable<BABYLON.AbstractMesh> = null) {
            var tracker: Tracker = this.getTracker(index);

            if (tracker.mesh === value) {
                return;
            }

            if (tracker.mesh) {
                tracker.mesh.getScene().onAfterCameraRenderObservable.removeCallback(this.onTrackerUpdate);
            }

            tracker.mesh = value;

            if (tracker.mesh) {
                tracker.mesh.getScene().onAfterCameraRenderObservable.add(this.onTrackerUpdate);
            }

            this._markAsDirty();
        }

        private getTracker(index: number): Tracker {
            if (!this._trackers[index]) {
                this._trackers[index] = new Tracker();
            }

            return this._trackers[index] as Tracker;
        }
        
        private updateTracker(value: Tracker): void {
            if (value.mesh != null) {
                var projection: BABYLON.Vector2 = this._host.getProjectedPosition(value.mesh.getBoundingInfo().boundingSphere.center, value.mesh.getWorldMatrix());

                value._point.x = projection.x;
                value._point.y = projection.y;
            }
            else if (value.control != null) {
                value._point.x = value.control.centerX;
                value._point.y = value.control.centerY;
            }
            else {
                value._point.x = value.x.getValue(this._host);
                value._point.y = value.y.getValue(this._host);
            }
        }

        private onTrackerUpdate = (): void => {
            this._markAsDirty();
        }

        track(items: (BABYLON.AbstractMesh | Control | BABYLON.Vector2)): void {
            //TODO: implement
        }

        addTracker(): number {
            this.getTracker(this._trackers.length);

            return this._trackers.length - 1;
        }

        removeTracker(index: number): void {
            var tracker: Nullable<Tracker> = this._trackers[index];

            if (!tracker) {
                return;
            }

            if (tracker.mesh) {
                tracker.mesh.getScene().onAfterCameraRenderObservable.removeCallback(this.onTrackerUpdate);
            }

            if (tracker.control) {
                tracker.control.onDirtyObservable.removeCallback(this.onTrackerUpdate);
            }

            this._trackers.splice(index, 1);
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
            return "ComplexLine";
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

                this._trackers.forEach(tracker => {
                    if (!tracker) {
                        return;
                    }

                    if (first) {
                        context.moveTo(tracker._point.x, tracker._point.y);

                        first = false;
                    }
                    else {
                        context.lineTo(tracker._point.x, tracker._point.y);
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
            
            this._trackers.forEach((tracker, index) => {
                if (!tracker) {
                    return;
                }

                this.updateTracker(tracker);

                if (this._minX == null || tracker._point.x < this._minX) this._minX = tracker._point.x;
                if (this._minY == null || tracker._point.y < this._minY) this._minY = tracker._point.y;
                if (this._maxX == null || tracker._point.x > this._maxX) this._maxX = tracker._point.x;
                if (this._maxY == null || tracker._point.y > this._maxY) this._maxY = tracker._point.y;
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
            while (this._trackers.length > 0) {
                this.removeTracker(this._trackers.length - 1);
            }
        }

    }    
}