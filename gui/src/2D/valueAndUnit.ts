import { AdvancedDynamicTexture } from "./advancedDynamicTexture";

/**
 * Class used to specific a value and its associated unit
 */
export class ValueAndUnit {
    private _value = 1;
    private _originalUnit: number;
    /**
     * Gets or sets a value indicating that this value will not scale accordingly with adaptive scaling property
     * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
     */
    public ignoreAdaptiveScaling = false;

    /**
     * Creates a new ValueAndUnit
     * @param value defines the value to store
     * @param unit defines the unit to store
     * @param negativeValueAllowed defines a boolean indicating if the value can be negative
     */
    public constructor(value: number,
        /** defines the unit to store */
        public unit = ValueAndUnit.UNITMODE_PIXEL,
        /** defines a boolean indicating if the value can be negative */
        public negativeValueAllowed = true) {
        this._value = value;
        this._originalUnit = unit;
    }

    /** Gets a boolean indicating if the value is a percentage */
    public get isPercentage(): boolean {
        return this.unit === ValueAndUnit.UNITMODE_PERCENTAGE;
    }

    /** Gets a boolean indicating if the value is store as pixel */
    public get isPixel(): boolean {
        return this.unit === ValueAndUnit.UNITMODE_PIXEL;
    }

    /** Gets direct internal value */
    public get internalValue(): number {
        return this._value;
    }

    /**
     * Gets value as pixel
     * @param host defines the root host
     * @param refValue defines the reference value for percentages
     * @returns the value as pixel
     */
    public getValueInPixel(host: AdvancedDynamicTexture, refValue: number): number {
        if (this.isPixel) {
            return this.getValue(host);
        }

        return this.getValue(host) * refValue;
    }

    /**
     * Update the current value and unit. This should be done cautiously as the GUi won't be marked as dirty with this function.
     * @param value defines the value to store
     * @param unit defines the unit to store
     * @returns the current ValueAndUnit
     */
    public updateInPlace(value: number, unit = ValueAndUnit.UNITMODE_PIXEL): ValueAndUnit {
        this._value = value;
        this.unit = unit;

        return this;
    }

    /**
     * Gets the value accordingly to its unit
     * @param host  defines the root host
     * @returns the value
     */
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

    /**
     * Gets a string representation of the value
     * @param host defines the root host
     * @param decimals defines an optional number of decimals to display
     * @returns a string
     */
    public toString(host: AdvancedDynamicTexture, decimals?: number): string {
        switch (this.unit) {
            case ValueAndUnit.UNITMODE_PERCENTAGE:
                let percentage = this.getValue(host) * 100;

                return (decimals ? percentage.toFixed(decimals) : percentage) + "%";
            case ValueAndUnit.UNITMODE_PIXEL:
                let pixels = this.getValue(host);
                return (decimals ? pixels.toFixed(decimals) : pixels) + "px";
        }

        return this.unit.toString();
    }

    /**
     * Store a value parsed from a string
     * @param source defines the source string
     * @returns true if the value was successfully parsed
     */
    public fromString(source: string | number): boolean {
        var match = ValueAndUnit._Regex.exec(source.toString());

        if (!match || match.length === 0) {
            return false;
        }

        var sourceValue = parseFloat(match[1]);
        var sourceUnit = this._originalUnit;

        if (!this.negativeValueAllowed) {
            if (sourceValue < 0) {
                sourceValue = 0;
            }
        }

        if (match.length === 4) {
            switch (match[3]) {
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

    /** UNITMODE_PERCENTAGE */
    public static get UNITMODE_PERCENTAGE(): number {
        return ValueAndUnit._UNITMODE_PERCENTAGE;
    }

    /** UNITMODE_PIXEL */
    public static get UNITMODE_PIXEL(): number {
        return ValueAndUnit._UNITMODE_PIXEL;
    }
}