import { Logger } from "../Misc/logger";
import { Vector3} from "./math.vector";
import { THIRDR3, IsoGridSize} from './math.constants';
import { DeepImmutable} from "../types";
import { ArrayTools } from '../Misc/arrayTools';
import { _TypeStore } from '../Misc/typeStore';

/**
 * Class representing an isovector containing 2 INTEGER coordinates
 * x axis is horizontal
 * y axis is 60 deg counter clockwise from positive y axis
 */
export class IsoVector {
    /**
     * Creates a new isovector from the given x and y coordinates
     * @param x defines the first coordinate, must be an integer
     * @param y defines the second coordinate, must be an integer
     */
    constructor(
        /** defines the first coordinate */
        public x: number = 0,
        /** defines the second coordinate */
        public y: number = 0) {
            if (x !== Math.floor(x)) {
                x === Math.floor(x);
                Logger.Warn("x is not an integer, floor(x) used");
            }
            if (y !== Math.floor(y)) {
                y === Math.floor(y);
                Logger.Warn("y is not an integer, floor(y) used");
            }
    }

    /**
     * Gets a string with the IsoVector coordinates
     * @returns a string with the IsoVector coordinates
     */
    public toString(): string {
        return "{X: " + this.x + " Y: " + this.y + "}";
    }

    /**
     * Gets class name
     * @returns the string "IsoVector"
     */
    public getClassName(): string {
        return "IsoVector";
    }


    // Operators

    /**
     * Add another IsoVector with the current one
     * @param otherVector defines the other IsoVector
     * @returns a new IsoVector set with the addition of the current IsoVector and the given one coordinates
     */
    public add(otherVector: DeepImmutable<IsoVector>): IsoVector {
        return new IsoVector(this.x + otherVector.x, this.y + otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the addition of the current IsoVector and the given one coordinates
     * @param otherVector defines the other IsoVector
     * @param result defines the target IsoVector
     * @returns the unmodified current IsoVector
     */
    public addToRef(otherVector: DeepImmutable<IsoVector>, result: IsoVector): IsoVector {
        result.x = this.x + otherVector.x;
        result.y = this.y + otherVector.y;
        return this;
    }

    /**
     * Set the IsoVector coordinates by adding the given IsoVector coordinates
     * @param otherVector defines the other IsoVector
     * @returns the current updated IsoVector
     */
    public addInPlace(otherVector: DeepImmutable<IsoVector>): IsoVector {
        this.x += otherVector.x;
        this.y += otherVector.y;
        return this;
    }

    /**
     * Gets a new IsoVector set with the subtracted coordinates of the given one from the current IsoVector
     * @param otherVector defines the other IsoVector
     * @returns a new IsoVector
     */
    public subtract(otherVector: IsoVector): IsoVector {
        return new IsoVector(this.x - otherVector.x, this.y - otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the subtraction of the given one from the current IsoVector coordinates.
     * @param otherVector defines the other IsoVector
     * @param result defines the target IsoVector
     * @returns the unmodified current IsoVector
     */
    public subtractToRef(otherVector: DeepImmutable<IsoVector>, result: IsoVector): IsoVector {
        result.x = this.x - otherVector.x;
        result.y = this.y - otherVector.y;
        return this;
    }
    /**
     * Sets the current IsoVector coordinates by subtracting from it the given one coordinates
     * @param otherVector defines the other IsoVector
     * @returns the current updated IsoVector
     */
    public subtractInPlace(otherVector: DeepImmutable<IsoVector>): IsoVector {
        this.x -= otherVector.x;
        this.y -= otherVector.y;
        return this;
    }

    /**
     * Gets a new IsoVector with current IsoVector negated coordinates
     * @returns a new IsoVector
     */
    public negate(): IsoVector {
        return new IsoVector(-this.x, -this.y);
    }

    /**
     * Negate this IsoVector in place
     * @returns this
     */
    public negateInPlace(): IsoVector {
        this.x *= -1;
        this.y *= -1;
        return this;
    }

    /**
     * Negate the current IsoVector and stores the result in the given IsoVector "result" coordinates
     * @param result defines the IsoVector object where to store the result
     * @returns the current IsoVector
     */
    public negateToRef(result: IsoVector): IsoVector {
        result.x = -1 * this.x;
        result.y = -1 * this.y;
        return result;
    }

    /**
     * Gets a boolean if two vectors are equals
     * @param otherVector defines the other IsoVector
     * @returns true if the given IsoVector coordinates strictly equal the current IsoVector ones
     */
    public equals(otherVector: DeepImmutable<IsoVector>): boolean {
        return otherVector && this.x === otherVector.x && this.y === otherVector.y;
    }

    /**
     * Gets the length of the IsoVector
     * @returns the IsoVector length (float)
     */
    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.x * this.y);
    }

    /**
     * Gets the IsoVector squared length
     * @returns the IsoVector squared length (float)
     */
    public lengthSquared(): number {
        return this.x * this.x + this.y * this.y + this.x * this.y;
    }

    /**
     * Gets a new IsoVector copied from the IsoVector
     * @returns a new IsoVector
     */
    public clone(): IsoVector {
        return new IsoVector(this.x, this.y);
    }

    /**
     * Rotates one IsoVector 60 degrees counter clockwise about another
     * Please note that this is an in place operation
     * @param other an IsoVector a center of rotation
     * @returns the rotated IsoVector
     */
    public rotate60About(other: IsoVector) { //other IsoVector
        let x: number = this.x;
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
    public rotateNeg60About(other: IsoVector) {
        let x = this.x;
        this.x = x + this.y - other.y;
        this.y = other.x + other.y - x;
        return this;
    };
    
    /**
     * For an equilateral triangle OAB with O at isovector (0, 0) and A at isovector (m, n)
     * Rotates one IsoVector 120 degrees counter clockwise about the center of the triangle
     * Please note that this is an in place operation
     * @param m integer a measure a Primary triangle of order (m, n) m > n
     * @param n integer a measure for a Primary triangle of order (m, n)
     * @returns the rotated IsoVector
     */
    public rotate120(m: number, n: number) { //m, n integers
        if (m !== Math.floor(m)) {
            m === Math.floor(m);
            Logger.Warn("m not an integer only floor(m) used");
        }
        if (n !== Math.floor(n)) {
            n === Math.floor(n);
            Logger.Warn("n not an integer only floor(n) used");
        }
        let x = this.x;
        this.x = m - x - this.y;
        this.y = n + x;
        return this;
    }
    
    /**
     * For an equilateral triangle OAB with O at isovector (0, 0) and A at isovector (m, n)
     * Rotates one IsoVector 120 degrees clockwise about the center of the triangle
     * Please note that this is an in place operation
     * @param m integer a measure a Primary triangle of order (m, n) m > n
     * @param n integer a measure for a Primary triangle of order (m, n)
     * @returns the rotated IsoVector
     */
    public rotateNeg120(m: number, n: number) { //m, n integers
        if (m !== Math.floor(m)) {
            m === Math.floor(m);
            Logger.Warn("m is not an integer, floor(m) used");
        }
        if (n !== Math.floor(n)) {
            n === Math.floor(n);
            Logger.Warn("n is not an integer,   floor(n) used");
        }
        let x = this.x
        this.x = this.y - n;
        this.y = m + n - x - this.y;
        return this;
    };
    
    /**
     * Transforms an IsoVector to one in Cartesian 3D space based on an isovector
     * @param origin an IsoVector
     * @returns Point as a Vector3 
     */
    public toCartesianOrigin(origin: IsoVector) {
        const point = Vector3.Zero();
        point.x = origin.x + 2 * this.x * IsoGridSize + this.y * IsoGridSize;
        point.y = origin.y + 3 * THIRDR3 * this.y * IsoGridSize;
        return point;
    };

    // Statics

    /**
     * Gets a new IsoVector(0, 0)
     * @returns a new IsoVector
     */
    public static Zero(): IsoVector {
        return new IsoVector(0, 0);
    }

    /**
     * Gets a new IsoVector(1, 1)
     * @returns a new IsoVector
     */
    public static One(): IsoVector {
        return new IsoVector(1, 1);
    }
}

/**
 * @hidden
 */
 export class TmpIsoVectors {
    public static IsoVector: IsoVector[] = ArrayTools.BuildArray(6, IsoVector.Zero); // 6 temp IsoVectors at once should be enough
}

_TypeStore.RegisteredTypes["BABYLON.IsoVector"] = IsoVector;

