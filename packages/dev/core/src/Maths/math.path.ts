import type { DeepImmutable, Nullable } from "../types";
import { Scalar } from "./math.scalar";
import { Vector2, Vector3, Quaternion, Matrix } from "./math.vector";
import type { Vector4 } from "./math.vector";
import { Epsilon } from "./math.constants";

/**
 * Defines potential orientation for back face culling
 */
export enum Orientation {
    /**
     * Clockwise
     */
    CW = 0,
    /** Counter clockwise */
    CCW = 1,
}

/** Class used to represent a Bezier curve */
export class BezierCurve {
    /**
     * Returns the cubic Bezier interpolated value (float) at "t" (float) from the given x1, y1, x2, y2 floats
     * @param t defines the time
     * @param x1 defines the left coordinate on X axis
     * @param y1 defines the left coordinate on Y axis
     * @param x2 defines the right coordinate on X axis
     * @param y2 defines the right coordinate on Y axis
     * @returns the interpolated value
     */
    public static Interpolate(t: number, x1: number, y1: number, x2: number, y2: number): number {
        // Extract X (which is equal to time here)
        const f0 = 1 - 3 * x2 + 3 * x1;
        const f1 = 3 * x2 - 6 * x1;
        const f2 = 3 * x1;

        let refinedT = t;
        for (let i = 0; i < 5; i++) {
            const refinedT2 = refinedT * refinedT;
            const refinedT3 = refinedT2 * refinedT;

            const x = f0 * refinedT3 + f1 * refinedT2 + f2 * refinedT;
            const slope = 1.0 / (3.0 * f0 * refinedT2 + 2.0 * f1 * refinedT + f2);
            refinedT -= (x - t) * slope;
            refinedT = Math.min(1, Math.max(0, refinedT));
        }

        // Resolve cubic bezier for the given x
        return 3 * Math.pow(1 - refinedT, 2) * refinedT * y1 + 3 * (1 - refinedT) * Math.pow(refinedT, 2) * y2 + Math.pow(refinedT, 3);
    }
}

/**
 * Defines angle representation
 */
export class Angle {
    private _radians: number;

    /**
     * Creates an Angle object of "radians" radians (float).
     * @param radians the angle in radians
     */
    constructor(radians: number) {
        this._radians = radians;
        if (this._radians < 0.0) {
            this._radians += 2.0 * Math.PI;
        }
    }

    /**
     * Get value in degrees
     * @returns the Angle value in degrees (float)
     */
    public degrees() {
        return (this._radians * 180.0) / Math.PI;
    }

    /**
     * Get value in radians
     * @returns the Angle value in radians (float)
     */
    public radians() {
        return this._radians;
    }

    /**
     * Gets a new Angle object with a value of the angle (in radians) between the line connecting the two points and the x-axis
     * @param a defines first point as the origin
     * @param b defines point
     * @returns a new Angle
     */
    public static BetweenTwoPoints(a: DeepImmutable<Vector2>, b: DeepImmutable<Vector2>): Angle {
        const delta = b.subtract(a);
        const theta = Math.atan2(delta.y, delta.x);
        return new Angle(theta);
    }

    /**
     * Gets the angle between the two vectors
     * @param a defines first vector
     * @param b defines vector
     * @returns Returns an new Angle between 0 and PI
     */
    public static BetweenTwoVectors<Vec extends Vector2 | Vector3 | Vector4>(a: DeepImmutable<Vec>, b: DeepImmutable<Vec>): Angle {
        let product = a.lengthSquared() * b.lengthSquared();
        if (product === 0) return new Angle(Math.PI / 2);
        product = Math.sqrt(product);
        let cosVal = a.dot(b as any) / product;
        cosVal = Scalar.Clamp(cosVal, -1, 1);
        const angle = Math.acos(cosVal);
        return new Angle(angle);
    }

    /**
     * Gets a new Angle object from the given float in radians
     * @param radians defines the angle value in radians
     * @returns a new Angle
     */
    public static FromRadians(radians: number): Angle {
        return new Angle(radians);
    }
    /**
     * Gets a new Angle object from the given float in degrees
     * @param degrees defines the angle value in degrees
     * @returns a new Angle
     */
    public static FromDegrees(degrees: number): Angle {
        return new Angle((degrees * Math.PI) / 180.0);
    }
}

/**
 * This represents an arc in a 2d space.
 */
export class Arc2 {
    /**
     * Defines the center point of the arc.
     */
    public centerPoint: Vector2;
    /**
     * Defines the radius of the arc.
     */
    public radius: number;
    /**
     * Defines the angle of the arc (from mid point to end point).
     */
    public angle: Angle;
    /**
     * Defines the start angle of the arc (from start point to middle point).
     */
    public startAngle: Angle;
    /**
     * Defines the orientation of the arc (clock wise/counter clock wise).
     */
    public orientation: Orientation;

    /**
     * Creates an Arc object from the three given points : start, middle and end.
     * @param startPoint Defines the start point of the arc
     * @param midPoint Defines the middle point of the arc
     * @param endPoint Defines the end point of the arc
     */
    constructor(
        /** Defines the start point of the arc */
        public startPoint: Vector2,
        /** Defines the mid point of the arc */
        public midPoint: Vector2,
        /** Defines the end point of the arc */
        public endPoint: Vector2
    ) {
        const temp = Math.pow(midPoint.x, 2) + Math.pow(midPoint.y, 2);
        const startToMid = (Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2) - temp) / 2;
        const midToEnd = (temp - Math.pow(endPoint.x, 2) - Math.pow(endPoint.y, 2)) / 2;
        const det = (startPoint.x - midPoint.x) * (midPoint.y - endPoint.y) - (midPoint.x - endPoint.x) * (startPoint.y - midPoint.y);

        this.centerPoint = new Vector2(
            (startToMid * (midPoint.y - endPoint.y) - midToEnd * (startPoint.y - midPoint.y)) / det,
            ((startPoint.x - midPoint.x) * midToEnd - (midPoint.x - endPoint.x) * startToMid) / det
        );

        this.radius = this.centerPoint.subtract(this.startPoint).length();

        this.startAngle = Angle.BetweenTwoPoints(this.centerPoint, this.startPoint);

        const a1 = this.startAngle.degrees();
        let a2 = Angle.BetweenTwoPoints(this.centerPoint, this.midPoint).degrees();
        let a3 = Angle.BetweenTwoPoints(this.centerPoint, this.endPoint).degrees();

        // angles correction
        if (a2 - a1 > +180.0) {
            a2 -= 360.0;
        }
        if (a2 - a1 < -180.0) {
            a2 += 360.0;
        }
        if (a3 - a2 > +180.0) {
            a3 -= 360.0;
        }
        if (a3 - a2 < -180.0) {
            a3 += 360.0;
        }

        this.orientation = a2 - a1 < 0 ? Orientation.CW : Orientation.CCW;
        this.angle = Angle.FromDegrees(this.orientation === Orientation.CW ? a1 - a3 : a3 - a1);
    }
}

/**
 * Represents a 2D path made up of multiple 2D points
 */
export class Path2 {
    private _points = new Array<Vector2>();
    private _length = 0.0;

    /**
     * If the path start and end point are the same
     */
    public closed = false;

    /**
     * Creates a Path2 object from the starting 2D coordinates x and y.
     * @param x the starting points x value
     * @param y the starting points y value
     */
    constructor(x: number, y: number) {
        this._points.push(new Vector2(x, y));
    }

    /**
     * Adds a new segment until the given coordinates (x, y) to the current Path2.
     * @param x the added points x value
     * @param y the added points y value
     * @returns the updated Path2.
     */
    public addLineTo(x: number, y: number): Path2 {
        if (this.closed) {
            return this;
        }
        const newPoint = new Vector2(x, y);
        const previousPoint = this._points[this._points.length - 1];
        this._points.push(newPoint);
        this._length += newPoint.subtract(previousPoint).length();
        return this;
    }

    /**
     * Adds _numberOfSegments_ segments according to the arc definition (middle point coordinates, end point coordinates, the arc start point being the current Path2 last point) to the current Path2.
     * @param midX middle point x value
     * @param midY middle point y value
     * @param endX end point x value
     * @param endY end point y value
     * @param numberOfSegments (default: 36)
     * @returns the updated Path2.
     */
    public addArcTo(midX: number, midY: number, endX: number, endY: number, numberOfSegments = 36): Path2 {
        if (this.closed) {
            return this;
        }
        const startPoint = this._points[this._points.length - 1];
        const midPoint = new Vector2(midX, midY);
        const endPoint = new Vector2(endX, endY);

        const arc = new Arc2(startPoint, midPoint, endPoint);

        let increment = arc.angle.radians() / numberOfSegments;
        if (arc.orientation === Orientation.CW) {
            increment *= -1;
        }
        let currentAngle = arc.startAngle.radians() + increment;

        for (let i = 0; i < numberOfSegments; i++) {
            const x = Math.cos(currentAngle) * arc.radius + arc.centerPoint.x;
            const y = Math.sin(currentAngle) * arc.radius + arc.centerPoint.y;
            this.addLineTo(x, y);
            currentAngle += increment;
        }
        return this;
    }

    /**
     * Adds _numberOfSegments_ segments according to the quadratic curve definition to the current Path2.
     * @param controlX control point x value
     * @param controlY control point y value
     * @param endX end point x value
     * @param endY end point y value
     * @param numberOfSegments (default: 36)
     * @returns the updated Path2.
     */
    public addQuadraticCurveTo(controlX: number, controlY: number, endX: number, endY: number, numberOfSegments = 36): Path2 {
        if (this.closed) {
            return this;
        }

        const equation = (t: number, val0: number, val1: number, val2: number) => {
            const res = (1.0 - t) * (1.0 - t) * val0 + 2.0 * t * (1.0 - t) * val1 + t * t * val2;
            return res;
        };
        const startPoint = this._points[this._points.length - 1];
        for (let i = 0; i <= numberOfSegments; i++) {
            const step = i / numberOfSegments;
            const x = equation(step, startPoint.x, controlX, endX);
            const y = equation(step, startPoint.y, controlY, endY);
            this.addLineTo(x, y);
        }
        return this;
    }

    /**
     * Adds _numberOfSegments_ segments according to the bezier curve definition to the current Path2.
     * @param originTangentX tangent vector at the origin point x value
     * @param originTangentY tangent vector at the origin point y value
     * @param destinationTangentX tangent vector at the destination point x value
     * @param destinationTangentY tangent vector at the destination point y value
     * @param endX end point x value
     * @param endY end point y value
     * @param numberOfSegments (default: 36)
     * @returns the updated Path2.
     */
    public addBezierCurveTo(
        originTangentX: number,
        originTangentY: number,
        destinationTangentX: number,
        destinationTangentY: number,
        endX: number,
        endY: number,
        numberOfSegments = 36
    ): Path2 {
        if (this.closed) {
            return this;
        }

        const equation = (t: number, val0: number, val1: number, val2: number, val3: number) => {
            const res = (1.0 - t) * (1.0 - t) * (1.0 - t) * val0 + 3.0 * t * (1.0 - t) * (1.0 - t) * val1 + 3.0 * t * t * (1.0 - t) * val2 + t * t * t * val3;
            return res;
        };
        const startPoint = this._points[this._points.length - 1];
        for (let i = 0; i <= numberOfSegments; i++) {
            const step = i / numberOfSegments;
            const x = equation(step, startPoint.x, originTangentX, destinationTangentX, endX);
            const y = equation(step, startPoint.y, originTangentY, destinationTangentY, endY);
            this.addLineTo(x, y);
        }
        return this;
    }

    /**
     * Defines if a given point is inside the polygon defines by the path
     * @param point defines the point to test
     * @returns true if the point is inside
     */
    public isPointInside(point: Vector2) {
        let isInside = false;
        const count = this._points.length;
        for (let p = count - 1, q = 0; q < count; p = q++) {
            let edgeLow = this._points[p];
            let edgeHigh = this._points[q];

            let edgeDx = edgeHigh.x - edgeLow.x;
            let edgeDy = edgeHigh.y - edgeLow.y;

            if (Math.abs(edgeDy) > Number.EPSILON) {
                // Not parallel
                if (edgeDy < 0) {
                    edgeLow = this._points[q];
                    edgeDx = -edgeDx;
                    edgeHigh = this._points[p];
                    edgeDy = -edgeDy;
                }

                if (point.y < edgeLow.y || point.y > edgeHigh.y) {
                    continue;
                }

                if (point.y === edgeLow.y && point.x === edgeLow.x) {
                    return true;
                } else {
                    const perpEdge = edgeDy * (point.x - edgeLow.x) - edgeDx * (point.y - edgeLow.y);
                    if (perpEdge === 0) {
                        return true;
                    }
                    if (perpEdge < 0) {
                        continue;
                    }
                    isInside = !isInside;
                }
            } else {
                // parallel or collinear
                if (point.y !== edgeLow.y) {
                    continue;
                }

                if ((edgeHigh.x <= point.x && point.x <= edgeLow.x) || (edgeLow.x <= point.x && point.x <= edgeHigh.x)) {
                    return true;
                }
            }
        }

        return isInside;
    }

    /**
     * Closes the Path2.
     * @returns the Path2.
     */
    public close(): Path2 {
        this.closed = true;
        return this;
    }
    /**
     * Gets the sum of the distance between each sequential point in the path
     * @returns the Path2 total length (float).
     */
    public length(): number {
        let result = this._length;

        if (this.closed) {
            const lastPoint = this._points[this._points.length - 1];
            const firstPoint = this._points[0];
            result += firstPoint.subtract(lastPoint).length();
        }
        return result;
    }

    /**
     * Gets the area of the polygon defined by the path
     * @returns area value
     */
    public area(): number {
        const n = this._points.length;
        let value = 0.0;

        for (let p = n - 1, q = 0; q < n; p = q++) {
            value += this._points[p].x * this._points[q].y - this._points[q].x * this._points[p].y;
        }

        return value * 0.5;
    }

    /**
     * Gets the points which construct the path
     * @returns the Path2 internal array of points.
     */
    public getPoints(): Vector2[] {
        return this._points;
    }

    /**
     * Retrieves the point at the distance aways from the starting point
     * @param normalizedLengthPosition the length along the path to retrieve the point from
     * @returns a new Vector2 located at a percentage of the Path2 total length on this path.
     */
    public getPointAtLengthPosition(normalizedLengthPosition: number): Vector2 {
        if (normalizedLengthPosition < 0 || normalizedLengthPosition > 1) {
            return Vector2.Zero();
        }

        const lengthPosition = normalizedLengthPosition * this.length();

        let previousOffset = 0;
        for (let i = 0; i < this._points.length; i++) {
            const j = (i + 1) % this._points.length;

            const a = this._points[i];
            const b = this._points[j];
            const bToA = b.subtract(a);

            const nextOffset = bToA.length() + previousOffset;
            if (lengthPosition >= previousOffset && lengthPosition <= nextOffset) {
                const dir = bToA.normalize();
                const localOffset = lengthPosition - previousOffset;

                return new Vector2(a.x + dir.x * localOffset, a.y + dir.y * localOffset);
            }
            previousOffset = nextOffset;
        }

        return Vector2.Zero();
    }

    /**
     * Creates a new path starting from an x and y position
     * @param x starting x value
     * @param y starting y value
     * @returns a new Path2 starting at the coordinates (x, y).
     */
    public static StartingAt(x: number, y: number): Path2 {
        return new Path2(x, y);
    }
}

/**
 * Represents a 3D path made up of multiple 3D points
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/path3D
 */
export class Path3D {
    private _curve = new Array<Vector3>();
    private _distances = new Array<number>();
    private _tangents = new Array<Vector3>();
    private _normals = new Array<Vector3>();
    private _binormals = new Array<Vector3>();
    private _raw: boolean;
    private _alignTangentsWithPath: boolean;

    // holds interpolated point data
    private readonly _pointAtData = {
        id: 0,
        point: Vector3.Zero(),
        previousPointArrayIndex: 0,

        position: 0,
        subPosition: 0,

        interpolateReady: false,
        interpolationMatrix: Matrix.Identity(),
    };

    /**
     * new Path3D(path, normal, raw)
     * Creates a Path3D. A Path3D is a logical math object, so not a mesh.
     * please read the description in the tutorial : https://doc.babylonjs.com/features/featuresDeepDive/mesh/path3D
     * @param path an array of Vector3, the curve axis of the Path3D
     * @param firstNormal (options) Vector3, the first wanted normal to the curve. Ex (0, 1, 0) for a vertical normal.
     * @param raw (optional, default false) : boolean, if true the returned Path3D isn't normalized. Useful to depict path acceleration or speed.
     * @param alignTangentsWithPath (optional, default false) : boolean, if true the tangents will be aligned with the path.
     */
    constructor(
        /**
         * an array of Vector3, the curve axis of the Path3D
         */
        public path: Vector3[],
        firstNormal: Nullable<Vector3> = null,
        raw?: boolean,
        alignTangentsWithPath = false
    ) {
        for (let p = 0; p < path.length; p++) {
            this._curve[p] = path[p].clone(); // hard copy
        }
        this._raw = raw || false;
        this._alignTangentsWithPath = alignTangentsWithPath;
        this._compute(firstNormal, alignTangentsWithPath);
    }

    /**
     * Returns the Path3D array of successive Vector3 designing its curve.
     * @returns the Path3D array of successive Vector3 designing its curve.
     */
    public getCurve(): Vector3[] {
        return this._curve;
    }

    /**
     * Returns the Path3D array of successive Vector3 designing its curve.
     * @returns the Path3D array of successive Vector3 designing its curve.
     */
    public getPoints(): Vector3[] {
        return this._curve;
    }

    /**
     * @returns the computed length (float) of the path.
     */
    public length() {
        return this._distances[this._distances.length - 1];
    }

    /**
     * Returns an array populated with tangent vectors on each Path3D curve point.
     * @returns an array populated with tangent vectors on each Path3D curve point.
     */
    public getTangents(): Vector3[] {
        return this._tangents;
    }

    /**
     * Returns an array populated with normal vectors on each Path3D curve point.
     * @returns an array populated with normal vectors on each Path3D curve point.
     */
    public getNormals(): Vector3[] {
        return this._normals;
    }

    /**
     * Returns an array populated with binormal vectors on each Path3D curve point.
     * @returns an array populated with binormal vectors on each Path3D curve point.
     */
    public getBinormals(): Vector3[] {
        return this._binormals;
    }

    /**
     * Returns an array populated with distances (float) of the i-th point from the first curve point.
     * @returns an array populated with distances (float) of the i-th point from the first curve point.
     */
    public getDistances(): number[] {
        return this._distances;
    }

    /**
     * Returns an interpolated point along this path
     * @param position the position of the point along this path, from 0.0 to 1.0
     * @returns a new Vector3 as the point
     */
    public getPointAt(position: number): Vector3 {
        return this._updatePointAtData(position).point;
    }

    /**
     * Returns the tangent vector of an interpolated Path3D curve point at the specified position along this path.
     * @param position the position of the point along this path, from 0.0 to 1.0
     * @param interpolated (optional, default false) : boolean, if true returns an interpolated tangent instead of the tangent of the previous path point.
     * @returns a tangent vector corresponding to the interpolated Path3D curve point, if not interpolated, the tangent is taken from the precomputed tangents array.
     */
    public getTangentAt(position: number, interpolated = false): Vector3 {
        this._updatePointAtData(position, interpolated);
        return interpolated ? Vector3.TransformCoordinates(Vector3.Forward(), this._pointAtData.interpolationMatrix) : this._tangents[this._pointAtData.previousPointArrayIndex];
    }

    /**
     * Returns the tangent vector of an interpolated Path3D curve point at the specified position along this path.
     * @param position the position of the point along this path, from 0.0 to 1.0
     * @param interpolated (optional, default false) : boolean, if true returns an interpolated normal instead of the normal of the previous path point.
     * @returns a normal vector corresponding to the interpolated Path3D curve point, if not interpolated, the normal is taken from the precomputed normals array.
     */
    public getNormalAt(position: number, interpolated = false): Vector3 {
        this._updatePointAtData(position, interpolated);
        return interpolated ? Vector3.TransformCoordinates(Vector3.Right(), this._pointAtData.interpolationMatrix) : this._normals[this._pointAtData.previousPointArrayIndex];
    }

    /**
     * Returns the binormal vector of an interpolated Path3D curve point at the specified position along this path.
     * @param position the position of the point along this path, from 0.0 to 1.0
     * @param interpolated (optional, default false) : boolean, if true returns an interpolated binormal instead of the binormal of the previous path point.
     * @returns a binormal vector corresponding to the interpolated Path3D curve point, if not interpolated, the binormal is taken from the precomputed binormals array.
     */
    public getBinormalAt(position: number, interpolated = false): Vector3 {
        this._updatePointAtData(position, interpolated);
        return interpolated ? Vector3.TransformCoordinates(Vector3.UpReadOnly, this._pointAtData.interpolationMatrix) : this._binormals[this._pointAtData.previousPointArrayIndex];
    }

    /**
     * Returns the distance (float) of an interpolated Path3D curve point at the specified position along this path.
     * @param position the position of the point along this path, from 0.0 to 1.0
     * @returns the distance of the interpolated Path3D curve point at the specified position along this path.
     */
    public getDistanceAt(position: number): number {
        return this.length() * position;
    }

    /**
     * Returns the array index of the previous point of an interpolated point along this path
     * @param position the position of the point to interpolate along this path, from 0.0 to 1.0
     * @returns the array index
     */
    public getPreviousPointIndexAt(position: number) {
        this._updatePointAtData(position);
        return this._pointAtData.previousPointArrayIndex;
    }

    /**
     * Returns the position of an interpolated point relative to the two path points it lies between, from 0.0 (point A) to 1.0 (point B)
     * @param position the position of the point to interpolate along this path, from 0.0 to 1.0
     * @returns the sub position
     */
    public getSubPositionAt(position: number) {
        this._updatePointAtData(position);
        return this._pointAtData.subPosition;
    }

    /**
     * Returns the position of the closest virtual point on this path to an arbitrary Vector3, from 0.0 to 1.0
     * @param target the vector of which to get the closest position to
     * @returns the position of the closest virtual point on this path to the target vector
     */
    public getClosestPositionTo(target: Vector3) {
        let smallestDistance = Number.MAX_VALUE;
        let closestPosition = 0.0;
        for (let i = 0; i < this._curve.length - 1; i++) {
            const point = this._curve[i + 0];
            const tangent = this._curve[i + 1].subtract(point).normalize();
            const subLength = this._distances[i + 1] - this._distances[i + 0];
            const subPosition = Math.min((Math.max(Vector3.Dot(tangent, target.subtract(point).normalize()), 0.0) * Vector3.Distance(point, target)) / subLength, 1.0);
            const distance = Vector3.Distance(point.add(tangent.scale(subPosition * subLength)), target);

            if (distance < smallestDistance) {
                smallestDistance = distance;
                closestPosition = (this._distances[i + 0] + subLength * subPosition) / this.length();
            }
        }
        return closestPosition;
    }

    /**
     * Returns a sub path (slice) of this path
     * @param start the position of the fist path point, from 0.0 to 1.0, or a negative value, which will get wrapped around from the end of the path to 0.0 to 1.0 values
     * @param end the position of the last path point, from 0.0 to 1.0, or a negative value, which will get wrapped around from the end of the path to 0.0 to 1.0 values
     * @returns a sub path (slice) of this path
     */
    public slice(start: number = 0.0, end: number = 1.0) {
        if (start < 0.0) {
            start = 1 - ((start * -1.0) % 1.0);
        }
        if (end < 0.0) {
            end = 1 - ((end * -1.0) % 1.0);
        }
        if (start > end) {
            const _start = start;
            start = end;
            end = _start;
        }
        const curvePoints = this.getCurve();

        const startPoint = this.getPointAt(start);
        let startIndex = this.getPreviousPointIndexAt(start);

        const endPoint = this.getPointAt(end);
        const endIndex = this.getPreviousPointIndexAt(end) + 1;

        const slicePoints: Vector3[] = [];
        if (start !== 0.0) {
            startIndex++;
            slicePoints.push(startPoint);
        }

        slicePoints.push(...curvePoints.slice(startIndex, endIndex));
        if (end !== 1.0 || start === 1.0) {
            slicePoints.push(endPoint);
        }
        return new Path3D(slicePoints, this.getNormalAt(start), this._raw, this._alignTangentsWithPath);
    }

    /**
     * Forces the Path3D tangent, normal, binormal and distance recomputation.
     * @param path path which all values are copied into the curves points
     * @param firstNormal which should be projected onto the curve
     * @param alignTangentsWithPath (optional, default false) : boolean, if true the tangents will be aligned with the path
     * @returns the same object updated.
     */
    public update(path: Vector3[], firstNormal: Nullable<Vector3> = null, alignTangentsWithPath = false): Path3D {
        for (let p = 0; p < path.length; p++) {
            this._curve[p].x = path[p].x;
            this._curve[p].y = path[p].y;
            this._curve[p].z = path[p].z;
        }
        this._compute(firstNormal, alignTangentsWithPath);
        return this;
    }

    // private function compute() : computes tangents, normals and binormals
    private _compute(firstNormal: Nullable<Vector3>, alignTangentsWithPath = false): void {
        const l = this._curve.length;

        if (l < 2) {
            return;
        }

        // first and last tangents
        this._tangents[0] = this._getFirstNonNullVector(0);
        if (!this._raw) {
            this._tangents[0].normalize();
        }
        this._tangents[l - 1] = this._curve[l - 1].subtract(this._curve[l - 2]);
        if (!this._raw) {
            this._tangents[l - 1].normalize();
        }

        // normals and binormals at first point : arbitrary vector with _normalVector()
        const tg0 = this._tangents[0];
        const pp0 = this._normalVector(tg0, firstNormal);
        this._normals[0] = pp0;
        if (!this._raw) {
            this._normals[0].normalize();
        }
        this._binormals[0] = Vector3.Cross(tg0, this._normals[0]);
        if (!this._raw) {
            this._binormals[0].normalize();
        }
        this._distances[0] = 0.0;

        // normals and binormals : next points
        let prev: Vector3; // previous vector (segment)
        let cur: Vector3; // current vector (segment)
        let curTang: Vector3; // current tangent
        // previous normal
        let prevNor: Vector3; // previous normal
        let prevBinor: Vector3; // previous binormal

        for (let i = 1; i < l; i++) {
            // tangents
            prev = this._getLastNonNullVector(i);
            if (i < l - 1) {
                cur = this._getFirstNonNullVector(i);
                this._tangents[i] = alignTangentsWithPath ? cur : prev.add(cur);
                this._tangents[i].normalize();
            }
            this._distances[i] = this._distances[i - 1] + this._curve[i].subtract(this._curve[i - 1]).length();

            // normals and binormals
            // http://www.cs.cmu.edu/afs/andrew/scs/cs/15-462/web/old/asst2camera.html
            curTang = this._tangents[i];
            prevBinor = this._binormals[i - 1];
            this._normals[i] = Vector3.Cross(prevBinor, curTang);
            if (!this._raw) {
                if (this._normals[i].length() === 0) {
                    prevNor = this._normals[i - 1];
                    this._normals[i] = prevNor.clone();
                } else {
                    this._normals[i].normalize();
                }
            }
            this._binormals[i] = Vector3.Cross(curTang, this._normals[i]);
            if (!this._raw) {
                this._binormals[i].normalize();
            }
        }
        this._pointAtData.id = NaN;
    }

    // private function getFirstNonNullVector(index)
    // returns the first non null vector from index : curve[index + N].subtract(curve[index])
    private _getFirstNonNullVector(index: number): Vector3 {
        let i = 1;
        let nNVector: Vector3 = this._curve[index + i].subtract(this._curve[index]);
        while (nNVector.length() === 0 && index + i + 1 < this._curve.length) {
            i++;
            nNVector = this._curve[index + i].subtract(this._curve[index]);
        }
        return nNVector;
    }

    // private function getLastNonNullVector(index)
    // returns the last non null vector from index : curve[index].subtract(curve[index - N])
    private _getLastNonNullVector(index: number): Vector3 {
        let i = 1;
        let nLVector: Vector3 = this._curve[index].subtract(this._curve[index - i]);
        while (nLVector.length() === 0 && index > i + 1) {
            i++;
            nLVector = this._curve[index].subtract(this._curve[index - i]);
        }
        return nLVector;
    }

    // private function normalVector(v0, vt, va) :
    // returns an arbitrary point in the plane defined by the point v0 and the vector vt orthogonal to this plane
    // if va is passed, it returns the va projection on the plane orthogonal to vt at the point v0
    private _normalVector(vt: Vector3, va: Nullable<Vector3>): Vector3 {
        let normal0: Vector3;
        let tgl = vt.length();
        if (tgl === 0.0) {
            tgl = 1.0;
        }

        if (va === undefined || va === null) {
            let point: Vector3;
            if (!Scalar.WithinEpsilon(Math.abs(vt.y) / tgl, 1.0, Epsilon)) {
                // search for a point in the plane
                point = new Vector3(0.0, -1.0, 0.0);
            } else if (!Scalar.WithinEpsilon(Math.abs(vt.x) / tgl, 1.0, Epsilon)) {
                point = new Vector3(1.0, 0.0, 0.0);
            } else if (!Scalar.WithinEpsilon(Math.abs(vt.z) / tgl, 1.0, Epsilon)) {
                point = new Vector3(0.0, 0.0, 1.0);
            } else {
                point = Vector3.Zero();
            }
            normal0 = Vector3.Cross(vt, point);
        } else {
            normal0 = Vector3.Cross(vt, va);
            Vector3.CrossToRef(normal0, vt, normal0);
        }
        normal0.normalize();
        return normal0;
    }

    /**
     * Updates the point at data for an interpolated point along this curve
     * @param position the position of the point along this curve, from 0.0 to 1.0
     * @param interpolateTNB
     * @interpolateTNB whether to compute the interpolated tangent, normal and binormal
     * @returns the (updated) point at data
     */
    private _updatePointAtData(position: number, interpolateTNB: boolean = false) {
        // set an id for caching the result
        if (this._pointAtData.id === position) {
            if (!this._pointAtData.interpolateReady) {
                this._updateInterpolationMatrix();
            }
            return this._pointAtData;
        } else {
            this._pointAtData.id = position;
        }
        const curvePoints = this.getPoints();

        // clamp position between 0.0 and 1.0
        if (position <= 0.0) {
            return this._setPointAtData(0.0, 0.0, curvePoints[0], 0, interpolateTNB);
        } else if (position >= 1.0) {
            return this._setPointAtData(1.0, 1.0, curvePoints[curvePoints.length - 1], curvePoints.length - 1, interpolateTNB);
        }

        let previousPoint: Vector3 = curvePoints[0];
        let currentPoint: Vector3;
        let currentLength = 0.0;
        const targetLength = position * this.length();

        for (let i = 1; i < curvePoints.length; i++) {
            currentPoint = curvePoints[i];
            const distance = Vector3.Distance(previousPoint, currentPoint);
            currentLength += distance;
            if (currentLength === targetLength) {
                return this._setPointAtData(position, 1.0, currentPoint, i, interpolateTNB);
            } else if (currentLength > targetLength) {
                const toLength = currentLength - targetLength;
                const diff = toLength / distance;
                const dir = previousPoint.subtract(currentPoint);
                const point = currentPoint.add(dir.scaleInPlace(diff));
                return this._setPointAtData(position, 1 - diff, point, i - 1, interpolateTNB);
            }
            previousPoint = currentPoint;
        }
        return this._pointAtData;
    }

    /**
     * Updates the point at data from the specified parameters
     * @param position where along the path the interpolated point is, from 0.0 to 1.0
     * @param subPosition
     * @param point the interpolated point
     * @param parentIndex the index of an existing curve point that is on, or else positionally the first behind, the interpolated point
     * @param interpolateTNB whether to compute the interpolated tangent, normal and binormal
     * @returns the (updated) point at data
     */
    private _setPointAtData(position: number, subPosition: number, point: Vector3, parentIndex: number, interpolateTNB: boolean) {
        this._pointAtData.point = point;
        this._pointAtData.position = position;
        this._pointAtData.subPosition = subPosition;
        this._pointAtData.previousPointArrayIndex = parentIndex;
        this._pointAtData.interpolateReady = interpolateTNB;

        if (interpolateTNB) {
            this._updateInterpolationMatrix();
        }
        return this._pointAtData;
    }

    /**
     * Updates the point at interpolation matrix for the tangents, normals and binormals
     */
    private _updateInterpolationMatrix() {
        this._pointAtData.interpolationMatrix = Matrix.Identity();
        const parentIndex = this._pointAtData.previousPointArrayIndex;

        if (parentIndex !== this._tangents.length - 1) {
            const index = parentIndex + 1;

            const tangentFrom = this._tangents[parentIndex].clone();
            const normalFrom = this._normals[parentIndex].clone();
            const binormalFrom = this._binormals[parentIndex].clone();

            const tangentTo = this._tangents[index].clone();
            const normalTo = this._normals[index].clone();
            const binormalTo = this._binormals[index].clone();

            const quatFrom = Quaternion.RotationQuaternionFromAxis(normalFrom, binormalFrom, tangentFrom);
            const quatTo = Quaternion.RotationQuaternionFromAxis(normalTo, binormalTo, tangentTo);
            const quatAt = Quaternion.Slerp(quatFrom, quatTo, this._pointAtData.subPosition);

            quatAt.toRotationMatrix(this._pointAtData.interpolationMatrix);
        }
    }
}

/**
 * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
 * A Curve3 is designed from a series of successive Vector3.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves
 */
export class Curve3 {
    private _points: Vector3[];
    private _length: number = 0.0;

    /**
     * Returns a Curve3 object along a Quadratic Bezier curve : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#quadratic-bezier-curve
     * @param v0 (Vector3) the origin point of the Quadratic Bezier
     * @param v1 (Vector3) the control point
     * @param v2 (Vector3) the end point of the Quadratic Bezier
     * @param nbPoints (integer) the wanted number of points in the curve
     * @returns the created Curve3
     */
    public static CreateQuadraticBezier(v0: DeepImmutable<Vector3>, v1: DeepImmutable<Vector3>, v2: DeepImmutable<Vector3>, nbPoints: number): Curve3 {
        nbPoints = nbPoints > 2 ? nbPoints : 3;
        const bez: Vector3[] = [];
        const equation = (t: number, val0: number, val1: number, val2: number) => {
            const res = (1.0 - t) * (1.0 - t) * val0 + 2.0 * t * (1.0 - t) * val1 + t * t * val2;
            return res;
        };
        for (let i = 0; i <= nbPoints; i++) {
            bez.push(new Vector3(equation(i / nbPoints, v0.x, v1.x, v2.x), equation(i / nbPoints, v0.y, v1.y, v2.y), equation(i / nbPoints, v0.z, v1.z, v2.z)));
        }
        return new Curve3(bez);
    }

    /**
     * Returns a Curve3 object along a Cubic Bezier curve : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#cubic-bezier-curve
     * @param v0 (Vector3) the origin point of the Cubic Bezier
     * @param v1 (Vector3) the first control point
     * @param v2 (Vector3) the second control point
     * @param v3 (Vector3) the end point of the Cubic Bezier
     * @param nbPoints (integer) the wanted number of points in the curve
     * @returns the created Curve3
     */
    public static CreateCubicBezier(v0: DeepImmutable<Vector3>, v1: DeepImmutable<Vector3>, v2: DeepImmutable<Vector3>, v3: DeepImmutable<Vector3>, nbPoints: number): Curve3 {
        nbPoints = nbPoints > 3 ? nbPoints : 4;
        const bez: Vector3[] = [];
        const equation = (t: number, val0: number, val1: number, val2: number, val3: number) => {
            const res = (1.0 - t) * (1.0 - t) * (1.0 - t) * val0 + 3.0 * t * (1.0 - t) * (1.0 - t) * val1 + 3.0 * t * t * (1.0 - t) * val2 + t * t * t * val3;
            return res;
        };
        for (let i = 0; i <= nbPoints; i++) {
            bez.push(new Vector3(equation(i / nbPoints, v0.x, v1.x, v2.x, v3.x), equation(i / nbPoints, v0.y, v1.y, v2.y, v3.y), equation(i / nbPoints, v0.z, v1.z, v2.z, v3.z)));
        }
        return new Curve3(bez);
    }

    /**
     * Returns a Curve3 object along a Hermite Spline curve : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#hermite-spline
     * @param p1 (Vector3) the origin point of the Hermite Spline
     * @param t1 (Vector3) the tangent vector at the origin point
     * @param p2 (Vector3) the end point of the Hermite Spline
     * @param t2 (Vector3) the tangent vector at the end point
     * @param nSeg (integer) the number of curve segments or nSeg + 1 points in the array
     * @returns the created Curve3
     */
    public static CreateHermiteSpline(p1: DeepImmutable<Vector3>, t1: DeepImmutable<Vector3>, p2: DeepImmutable<Vector3>, t2: DeepImmutable<Vector3>, nSeg: number): Curve3 {
        const hermite: Vector3[] = [];
        const step = 1.0 / nSeg;
        for (let i = 0; i <= nSeg; i++) {
            hermite.push(Vector3.Hermite(p1, t1, p2, t2, i * step));
        }
        return new Curve3(hermite);
    }

    /**
     * Returns a Curve3 object along a CatmullRom Spline curve :
     * @param points (array of Vector3) the points the spline must pass through. At least, four points required
     * @param nbPoints (integer) the wanted number of points between each curve control points
     * @param closed (boolean) optional with default false, when true forms a closed loop from the points
     * @returns the created Curve3
     */
    public static CreateCatmullRomSpline(points: DeepImmutable<Vector3[]>, nbPoints: number, closed?: boolean): Curve3 {
        const catmullRom: Vector3[] = [];
        const step = 1.0 / nbPoints;
        let amount = 0.0;
        if (closed) {
            const pointsCount = points.length;
            for (let i = 0; i < pointsCount; i++) {
                amount = 0;
                for (let c = 0; c < nbPoints; c++) {
                    catmullRom.push(
                        Vector3.CatmullRom(points[i % pointsCount], points[(i + 1) % pointsCount], points[(i + 2) % pointsCount], points[(i + 3) % pointsCount], amount)
                    );
                    amount += step;
                }
            }
            catmullRom.push(catmullRom[0]);
        } else {
            const totalPoints: Vector3[] = [];
            totalPoints.push(points[0].clone());
            Array.prototype.push.apply(totalPoints, points);
            totalPoints.push(points[points.length - 1].clone());
            let i = 0;
            for (; i < totalPoints.length - 3; i++) {
                amount = 0;
                for (let c = 0; c < nbPoints; c++) {
                    catmullRom.push(Vector3.CatmullRom(totalPoints[i], totalPoints[i + 1], totalPoints[i + 2], totalPoints[i + 3], amount));
                    amount += step;
                }
            }
            i--;
            catmullRom.push(Vector3.CatmullRom(totalPoints[i], totalPoints[i + 1], totalPoints[i + 2], totalPoints[i + 3], amount));
        }
        return new Curve3(catmullRom);
    }

    /**
     * Returns a Curve3 object along an arc through three vector3 points:
     * The three points should not be colinear. When they are the Curve3 is empty.
     * @param first (Vector3) the first point the arc must pass through.
     * @param second (Vector3) the second point the arc must pass through.
     * @param third (Vector3) the third point the arc must pass through.
     * @param steps (number) the larger the number of steps the more detailed the arc.
     * @param closed (boolean) optional with default false, when true forms the chord from the first and third point
     * @param fullCircle Circle (boolean) optional with default false, when true forms the complete circle through the three points
     * @returns the created Curve3
     */
    public static ArcThru3Points(first: Vector3, second: Vector3, third: Vector3, steps: number = 32, closed: boolean = false, fullCircle: boolean = false): Curve3 {
        const arc: Vector3[] = [];
        const vec1 = second.subtract(first);
        const vec2 = third.subtract(second);
        const vec3 = first.subtract(third);
        const zAxis = Vector3.Cross(vec1, vec2);
        const len4 = zAxis.length();
        if (len4 < Math.pow(10, -8)) {
            return new Curve3(arc); // colinear points arc is empty
        }
        const len1_sq = vec1.lengthSquared();
        const len2_sq = vec2.lengthSquared();
        const len3_sq = vec3.lengthSquared();
        const len4_sq = zAxis.lengthSquared();
        const len1 = vec1.length();
        const len2 = vec2.length();
        const len3 = vec3.length();
        const radius = (0.5 * len1 * len2 * len3) / len4;
        const dot1 = Vector3.Dot(vec1, vec3);
        const dot2 = Vector3.Dot(vec1, vec2);
        const dot3 = Vector3.Dot(vec2, vec3);
        const a = (-0.5 * len2_sq * dot1) / len4_sq;
        const b = (-0.5 * len3_sq * dot2) / len4_sq;
        const c = (-0.5 * len1_sq * dot3) / len4_sq;
        const center = first.scale(a).add(second.scale(b)).add(third.scale(c));
        const radiusVec = first.subtract(center);
        const xAxis = radiusVec.normalize();
        const yAxis = Vector3.Cross(zAxis, xAxis).normalize();
        if (fullCircle) {
            const dStep = (2 * Math.PI) / steps;
            for (let theta = 0; theta <= 2 * Math.PI; theta += dStep) {
                arc.push(center.add(xAxis.scale(radius * Math.cos(theta)).add(yAxis.scale(radius * Math.sin(theta)))));
            }
            arc.push(first);
        } else {
            const dStep = 1 / steps;
            let theta = 0;
            let point = Vector3.Zero();
            do {
                point = center.add(xAxis.scale(radius * Math.cos(theta)).add(yAxis.scale(radius * Math.sin(theta))));
                arc.push(point);
                theta += dStep;
            } while (!point.equalsWithEpsilon(third, radius * dStep * 1.1));
            arc.push(third);
            if (closed) {
                arc.push(first);
            }
        }
        return new Curve3(arc);
    }

    /**
     * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
     * A Curve3 is designed from a series of successive Vector3.
     * Tuto : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#curve3-object
     * @param points points which make up the curve
     */
    constructor(points: Vector3[]) {
        this._points = points;
        this._length = this._computeLength(points);
    }

    /**
     * @returns the Curve3 stored array of successive Vector3
     */
    public getPoints() {
        return this._points;
    }

    /**
     * @returns the computed length (float) of the curve.
     */
    public length() {
        return this._length;
    }

    /**
     * Returns a new instance of Curve3 object : var curve = curveA.continue(curveB);
     * This new Curve3 is built by translating and sticking the curveB at the end of the curveA.
     * curveA and curveB keep unchanged.
     * @param curve the curve to continue from this curve
     * @returns the newly constructed curve
     */
    public continue(curve: DeepImmutable<Curve3>): Curve3 {
        const lastPoint = this._points[this._points.length - 1];
        const continuedPoints = this._points.slice();
        const curvePoints = curve.getPoints();
        for (let i = 1; i < curvePoints.length; i++) {
            continuedPoints.push(curvePoints[i].subtract(curvePoints[0]).add(lastPoint));
        }
        const continuedCurve = new Curve3(continuedPoints);
        return continuedCurve;
    }

    private _computeLength(path: DeepImmutable<Vector3[]>): number {
        let l = 0;
        for (let i = 1; i < path.length; i++) {
            l += path[i].subtract(path[i - 1]).length();
        }
        return l;
    }
}
