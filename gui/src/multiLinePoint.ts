/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {

    export class MultiLinePoint {

        private _multiLine: MultiLine;

        private _x: ValueAndUnit;
        private _y: ValueAndUnit;
        private _control: Nullable<Control>;
        private _mesh: Nullable<AbstractMesh>;

        private _controlObserver: Nullable< Observer<Control> >;
        private _meshObserver: Nullable< Observer<Camera> >;

        public _point: Vector2;

        constructor(multiLine: MultiLine) {
            this._multiLine = multiLine;

            this._x = new ValueAndUnit(0);
            this._y = new ValueAndUnit(0);

            this._point = new Vector2(0, 0);
        }

        public get x(): string | number {
            return this._x.toString(this._multiLine._host);
        }

        public set x(value: string | number) {
            if (this._x.toString(this._multiLine._host) === value) {
                return;
            }

            if (this._x.fromString(value)) {
                this._multiLine._markAsDirty();
            }
        }

        public get y(): string | number {
            return this._y.toString(this._multiLine._host);
        }

        public set y(value: string | number) {
            if (this._y.toString(this._multiLine._host) === value) {
                return;
            }

            if (this._y.fromString(value)) {
                this._multiLine._markAsDirty();
            }
        }

        public get control(): Nullable<Control> {
            return this._control;
        }

        public set control(value: Nullable<Control>) {
            if (this._control === value) {
                return;
            }

            if (this._control && this._controlObserver) {
                this._control.onDirtyObservable.remove(this._controlObserver);

                this._controlObserver = null;
            }

            this._control = value;

            if (this._control) {
                this._controlObserver = this._control.onDirtyObservable.add(this._multiLine.onPointUpdate);
            }

            this._multiLine._markAsDirty();
        }

        public get mesh(): Nullable<AbstractMesh> {
            return this._mesh;
        }

        public set mesh(value: Nullable<AbstractMesh>) {
            if (this._mesh === value) {
                return;
            }

            if (this._mesh && this._meshObserver) {
                this._mesh.getScene().onAfterCameraRenderObservable.remove(this._meshObserver);
            }

            this._mesh = value;

            if (this._mesh) {
                this._meshObserver = this._mesh.getScene().onAfterCameraRenderObservable.add(this._multiLine.onPointUpdate);
            }

            this._multiLine._markAsDirty();
        }

        public translate(): Vector2 {
            this._point = this._translatePoint();

            return this._point;
        }

        private _translatePoint(): Vector2 {
            if (this._mesh != null) {
                return this._multiLine._host.getProjectedPosition(this._mesh.getBoundingInfo().boundingSphere.center, this._mesh.getWorldMatrix());
            }
            else if (this._control != null) {
                return new Vector2(this._control.centerX, this._control.centerY);
            }
            else {
                var host: any = this._multiLine._host as any;

                var xValue: number = this._x.getValueInPixel(host, Number(host._canvas.width));
                var yValue: number = this._y.getValueInPixel(host, Number(host._canvas.height));
                
                return new Vector2(xValue, yValue);
            }
        }

        public dispose(): void {
            this.control = null;
            this.mesh = null;
        }

    }

}
