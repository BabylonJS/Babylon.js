import { Matrix2D } from "./math2D";
import { Vector2 } from "babylonjs/Maths/math";
import { Polygon } from "babylonjs/Meshes/polygonMesh";

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
     * Computes the axis aligned bounding box measure for two given measures
     * @param a Input measure
     * @param b Input measure
     * @param result the resulting bounding measure
     */
    public static CombineToRef(a: Measure, b: Measure, result: Measure) {
        var left = Math.min(a.left, b.left);
        var top = Math.min(a.top, b.top);
        var right = Math.max(a.left + a.width, b.left + b.width);
        var bottom = Math.max(a.top + a.height, b.top + b.height);
        result.left = left;
        result.top = top;
        result.width = right - left;
        result.height = bottom - top;
    }

    /**
     * Computes the axis aligned bounding box of the measure after it is modified by a given transform
     * @param transform the matrix to transform the measure before computing the AABB
     * @param result the resulting AABB
     */
    public transformToRef(transform: Matrix2D, result: Measure) {
        var rectanglePoints = Polygon.Rectangle(this.left, this.top, this.left + this.width, this.top + this.height);
        var min = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
        var max = new Vector2(0, 0);
        for (var i = 0; i < 4; i++) {
            transform.transformCoordinates(rectanglePoints[i].x, rectanglePoints[i].y, rectanglePoints[i]);
            min.x = Math.floor(Math.min(min.x, rectanglePoints[i].x));
            min.y = Math.floor(Math.min(min.y, rectanglePoints[i].y));
            max.x = Math.ceil(Math.max(max.x, rectanglePoints[i].x));
            max.y = Math.ceil(Math.max(max.y, rectanglePoints[i].y));
        }
        result.left = min.x;
        result.top = min.y;
        result.width = max.x - min.x;
        result.height = max.y - min.y;
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