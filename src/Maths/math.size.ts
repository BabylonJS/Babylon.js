
/**
 * Interface for the size containing width and height
 */
export interface ISize {
    /**
     * Width
     */
    width: number;
    /**
     * Heighht
     */
    height: number;
}

/**
 * Size containing widht and height
 */
export class Size implements ISize {
    /**
     * Width
     */
    public width: number;
    /**
     * Height
     */
    public height: number;

    /**
     * Creates a Size object from the given width and height (floats).
     * @param width width of the new size
     * @param height height of the new size
     */
    public constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    /**
     * Returns a string with the Size width and height
     * @returns a string with the Size width and height
     */
    public toString(): string {
        return `{W: ${this.width}, H: ${this.height}}`;
    }
    /**
     * "Size"
     * @returns the string "Size"
     */
    public getClassName(): string {
        return "Size";
    }
    /**
     * Returns the Size hash code.
     * @returns a hash code for a unique width and height
     */
    public getHashCode(): number {
        let hash = this.width | 0;
        hash = (hash * 397) ^ (this.height | 0);
        return hash;
    }
    /**
     * Updates the current size from the given one.
     * @param src the given size
     */
    public copyFrom(src: Size) {
        this.width = src.width;
        this.height = src.height;
    }
    /**
     * Updates in place the current Size from the given floats.
     * @param width width of the new size
     * @param height height of the new size
     * @returns the updated Size.
     */
    public copyFromFloats(width: number, height: number): Size {
        this.width = width;
        this.height = height;
        return this;
    }
    /**
     * Updates in place the current Size from the given floats.
     * @param width width to set
     * @param height height to set
     * @returns the updated Size.
     */
    public set(width: number, height: number): Size {
        return this.copyFromFloats(width, height);
    }
    /**
     * Multiplies the width and height by numbers
     * @param w factor to multiple the width by
     * @param h factor to multiple the height by
     * @returns a new Size set with the multiplication result of the current Size and the given floats.
     */
    public multiplyByFloats(w: number, h: number): Size {
        return new Size(this.width * w, this.height * h);
    }
    /**
     * Clones the size
     * @returns a new Size copied from the given one.
     */
    public clone(): Size {
        return new Size(this.width, this.height);
    }
    /**
     * True if the current Size and the given one width and height are strictly equal.
     * @param other the other size to compare against
     * @returns True if the current Size and the given one width and height are strictly equal.
     */
    public equals(other: Size): boolean {
        if (!other) {
            return false;
        }
        return (this.width === other.width) && (this.height === other.height);
    }
    /**
     * The surface of the Size : width * height (float).
     */
    public get surface(): number {
        return this.width * this.height;
    }
    /**
     * Create a new size of zero
     * @returns a new Size set to (0.0, 0.0)
     */
    public static Zero(): Size {
        return new Size(0.0, 0.0);
    }
    /**
     * Sums the width and height of two sizes
     * @param otherSize size to add to this size
     * @returns a new Size set as the addition result of the current Size and the given one.
     */
    public add(otherSize: Size): Size {
        let r = new Size(this.width + otherSize.width, this.height + otherSize.height);
        return r;
    }
    /**
     * Subtracts the width and height of two
     * @param otherSize size to subtract to this size
     * @returns a new Size set as the subtraction result of  the given one from the current Size.
     */
    public subtract(otherSize: Size): Size {
        let r = new Size(this.width - otherSize.width, this.height - otherSize.height);
        return r;
    }
    /**
     * Creates a new Size set at the linear interpolation "amount" between "start" and "end"
     * @param start starting size to lerp between
     * @param end end size to lerp between
     * @param amount amount to lerp between the start and end values
     * @returns a new Size set at the linear interpolation "amount" between "start" and "end"
     */
    public static Lerp(start: Size, end: Size, amount: number): Size {
        var w = start.width + ((end.width - start.width) * amount);
        var h = start.height + ((end.height - start.height) * amount);

        return new Size(w, h);
    }

}