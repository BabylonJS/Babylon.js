import { Nullable, IndicesArray } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Plane } from '../Maths/math.plane';

var intersectBoxAASphere = (boxMin: Vector3, boxMax: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean => {
    if (boxMin.x > sphereCenter.x + sphereRadius) {
        return false;
    }

    if (sphereCenter.x - sphereRadius > boxMax.x) {
        return false;
    }

    if (boxMin.y > sphereCenter.y + sphereRadius) {
        return false;
    }

    if (sphereCenter.y - sphereRadius > boxMax.y) {
        return false;
    }

    if (boxMin.z > sphereCenter.z + sphereRadius) {
        return false;
    }

    if (sphereCenter.z - sphereRadius > boxMax.z) {
        return false;
    }

    return true;
};

var getLowestRoot: (a: number, b: number, c: number, maxR: number) => { root: number, found: boolean } =
    (function() {
        var result = { root: 0, found: false };
        return function(a: number, b: number, c: number, maxR: number) {
            result.root = 0; result.found = false;
            var determinant = b * b - 4.0 * a * c;
            if (determinant < 0) {
                return result;
            }

            var sqrtD = Math.sqrt(determinant);
            var r1 = (-b - sqrtD) / (2.0 * a);
            var r2 = (-b + sqrtD) / (2.0 * a);

            if (r1 > r2) {
                var temp = r2;
                r2 = r1;
                r1 = temp;
            }

            if (r1 > 0 && r1 < maxR) {
                result.root = r1;
                result.found = true;
                return result;
            }

            if (r2 > 0 && r2 < maxR) {
                result.root = r2;
                result.found = true;
                return result;
            }

            return result;
        };
    }
    )();

/** @hidden */
export class Collider {
    // Implementation of the "Improved Collision detection and Response" algorithm proposed by Kasper Fauerby
    // https://www.peroxide.dk/papers/collision/collision.pdf

    /** Define if a collision was found */
    public collisionFound: boolean;

    /**
     * Define last intersection point in local space
     */
    public intersectionPoint: Vector3;

    /**
     * Define last collided mesh
     */
    public collidedMesh: Nullable<AbstractMesh>;

    private _collisionPoint = Vector3.Zero();
    private _planeIntersectionPoint = Vector3.Zero();
    private _tempVector = Vector3.Zero();
    private _tempVector2 = Vector3.Zero();
    private _tempVector3 = Vector3.Zero();
    private _tempVector4 = Vector3.Zero();
    private _edge = Vector3.Zero();
    private _baseToVertex = Vector3.Zero();
    private _destinationPoint = Vector3.Zero();
    private _slidePlaneNormal = Vector3.Zero();
    private _displacementVector = Vector3.Zero();

    /** @hidden */
    public _radius = Vector3.One();
    /** @hidden */
    public _retry = 0;
    private _velocity: Vector3;
    private _basePoint: Vector3;
    private _epsilon: number;
    /** @hidden */
    public _velocityWorldLength: number;
    /** @hidden */
    public _basePointWorld = Vector3.Zero();
    private _velocityWorld = Vector3.Zero();
    private _normalizedVelocity = Vector3.Zero();
    /** @hidden */
    public _initialVelocity: Vector3;
    /** @hidden */
    public _initialPosition: Vector3;
    private _nearestDistance: number;

    private _collisionMask = -1;

    public get collisionMask(): number {
        return this._collisionMask;
    }

    public set collisionMask(mask: number) {
        this._collisionMask = !isNaN(mask) ? mask : -1;
    }

    /**
     * Gets the plane normal used to compute the sliding response (in local space)
     */
    public get slidePlaneNormal(): Vector3 {
        return this._slidePlaneNormal;
    }

    // Methods
    /** @hidden */
    public _initialize(source: Vector3, dir: Vector3, e: number): void {
        this._velocity = dir;
        Vector3.NormalizeToRef(dir, this._normalizedVelocity);
        this._basePoint = source;

        source.multiplyToRef(this._radius, this._basePointWorld);
        dir.multiplyToRef(this._radius, this._velocityWorld);

        this._velocityWorldLength = this._velocityWorld.length();

        this._epsilon = e;
        this.collisionFound = false;
    }

    /** @hidden */
    public _checkPointInTriangle(point: Vector3, pa: Vector3, pb: Vector3, pc: Vector3, n: Vector3): boolean {
        pa.subtractToRef(point, this._tempVector);
        pb.subtractToRef(point, this._tempVector2);

        Vector3.CrossToRef(this._tempVector, this._tempVector2, this._tempVector4);
        var d = Vector3.Dot(this._tempVector4, n);
        if (d < 0) {
            return false;
        }

        pc.subtractToRef(point, this._tempVector3);
        Vector3.CrossToRef(this._tempVector2, this._tempVector3, this._tempVector4);
        d = Vector3.Dot(this._tempVector4, n);
        if (d < 0) {
            return false;
        }

        Vector3.CrossToRef(this._tempVector3, this._tempVector, this._tempVector4);
        d = Vector3.Dot(this._tempVector4, n);
        return d >= 0;
    }

    /** @hidden */
    public _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): boolean {
        var distance = Vector3.Distance(this._basePointWorld, sphereCenter);

        var max = Math.max(this._radius.x, this._radius.y, this._radius.z);

        if (distance > this._velocityWorldLength + max + sphereRadius) {
            return false;
        }

        if (!intersectBoxAASphere(vecMin, vecMax, this._basePointWorld, this._velocityWorldLength + max)) {
            return false;
        }

        return true;
    }

    /** @hidden */
    public _testTriangle(faceIndex: number, trianglePlaneArray: Array<Plane>, p1: Vector3, p2: Vector3, p3: Vector3, hasMaterial: boolean, hostMesh: AbstractMesh): void {
        var t0;
        var embeddedInPlane = false;

        //defensive programming, actually not needed.
        if (!trianglePlaneArray) {
            trianglePlaneArray = [];
        }

        if (!trianglePlaneArray[faceIndex]) {
            trianglePlaneArray[faceIndex] = new Plane(0, 0, 0, 0);
            trianglePlaneArray[faceIndex].copyFromPoints(p1, p2, p3);
        }

        var trianglePlane = trianglePlaneArray[faceIndex];

        if ((!hasMaterial) && !trianglePlane.isFrontFacingTo(this._normalizedVelocity, 0)) {
            return;
        }

        var signedDistToTrianglePlane = trianglePlane.signedDistanceTo(this._basePoint);
        var normalDotVelocity = Vector3.Dot(trianglePlane.normal, this._velocity);

        if (normalDotVelocity == 0) {
            if (Math.abs(signedDistToTrianglePlane) >= 1.0) {
                return;
            }
            embeddedInPlane = true;
            t0 = 0;
        }
        else {
            t0 = (-1.0 - signedDistToTrianglePlane) / normalDotVelocity;
            var t1 = (1.0 - signedDistToTrianglePlane) / normalDotVelocity;

            if (t0 > t1) {
                var temp = t1;
                t1 = t0;
                t0 = temp;
            }

            if (t0 > 1.0 || t1 < 0.0) {
                return;
            }

            if (t0 < 0) {
                t0 = 0;
            }
            if (t0 > 1.0) {
                t0 = 1.0;
            }
        }

        this._collisionPoint.copyFromFloats(0, 0, 0);

        var found = false;
        var t = 1.0;

        if (!embeddedInPlane) {
            this._basePoint.subtractToRef(trianglePlane.normal, this._planeIntersectionPoint);
            this._velocity.scaleToRef(t0, this._tempVector);
            this._planeIntersectionPoint.addInPlace(this._tempVector);

            if (this._checkPointInTriangle(this._planeIntersectionPoint, p1, p2, p3, trianglePlane.normal)) {
                found = true;
                t = t0;
                this._collisionPoint.copyFrom(this._planeIntersectionPoint);
            }
        }

        if (!found) {
            var velocitySquaredLength = this._velocity.lengthSquared();

            var a = velocitySquaredLength;

            this._basePoint.subtractToRef(p1, this._tempVector);
            var b = 2.0 * (Vector3.Dot(this._velocity, this._tempVector));
            var c = this._tempVector.lengthSquared() - 1.0;

            var lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                t = lowestRoot.root;
                found = true;
                this._collisionPoint.copyFrom(p1);
            }

            this._basePoint.subtractToRef(p2, this._tempVector);
            b = 2.0 * (Vector3.Dot(this._velocity, this._tempVector));
            c = this._tempVector.lengthSquared() - 1.0;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                t = lowestRoot.root;
                found = true;
                this._collisionPoint.copyFrom(p2);
            }

            this._basePoint.subtractToRef(p3, this._tempVector);
            b = 2.0 * (Vector3.Dot(this._velocity, this._tempVector));
            c = this._tempVector.lengthSquared() - 1.0;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                t = lowestRoot.root;
                found = true;
                this._collisionPoint.copyFrom(p3);
            }

            p2.subtractToRef(p1, this._edge);
            p1.subtractToRef(this._basePoint, this._baseToVertex);
            var edgeSquaredLength = this._edge.lengthSquared();
            var edgeDotVelocity = Vector3.Dot(this._edge, this._velocity);
            var edgeDotBaseToVertex = Vector3.Dot(this._edge, this._baseToVertex);

            a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
            b = edgeSquaredLength * (2.0 * Vector3.Dot(this._velocity, this._baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
            c = edgeSquaredLength * (1.0 - this._baseToVertex.lengthSquared()) + edgeDotBaseToVertex * edgeDotBaseToVertex;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                var f = (edgeDotVelocity * lowestRoot.root - edgeDotBaseToVertex) / edgeSquaredLength;

                if (f >= 0.0 && f <= 1.0) {
                    t = lowestRoot.root;
                    found = true;
                    this._edge.scaleInPlace(f);
                    p1.addToRef(this._edge, this._collisionPoint);
                }
            }

            p3.subtractToRef(p2, this._edge);
            p2.subtractToRef(this._basePoint, this._baseToVertex);
            edgeSquaredLength = this._edge.lengthSquared();
            edgeDotVelocity = Vector3.Dot(this._edge, this._velocity);
            edgeDotBaseToVertex = Vector3.Dot(this._edge, this._baseToVertex);

            a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
            b = edgeSquaredLength * (2.0 * Vector3.Dot(this._velocity, this._baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
            c = edgeSquaredLength * (1.0 - this._baseToVertex.lengthSquared()) + edgeDotBaseToVertex * edgeDotBaseToVertex;
            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                f = (edgeDotVelocity * lowestRoot.root - edgeDotBaseToVertex) / edgeSquaredLength;

                if (f >= 0.0 && f <= 1.0) {
                    t = lowestRoot.root;
                    found = true;
                    this._edge.scaleInPlace(f);
                    p2.addToRef(this._edge, this._collisionPoint);
                }
            }

            p1.subtractToRef(p3, this._edge);
            p3.subtractToRef(this._basePoint, this._baseToVertex);
            edgeSquaredLength = this._edge.lengthSquared();
            edgeDotVelocity = Vector3.Dot(this._edge, this._velocity);
            edgeDotBaseToVertex = Vector3.Dot(this._edge, this._baseToVertex);

            a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
            b = edgeSquaredLength * (2.0 * Vector3.Dot(this._velocity, this._baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
            c = edgeSquaredLength * (1.0 - this._baseToVertex.lengthSquared()) + edgeDotBaseToVertex * edgeDotBaseToVertex;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                f = (edgeDotVelocity * lowestRoot.root - edgeDotBaseToVertex) / edgeSquaredLength;

                if (f >= 0.0 && f <= 1.0) {
                    t = lowestRoot.root;
                    found = true;
                    this._edge.scaleInPlace(f);
                    p3.addToRef(this._edge, this._collisionPoint);
                }
            }
        }

        if (found) {
            var distToCollision = t * this._velocity.length();

            if (!this.collisionFound || distToCollision < this._nearestDistance) {
                if (!this.intersectionPoint) {
                    this.intersectionPoint = this._collisionPoint.clone();
                } else {
                    this.intersectionPoint.copyFrom(this._collisionPoint);
                }
                this._nearestDistance = distToCollision;
                this.collisionFound = true;
                this.collidedMesh = hostMesh;
            }
        }
    }

    /** @hidden */
    public _collide(trianglePlaneArray: Array<Plane>, pts: Vector3[], indices: IndicesArray, indexStart: number, indexEnd: number, decal: number, hasMaterial: boolean, hostMesh: AbstractMesh): void {
        for (var i = indexStart; i < indexEnd; i += 3) {
            var p1 = pts[indices[i] - decal];
            var p2 = pts[indices[i + 1] - decal];
            var p3 = pts[indices[i + 2] - decal];

            this._testTriangle(i, trianglePlaneArray, p3, p2, p1, hasMaterial, hostMesh);
        }
    }

    /** @hidden */
    public _getResponse(pos: Vector3, vel: Vector3): void {
        pos.addToRef(vel, this._destinationPoint);
        vel.scaleInPlace((this._nearestDistance / vel.length()));

        this._basePoint.addToRef(vel, pos);
        pos.subtractToRef(this.intersectionPoint, this._slidePlaneNormal);
        this._slidePlaneNormal.normalize();
        this._slidePlaneNormal.scaleToRef(this._epsilon, this._displacementVector);

        pos.addInPlace(this._displacementVector);
        this.intersectionPoint.addInPlace(this._displacementVector);

        this._slidePlaneNormal.scaleInPlace(Plane.SignedDistanceToPlaneFromPositionAndNormal(this.intersectionPoint, this._slidePlaneNormal, this._destinationPoint));
        this._destinationPoint.subtractInPlace(this._slidePlaneNormal);

        this._destinationPoint.subtractToRef(this.intersectionPoint, vel);
    }
}
