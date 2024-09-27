import { BuildArray } from "../Misc/arrayTools";
import { RegisterClass } from "../Misc/typeStore";
import type { DeepImmutable, FloatArray, Tuple } from "../types";
import { Epsilon, ToGammaSpace, ToLinearSpace } from "./math.constants";
import type { IColor3Like, IColor4Like } from "./math.like";
import { Clamp, ToHex, WithinEpsilon } from "./math.scalar.functions";
import type { Tensor } from "./tensor";

function colorChannelToLinearSpace(color: number): number {
    return Math.pow(color, ToLinearSpace);
}

function colorChannelToLinearSpaceExact(color: number): number {
    if (color <= 0.04045) {
        return 0.0773993808 * color;
    }
    return Math.pow(0.947867299 * (color + 0.055), 2.4);
}

function colorChannelToGammaSpace(color: number): number {
    return Math.pow(color, ToGammaSpace);
}

function colorChannelToGammaSpaceExact(color: number): number {
    if (color <= 0.0031308) {
        return 12.92 * color;
    }
    return 1.055 * Math.pow(color, 0.41666) - 0.055;
}

/**
 * Class used to hold a RGB color
 */
export class Color3 implements Tensor<Tuple<number, 3>, IColor3Like>, IColor3Like {
    /**
     * @see Tensor.dimension
     */
    public declare readonly dimension: [3];

    /**
     * @see Tensor.rank
     */
    public declare readonly rank: 1;

    /**
     * Creates a new Color3 object from red, green, blue values, all between 0 and 1
     * @param r defines the red component (between 0 and 1, default is 0)
     * @param g defines the green component (between 0 and 1, default is 0)
     * @param b defines the blue component (between 0 and 1, default is 0)
     */
    constructor(
        /**
         * [0] Defines the red component (between 0 and 1, default is 0)
         */
        public r: number = 0,
        /**
         * [0] Defines the green component (between 0 and 1, default is 0)
         */
        public g: number = 0,
        /**
         * [0] Defines the blue component (between 0 and 1, default is 0)
         */
        public b: number = 0
    ) {}

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
    public toArray(array: FloatArray, index: number = 0): this {
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
    public fromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): this {
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
    public asArray(): Tuple<number, 3> {
        return [this.r, this.g, this.b];
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
    public multiply(otherColor: DeepImmutable<IColor3Like>): Color3 {
        return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
    }

    /**
     * Multiply the rgb values of the Color3 and the given Color3 and stores the result in the object "result"
     * @param otherColor defines the second operand
     * @param result defines the Color3 object where to store the result
     * @returns the result Color3
     */
    public multiplyToRef<T extends IColor3Like>(otherColor: DeepImmutable<IColor3Like>, result: T): T {
        result.r = this.r * otherColor.r;
        result.g = this.g * otherColor.g;
        result.b = this.b * otherColor.b;
        return result;
    }

    /**
     * Multiplies the current Color3 coordinates by the given ones
     * @param otherColor defines the second operand
     * @returns the current updated Color3
     */
    public multiplyInPlace(otherColor: DeepImmutable<IColor3Like>): this {
        this.r *= otherColor.r;
        this.g *= otherColor.g;
        this.b *= otherColor.b;
        return this;
    }

    /**
     * Returns a new Color3 set with the result of the multiplication of the current Color3 coordinates by the given floats
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the new Color3
     */
    public multiplyByFloats(r: number, g: number, b: number): Color3 {
        return new Color3(this.r * r, this.g * g, this.b * b);
    }

    /**
     * @internal
     * Do not use
     */
    public divide(_other: DeepImmutable<IColor3Like>): never {
        throw new ReferenceError("Can not divide a color");
    }

    /**
     * @internal
     * Do not use
     */
    public divideToRef(_other: DeepImmutable<IColor3Like>, _result: IColor3Like): never {
        throw new ReferenceError("Can not divide a color");
    }

    /**
     * @internal
     * Do not use
     */
    public divideInPlace(_other: DeepImmutable<IColor3Like>): never {
        throw new ReferenceError("Can not divide a color");
    }

    /**
     * Updates the current Color3 with the minimal coordinate values between its and the given color ones
     * @param other defines the second operand
     * @returns the current updated Color3
     */
    public minimizeInPlace(other: DeepImmutable<IColor3Like>): this {
        return this.minimizeInPlaceFromFloats(other.r, other.g, other.b);
    }

    /**
     * Updates the current Color3 with the maximal coordinate values between its and the given color ones.
     * @param other defines the second operand
     * @returns the current updated Color3
     */
    public maximizeInPlace(other: DeepImmutable<IColor3Like>): this {
        return this.maximizeInPlaceFromFloats(other.r, other.g, other.b);
    }

    /**
     * Updates the current Color3 with the minimal coordinate values between its and the given coordinates
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the current updated Color3
     */
    public minimizeInPlaceFromFloats(r: number, g: number, b: number): this {
        this.r = Math.min(r, this.r);
        this.g = Math.min(g, this.g);
        this.b = Math.min(b, this.b);
        return this;
    }

    /**
     * Updates the current Color3 with the maximal coordinate values between its and the given coordinates.
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the current updated Color3
     */
    public maximizeInPlaceFromFloats(r: number, g: number, b: number): this {
        this.r = Math.max(r, this.r);
        this.g = Math.max(g, this.g);
        this.b = Math.max(b, this.b);
        return this;
    }

    /**
     * @internal
     * Do not use
     */
    public floorToRef(_result: IColor3Like): never {
        throw new ReferenceError("Can not floor a color");
    }

    /**
     * @internal
     * Do not use
     */
    public floor(): never {
        throw new ReferenceError("Can not floor a color");
    }

    /**
     * @internal
     * Do not use
     */
    public fractToRef(_result: IColor3Like): never {
        throw new ReferenceError("Can not fract a color");
    }

    /**
     * @internal
     * Do not use
     */
    public fract(): never {
        throw new ReferenceError("Can not fract a color");
    }

    /**
     * Determines equality between Color3 objects
     * @param otherColor defines the second operand
     * @returns true if the rgb values are equal to the given ones
     */
    public equals(otherColor: DeepImmutable<IColor3Like>): boolean {
        return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
    }

    /**
     * Alias for equalsToFloats
     * @param r red color component
     * @param g green color component
     * @param b blue color component
     * @returns boolean
     */
    public equalsFloats(r: number, g: number, b: number): boolean {
        return this.equalsToFloats(r, g, b);
    }

    /**
     * Determines equality between the current Color3 object and a set of r,b,g values
     * @param r defines the red component to check
     * @param g defines the green component to check
     * @param b defines the blue component to check
     * @returns true if the rgb values are equal to the given ones
     */
    public equalsToFloats(r: number, g: number, b: number): boolean {
        return this.r === r && this.g === g && this.b === b;
    }

    /**
     * Returns true if the current Color3 and the given color coordinates are distant less than epsilon
     * @param otherColor defines the second operand
     * @param epsilon defines the minimal distance to define values as equals
     * @returns true if both colors are distant less than epsilon
     */
    public equalsWithEpsilon(otherColor: DeepImmutable<IColor3Like>, epsilon: number = Epsilon): boolean {
        return WithinEpsilon(this.r, otherColor.r, epsilon) && WithinEpsilon(this.g, otherColor.g, epsilon) && WithinEpsilon(this.b, otherColor.b, epsilon);
    }

    /**
     * @internal
     * Do not use
     */
    public negate(): never {
        throw new ReferenceError("Can not negate a color");
    }

    /**
     * @internal
     * Do not use
     */
    public negateInPlace(): never {
        throw new ReferenceError("Can not negate a color");
    }

    /**
     * @internal
     * Do not use
     */
    public negateToRef(_result: IColor3Like): never {
        throw new ReferenceError("Can not negate a color");
    }

    /**
     * Creates a new Color3 with the current Color3 values multiplied by scale
     * @param scale defines the scaling factor to apply
     * @returns a new Color3 object
     */
    public scale(scale: number): Color3 {
        return new Color3(this.r * scale, this.g * scale, this.b * scale);
    }

    /**
     * Multiplies the Color3 values by the float "scale"
     * @param scale defines the scaling factor to apply
     * @returns the current updated Color3
     */
    public scaleInPlace(scale: number): this {
        this.r *= scale;
        this.g *= scale;
        this.b *= scale;
        return this;
    }

    /**
     * Multiplies the rgb values by scale and stores the result into "result"
     * @param scale defines the scaling factor
     * @param result defines the Color3 object where to store the result
     * @returns the result Color3
     */
    public scaleToRef<T extends IColor3Like>(scale: number, result: T): T {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
        return result;
    }

    /**
     * Scale the current Color3 values by a factor and add the result to a given Color3
     * @param scale defines the scale factor
     * @param result defines color to store the result into
     * @returns the result Color3
     */
    public scaleAndAddToRef<T extends IColor3Like>(scale: number, result: T): T {
        result.r += this.r * scale;
        result.g += this.g * scale;
        result.b += this.b * scale;
        return result;
    }

    /**
     * Clamps the rgb values by the min and max values and stores the result into "result"
     * @param min defines minimum clamping value (default is 0)
     * @param max defines maximum clamping value (default is 1)
     * @param result defines color to store the result into
     * @returns the result Color3
     */
    public clampToRef<T extends IColor3Like>(min: number = 0, max: number = 1, result: T): T {
        result.r = Clamp(this.r, min, max);
        result.g = Clamp(this.g, min, max);
        result.b = Clamp(this.b, min, max);
        return result;
    }

    /**
     * Creates a new Color3 set with the added values of the current Color3 and of the given one
     * @param otherColor defines the second operand
     * @returns the new Color3
     */
    public add(otherColor: DeepImmutable<IColor3Like>): Color3 {
        return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
    }

    /**
     * Adds the given color to the current Color3
     * @param otherColor defines the second operand
     * @returns the current updated Color3
     */
    public addInPlace(otherColor: DeepImmutable<IColor3Like>): this {
        this.r += otherColor.r;
        this.g += otherColor.g;
        this.b += otherColor.b;
        return this;
    }

    /**
     * Adds the given coordinates to the current Color3
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the current updated Color3
     */
    public addInPlaceFromFloats(r: number, g: number, b: number): this {
        this.r += r;
        this.g += g;
        this.b += b;
        return this;
    }

    /**
     * Stores the result of the addition of the current Color3 and given one rgb values into "result"
     * @param otherColor defines the second operand
     * @param result defines Color3 object to store the result into
     * @returns the unmodified current Color3
     */
    public addToRef<T extends IColor3Like>(otherColor: DeepImmutable<IColor3Like>, result: T): T {
        result.r = this.r + otherColor.r;
        result.g = this.g + otherColor.g;
        result.b = this.b + otherColor.b;
        return result;
    }

    /**
     * Returns a new Color3 set with the subtracted values of the given one from the current Color3
     * @param otherColor defines the second operand
     * @returns the new Color3
     */
    public subtract(otherColor: DeepImmutable<IColor3Like>): Color3 {
        return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
    }

    /**
     * Stores the result of the subtraction of given one from the current Color3 rgb values into "result"
     * @param otherColor defines the second operand
     * @param result defines Color3 object to store the result into
     * @returns the unmodified current Color3
     */
    public subtractToRef<T extends IColor3Like>(otherColor: DeepImmutable<IColor3Like>, result: T): T {
        result.r = this.r - otherColor.r;
        result.g = this.g - otherColor.g;
        result.b = this.b - otherColor.b;
        return result;
    }

    /**
     * Subtract the given color from the current Color3
     * @param otherColor defines the second operand
     * @returns the current updated Color3
     */
    public subtractInPlace(otherColor: DeepImmutable<IColor3Like>): this {
        this.r -= otherColor.r;
        this.g -= otherColor.g;
        this.b -= otherColor.b;
        return this;
    }

    /**
     * Returns a new Color3 set with the subtraction of the given floats from the current Color3 coordinates
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the resulting Color3
     */
    public subtractFromFloats(r: number, g: number, b: number): Color3 {
        return new Color3(this.r - r, this.g - g, this.b - b);
    }

    /**
     * Subtracts the given floats from the current Color3 coordinates and set the given color "result" with this result
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param result defines the Color3 object where to store the result
     * @returns the result
     */
    public subtractFromFloatsToRef<T extends IColor3Like>(r: number, g: number, b: number, result: T): T {
        result.r = this.r - r;
        result.g = this.g - g;
        result.b = this.b - b;
        return result;
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
    public copyFrom(source: DeepImmutable<IColor3Like>): this {
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
    public copyFromFloats(r: number, g: number, b: number): this {
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
    public set(r: number, g: number, b: number): this {
        return this.copyFromFloats(r, g, b);
    }

    /**
     * Copies the given float to the current Color3 coordinates
     * @param v defines the r, g and b coordinates of the operand
     * @returns the current updated Color3
     */
    public setAll(v: number): this {
        this.r = this.g = this.b = v;
        return this;
    }

    /**
     * Compute the Color3 hexadecimal code as a string
     * @returns a string containing the hexadecimal representation of the Color3 object
     */
    public toHexString(): string {
        const intR = Math.round(this.r * 255);
        const intG = Math.round(this.g * 255);
        const intB = Math.round(this.b * 255);
        return "#" + ToHex(intR) + ToHex(intG) + ToHex(intB);
    }

    /**
     * Updates the Color3 rgb values from the string containing valid hexadecimal values
     * @param hex defines a string containing valid hexadecimal values
     * @returns the current Color3 object
     */
    public fromHexString(hex: string): this {
        if (hex.substring(0, 1) !== "#" || hex.length !== 7) {
            return this;
        }

        this.r = parseInt(hex.substring(1, 3), 16) / 255;
        this.g = parseInt(hex.substring(3, 5), 16) / 255;
        this.b = parseInt(hex.substring(5, 7), 16) / 255;

        return this;
    }

    /**
     * Converts current color in rgb space to HSV values
     * @returns a new color3 representing the HSV values
     */
    public toHSV(): Color3 {
        return this.toHSVToRef(new Color3());
    }

    /**
     * Converts current color in rgb space to HSV values
     * @param result defines the Color3 where to store the HSV values
     * @returns the updated result
     */
    public toHSVToRef<T extends IColor3Like>(result: T): T {
        const r = this.r;
        const g = this.g;
        const b = this.b;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const v = max;

        const dm = max - min;

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
        return result;
    }

    /**
     * Computes a new Color3 converted from the current one to linear space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color3 object
     */
    public toLinearSpace(exact = false): Color3 {
        const convertedColor = new Color3();
        this.toLinearSpaceToRef(convertedColor, exact);
        return convertedColor;
    }

    /**
     * Converts the Color3 values to linear space and stores the result in "convertedColor"
     * @param convertedColor defines the Color3 object where to store the linear space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color3
     */
    public toLinearSpaceToRef(convertedColor: IColor3Like, exact = false): this {
        if (exact) {
            convertedColor.r = colorChannelToLinearSpaceExact(this.r);
            convertedColor.g = colorChannelToLinearSpaceExact(this.g);
            convertedColor.b = colorChannelToLinearSpaceExact(this.b);
        } else {
            convertedColor.r = colorChannelToLinearSpace(this.r);
            convertedColor.g = colorChannelToLinearSpace(this.g);
            convertedColor.b = colorChannelToLinearSpace(this.b);
        }
        return this;
    }

    /**
     * Computes a new Color3 converted from the current one to gamma space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color3 object
     */
    public toGammaSpace(exact = false): Color3 {
        const convertedColor = new Color3();
        this.toGammaSpaceToRef(convertedColor, exact);
        return convertedColor;
    }

    /**
     * Converts the Color3 values to gamma space and stores the result in "convertedColor"
     * @param convertedColor defines the Color3 object where to store the gamma space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color3
     */
    public toGammaSpaceToRef(convertedColor: IColor3Like, exact = false): this {
        if (exact) {
            convertedColor.r = colorChannelToGammaSpaceExact(this.r);
            convertedColor.g = colorChannelToGammaSpaceExact(this.g);
            convertedColor.b = colorChannelToGammaSpaceExact(this.b);
        } else {
            convertedColor.r = colorChannelToGammaSpace(this.r);
            convertedColor.g = colorChannelToGammaSpace(this.g);
            convertedColor.b = colorChannelToGammaSpace(this.b);
        }
        return this;
    }

    // Statics

    private static _BlackReadOnly = Color3.Black() as DeepImmutable<Color3>;

    /**
     * Converts Hue, saturation and value to a Color3 (RGB)
     * @param hue defines the hue (value between 0 and 360)
     * @param saturation defines the saturation (value between 0 and 1)
     * @param value defines the value (value between 0 and 1)
     * @param result defines the Color3 where to store the RGB values
     * @returns the updated result
     */
    public static HSVtoRGBToRef<T extends IColor3Like>(hue: number, saturation: number, value: number, result: T): T {
        const chroma = value * saturation;
        const h = hue / 60;
        const x = chroma * (1 - Math.abs((h % 2) - 1));
        let r = 0;
        let g = 0;
        let b = 0;

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

        const m = value - chroma;
        result.r = r + m;
        result.g = g + m;
        result.b = b + m;
        return result;
    }

    /**
     * Converts Hue, saturation and value to a new Color3 (RGB)
     * @param hue defines the hue (value between 0 and 360)
     * @param saturation defines the saturation (value between 0 and 1)
     * @param value defines the value (value between 0 and 1)
     * @returns a new Color3 object
     */
    public static FromHSV(hue: number, saturation: number, value: number): Color3 {
        const result = new Color3(0, 0, 0);
        Color3.HSVtoRGBToRef(hue, saturation, value, result);
        return result;
    }

    /**
     * Creates a new Color3 from the string containing valid hexadecimal values
     * @param hex defines a string containing valid hexadecimal values
     * @returns a new Color3 object
     */
    public static FromHexString(hex: string): Color3 {
        return new Color3(0, 0, 0).fromHexString(hex);
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
     * Creates a new Color3 from integer values (\< 256)
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
        const result = new Color3(0.0, 0.0, 0.0);
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
        result.r = left.r + (right.r - left.r) * amount;
        result.g = left.g + (right.g - left.g) * amount;
        result.b = left.b + (right.b - left.b) * amount;
    }

    /**
     * Returns a new Color3 located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2"
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent Color3
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent Color3
     * @param amount defines the amount on the interpolation spline (between 0 and 1)
     * @returns the new Color3
     */
    public static Hermite(value1: DeepImmutable<Color3>, tangent1: DeepImmutable<Color3>, value2: DeepImmutable<Color3>, tangent2: DeepImmutable<Color3>, amount: number): Color3 {
        const squared = amount * amount;
        const cubed = amount * squared;
        const part1 = 2.0 * cubed - 3.0 * squared + 1.0;
        const part2 = -2.0 * cubed + 3.0 * squared;
        const part3 = cubed - 2.0 * squared + amount;
        const part4 = cubed - squared;

        const r = value1.r * part1 + value2.r * part2 + tangent1.r * part3 + tangent2.r * part4;
        const g = value1.g * part1 + value2.g * part2 + tangent1.g * part3 + tangent2.g * part4;
        const b = value1.b * part1 + value2.b * part2 + tangent1.b * part3 + tangent2.b * part4;
        return new Color3(r, g, b);
    }

    /**
     * Returns a new Color3 which is the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @returns 1st derivative
     */
    public static Hermite1stDerivative(
        value1: DeepImmutable<Color3>,
        tangent1: DeepImmutable<Color3>,
        value2: DeepImmutable<Color3>,
        tangent2: DeepImmutable<Color3>,
        time: number
    ): Color3 {
        const result = Color3.Black();

        this.Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result);

        return result;
    }

    /**
     * Returns a new Color3 which is the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @param result define where to store the derivative
     */
    public static Hermite1stDerivativeToRef(
        value1: DeepImmutable<Color3>,
        tangent1: DeepImmutable<Color3>,
        value2: DeepImmutable<Color3>,
        tangent2: DeepImmutable<Color3>,
        time: number,
        result: Color3
    ) {
        const t2 = time * time;

        result.r = (t2 - time) * 6 * value1.r + (3 * t2 - 4 * time + 1) * tangent1.r + (-t2 + time) * 6 * value2.r + (3 * t2 - 2 * time) * tangent2.r;
        result.g = (t2 - time) * 6 * value1.g + (3 * t2 - 4 * time + 1) * tangent1.g + (-t2 + time) * 6 * value2.g + (3 * t2 - 2 * time) * tangent2.g;
        result.b = (t2 - time) * 6 * value1.b + (3 * t2 - 4 * time + 1) * tangent1.b + (-t2 + time) * 6 * value2.b + (3 * t2 - 2 * time) * tangent2.b;
    }

    /**
     * Returns a Color3 value containing a red color
     * @returns a new Color3 object
     */
    public static Red(): Color3 {
        return new Color3(1, 0, 0);
    }
    /**
     * Returns a Color3 value containing a green color
     * @returns a new Color3 object
     */
    public static Green(): Color3 {
        return new Color3(0, 1, 0);
    }
    /**
     * Returns a Color3 value containing a blue color
     * @returns a new Color3 object
     */
    public static Blue(): Color3 {
        return new Color3(0, 0, 1);
    }
    /**
     * Returns a Color3 value containing a black color
     * @returns a new Color3 object
     */
    public static Black(): Color3 {
        return new Color3(0, 0, 0);
    }

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
    public static White(): Color3 {
        return new Color3(1, 1, 1);
    }
    /**
     * Returns a Color3 value containing a purple color
     * @returns a new Color3 object
     */
    public static Purple(): Color3 {
        return new Color3(0.5, 0, 0.5);
    }
    /**
     * Returns a Color3 value containing a magenta color
     * @returns a new Color3 object
     */
    public static Magenta(): Color3 {
        return new Color3(1, 0, 1);
    }
    /**
     * Returns a Color3 value containing a yellow color
     * @returns a new Color3 object
     */
    public static Yellow(): Color3 {
        return new Color3(1, 1, 0);
    }
    /**
     * Returns a Color3 value containing a gray color
     * @returns a new Color3 object
     */
    public static Gray(): Color3 {
        return new Color3(0.5, 0.5, 0.5);
    }
    /**
     * Returns a Color3 value containing a teal color
     * @returns a new Color3 object
     */
    public static Teal(): Color3 {
        return new Color3(0, 1.0, 1.0);
    }
    /**
     * Returns a Color3 value containing a random color
     * @returns a new Color3 object
     */
    public static Random(): Color3 {
        return new Color3(Math.random(), Math.random(), Math.random());
    }
}
Object.defineProperties(Color3.prototype, {
    dimension: { value: [3] },
    rank: { value: 1 },
});

/**
 * Class used to hold a RBGA color
 */
export class Color4 implements Tensor<Tuple<number, 4>, IColor4Like>, IColor4Like {
    /**
     * @see Tensor.dimension
     */
    public declare readonly dimension: [4];

    /**
     * @see Tensor.rank
     */
    public declare readonly rank: 1;

    /**
     * Creates a new Color4 object from red, green, blue values, all between 0 and 1
     * @param r defines the red component (between 0 and 1, default is 0)
     * @param g defines the green component (between 0 and 1, default is 0)
     * @param b defines the blue component (between 0 and 1, default is 0)
     * @param a defines the alpha component (between 0 and 1, default is 1)
     */
    constructor(
        /**
         * [0] Defines the red component (between 0 and 1, default is 0)
         */
        public r: number = 0,
        /**
         * [0] Defines the green component (between 0 and 1, default is 0)
         */
        public g: number = 0,
        /**
         * [0] Defines the blue component (between 0 and 1, default is 0)
         */
        public b: number = 0,
        /**
         * [1] Defines the alpha component (between 0 and 1, default is 1)
         */
        public a: number = 1
    ) {}

    // Operators

    /**
     * Creates a new array populated with 4 numeric elements : red, green, blue, alpha values
     * @returns the new array
     */
    public asArray(): Tuple<number, 4> {
        return [this.r, this.g, this.b, this.a];
    }

    /**
     * Stores from the starting index in the given array the Color4 successive values
     * @param array defines the array where to store the r,g,b components
     * @param index defines an optional index in the target array to define where to start storing values
     * @returns the current Color4 object
     */
    public toArray(array: FloatArray, index: number = 0): this {
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
    public fromArray(array: DeepImmutable<ArrayLike<number>>, offset: number = 0): this {
        this.r = array[offset];
        this.g = array[offset + 1];
        this.b = array[offset + 2];
        this.a = array[offset + 3];
        return this;
    }

    /**
     * Determines equality between Color4 objects
     * @param otherColor defines the second operand
     * @returns true if the rgba values are equal to the given ones
     */
    public equals(otherColor: DeepImmutable<IColor4Like>): boolean {
        return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b && this.a === otherColor.a;
    }

    /**
     * Creates a new Color4 set with the added values of the current Color4 and of the given one
     * @param otherColor defines the second operand
     * @returns a new Color4 object
     */
    public add(otherColor: DeepImmutable<IColor4Like>): Color4 {
        return new Color4(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b, this.a + otherColor.a);
    }

    /**
     * Updates the given color "result" with the result of the addition of the current Color4 and the given one.
     * @param otherColor the color to add
     * @param result the color to store the result
     * @returns result input
     */
    public addToRef<T extends IColor4Like>(otherColor: DeepImmutable<IColor4Like>, result: T): T {
        result.r = this.r + otherColor.r;
        result.g = this.g + otherColor.g;
        result.b = this.b + otherColor.b;
        result.a = this.a + otherColor.a;
        return result;
    }

    /**
     * Adds in place the given Color4 values to the current Color4 object
     * @param otherColor defines the second operand
     * @returns the current updated Color4 object
     */
    public addInPlace(otherColor: DeepImmutable<IColor4Like>): this {
        this.r += otherColor.r;
        this.g += otherColor.g;
        this.b += otherColor.b;
        this.a += otherColor.a;
        return this;
    }

    /**
     * Adds the given coordinates to the current Color4
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param a defines the a coordinate of the operand
     * @returns the current updated Color4
     */
    public addInPlaceFromFloats(r: number, g: number, b: number, a: number): this {
        this.r += r;
        this.g += g;
        this.b += b;
        this.a += a;
        return this;
    }

    /**
     * Creates a new Color4 set with the subtracted values of the given one from the current Color4
     * @param otherColor defines the second operand
     * @returns a new Color4 object
     */
    public subtract(otherColor: DeepImmutable<IColor4Like>): Color4 {
        return new Color4(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b, this.a - otherColor.a);
    }

    /**
     * Subtracts the given ones from the current Color4 values and stores the results in "result"
     * @param otherColor defines the second operand
     * @param result defines the Color4 object where to store the result
     * @returns the result Color4 object
     */
    public subtractToRef<T extends IColor4Like>(otherColor: DeepImmutable<IColor4Like>, result: T): T {
        result.r = this.r - otherColor.r;
        result.g = this.g - otherColor.g;
        result.b = this.b - otherColor.b;
        result.a = this.a - otherColor.a;
        return result;
    }

    /**
     * Subtract in place the given color from the current Color4.
     * @param otherColor the color to subtract
     * @returns the updated Color4.
     */
    public subtractInPlace(otherColor: DeepImmutable<IColor4Like>): this {
        this.r -= otherColor.r;
        this.g -= otherColor.g;
        this.b -= otherColor.b;
        this.a -= otherColor.a;
        return this;
    }

    /**
     * Returns a new Color4 set with the result of the subtraction of the given floats from the current Color4 coordinates.
     * @param r value to subtract
     * @param g value to subtract
     * @param b value to subtract
     * @param a value to subtract
     * @returns new color containing the result
     */
    public subtractFromFloats(r: number, g: number, b: number, a: number): Color4 {
        return new Color4(this.r - r, this.g - g, this.b - b, this.a - a);
    }

    /**
     * Sets the given color "result" set with the result of the subtraction of the given floats from the current Color4 coordinates.
     * @param r value to subtract
     * @param g value to subtract
     * @param b value to subtract
     * @param a value to subtract
     * @param result the color to store the result in
     * @returns result input
     */
    public subtractFromFloatsToRef<T extends IColor4Like>(r: number, g: number, b: number, a: number, result: T): T {
        result.r = this.r - r;
        result.g = this.g - g;
        result.b = this.b - b;
        result.a = this.a - a;
        return result;
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
     * Multiplies the Color4 values by the float "scale"
     * @param scale defines the scaling factor to apply
     * @returns the current updated Color4
     */
    public scaleInPlace(scale: number): this {
        this.r *= scale;
        this.g *= scale;
        this.b *= scale;
        this.a *= scale;
        return this;
    }

    /**
     * Multiplies the current Color4 values by scale and stores the result in "result"
     * @param scale defines the scaling factor to apply
     * @param result defines the Color4 object where to store the result
     * @returns the result Color4
     */
    public scaleToRef<T extends IColor4Like>(scale: number, result: T): T {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
        result.a = this.a * scale;
        return result;
    }

    /**
     * Scale the current Color4 values by a factor and add the result to a given Color4
     * @param scale defines the scale factor
     * @param result defines the Color4 object where to store the result
     * @returns the result Color4
     */
    public scaleAndAddToRef<T extends IColor4Like>(scale: number, result: T): T {
        result.r += this.r * scale;
        result.g += this.g * scale;
        result.b += this.b * scale;
        result.a += this.a * scale;
        return result;
    }

    /**
     * Clamps the rgb values by the min and max values and stores the result into "result"
     * @param min defines minimum clamping value (default is 0)
     * @param max defines maximum clamping value (default is 1)
     * @param result defines color to store the result into.
     * @returns the result Color4
     */
    public clampToRef<T extends IColor4Like>(min: number = 0, max: number = 1, result: T): T {
        result.r = Clamp(this.r, min, max);
        result.g = Clamp(this.g, min, max);
        result.b = Clamp(this.b, min, max);
        result.a = Clamp(this.a, min, max);
        return result;
    }

    /**
     * Multiply an Color4 value by another and return a new Color4 object
     * @param color defines the Color4 value to multiply by
     * @returns a new Color4 object
     */
    public multiply(color: DeepImmutable<IColor4Like>): Color4 {
        return new Color4(this.r * color.r, this.g * color.g, this.b * color.b, this.a * color.a);
    }

    /**
     * Multiply a Color4 value by another and push the result in a reference value
     * @param color defines the Color4 value to multiply by
     * @param result defines the Color4 to fill the result in
     * @returns the result Color4
     */
    public multiplyToRef<T extends IColor4Like>(color: DeepImmutable<IColor4Like>, result: T): T {
        result.r = this.r * color.r;
        result.g = this.g * color.g;
        result.b = this.b * color.b;
        result.a = this.a * color.a;
        return result;
    }

    /**
     * Multiplies in place the current Color4 by the given one.
     * @param otherColor color to multiple with
     * @returns the updated Color4.
     */
    public multiplyInPlace(otherColor: DeepImmutable<IColor4Like>): this {
        this.r *= otherColor.r;
        this.g *= otherColor.g;
        this.b *= otherColor.b;
        this.a *= otherColor.a;
        return this;
    }

    /**
     * Returns a new Color4 set with the multiplication result of the given floats and the current Color4 coordinates.
     * @param r value multiply with
     * @param g value multiply with
     * @param b value multiply with
     * @param a value multiply with
     * @returns resulting new color
     */
    public multiplyByFloats(r: number, g: number, b: number, a: number): Color4 {
        return new Color4(this.r * r, this.g * g, this.b * b, this.a * a);
    }

    /**
     * @internal
     * Do not use
     */
    public divide(_other: DeepImmutable<IColor4Like>): never {
        throw new ReferenceError("Can not divide a color");
    }

    /**
     * @internal
     * Do not use
     */
    public divideToRef(_other: DeepImmutable<IColor4Like>, _result: IColor4Like): never {
        throw new ReferenceError("Can not divide a color");
    }

    /**
     * @internal
     * Do not use
     */
    public divideInPlace(_other: DeepImmutable<IColor4Like>): never {
        throw new ReferenceError("Can not divide a color");
    }

    /**
     * Updates the Color4 coordinates with the minimum values between its own and the given color ones
     * @param other defines the second operand
     * @returns the current updated Color4
     */
    public minimizeInPlace(other: DeepImmutable<IColor4Like>): this {
        this.r = Math.min(this.r, other.r);
        this.g = Math.min(this.g, other.g);
        this.b = Math.min(this.b, other.b);
        this.a = Math.min(this.a, other.a);
        return this;
    }
    /**
     * Updates the Color4 coordinates with the maximum values between its own and the given color ones
     * @param other defines the second operand
     * @returns the current updated Color4
     */
    public maximizeInPlace(other: DeepImmutable<IColor4Like>): this {
        this.r = Math.max(this.r, other.r);
        this.g = Math.max(this.g, other.g);
        this.b = Math.max(this.b, other.b);
        this.a = Math.max(this.a, other.a);
        return this;
    }

    /**
     * Updates the current Color4 with the minimal coordinate values between its and the given coordinates
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param a defines the a coordinate of the operand
     * @returns the current updated Color4
     */
    public minimizeInPlaceFromFloats(r: number, g: number, b: number, a: number): this {
        this.r = Math.min(r, this.r);
        this.g = Math.min(g, this.g);
        this.b = Math.min(b, this.b);
        this.a = Math.min(a, this.a);
        return this;
    }

    /**
     * Updates the current Color4 with the maximal coordinate values between its and the given coordinates.
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param a defines the a coordinate of the operand
     * @returns the current updated Color4
     */
    public maximizeInPlaceFromFloats(r: number, g: number, b: number, a: number): this {
        this.r = Math.max(r, this.r);
        this.g = Math.max(g, this.g);
        this.b = Math.max(b, this.b);
        this.a = Math.max(a, this.a);
        return this;
    }

    /**
     * @internal
     * Do not use
     */
    public floorToRef(_result: IColor4Like): never {
        throw new ReferenceError("Can not floor a color");
    }

    /**
     * @internal
     * Do not use
     */
    public floor(): never {
        throw new ReferenceError("Can not floor a color");
    }

    /**
     * @internal
     * Do not use
     */
    public fractToRef(_result: IColor4Like): never {
        throw new ReferenceError("Can not fract a color");
    }

    /**
     * @internal
     * Do not use
     */
    public fract(): never {
        throw new ReferenceError("Can not fract a color");
    }

    /**
     * @internal
     * Do not use
     */
    public negate(): never {
        throw new ReferenceError("Can not negate a color");
    }

    /**
     * @internal
     * Do not use
     */
    public negateInPlace(): never {
        throw new ReferenceError("Can not negate a color");
    }

    /**
     * @internal
     * Do not use
     */
    public negateToRef(_result: IColor4Like): never {
        throw new ReferenceError("Can not negate a color");
    }

    /**
     * Boolean : True if the current Color4 coordinates are each beneath the distance "epsilon" from the given color ones.
     * @param otherColor color to compare against
     * @param epsilon (Default: very small number)
     * @returns true if they are equal
     */
    public equalsWithEpsilon(otherColor: DeepImmutable<IColor4Like>, epsilon: number = Epsilon): boolean {
        return (
            WithinEpsilon(this.r, otherColor.r, epsilon) &&
            WithinEpsilon(this.g, otherColor.g, epsilon) &&
            WithinEpsilon(this.b, otherColor.b, epsilon) &&
            WithinEpsilon(this.a, otherColor.a, epsilon)
        );
    }

    /**
     * Boolean : True if the given floats are strictly equal to the current Color4 coordinates.
     * @param x x value to compare against
     * @param y y value to compare against
     * @param z z value to compare against
     * @param w w value to compare against
     * @returns true if equal
     */
    public equalsToFloats(x: number, y: number, z: number, w: number): boolean {
        return this.r === x && this.g === y && this.b === z && this.a === w;
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
        const result = new Color4();
        return result.copyFrom(this);
    }

    /**
     * Copies the given Color4 values into the current one
     * @param source defines the source Color4 object
     * @returns the current updated Color4 object
     */
    public copyFrom(source: DeepImmutable<IColor4Like>): this {
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
    public copyFromFloats(r: number, g: number, b: number, a: number): this {
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
    public set(r: number, g: number, b: number, a: number): this {
        return this.copyFromFloats(r, g, b, a);
    }

    /**
     * Copies the given float to the current Vector4 coordinates
     * @param v defines the r, g, b, and a coordinates of the operand
     * @returns the current updated Vector4
     */
    public setAll(v: number): this {
        this.r = this.g = this.b = this.a = v;
        return this;
    }

    /**
     * Compute the Color4 hexadecimal code as a string
     * @param returnAsColor3 defines if the string should only contains RGB values (off by default)
     * @returns a string containing the hexadecimal representation of the Color4 object
     */
    public toHexString(returnAsColor3 = false): string {
        const intR = Math.round(this.r * 255);
        const intG = Math.round(this.g * 255);
        const intB = Math.round(this.b * 255);

        if (returnAsColor3) {
            return "#" + ToHex(intR) + ToHex(intG) + ToHex(intB);
        }

        const intA = Math.round(this.a * 255);
        return "#" + ToHex(intR) + ToHex(intG) + ToHex(intB) + ToHex(intA);
    }

    /**
     * Updates the Color4 rgba values from the string containing valid hexadecimal values.
     *
     * A valid hex string is either in the format #RRGGBB or #RRGGBBAA.
     *
     * When a hex string without alpha is passed, the resulting Color4 keeps
     * its previous alpha value.
     *
     * An invalid string does not modify this object
     *
     * @param hex defines a string containing valid hexadecimal values
     * @returns the current updated Color4 object
     */
    public fromHexString(hex: string): this {
        if (hex.substring(0, 1) !== "#" || (hex.length !== 9 && hex.length !== 7)) {
            return this;
        }

        this.r = parseInt(hex.substring(1, 3), 16) / 255;
        this.g = parseInt(hex.substring(3, 5), 16) / 255;
        this.b = parseInt(hex.substring(5, 7), 16) / 255;
        if (hex.length === 9) {
            this.a = parseInt(hex.substring(7, 9), 16) / 255;
        }

        return this;
    }

    /**
     * Computes a new Color4 converted from the current one to linear space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color4 object
     */
    public toLinearSpace(exact = false): Color4 {
        const convertedColor = new Color4();
        this.toLinearSpaceToRef(convertedColor, exact);
        return convertedColor;
    }

    /**
     * Converts the Color4 values to linear space and stores the result in "convertedColor"
     * @param convertedColor defines the Color4 object where to store the linear space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color4
     */
    public toLinearSpaceToRef(convertedColor: IColor4Like, exact = false): this {
        if (exact) {
            convertedColor.r = colorChannelToLinearSpaceExact(this.r);
            convertedColor.g = colorChannelToLinearSpaceExact(this.g);
            convertedColor.b = colorChannelToLinearSpaceExact(this.b);
        } else {
            convertedColor.r = colorChannelToLinearSpace(this.r);
            convertedColor.g = colorChannelToLinearSpace(this.g);
            convertedColor.b = colorChannelToLinearSpace(this.b);
        }
        convertedColor.a = this.a;
        return this;
    }

    /**
     * Computes a new Color4 converted from the current one to gamma space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color4 object
     */
    public toGammaSpace(exact = false): Color4 {
        const convertedColor = new Color4();
        this.toGammaSpaceToRef(convertedColor, exact);
        return convertedColor;
    }

    /**
     * Converts the Color4 values to gamma space and stores the result in "convertedColor"
     * @param convertedColor defines the Color4 object where to store the gamma space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color4
     */
    public toGammaSpaceToRef(convertedColor: IColor4Like, exact = false): this {
        if (exact) {
            convertedColor.r = colorChannelToGammaSpaceExact(this.r);
            convertedColor.g = colorChannelToGammaSpaceExact(this.g);
            convertedColor.b = colorChannelToGammaSpaceExact(this.b);
        } else {
            convertedColor.r = colorChannelToGammaSpace(this.r);
            convertedColor.g = colorChannelToGammaSpace(this.g);
            convertedColor.b = colorChannelToGammaSpace(this.b);
        }
        convertedColor.a = this.a;
        return this;
    }

    // Statics

    /**
     * Creates a new Color4 from the string containing valid hexadecimal values.
     *
     * A valid hex string is either in the format #RRGGBB or #RRGGBBAA.
     *
     * When a hex string without alpha is passed, the resulting Color4 has
     * its alpha value set to 1.0.
     *
     * An invalid string results in a Color with all its channels set to 0.0,
     * i.e. "transparent black".
     *
     * @param hex defines a string containing valid hexadecimal values
     * @returns a new Color4 object
     */
    public static FromHexString(hex: string): Color4 {
        if (hex.substring(0, 1) !== "#" || (hex.length !== 9 && hex.length !== 7)) {
            return new Color4(0.0, 0.0, 0.0, 0.0);
        }

        return new Color4(0.0, 0.0, 0.0, 1.0).fromHexString(hex);
    }

    /**
     * Creates a new Color4 object set with the linearly interpolated values of "amount" between the left Color4 object and the right Color4 object
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @returns a new Color4 object
     */
    public static Lerp(left: DeepImmutable<IColor4Like>, right: DeepImmutable<IColor4Like>, amount: number): Color4 {
        return Color4.LerpToRef(left, right, amount, new Color4());
    }

    /**
     * Set the given "result" with the linearly interpolated values of "amount" between the left Color4 object and the right Color4 object
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @param result defines the Color4 object where to store data
     * @returns the updated result
     */
    public static LerpToRef<T extends IColor4Like>(left: DeepImmutable<IColor4Like>, right: DeepImmutable<IColor4Like>, amount: number, result: T): T {
        result.r = left.r + (right.r - left.r) * amount;
        result.g = left.g + (right.g - left.g) * amount;
        result.b = left.b + (right.b - left.b) * amount;
        result.a = left.a + (right.a - left.a) * amount;
        return result;
    }

    /**
     * Interpolate between two Color4 using Hermite interpolation
     * @param value1 defines first Color4
     * @param tangent1 defines the incoming tangent
     * @param value2 defines second Color4
     * @param tangent2 defines the outgoing tangent
     * @param amount defines the target Color4
     * @returns the new interpolated Color4
     */
    public static Hermite(
        value1: DeepImmutable<IColor4Like>,
        tangent1: DeepImmutable<IColor4Like>,
        value2: DeepImmutable<IColor4Like>,
        tangent2: DeepImmutable<IColor4Like>,
        amount: number
    ): Color4 {
        const squared = amount * amount;
        const cubed = amount * squared;
        const part1 = 2.0 * cubed - 3.0 * squared + 1.0;
        const part2 = -2.0 * cubed + 3.0 * squared;
        const part3 = cubed - 2.0 * squared + amount;
        const part4 = cubed - squared;

        const r = value1.r * part1 + value2.r * part2 + tangent1.r * part3 + tangent2.r * part4;
        const g = value1.g * part1 + value2.g * part2 + tangent1.g * part3 + tangent2.g * part4;
        const b = value1.b * part1 + value2.b * part2 + tangent1.b * part3 + tangent2.b * part4;
        const a = value1.a * part1 + value2.a * part2 + tangent1.a * part3 + tangent2.a * part4;
        return new Color4(r, g, b, a);
    }

    /**
     * Returns a new Color4 which is the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @returns 1st derivative
     */
    public static Hermite1stDerivative(
        value1: DeepImmutable<IColor4Like>,
        tangent1: DeepImmutable<IColor4Like>,
        value2: DeepImmutable<IColor4Like>,
        tangent2: DeepImmutable<IColor4Like>,
        time: number
    ): Color4 {
        const result = new Color4();

        this.Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result);

        return result;
    }

    /**
     * Update a Color4 with the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @param result define where to store the derivative
     */
    public static Hermite1stDerivativeToRef(
        value1: DeepImmutable<IColor4Like>,
        tangent1: DeepImmutable<IColor4Like>,
        value2: DeepImmutable<IColor4Like>,
        tangent2: DeepImmutable<IColor4Like>,
        time: number,
        result: IColor4Like
    ) {
        const t2 = time * time;

        result.r = (t2 - time) * 6 * value1.r + (3 * t2 - 4 * time + 1) * tangent1.r + (-t2 + time) * 6 * value2.r + (3 * t2 - 2 * time) * tangent2.r;
        result.g = (t2 - time) * 6 * value1.g + (3 * t2 - 4 * time + 1) * tangent1.g + (-t2 + time) * 6 * value2.g + (3 * t2 - 2 * time) * tangent2.g;
        result.b = (t2 - time) * 6 * value1.b + (3 * t2 - 4 * time + 1) * tangent1.b + (-t2 + time) * 6 * value2.b + (3 * t2 - 2 * time) * tangent2.b;
        result.a = (t2 - time) * 6 * value1.a + (3 * t2 - 4 * time + 1) * tangent1.a + (-t2 + time) * 6 * value2.a + (3 * t2 - 2 * time) * tangent2.a;
    }

    /**
     * Creates a new Color4 from a Color3 and an alpha value
     * @param color3 defines the source Color3 to read from
     * @param alpha defines the alpha component (1.0 by default)
     * @returns a new Color4 object
     */
    public static FromColor3(color3: DeepImmutable<IColor3Like>, alpha: number = 1.0): Color4 {
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
     * Creates a new Color3 from integer values (less than 256)
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
            const colors4 = [];
            for (let index = 0; index < colors.length; index += 3) {
                const newIndex = (index / 3) * 4;
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
Object.defineProperties(Color4.prototype, {
    dimension: { value: [4] },
    rank: { value: 1 },
});

/**
 * @internal
 */
export class TmpColors {
    public static Color3: Color3[] = BuildArray(3, Color3.Black);
    public static Color4: Color4[] = BuildArray(3, () => new Color4(0, 0, 0, 0));
}

RegisterClass("BABYLON.Color3", Color3);
RegisterClass("BABYLON.Color4", Color4);
