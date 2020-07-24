import { DeepImmutable, FloatArray } from '../types';
import { Scalar } from './math.scalar';
import { ToLinearSpace, ToGammaSpace } from './math.constants';
import { ArrayTools } from '../Misc/arrayTools';
import { _TypeStore } from '../Misc/typeStore';

/**
 * Class used to hold a RBG color
 */
export class Color3 {

    /**
     * Creates a new Color3 object from red, green, blue values, all between 0 and 1
     * @param r defines the red component (between 0 and 1, default is 0)
     * @param g defines the green component (between 0 and 1, default is 0)
     * @param b defines the blue component (between 0 and 1, default is 0)
     */
    constructor(
        /**
         * Defines the red component (between 0 and 1, default is 0)
         */
        public r: number = 0,
        /**
         * Defines the green component (between 0 and 1, default is 0)
         */
        public g: number = 0,
        /**
         * Defines the blue component (between 0 and 1, default is 0)
         */
        public b: number = 0) {
    }

    /**
     * Creates a string with the Color3 current values
     * @returns the string representation of the Color3 object
     */
    public toString(): string {
        return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
    }

    /**
     * Returns the string "Color3"
     * @returns "Color3"
     */
    public getClassName(): string {
        return "Color3";
    }

    /**
     * Compute the Color3 hash code
     * @returns an unique number that can be used to hash Color3 objects
     */
    public getHashCode(): number {
        let hash = (this.r * 255) | 0;
        hash = (hash * 397) ^ ((this.g * 255) | 0);
        hash = (hash * 397) ^ ((this.b * 255) | 0);
        return hash;
    }

    // Operators

    /**
     * Stores in the given array from the given starting index the red, green, blue values as successive elements
     * @param array defines the array where to store the r,g,b components
     * @param index defines an optional index in the target array to define where to start storing values
     * @returns the current Color3 object
     */
    public toArray(array: FloatArray, index: number = 0): Color3 {
        array[index] = this.r;
        array[index + 1] = this.g;
        array[index + 2] = this.b;

        return this;
    }

    /**
     * Update the current color with values stored in an array from the starting index of the given array
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @returns the current Color3 object
     */
    public fromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Color3 {
        Color3.FromArrayToRef(array, offset, this);
        return this;
    }

    /**
     * Returns a new Color4 object from the current Color3 and the given alpha
     * @param alpha defines the alpha component on the new Color4 object (default is 1)
     * @returns a new Color4 object
     */
    public toColor4(alpha: number = 1): Color4 {
        return new Color4(this.r, this.g, this.b, alpha);
    }

    /**
     * Returns a new array populated with 3 numeric elements : red, green and blue values
     * @returns the new array
     */
    public asArray(): number[] {
        var result = new Array<number>();
        this.toArray(result, 0);
        return result;
    }

    /**
     * Returns the luminance value
     * @returns a float value
     */
    public toLuminance(): number {
        return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
    }

    /**
     * Multiply each Color3 rgb values by the given Color3 rgb values in a new Color3 object
     * @param otherColor defines the second operand
     * @returns the new Color3 object
     */
    public multiply(otherColor: DeepImmutable<Color3>): Color3 {
        return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
    }

    /**
     * Multiply the rgb values of the Color3 and the given Color3 and stores the result in the object "result"
     * @param otherColor defines the second operand
     * @param result defines the Color3 object where to store the result
     * @returns the current Color3
     */
    public multiplyToRef(otherColor: DeepImmutable<Color3>, result: Color3): Color3 {
        result.r = this.r * otherColor.r;
        result.g = this.g * otherColor.g;
        result.b = this.b * otherColor.b;
        return this;
    }

    /**
     * Determines equality between Color3 objects
     * @param otherColor defines the second operand
     * @returns true if the rgb values are equal to the given ones
     */
    public equals(otherColor: DeepImmutable<Color3>): boolean {
        return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
    }

    /**
     * Determines equality between the current Color3 object and a set of r,b,g values
     * @param r defines the red component to check
     * @param g defines the green component to check
     * @param b defines the blue component to check
     * @returns true if the rgb values are equal to the given ones
     */
    public equalsFloats(r: number, g: number, b: number): boolean {
        return this.r === r && this.g === g && this.b === b;
    }

    /**
     * Multiplies in place each rgb value by scale
     * @param scale defines the scaling factor
     * @returns the updated Color3
     */
    public scale(scale: number): Color3 {
        return new Color3(this.r * scale, this.g * scale, this.b * scale);
    }

    /**
     * Multiplies the rgb values by scale and stores the result into "result"
     * @param scale defines the scaling factor
     * @param result defines the Color3 object where to store the result
     * @returns the unmodified current Color3
     */
    public scaleToRef(scale: number, result: Color3): Color3 {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
        return this;
    }

    /**
     * Scale the current Color3 values by a factor and add the result to a given Color3
     * @param scale defines the scale factor
     * @param result defines color to store the result into
     * @returns the unmodified current Color3
     */
    public scaleAndAddToRef(scale: number, result: Color3): Color3 {
        result.r += this.r * scale;
        result.g += this.g * scale;
        result.b += this.b * scale;
        return this;
    }

    /**
     * Clamps the rgb values by the min and max values and stores the result into "result"
     * @param min defines minimum clamping value (default is 0)
     * @param max defines maximum clamping value (default is 1)
     * @param result defines color to store the result into
     * @returns the original Color3
     */
    public clampToRef(min: number = 0, max: number = 1, result: Color3): Color3 {
        result.r = Scalar.Clamp(this.r, min, max);
        result.g = Scalar.Clamp(this.g, min, max);
        result.b = Scalar.Clamp(this.b, min, max);
        return this;
    }

    /**
     * Creates a new Color3 set with the added values of the current Color3 and of the given one
     * @param otherColor defines the second operand
     * @returns the new Color3
     */
    public add(otherColor: DeepImmutable<Color3>): Color3 {
        return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
    }

    /**
     * Stores the result of the addition of the current Color3 and given one rgb values into "result"
     * @param otherColor defines the second operand
     * @param result defines Color3 object to store the result into
     * @returns the unmodified current Color3
     */
    public addToRef(otherColor: DeepImmutable<Color3>, result: Color3): Color3 {
        result.r = this.r + otherColor.r;
        result.g = this.g + otherColor.g;
        result.b = this.b + otherColor.b;
        return this;
    }

    /**
     * Returns a new Color3 set with the subtracted values of the given one from the current Color3
     * @param otherColor defines the second operand
     * @returns the new Color3
     */
    public subtract(otherColor: DeepImmutable<Color3>): Color3 {
        return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
    }

    /**
     * Stores the result of the subtraction of given one from the current Color3 rgb values into "result"
     * @param otherColor defines the second operand
     * @param result defines Color3 object to store the result into
     * @returns the unmodified current Color3
     */
    public subtractToRef(otherColor: DeepImmutable<Color3>, result: Color3): Color3 {
        result.r = this.r - otherColor.r;
        result.g = this.g - otherColor.g;
        result.b = this.b - otherColor.b;
        return this;
    }

    /**
     * Copy the current object
     * @returns a new Color3 copied the current one
     */
    public clone(): Color3 {
        return new Color3(this.r, this.g, this.b);
    }

    /**
     * Copies the rgb values from the source in the current Color3
     * @param source defines the source Color3 object
     * @returns the updated Color3 object
     */
    public copyFrom(source: DeepImmutable<Color3>): Color3 {
        this.r = source.r;
        this.g = source.g;
        this.b = source.b;
        return this;
    }

    /**
     * Updates the Color3 rgb values from the given floats
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @returns the current Color3 object
     */
    public copyFromFloats(r: number, g: number, b: number): Color3 {
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }

    /**
     * Updates the Color3 rgb values from the given floats
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @returns the current Color3 object
     */
    public set(r: number, g: number, b: number): Color3 {
        return this.copyFromFloats(r, g, b);
    }

    /**
     * Compute the Color3 hexadecimal code as a string
     * @returns a string containing the hexadecimal representation of the Color3 object
     */
    public toHexString(): string {
        var intR = (this.r * 255) | 0;
        var intG = (this.g * 255) | 0;
        var intB = (this.b * 255) | 0;
        return "#" + Scalar.ToHex(intR) + Scalar.ToHex(intG) + Scalar.ToHex(intB);
    }

    /**
     * Computes a new Color3 converted from the current one to linear space
     * @returns a new Color3 object
     */
    public toLinearSpace(): Color3 {
        var convertedColor = new Color3();
        this.toLinearSpaceToRef(convertedColor);
        return convertedColor;
    }

    /**
     * Converts current color in rgb space to HSV values
     * @returns a new color3 representing the HSV values
     */
    public toHSV(): Color3 {
        let result = new Color3();

        this.toHSVToRef(result);

        return result;
    }

    /**
     * Converts current color in rgb space to HSV values
     * @param result defines the Color3 where to store the HSV values
     */
    public toHSVToRef(result: Color3) {
        var r = this.r;
        var g = this.g;
        var b = this.b;

        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0;
        var s = 0;
        var v = max;

        var dm = max - min;

        if (max !== 0) {
            s = dm / max;
        }

        if (max != min) {
            if (max == r) {
                h = (g - b) / dm;
                if (g < b) {
                    h += 6;
                }
            } else if (max == g) {
                h = (b - r) / dm + 2;
            } else if (max == b) {
                h = (r - g) / dm + 4;
            }
            h *= 60;
        }

        result.r = h;
        result.g = s;
        result.b = v;
    }

    /**
     * Converts the Color3 values to linear space and stores the result in "convertedColor"
     * @param convertedColor defines the Color3 object where to store the linear space version
     * @returns the unmodified Color3
     */
    public toLinearSpaceToRef(convertedColor: Color3): Color3 {
        convertedColor.r = Math.pow(this.r, ToLinearSpace);
        convertedColor.g = Math.pow(this.g, ToLinearSpace);
        convertedColor.b = Math.pow(this.b, ToLinearSpace);
        return this;
    }

    /**
     * Computes a new Color3 converted from the current one to gamma space
     * @returns a new Color3 object
     */
    public toGammaSpace(): Color3 {
        var convertedColor = new Color3();
        this.toGammaSpaceToRef(convertedColor);
        return convertedColor;
    }

    /**
     * Converts the Color3 values to gamma space and stores the result in "convertedColor"
     * @param convertedColor defines the Color3 object where to store the gamma space version
     * @returns the unmodified Color3
     */
    public toGammaSpaceToRef(convertedColor: Color3): Color3 {
        convertedColor.r = Math.pow(this.r, ToGammaSpace);
        convertedColor.g = Math.pow(this.g, ToGammaSpace);
        convertedColor.b = Math.pow(this.b, ToGammaSpace);
        return this;
    }

    // Statics

    private static _BlackReadOnly = Color3.Black() as DeepImmutable<Color3>;

    /**
     * Convert Hue, saturation and value to a Color3 (RGB)
     * @param hue defines the hue
     * @param saturation defines the saturation
     * @param value defines the value
     * @param result defines the Color3 where to store the RGB values
     */
    public static HSVtoRGBToRef(hue: number, saturation: number, value: number, result: Color3) {
        var chroma = value * saturation;
        var h = hue / 60;
        var x = chroma * (1 - Math.abs((h % 2) - 1));
        var r = 0;
        var g = 0;
        var b = 0;

        if (h >= 0 && h <= 1) {
            r = chroma;
            g = x;
        } else if (h >= 1 && h <= 2) {
            r = x;
            g = chroma;
        } else if (h >= 2 && h <= 3) {
            g = chroma;
            b = x;
        } else if (h >= 3 && h <= 4) {
            g = x;
            b = chroma;
        } else if (h >= 4 && h <= 5) {
            r = x;
            b = chroma;
        } else if (h >= 5 && h <= 6) {
            r = chroma;
            b = x;
        }

        var m = value - chroma;
        result.set((r + m), (g + m), (b + m));
    }

    /**
     * Creates a new Color3 from the string containing valid hexadecimal values
     * @param hex defines a string containing valid hexadecimal values
     * @returns a new Color3 object
     */
    public static FromHexString(hex: string): Color3 {
        if (hex.substring(0, 1) !== "#" || hex.length !== 7) {
            return new Color3(0, 0, 0);
        }

        var r = parseInt(hex.substring(1, 3), 16);
        var g = parseInt(hex.substring(3, 5), 16);
        var b = parseInt(hex.substring(5, 7), 16);

        return Color3.FromInts(r, g, b);
    }

    /**
     * Creates a new Color3 from the starting index of the given array
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @returns a new Color3 object
     */
    public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Color3 {
        return new Color3(array[offset], array[offset + 1], array[offset + 2]);
    }

    /**
     * Creates a new Color3 from the starting index element of the given array
     * @param array defines the source array to read from
     * @param offset defines the offset in the source array
     * @param result defines the target Color3 object
     */
    public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number = 0, result: Color3) {
        result.r = array[offset];
        result.g = array[offset + 1];
        result.b = array[offset + 2];
    }

    /**
     * Creates a new Color3 from integer values (< 256)
     * @param r defines the red component to read from (value between 0 and 255)
     * @param g defines the green component to read from (value between 0 and 255)
     * @param b defines the blue component to read from (value between 0 and 255)
     * @returns a new Color3 object
     */
    public static FromInts(r: number, g: number, b: number): Color3 {
        return new Color3(r / 255.0, g / 255.0, b / 255.0);
    }

    /**
     * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3
     * @param start defines the start Color3 value
     * @param end defines the end Color3 value
     * @param amount defines the gradient value between start and end
     * @returns a new Color3 object
     */
    public static Lerp(start: DeepImmutable<Color3>, end: DeepImmutable<Color3>, amount: number): Color3 {
        var result = new Color3(0.0, 0.0, 0.0);
        Color3.LerpToRef(start, end, amount, result);
        return result;
    }

    /**
     * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @param result defines the Color3 object where to store the result
     */
    public static LerpToRef(left: DeepImmutable<Color3>, right: DeepImmutable<Color3>, amount: number, result: Color3): void {
        result.r = left.r + ((right.r - left.r) * amount);
        result.g = left.g + ((right.g - left.g) * amount);
        result.b = left.b + ((right.b - left.b) * amount);
    }

    /**
     * Returns a Color3 value containing a red color
     * @returns a new Color3 object
     */
    public static Red(): Color3 { return new Color3(1, 0, 0); }
    /**
     * Returns a Color3 value containing a green color
     * @returns a new Color3 object
     */
    public static Green(): Color3 { return new Color3(0, 1, 0); }
    /**
     * Returns a Color3 value containing a blue color
     * @returns a new Color3 object
     */
    public static Blue(): Color3 { return new Color3(0, 0, 1); }
    /**
     * Returns a Color3 value containing a black color
     * @returns a new Color3 object
     */
    public static Black(): Color3 { return new Color3(0, 0, 0); }

    /**
      * Gets a Color3 value containing a black color that must not be updated
      */
    public static get BlackReadOnly(): DeepImmutable<Color3> {
        return Color3._BlackReadOnly;
    }

    /**
     * Returns a Color3 value containing a white color
     * @returns a new Color3 object
     */
    public static White(): Color3 { return new Color3(1, 1, 1); }
    /**
     * Returns a Color3 value containing a purple color
     * @returns a new Color3 object
     */
    public static Purple(): Color3 { return new Color3(0.5, 0, 0.5); }
    /**
     * Returns a Color3 value containing a magenta color
     * @returns a new Color3 object
     */
    public static Magenta(): Color3 { return new Color3(1, 0, 1); }
    /**
     * Returns a Color3 value containing a yellow color
     * @returns a new Color3 object
     */
    public static Yellow(): Color3 { return new Color3(1, 1, 0); }
    /**
     * Returns a Color3 value containing a gray color
     * @returns a new Color3 object
     */
    public static Gray(): Color3 { return new Color3(0.5, 0.5, 0.5); }
    /**
     * Returns a Color3 value containing a teal color
     * @returns a new Color3 object
     */
    public static Teal(): Color3 { return new Color3(0, 1.0, 1.0); }
    /**
     * Returns a Color3 value containing a random color
     * @returns a new Color3 object
     */
    public static Random(): Color3 { return new Color3(Math.random(), Math.random(), Math.random()); }
}

/**
 * Class used to hold a RBGA color
 */
export class Color4 {
    /**
     * Creates a new Color4 object from red, green, blue values, all between 0 and 1
     * @param r defines the red component (between 0 and 1, default is 0)
     * @param g defines the green component (between 0 and 1, default is 0)
     * @param b defines the blue component (between 0 and 1, default is 0)
     * @param a defines the alpha component (between 0 and 1, default is 1)
     */
    constructor(
        /**
         * Defines the red component (between 0 and 1, default is 0)
         */
        public r: number = 0,
        /**
         * Defines the green component (between 0 and 1, default is 0)
         */
        public g: number = 0,
        /**
         * Defines the blue component (between 0 and 1, default is 0)
         */
        public b: number = 0,
        /**
         * Defines the alpha component (between 0 and 1, default is 1)
         */
        public a: number = 1) {
    }

    // Operators

    /**
     * Adds in place the given Color4 values to the current Color4 object
     * @param right defines the second operand
     * @returns the current updated Color4 object
     */
    public addInPlace(right: DeepImmutable<Color4>): Color4 {
        this.r += right.r;
        this.g += right.g;
        this.b += right.b;
        this.a += right.a;
        return this;
    }

    /**
     * Creates a new array populated with 4 numeric elements : red, green, blue, alpha values
     * @returns the new array
     */
    public asArray(): number[] {
        var result = new Array<number>();
        this.toArray(result, 0);
        return result;
    }

    /**
     * Stores from the starting index in the given array the Color4 successive values
     * @param array defines the array where to store the r,g,b components
     * @param index defines an optional index in the target array to define where to start storing values
     * @returns the current Color4 object
     */
    public toArray(array: number[], index: number = 0): Color4 {
        array[index] = this.r;
        array[index + 1] = this.g;
        array[index + 2] = this.b;
        array[index + 3] = this.a;
        return this;
    }

    /**
     * Update the current color with values stored in an array from the starting index of the given array
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @returns the current Color4 object
     */
    public fromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Color4 {
        Color4.FromArrayToRef(array, offset, this);
        return this;
    }    

    /**
     * Determines equality between Color4 objects
     * @param otherColor defines the second operand
     * @returns true if the rgba values are equal to the given ones
     */
    public equals(otherColor: DeepImmutable<Color4>): boolean {
        return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b && this.a === otherColor.a;
    }

    /**
     * Creates a new Color4 set with the added values of the current Color4 and of the given one
     * @param right defines the second operand
     * @returns a new Color4 object
     */
    public add(right: DeepImmutable<Color4>): Color4 {
        return new Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
    }

    /**
     * Creates a new Color4 set with the subtracted values of the given one from the current Color4
     * @param right defines the second operand
     * @returns a new Color4 object
     */
    public subtract(right: DeepImmutable<Color4>): Color4 {
        return new Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
    }

    /**
     * Subtracts the given ones from the current Color4 values and stores the results in "result"
     * @param right defines the second operand
     * @param result defines the Color4 object where to store the result
     * @returns the current Color4 object
     */
    public subtractToRef(right: DeepImmutable<Color4>, result: Color4): Color4 {
        result.r = this.r - right.r;
        result.g = this.g - right.g;
        result.b = this.b - right.b;
        result.a = this.a - right.a;
        return this;
    }

    /**
     * Creates a new Color4 with the current Color4 values multiplied by scale
     * @param scale defines the scaling factor to apply
     * @returns a new Color4 object
     */
    public scale(scale: number): Color4 {
        return new Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
    }

    /**
     * Multiplies the current Color4 values by scale and stores the result in "result"
     * @param scale defines the scaling factor to apply
     * @param result defines the Color4 object where to store the result
     * @returns the current unmodified Color4
     */
    public scaleToRef(scale: number, result: Color4): Color4 {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
        result.a = this.a * scale;
        return this;
    }

    /**
     * Scale the current Color4 values by a factor and add the result to a given Color4
     * @param scale defines the scale factor
     * @param result defines the Color4 object where to store the result
     * @returns the unmodified current Color4
     */
    public scaleAndAddToRef(scale: number, result: Color4): Color4 {
        result.r += this.r * scale;
        result.g += this.g * scale;
        result.b += this.b * scale;
        result.a += this.a * scale;
        return this;
    }

    /**
     * Clamps the rgb values by the min and max values and stores the result into "result"
     * @param min defines minimum clamping value (default is 0)
     * @param max defines maximum clamping value (default is 1)
     * @param result defines color to store the result into.
     * @returns the cuurent Color4
     */
    public clampToRef(min: number = 0, max: number = 1, result: Color4): Color4 {
        result.r = Scalar.Clamp(this.r, min, max);
        result.g = Scalar.Clamp(this.g, min, max);
        result.b = Scalar.Clamp(this.b, min, max);
        result.a = Scalar.Clamp(this.a, min, max);
        return this;
    }

    /**
      * Multipy an Color4 value by another and return a new Color4 object
      * @param color defines the Color4 value to multiply by
      * @returns a new Color4 object
      */
    public multiply(color: Color4): Color4 {
        return new Color4(this.r * color.r, this.g * color.g, this.b * color.b, this.a * color.a);
    }

    /**
     * Multipy a Color4 value by another and push the result in a reference value
     * @param color defines the Color4 value to multiply by
     * @param result defines the Color4 to fill the result in
     * @returns the result Color4
     */
    public multiplyToRef(color: Color4, result: Color4): Color4 {
        result.r = this.r * color.r;
        result.g = this.g * color.g;
        result.b = this.b * color.b;
        result.a = this.a * color.a;
        return result;
    }

    /**
     * Creates a string with the Color4 current values
     * @returns the string representation of the Color4 object
     */
    public toString(): string {
        return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
    }

    /**
     * Returns the string "Color4"
     * @returns "Color4"
     */
    public getClassName(): string {
        return "Color4";
    }

    /**
     * Compute the Color4 hash code
     * @returns an unique number that can be used to hash Color4 objects
     */
    public getHashCode(): number {
        let hash = (this.r * 255) | 0;
        hash = (hash * 397) ^ ((this.g * 255) | 0);
        hash = (hash * 397) ^ ((this.b * 255) | 0);
        hash = (hash * 397) ^ ((this.a * 255) | 0);
        return hash;
    }

    /**
     * Creates a new Color4 copied from the current one
     * @returns a new Color4 object
     */
    public clone(): Color4 {
        return new Color4(this.r, this.g, this.b, this.a);
    }

    /**
     * Copies the given Color4 values into the current one
     * @param source defines the source Color4 object
     * @returns the current updated Color4 object
     */
    public copyFrom(source: Color4): Color4 {
        this.r = source.r;
        this.g = source.g;
        this.b = source.b;
        this.a = source.a;
        return this;
    }

    /**
     * Copies the given float values into the current one
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @param a defines the alpha component to read from
     * @returns the current updated Color4 object
     */
    public copyFromFloats(r: number, g: number, b: number, a: number): Color4 {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }

    /**
     * Copies the given float values into the current one
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @param a defines the alpha component to read from
     * @returns the current updated Color4 object
     */
    public set(r: number, g: number, b: number, a: number): Color4 {
        return this.copyFromFloats(r, g, b, a);
    }

    /**
     * Compute the Color4 hexadecimal code as a string
     * @param returnAsColor3 defines if the string should only contains RGB values (off by default)
     * @returns a string containing the hexadecimal representation of the Color4 object
     */
    public toHexString(returnAsColor3 = false): string {
        var intR = (this.r * 255) | 0;
        var intG = (this.g * 255) | 0;
        var intB = (this.b * 255) | 0;

        if (returnAsColor3) {
            return "#" + Scalar.ToHex(intR) + Scalar.ToHex(intG) + Scalar.ToHex(intB);
        }

        var intA = (this.a * 255) | 0;
        return "#" + Scalar.ToHex(intR) + Scalar.ToHex(intG) + Scalar.ToHex(intB) + Scalar.ToHex(intA);
    }

    /**
     * Computes a new Color4 converted from the current one to linear space
     * @returns a new Color4 object
     */
    public toLinearSpace(): Color4 {
        var convertedColor = new Color4();
        this.toLinearSpaceToRef(convertedColor);
        return convertedColor;
    }

    /**
     * Converts the Color4 values to linear space and stores the result in "convertedColor"
     * @param convertedColor defines the Color4 object where to store the linear space version
     * @returns the unmodified Color4
     */
    public toLinearSpaceToRef(convertedColor: Color4): Color4 {
        convertedColor.r = Math.pow(this.r, ToLinearSpace);
        convertedColor.g = Math.pow(this.g, ToLinearSpace);
        convertedColor.b = Math.pow(this.b, ToLinearSpace);
        convertedColor.a = this.a;
        return this;
    }

    /**
     * Computes a new Color4 converted from the current one to gamma space
     * @returns a new Color4 object
     */
    public toGammaSpace(): Color4 {
        var convertedColor = new Color4();
        this.toGammaSpaceToRef(convertedColor);
        return convertedColor;
    }

    /**
     * Converts the Color4 values to gamma space and stores the result in "convertedColor"
     * @param convertedColor defines the Color4 object where to store the gamma space version
     * @returns the unmodified Color4
     */
    public toGammaSpaceToRef(convertedColor: Color4): Color4 {
        convertedColor.r = Math.pow(this.r, ToGammaSpace);
        convertedColor.g = Math.pow(this.g, ToGammaSpace);
        convertedColor.b = Math.pow(this.b, ToGammaSpace);
        convertedColor.a = this.a;
        return this;
    }

    // Statics

    /**
     * Creates a new Color4 from the string containing valid hexadecimal values
     * @param hex defines a string containing valid hexadecimal values
     * @returns a new Color4 object
     */
    public static FromHexString(hex: string): Color4 {
        if (hex.substring(0, 1) !== "#" || hex.length !== 9) {
            return new Color4(0.0, 0.0, 0.0, 0.0);
        }

        var r = parseInt(hex.substring(1, 3), 16);
        var g = parseInt(hex.substring(3, 5), 16);
        var b = parseInt(hex.substring(5, 7), 16);
        var a = parseInt(hex.substring(7, 9), 16);

        return Color4.FromInts(r, g, b, a);
    }

    /**
     * Creates a new Color4 object set with the linearly interpolated values of "amount" between the left Color4 object and the right Color4 object
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @returns a new Color4 object
     */
    public static Lerp(left: DeepImmutable<Color4>, right: DeepImmutable<Color4>, amount: number): Color4 {
        var result = new Color4(0.0, 0.0, 0.0, 0.0);
        Color4.LerpToRef(left, right, amount, result);
        return result;
    }

    /**
     * Set the given "result" with the linearly interpolated values of "amount" between the left Color4 object and the right Color4 object
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @param result defines the Color4 object where to store data
     */
    public static LerpToRef(left: DeepImmutable<Color4>, right: DeepImmutable<Color4>, amount: number, result: Color4): void {
        result.r = left.r + (right.r - left.r) * amount;
        result.g = left.g + (right.g - left.g) * amount;
        result.b = left.b + (right.b - left.b) * amount;
        result.a = left.a + (right.a - left.a) * amount;
    }

    /**
     * Creates a new Color4 from a Color3 and an alpha value
     * @param color3 defines the source Color3 to read from
     * @param alpha defines the alpha component (1.0 by default)
     * @returns a new Color4 object
     */
    public static FromColor3(color3: DeepImmutable<Color3>, alpha: number = 1.0): Color4 {
        return new Color4(color3.r, color3.g, color3.b, alpha);
    }

    /**
     * Creates a new Color4 from the starting index element of the given array
     * @param array defines the source array to read from
     * @param offset defines the offset in the source array
     * @returns a new Color4 object
     */
    public static FromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): Color4 {
        return new Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    }

    /**
     * Creates a new Color4 from the starting index element of the given array
     * @param array defines the source array to read from
     * @param offset defines the offset in the source array
     * @param result defines the target Color4 object
     */
    public static FromArrayToRef(array: DeepImmutable<ArrayLike<number>>, offset: number = 0, result: Color4) {
        result.r = array[offset];
        result.g = array[offset + 1];
        result.b = array[offset + 2];
        result.a = array[offset + 3];
    }

    /**
     * Creates a new Color3 from integer values (< 256)
     * @param r defines the red component to read from (value between 0 and 255)
     * @param g defines the green component to read from (value between 0 and 255)
     * @param b defines the blue component to read from (value between 0 and 255)
     * @param a defines the alpha component to read from (value between 0 and 255)
     * @returns a new Color3 object
     */
    public static FromInts(r: number, g: number, b: number, a: number): Color4 {
        return new Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
    }

    /**
     * Check the content of a given array and convert it to an array containing RGBA data
     * If the original array was already containing count * 4 values then it is returned directly
     * @param colors defines the array to check
     * @param count defines the number of RGBA data to expect
     * @returns an array containing count * 4 values (RGBA)
     */
    public static CheckColors4(colors: number[], count: number): number[] {
        // Check if color3 was used
        if (colors.length === count * 3) {
            var colors4 = [];
            for (var index = 0; index < colors.length; index += 3) {
                var newIndex = (index / 3) * 4;
                colors4[newIndex] = colors[index];
                colors4[newIndex + 1] = colors[index + 1];
                colors4[newIndex + 2] = colors[index + 2];
                colors4[newIndex + 3] = 1.0;
            }

            return colors4;
        }

        return colors;
    }
}

/**
 * @hidden
 */
export class TmpColors {
    public static Color3: Color3[] = ArrayTools.BuildArray(3, Color3.Black);
    public static Color4: Color4[] = ArrayTools.BuildArray(3, () => new Color4(0, 0, 0, 0));
}

_TypeStore.RegisteredTypes["BABYLON.Color3"] = Color3;
_TypeStore.RegisteredTypes["BABYLON.Color4"] = Color4;