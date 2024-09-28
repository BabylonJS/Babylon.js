import { Logger } from "../Misc/logger";
import { Vector3 } from "./math.vector";

/**
 * Class representing an isovector a vector containing 2 INTEGER coordinates
 * x axis is horizontal
 * y axis is 60 deg counter clockwise from positive y axis
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _IsoVector {
    /**
     * Creates a new isovector from the given x and y coordinates
     * @param x defines the first coordinate, must be an integer
     * @param y defines the second coordinate, must be an integer
     */
    constructor(
        /** [0] defines the first coordinate */
        public x: number = 0,
        /** [0] defines the second coordinate */
        public y: number = 0
    ) {
        if (x !== Math.floor(x)) {
            x = Math.floor(x);
            Logger.Warn("x is not an integer, floor(x) used");
        }
        if (y !== Math.floor(y)) {
            y = Math.floor(y);
            Logger.Warn("y is not an integer, floor(y) used");
        }
    }

    // Operators

    /**
     * Gets a new IsoVector copied from the IsoVector
     * @returns a new IsoVector
     */
    public clone(): _IsoVector {
        return new _IsoVector(this.x, this.y);
    }

    /**
     * Rotates one IsoVector 60 degrees counter clockwise about another
     * Please note that this is an in place operation
     * @param other an IsoVector a center of rotation
     * @returns the rotated IsoVector
     */
    public rotate60About(other: _IsoVector) {
        //other IsoVector
        const x: number = this.x;
        this.x = other.x + other.y - this.y;
        this.y = x + this.y - other.x;
        return this;
    }

    /**
     * Rotates one IsoVector 60 degrees clockwise about another
     * Please note that this is an in place operation
     * @param other an IsoVector as center of rotation
     * @returns the rotated IsoVector
     */
    public rotateNeg60About(other: _IsoVector) {
        const x = this.x;
        this.x = x + this.y - other.y;
        this.y = other.x + other.y - x;
        return this;
    }

    /**
     * For an equilateral triangle OAB with O at isovector (0, 0) and A at isovector (m, n)
     * Rotates one IsoVector 120 degrees counter clockwise about the center of the triangle
     * Please note that this is an in place operation
     * @param m integer a measure a Primary triangle of order (m, n) m > n
     * @param n >= 0 integer a measure for a Primary triangle of order (m, n)
     * @returns the rotated IsoVector
     */
    public rotate120(m: number, n: number) {
        //m, n integers
        if (m !== Math.floor(m)) {
            m = Math.floor(m);
            Logger.Warn("m not an integer only floor(m) used");
        }
        if (n !== Math.floor(n)) {
            n = Math.floor(n);
            Logger.Warn("n not an integer only floor(n) used");
        }
        const x = this.x;
        this.x = m - x - this.y;
        this.y = n + x;
        return this;
    }

    /**
     * For an equilateral triangle OAB with O at isovector (0, 0) and A at isovector (m, n)
     * Rotates one IsoVector 120 degrees clockwise about the center of the triangle
     * Please note that this is an in place operation
     * @param m integer a measure a Primary triangle of order (m, n) m > n
     * @param n >= 0 integer a measure for a Primary triangle of order (m, n)
     * @returns the rotated IsoVector
     */
    public rotateNeg120(m: number, n: number) {
        //m, n integers
        if (m !== Math.floor(m)) {
            m = Math.floor(m);
            Logger.Warn("m is not an integer, floor(m) used");
        }
        if (n !== Math.floor(n)) {
            n = Math.floor(n);
            Logger.Warn("n is not an integer,   floor(n) used");
        }
        const x = this.x;
        this.x = this.y - n;
        this.y = m + n - x - this.y;
        return this;
    }

    /**
     * Transforms an IsoVector to one in Cartesian 3D space based on an isovector
     * @param origin an IsoVector
     * @param isoGridSize
     * @returns Point as a Vector3
     */
    public toCartesianOrigin(origin: _IsoVector, isoGridSize: number) {
        const point = Vector3.Zero();
        point.x = origin.x + 2 * this.x * isoGridSize + this.y * isoGridSize;
        point.y = origin.y + Math.sqrt(3) * this.y * isoGridSize;
        return point;
    }

    // Statics

    /**
     * Gets a new IsoVector(0, 0)
     * @returns a new IsoVector
     */
    public static Zero(): _IsoVector {
        return new _IsoVector(0, 0);
    }
}
