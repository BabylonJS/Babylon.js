/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class ValueAndUnit {
        public constructor(public value = 1, public unit = ValueAndUnit.UNITMODE_PERCENTAGE, public negativeValueAllowed = true) {
        }

        public get isPercentage(): boolean {
            return this.unit === ValueAndUnit.UNITMODE_PERCENTAGE;
        }

        public get isPixel(): boolean {
            return this.unit === ValueAndUnit.UNITMODE_PIXEL;
        }

        public toString(): string {
            switch (this.unit) {
                case ValueAndUnit.UNITMODE_PERCENTAGE:
                    return this.unit + "%";
                case ValueAndUnit.UNITMODE_PIXEL:
                    return this.unit + "px";
            }

            return this.unit.toString();
        }

        public fromString(source: string): boolean {
            var match = ValueAndUnit._Regex.exec(source);

            if (!match || match.length === 0) {
                return false;
            }

            var sourceValue = parseFloat(match[1]);
            var sourceUnit = this.unit;

            if (!this.negativeValueAllowed) {
                if (sourceValue < 0) {
                    sourceValue = 0;
                }
            }
            
            if (match.length === 4) {
                switch(match[3]) {
                    case "px":
                        sourceUnit = ValueAndUnit.UNITMODE_PIXEL;
                        break;
                    case "%":
                        sourceUnit = ValueAndUnit.UNITMODE_PERCENTAGE;
                        sourceValue /= 100.0;
                        break;
                }
            }

            if (sourceValue === this.value && sourceUnit === this.unit) {
                return false;
            }

            this.value = sourceValue;
            this.unit = sourceUnit;

            return true;
        }

        // Static
        private static _Regex = /(^-?\d*(\.\d+)?)(%|px)?/;
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