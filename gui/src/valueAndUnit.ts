/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class ValueAndUnit {
        private _value = 1;
        public ignoreAdaptiveScaling = false;

        public constructor(value: number, public unit = ValueAndUnit.UNITMODE_PIXEL, public negativeValueAllowed = true) {
            this._value = value;
        }

        public get isPercentage(): boolean {
            return this.unit === ValueAndUnit.UNITMODE_PERCENTAGE;
        }

        public get isPixel(): boolean {
            return this.unit === ValueAndUnit.UNITMODE_PIXEL;
        }

        public get internalValue(): number {
            return this._value;
        }

        public getValueInPixel(host: AdvancedDynamicTexture, refValue: number): number {
            if (this.isPixel) {
                return this.getValue(host);
            }

            return this.getValue(host) * refValue;
        }

        public getValue(host: AdvancedDynamicTexture): number {
            if (host && !this.ignoreAdaptiveScaling && this.unit !== ValueAndUnit.UNITMODE_PERCENTAGE) {
                var width: number = 0;
                var height: number = 0;

                if (host.idealWidth) {
                    width = (this._value * host.getSize().width) / host.idealWidth;
                }
                
                if (host.idealHeight) {
                    height = (this._value * host.getSize().height) / host.idealHeight;
                }

                if (host.useSmallestIdeal && host.idealWidth && host.idealHeight) {
                    return window.innerWidth < window.innerHeight ? width : height;
                }

                if (host.idealWidth) { // horizontal
                    return width;
                }
                
                if (host.idealHeight) { // vertical
                    return height;
                }
            }
            return this._value;
        }

        public toString(host: AdvancedDynamicTexture): string {
            switch (this.unit) {
                case ValueAndUnit.UNITMODE_PERCENTAGE:
                    return (this.getValue(host) * 100) + "%";
                case ValueAndUnit.UNITMODE_PIXEL:
                    return this.getValue(host) + "px";
            }

            return this.unit.toString();
        }

        public fromString(source: string | number ): boolean {
            var match = ValueAndUnit._Regex.exec(source.toString());

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

            if (sourceValue === this._value && sourceUnit === this.unit) {
                return false;
            }

            this._value = sourceValue;
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