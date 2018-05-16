/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Control3D {
        public get typeName(): string {
            return this._getTypeName();
        }

        protected _getTypeName(): string {
            return "Control3D";
        }
    }
}