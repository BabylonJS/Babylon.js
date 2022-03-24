import { Observable } from "core/Misc/observable";
import type { AdvancedDynamicTexture } from "./advancedDynamicTexture";

/**
 * Class used to specific a value and its associated unit
 */
export class ValueAndUnit {
    private _value = 1;
    private _unit = ValueAndUnit.UNITMODE_PIXEL;
    private _originalUnit: number;

    /**
     * Gets or sets a value indicating that this value will not scale accordingly with adaptive scaling property
     * @see https://doc.babylonjs.com/how_to/gui#adaptive-scaling
     */
    public ignoreAdaptiveScaling = false;

    /**
     * Observable event triggered each time the value or unit changes
     */
    public onChangedObservable = new Observable<void>();

    /**
     * Creates a new ValueAndUnit
     * @param value defines the value to store
     * @param unit defines the unit to store - defaults to ValueAndUnit.UNITMODE_PIXEL
     * @param negativeValueAllowed defines a boolean indicating if the value can be negative
     */
    public constructor(
        value: number,
        /** defines the unit to store */
        unit = ValueAndUnit.UNITMODE_PIXEL,
        /** defines a boolean indicating if the value can be negative */
        public negativeValueAllowed = true
    ) {
        this._value = value;
        this._unit = unit;
        this._originalUnit = unit;
    }

    /** Gets a boolean indicating if the value is a percentage */
    public get isPercentage(): boolean {
        return this._unit === ValueAndUnit.UNITMODE_PERCENTAGE;
    }

    /** Gets a boolean indicating if the value is store as pixel */
    public get isPixel(): boolean {
        return this._unit === ValueAndUnit.UNITMODE_PIXEL;
    }

    /**
     * Gets value (without units)
     * @deprecated use value property instead
     */
    public get internalValue(): number {
        return this._value;
    }

    /** Gets value (without units) */
    public get value(): number {
        return this._value;
    }

    /** Sets value (without units) */
    public set value(value: number) {
        if (value !== this._value) {
            this._value = value;
            this.onChangedObservable.notifyObservers();
        }
    }

    /** Gets units (without value) */
    public get unit(): number {
        return this._unit;
    }

    /** Sets units (without value) */
    public set unit(value: number) {
        if (value !== this._unit) {
            this._unit = value;
            this.onChangedObservable.notifyObservers();
        }
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
     * Update the current value and unit.
     * @param value defines the value to store
     * @param unit defines the unit to store
     * @returns the current ValueAndUnit
     */
    public updateInPlace(value: number, unit = ValueAndUnit.UNITMODE_PIXEL): ValueAndUnit {
        if (this.value !== value || this.unit !== unit) {
            // set member variables to notify only once
            this._value = value;
            this._unit = unit;
            this.onChangedObservable.notifyObservers();
        }

        return this;
    }

    /**
     * Gets the value accordingly to its unit
     * @param host  defines the root host
     * @returns the value
     */
    public getValue(host: AdvancedDynamicTexture): number {
        if (host && !this.ignoreAdaptiveScaling && this.unit !== ValueAndUnit.UNITMODE_PERCENTAGE) {
            let width: number = 0;
            let height: number = 0;

            if (host.idealWidth) {
                width = (this._value * host.getSize().width) / host.idealWidth;
            }

            if (host.idealHeight) {
                height = (this._value * host.getSize().height) / host.idealHeight;
            }

            if (host.useSmallestIdeal && host.idealWidth && host.idealHeight) {
                return window.innerWidth < window.innerHeight ? width : height;
            }

            if (host.idealWidth) {
                // horizontal
                return width;
            }

            if (host.idealHeight) {
                // vertical
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
        switch (this._unit) {
            case ValueAndUnit.UNITMODE_PERCENTAGE: {
                const percentage = this.getValue(host) * 100;
                return (decimals ? percentage.toFixed(decimals) : percentage) + "%";
            }
            case ValueAndUnit.UNITMODE_PIXEL: {
                const pixels = this.getValue(host);
                return (decimals ? pixels.toFixed(decimals) : pixels) + "px";
            }
        }

        return this._unit.toString();
    }

    /**
     * Store a value parsed from a string
     * @param source defines the source string
     * @returns true if the value was successfully parsed and updated
     */
    public fromString(source: string | number): boolean {
        const match = ValueAndUnit._Regex.exec(source.toString());

        if (!match || match.length === 0) {
            return false;
        }

        let sourceValue = parseFloat(match[1]);
        let sourceUnit = this._originalUnit;

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

        if (sourceValue === this._value && sourceUnit === this._unit) {
            return false;
        }

        this._value = sourceValue;
        this._unit = sourceUnit;
        this.onChangedObservable.notifyObservers();

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
