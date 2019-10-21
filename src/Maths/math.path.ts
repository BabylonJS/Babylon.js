import { DeepImmutable, Nullable } from '../types';
import { Scalar } from './math.scalar';
import { Vector2, Vector3 } from './math.vector';
import { Epsilon } from './math.constants';

/**
 * Defines potential orientation for back face culling
 */
export enum Orientation {
    /**
     * Clockwise
     */
    CW = 0,
    /** Counter clockwise */
    CCW = 1
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
        var f0 = 1 - 3 * x2 + 3 * x1;
        var f1 = 3 * x2 - 6 * x1;
        var f2 = 3 * x1;

        var refinedT = t;
        for (var i = 0; i < 5; i++) {
            var refinedT2 = refinedT * refinedT;
            var refinedT3 = refinedT2 * refinedT;

            var x = f0 * refinedT3 + f1 * refinedT2 + f2 * refinedT;
            var slope = 1.0 / (3.0 * f0 * refinedT2 + 2.0 * f1 * refinedT + f2);
            refinedT -= (x - t) * slope;
            refinedT = Math.min(1, Math.max(0, refinedT));

        }

        // Resolve cubic bezier for the given x
        return 3 * Math.pow(1 - refinedT, 2) * refinedT * y1 +
            3 * (1 - refinedT) * Math.pow(refinedT, 2) * y2 +
            Math.pow(refinedT, 3);
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
        if (this._radians < 0.0) { this._radians += (2.0 * Math.PI); }
    }

    /**
     * Get value in degrees
     * @returns the Angle value in degrees (float)
     */
    public degrees() {
        return this._radians * 180.0 / Math.PI;
    }

    /**
     * Get value in radians
     * @returns the Angle value in radians (float)
     */
    public radians() {
        return this._radians;
    }

    /**
     * Gets a new Angle object valued with the angle value in radians between the two given vectors
     * @param a defines first vector
     * @param b defines second vector
     * @returns a new Angle
     */
    public static BetweenTwoPoints(a: DeepImmutable<Vector2>, b: DeepImmutable<Vector2>): Angle {
        var delta = b.subtract(a);
        var theta = Math.atan2(delta.y, delta.x);
        return new Angle(theta);
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
        return new Angle(degrees * Math.PI / 180.0);
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
     * @param midPoint Defines the midlle point of the arc
     * @param endPoint Defines the end point of the arc
     */
    constructor(
        /** Defines the start point of the arc */
        public startPoint: Vector2,
        /** Defines the mid point of the arc */
        public midPoint: Vector2,
        /** Defines the end point of the arc */
        public endPoint: Vector2) {

        var temp = Math.pow(midPoint.x, 2) + Math.pow(midPoint.y, 2);
        var startToMid = (Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2) - temp) / 2.;
        var midToEnd = (temp - Math.pow(endPoint.x, 2) - Math.pow(endPoint.y, 2)) / 2.;
        var det = (startPoint.x - midPoint.x) * (midPoint.y - endPoint.y) - (midPoint.x - endPoint.x) * (startPoint.y - midPoint.y);

        this.centerPoint = new Vector2(
            (startToMid * (midPoint.y - endPoint.y) - midToEnd * (startPoint.y - midPoint.y)) / det,
            ((startPoint.x - midPoint.x) * midToEnd - (midPoint.x - endPoint.x) * startToMid) / det
        );

        this.radius = this.centerPoint.subtract(this.startPoint).length();

        this.startAngle = Angle.BetweenTwoPoints(this.centerPoint, this.startPoint);

        var a1 = this.startAngle.degrees();
        var a2 = Angle.BetweenTwoPoints(this.centerPoint, this.midPoint).degrees();
        var a3 = Angle.BetweenTwoPoints(this.centerPoint, this.endPoint).degrees();

        // angles correction
        if (a2 - a1 > +180.0) { a2 -= 360.0; }
        if (a2 - a1 < -180.0) { a2 += 360.0; }
        if (a3 - a2 > +180.0) { a3 -= 360.0; }
        if (a3 - a2 < -180.0) { a3 += 360.0; }

        this.orientation = (a2 - a1) < 0 ? Orientation.CW : Orientation.CCW;
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
        var newPoint = new Vector2(x, y);
        var previousPoint = this._points[this._points.length - 1];
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
        var startPoint = this._points[this._points.length - 1];
        var midPoint = new Vector2(midX, midY);
        var endPoint = new Vector2(endX, endY);

        var arc = new Arc2(startPoint, midPoint, endPoint);

        var increment = arc.angle.radians() / numberOfSegments;
        if (arc.orientation === Orientation.CW) { increment *= -1; }
        var currentAngle = arc.startAngle.radians() + increment;

        for (var i = 0; i < numberOfSegments; i++) {
            var x = Math.cos(currentAngle) * arc.radius + arc.centerPoint.x;
            var y = Math.sin(currentAngle) * arc.radius + arc.centerPoint.y;
            this.addLineTo(x, y);
            currentAngle += increment;
        }
        return this;
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
        var result = this._length;

        if (this.closed) {
            var lastPoint = this._points[this._points.length - 1];
            var firstPoint = this._points[0];
            result += (firstPoint.subtract(lastPoint).length());
        }
        return result;
    }

    /**
     * Gets the points which construct the path
     * @returns the Path2 internal array of points.
     */
    public getPoints(): Vector2[] {
        return this._points;
    }

    /**
     * Retreives the point at the distance aways from the starting point
     * @param normalizedLengthPosition the length along the path to retreive the point from
     * @returns a new Vector2 located at a percentage of the Path2 total length on this path.
     */
    public getPointAtLengthPosition(normalizedLengthPosition: number): Vector2 {
        if (normalizedLengthPosition < 0 || normalizedLengthPosition > 1) {
            return Vector2.Zero();
        }

        var lengthPosition = normalizedLengthPosition * this.length();

        var previousOffset = 0;
        for (var i = 0; i < this._points.length; i++) {
            var j = (i + 1) % this._points.length;

            var a = this._points[i];
            var b = this._points[j];
            var bToA = b.subtract(a);

            var nextOffset = (bToA.length() + previousOffset);
            if (lengthPosition >= previousOffset && lengthPosition <= nextOffset) {
                var dir = bToA.normalize();
                var localOffset = lengthPosition - previousOffset;

                return new Vector2(
                    a.x + (dir.x * localOffset),
                    a.y + (dir.y * localOffset)
                );
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
 */
export class Path3D {
    private _curve = new Array<Vector3>();
    private _distances = new Array<number>();
    private _tangents = new Array<Vector3>();
    private _normals = new Array<Vector3>();
    private _binormals = new Array<Vector3>();
    private _raw: boolean;

    /**
    * new Path3D(path, normal, raw)
    * Creates a Path3D. A Path3D is a logical math object, so not a mesh.
    * please read the description in the tutorial : https://doc.babylonjs.com/how_to/how_to_use_path3d
    * @param path an array of Vector3, the curve axis of the Path3D
    * @param firstNormal (options) Vector3, the first wanted normal to the curve. Ex (0, 1, 0) for a vertical normal.
    * @param raw (optional, default false) : boolean, if true the returned Path3D isn't normalized. Useful to depict path acceleration or speed.
    */
    constructor(
        /**
         * an array of Vector3, the curve axis of the Path3D
         */
        public path: Vector3[],
        firstNormal: Nullable<Vector3> = null,
        raw?: boolean
    ) {
        for (var p = 0; p < path.length; p++) {
            this._curve[p] = path[p].clone(); // hard copy
        }
        this._raw = raw || false;
        this._compute(firstNormal);
    }

    /**
     * Returns the Path3D array of successive Vector3 designing its curve.
     * @returns the Path3D array of successive Vector3 designing its curve.
     */
    public getCurve(): Vector3[] {
        return this._curve;
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
     * Forces the Path3D tangent, normal, binormal and distance recomputation.
     * @param path path which all values are copied into the curves points
     * @param firstNormal which should be projected onto the curve
     * @returns the same object updated.
     */
    public update(path: Vector3[], firstNormal: Nullable<Vector3> = null): Path3D {
        for (var p = 0; p < path.length; p++) {
            this._curve[p].x = path[p].x;
            this._curve[p].y = path[p].y;
            this._curve[p].z = path[p].z;
        }
        this._compute(firstNormal);
        return this;
    }

    // private function compute() : computes tangents, normals and binormals
    private _compute(firstNormal: Nullable<Vector3>): void {
        var l = this._curve.length;

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
        var tg0 = this._tangents[0];
        var pp0 = this._normalVector(tg0, firstNormal);
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
        var prev: Vector3;        // previous vector (segment)
        var cur: Vector3;         // current vector (segment)
        var curTang: Vector3;     // current tangent
        // previous normal
        var prevBinor: Vector3;   // previous binormal

        for (var i = 1; i < l; i++) {
            // tangents
            prev = this._getLastNonNullVector(i);
            if (i < l - 1) {
                cur = this._getFirstNonNullVector(i);
                this._tangents[i] = prev.add(cur);
                this._tangents[i].normalize();
            }
            this._distances[i] = this._distances[i - 1] + prev.length();

            // normals and binormals
            // http://www.cs.cmu.edu/afs/andrew/scs/cs/15-462/web/old/asst2camera.html
            curTang = this._tangents[i];
            prevBinor = this._binormals[i - 1];
            this._normals[i] = Vector3.Cross(prevBinor, curTang);
            if (!this._raw) {
                this._normals[i].normalize();
            }
            this._binormals[i] = Vector3.Cross(curTang, this._normals[i]);
            if (!this._raw) {
                this._binormals[i].normalize();
            }
        }
    }

    // private function getFirstNonNullVector(index)
    // returns the first non null vector from index : curve[index + N].subtract(curve[index])
    private _getFirstNonNullVector(index: number): Vector3 {
        var i = 1;
        var nNVector: Vector3 = this._curve[index + i].subtract(this._curve[index]);
        while (nNVector.length() === 0 && index + i + 1 < this._curve.length) {
            i++;
            nNVector = this._curve[index + i].subtract(this._curve[index]);
        }
        return nNVector;
    }

    // private function getLastNonNullVector(index)
    // returns the last non null vector from index : curve[index].subtract(curve[index - N])
    private _getLastNonNullVector(index: number): Vector3 {
        var i = 1;
        var nLVector: Vector3 = this._curve[index].subtract(this._curve[index - i]);
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
        var normal0: Vector3;
        var tgl = vt.length();
        if (tgl === 0.0) {
            tgl = 1.0;
        }

        if (va === undefined || va === null) {
            var point: Vector3;
            if (!Scalar.WithinEpsilon(Math.abs(vt.y) / tgl, 1.0, Epsilon)) {     // search for a point in the plane
                point = new Vector3(0.0, -1.0, 0.0);
            }
            else if (!Scalar.WithinEpsilon(Math.abs(vt.x) / tgl, 1.0, Epsilon)) {
                point = new Vector3(1.0, 0.0, 0.0);
            }
            else if (!Scalar.WithinEpsilon(Math.abs(vt.z) / tgl, 1.0, Epsilon)) {
                point = new Vector3(0.0, 0.0, 1.0);
            }
            else {
                point = Vector3.Zero();
            }
            normal0 = Vector3.Cross(vt, point);
        }
        else {
            normal0 = Vector3.Cross(vt, va);
            Vector3.CrossToRef(normal0, vt, normal0);
        }
        normal0.normalize();
        return normal0;
    }
}

/**
 * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
 * A Curve3 is designed from a series of successive Vector3.
 * @see https://doc.babylonjs.com/how_to/how_to_use_curve3
 */
export class Curve3 {
    private _points: Vector3[];
    private _length: number = 0.0;

    /**
     * Returns a Curve3 object along a Quadratic Bezier curve : https://doc.babylonjs.com/how_to/how_to_use_curve3#quadratic-bezier-curve
     * @param v0 (Vector3) the origin point of the Quadratic Bezier
     * @param v1 (Vector3) the control point
     * @param v2 (Vector3) the end point of the Quadratic Bezier
     * @param nbPoints (integer) the wanted number of points in the curve
     * @returns the created Curve3
     */
    public static CreateQuadraticBezier(v0: DeepImmutable<Vector3>, v1: DeepImmutable<Vector3>, v2: DeepImmutable<Vector3>, nbPoints: number): Curve3 {
        nbPoints = nbPoints > 2 ? nbPoints : 3;
        var bez = new Array<Vector3>();
        var equation = (t: number, val0: number, val1: number, val2: number) => {
            var res = (1.0 - t) * (1.0 - t) * val0 + 2.0 * t * (1.0 - t) * val1 + t * t * val2;
            return res;
        };
        for (var i = 0; i <= nbPoints; i++) {
            bez.push(new Vector3(equation(i / nbPoints, v0.x, v1.x, v2.x), equation(i / nbPoints, v0.y, v1.y, v2.y), equation(i / nbPoints, v0.z, v1.z, v2.z)));
        }
        return new Curve3(bez);
    }

    /**
     * Returns a Curve3 object along a Cubic Bezier curve : https://doc.babylonjs.com/how_to/how_to_use_curve3#cubic-bezier-curve
     * @param v0 (Vector3) the origin point of the Cubic Bezier
     * @param v1 (Vector3) the first control point
     * @param v2 (Vector3) the second control point
     * @param v3 (Vector3) the end point of the Cubic Bezier
     * @param nbPoints (integer) the wanted number of points in the curve
     * @returns the created Curve3
     */
    public static CreateCubicBezier(v0: DeepImmutable<Vector3>, v1: DeepImmutable<Vector3>, v2: DeepImmutable<Vector3>, v3: DeepImmutable<Vector3>, nbPoints: number): Curve3 {
        nbPoints = nbPoints > 3 ? nbPoints : 4;
        var bez = new Array<Vector3>();
        var equation = (t: number, val0: number, val1: number, val2: number, val3: number) => {
            var res = (1.0 - t) * (1.0 - t) * (1.0 - t) * val0 + 3.0 * t * (1.0 - t) * (1.0 - t) * val1 + 3.0 * t * t * (1.0 - t) * val2 + t * t * t * val3;
            return res;
        };
        for (var i = 0; i <= nbPoints; i++) {
            bez.push(new Vector3(equation(i / nbPoints, v0.x, v1.x, v2.x, v3.x), equation(i / nbPoints, v0.y, v1.y, v2.y, v3.y), equation(i / nbPoints, v0.z, v1.z, v2.z, v3.z)));
        }
        return new Curve3(bez);
    }

    /**
     * Returns a Curve3 object along a Hermite Spline curve : https://doc.babylonjs.com/how_to/how_to_use_curve3#hermite-spline
     * @param p1 (Vector3) the origin point of the Hermite Spline
     * @param t1 (Vector3) the tangent vector at the origin point
     * @param p2 (Vector3) the end point of the Hermite Spline
     * @param t2 (Vector3) the tangent vector at the end point
     * @param nbPoints (integer) the wanted number of points in the curve
     * @returns the created Curve3
     */
    public static CreateHermiteSpline(p1: DeepImmutable<Vector3>, t1: DeepImmutable<Vector3>, p2: DeepImmutable<Vector3>, t2: DeepImmutable<Vector3>, nbPoints: number): Curve3 {
        var hermite = new Array<Vector3>();
        var step = 1.0 / nbPoints;
        for (var i = 0; i <= nbPoints; i++) {
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
        var catmullRom = new Array<Vector3>();
        var step = 1.0 / nbPoints;
        var amount = 0.0;
        if (closed) {
            var pointsCount = points.length;
            for (var i = 0; i < pointsCount; i++) {
                amount = 0;
                for (var c = 0; c < nbPoints; c++) {
                    catmullRom.push(Vector3.CatmullRom(points[i % pointsCount], points[(i + 1) % pointsCount], points[(i + 2) % pointsCount], points[(i + 3) % pointsCount], amount));
                    amount += step;
                }
            }
            catmullRom.push(catmullRom[0]);
        }
        else {
            var totalPoints = new Array<Vector3>();
            totalPoints.push(points[0].clone());
            Array.prototype.push.apply(totalPoints, points);
            totalPoints.push(points[points.length - 1].clone());
            for (var i = 0; i < totalPoints.length - 3; i++) {
                amount = 0;
                for (var c = 0; c < nbPoints; c++) {
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
     * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
     * A Curve3 is designed from a series of successive Vector3.
     * Tuto : https://doc.babylonjs.com/how_to/how_to_use_curve3#curve3-object
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
        var lastPoint = this._points[this._points.length - 1];
        var continuedPoints = this._points.slice();
        var curvePoints = curve.getPoints();
        for (var i = 1; i < curvePoints.length; i++) {
            continuedPoints.push(curvePoints[i].subtract(curvePoints[0]).add(lastPoint));
        }
        var continuedCurve = new Curve3(continuedPoints);
        return continuedCurve;
    }

    private _computeLength(path: DeepImmutable<Vector3[]>): number {
        var l = 0;
        for (var i = 1; i < path.length; i++) {
            l += (path[i].subtract(path[i - 1])).length();
        }
        return l;
    }
}