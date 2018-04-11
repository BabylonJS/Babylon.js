/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {

    export class Segment {

        private _multiLine: MultiLine;

        private _x: ValueAndUnit;
        private _y: ValueAndUnit;
        private _control: Nullable<Control>;
        private _mesh: Nullable<AbstractMesh>;

        private _controlObserver: Nullable< Observer<Control> >;
        private _meshObserver: Nullable< Observer<Camera> >;

        _point: Vector2;

        constructor(multiLine: MultiLine) {
            this._multiLine = multiLine;

            this._x = new ValueAndUnit(0);
            this._y = new ValueAndUnit(0);

            this._point = new Vector2(0, 0);
        }

        get x(): string | number {
            return this._x.toString(this._multiLine._host);
        }

        set x(value: string | number) {
            if (this._x.toString(this._multiLine._host) === value) {
                return;
            }

            if (this._x.fromString(value)) {
                this._multiLine._markAsDirty();
            }
        }

        get y(): string | number {
            return this._y.toString(this._multiLine._host);
        }

        set y(value: string | number) {
            if (this._y.toString(this._multiLine._host) === value) {
                return;
            }

            if (this._y.fromString(value)) {
                this._multiLine._markAsDirty();
            }
        }

        get control(): Nullable<Control> {
            return this._control;
        }

        set control(value: Nullable<Control>) {
            if (this._control === value) {
                return;
            }

            if (this._control && this._controlObserver) {
                this._control.onDirtyObservable.remove(this._controlObserver);

                this._controlObserver = null;
            }

            this._control = value;

            if (this._control) {
                this._controlObserver = this._control.onDirtyObservable.add(this._multiLine.onSegmentUpdate);
            }

            this._multiLine._markAsDirty();
        }

        get mesh(): Nullable<AbstractMesh> {
            return this._mesh;
        }

        set mesh(value: Nullable<AbstractMesh>) {
            if (this._mesh === value) {
                return;
            }

            if (this._mesh && this._meshObserver) {
                this._mesh.getScene().onAfterCameraRenderObservable.remove(this._meshObserver);
            }

            this._mesh = value;

            if (this._mesh) {
                this._meshObserver = this._mesh.getScene().onAfterCameraRenderObservable.add(this._multiLine.onSegmentUpdate);
            }

            this._multiLine._markAsDirty();
        }

        translate(): Vector2 {
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
                //TODO: extract number from px and % - eventually in order to support %
                return new Vector2(this.x as number, this.y as number); //temp - as number
            }
        }

        dispose(): void {
            this.control = null;
            this.mesh = null;
        }

    }

    export class ValueAndUnitVector2 {

        x: string | number;
        y: string | number;

    }

}
