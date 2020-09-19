import { Matrix2D } from "./math2D";
import { Vector2 } from "babylonjs/Maths/math.vector";

let tmpRect = [
    new Vector2(0, 0),
    new Vector2(0, 0),
    new Vector2(0, 0),
    new Vector2(0, 0),
];

let tmpRect2 = [
    new Vector2(0, 0),
    new Vector2(0, 0),
    new Vector2(0, 0),
    new Vector2(0, 0),
];

let tmpV1 = new Vector2(0, 0);
let tmpV2 = new Vector2(0, 0);

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
     * @param addX number to add to left
     * @param addY number to add to top
     * @param addWidth number to add to width
     * @param addHeight number to add to height
     * @param result the resulting AABB
     */
    public addAndTransformToRef(transform: Matrix2D, addX: number, addY: number, addWidth: number, addHeight: number, result: Measure) {
        const left = this.left + addX;
        const top = this.top + addY;
        const width = this.width + addWidth;
        const height = this.height + addHeight;

        tmpRect[0].copyFromFloats(left, top);
        tmpRect[1].copyFromFloats(left + width, top);
        tmpRect[2].copyFromFloats(left + width, top + height);
        tmpRect[3].copyFromFloats(left, top + height);

        tmpV1.copyFromFloats(Number.MAX_VALUE, Number.MAX_VALUE);
        tmpV2.copyFromFloats(0, 0);
        for (var i = 0; i < 4; i++) {
            transform.transformCoordinates(tmpRect[i].x, tmpRect[i].y, tmpRect2[i]);
            tmpV1.x = Math.floor(Math.min(tmpV1.x, tmpRect2[i].x));
            tmpV1.y = Math.floor(Math.min(tmpV1.y, tmpRect2[i].y));
            tmpV2.x = Math.ceil(Math.max(tmpV2.x, tmpRect2[i].x));
            tmpV2.y = Math.ceil(Math.max(tmpV2.y, tmpRect2[i].y));
        }
        result.left = tmpV1.x;
        result.top = tmpV1.y;
        result.width = tmpV2.x - tmpV1.x;
        result.height = tmpV2.y - tmpV1.y;
    }

    /**
     * Computes the axis aligned bounding box of the measure after it is modified by a given transform
     * @param transform the matrix to transform the measure before computing the AABB
     * @param result the resulting AABB
     */
    public transformToRef(transform: Matrix2D, result: Measure) {
        this.addAndTransformToRef(transform, 0, 0, 0, 0, result);
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