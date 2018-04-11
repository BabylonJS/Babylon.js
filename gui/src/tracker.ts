/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {

    export class Tracker {

        private _x: ValueAndUnit;
        private _y: ValueAndUnit;
        private _control: Nullable<Control>;
        private _mesh: Nullable<BABYLON.AbstractMesh>;

        _point: BABYLON.Vector2;

        constructor(x: number = 0, y: number = 0, public unit = ValueAndUnit.UNITMODE_PIXEL, public negativeValueAllowed = true, control: Nullable<Control> = null, mesh: Nullable<BABYLON.AbstractMesh> = null) {
            this._x = new ValueAndUnit(x);
            this._y = new ValueAndUnit(y);
            this._control = control;
            this._mesh = mesh;
            this._point = new BABYLON.Vector2(0, 0);
        }

        get x(): ValueAndUnit {
            return this._x;
        }

        get y(): ValueAndUnit {
            return this._y;
        }

        get control(): Nullable<Control> {
            return this._control;
        }

        set control(value: Nullable<Control>) {
            this._control = value;
        }

        get mesh(): Nullable<BABYLON.AbstractMesh> {
            return this._mesh;
        }

        set mesh(value: Nullable<BABYLON.AbstractMesh>) {
            this._mesh = value;
        }

    }

}
