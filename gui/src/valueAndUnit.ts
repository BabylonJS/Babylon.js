/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class ValueAndUnit {
        public constructor(public value: number = 1, public unit = ValueAndUnit.UNITMODE_PERCENTAGE) {
        }

        public get isPercentage(): boolean {
            return this.unit === ValueAndUnit.UNITMODE_PERCENTAGE;
        }

        public get isPixel(): boolean {
            return this.unit === ValueAndUnit.UNITMODE_PIXEL;
        }

        // Static
        private static _UNITMODE_PERCENTAGE = 0;
        private static _UNITMODE_PIXEL = 1;

        public static get UNITMODE_PERCENTAGE(): number {
            return ValueAndUnit._UNITMODE_PERCENTAGE;
        }

        public static get UNITMODE_PIXEL(): number {
            return ValueAndUnit._UNITMODE_PIXEL;
        }
    }    
}