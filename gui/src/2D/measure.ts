
/**
 * Class used to store 2D control sizes
 */
export class Measure {
    /**
     * Creates a new measure
     * @param left defines left coordinate
     * @param top defines top coordinate
     * @param width defines width dimension
     * @param height defines height dimension
     */
    public constructor(
        /** defines left coordinate */
        public left: number,
        /** defines top coordinate  */
        public top: number,
        /** defines width dimension  */
        public width: number,
        /** defines height dimension */
        public height: number) {

    }

    /**
     * Copy from another measure
     * @param other defines the other measure to copy from
     */
    public copyFrom(other: Measure): void {
        this.left = other.left;
        this.top = other.top;
        this.width = other.width;
        this.height = other.height;
    }

    /**
     * Copy from a group of 4 floats
     * @param left defines left coordinate
     * @param top defines top coordinate
     * @param width defines width dimension
     * @param height defines height dimension
     */
    public copyFromFloats(left: number, top: number, width: number, height: number): void {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    /**
     * Check equality between this measure and another one
     * @param other defines the other measures
     * @returns true if both measures are equals
     */
    public isEqualsTo(other: Measure): boolean {

        if (this.left !== other.left) {
            return false;
        }

        if (this.top !== other.top) {
            return false;
        }

        if (this.width !== other.width) {
            return false;
        }

        if (this.height !== other.height) {
            return false;
        }

        return true;
    }

    /**
     * Creates an empty measure
     * @returns a new measure
     */
    public static Empty(): Measure {
        return new Measure(0, 0, 0, 0);
    }
}