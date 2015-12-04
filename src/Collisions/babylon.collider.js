var BABYLON;
(function (BABYLON) {
    var intersectBoxAASphere = function (boxMin, boxMax, sphereCenter, sphereRadius) {
        if (boxMin.x > sphereCenter.x + sphereRadius)
            return false;
        if (sphereCenter.x - sphereRadius > boxMax.x)
            return false;
        if (boxMin.y > sphereCenter.y + sphereRadius)
            return false;
        if (sphereCenter.y - sphereRadius > boxMax.y)
            return false;
        if (boxMin.z > sphereCenter.z + sphereRadius)
            return false;
        if (sphereCenter.z - sphereRadius > boxMax.z)
            return false;
        return true;
    };
    var getLowestRoot = function (a, b, c, maxR) {
        var determinant = b * b - 4.0 * a * c;
        var result = { root: 0, found: false };
        if (determinant < 0)
            return result;
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
    var Collider = (function () {
        function Collider() {
            this.radius = new BABYLON.Vector3(1, 1, 1);
            this.retry = 0;
            this.basePointWorld = BABYLON.Vector3.Zero();
            this.velocityWorld = BABYLON.Vector3.Zero();
            this.normalizedVelocity = BABYLON.Vector3.Zero();
            this._collisionPoint = BABYLON.Vector3.Zero();
            this._planeIntersectionPoint = BABYLON.Vector3.Zero();
            this._tempVector = BABYLON.Vector3.Zero();
            this._tempVector2 = BABYLON.Vector3.Zero();
            this._tempVector3 = BABYLON.Vector3.Zero();
            this._tempVector4 = BABYLON.Vector3.Zero();
            this._edge = BABYLON.Vector3.Zero();
            this._baseToVertex = BABYLON.Vector3.Zero();
            this._destinationPoint = BABYLON.Vector3.Zero();
            this._slidePlaneNormal = BABYLON.Vector3.Zero();
            this._displacementVector = BABYLON.Vector3.Zero();
        }
        // Methods
        Collider.prototype._initialize = function (source, dir, e) {
            this.velocity = dir;
            BABYLON.Vector3.NormalizeToRef(dir, this.normalizedVelocity);
            this.basePoint = source;
            source.multiplyToRef(this.radius, this.basePointWorld);
            dir.multiplyToRef(this.radius, this.velocityWorld);
            this.velocityWorldLength = this.velocityWorld.length();
            this.epsilon = e;
            this.collisionFound = false;
        };
        Collider.prototype._checkPointInTriangle = function (point, pa, pb, pc, n) {
            pa.subtractToRef(point, this._tempVector);
            pb.subtractToRef(point, this._tempVector2);
            BABYLON.Vector3.CrossToRef(this._tempVector, this._tempVector2, this._tempVector4);
            var d = BABYLON.Vector3.Dot(this._tempVector4, n);
            if (d < 0)
                return false;
            pc.subtractToRef(point, this._tempVector3);
            BABYLON.Vector3.CrossToRef(this._tempVector2, this._tempVector3, this._tempVector4);
            d = BABYLON.Vector3.Dot(this._tempVector4, n);
            if (d < 0)
                return false;
            BABYLON.Vector3.CrossToRef(this._tempVector3, this._tempVector, this._tempVector4);
            d = BABYLON.Vector3.Dot(this._tempVector4, n);
            return d >= 0;
        };
        Collider.prototype._canDoCollision = function (sphereCenter, sphereRadius, vecMin, vecMax) {
            var distance = BABYLON.Vector3.Distance(this.basePointWorld, sphereCenter);
            var max = Math.max(this.radius.x, this.radius.y, this.radius.z);
            if (distance > this.velocityWorldLength + max + sphereRadius) {
                return false;
            }
            if (!intersectBoxAASphere(vecMin, vecMax, this.basePointWorld, this.velocityWorldLength + max))
                return false;
            return true;
        };
        Collider.prototype._testTriangle = function (faceIndex, trianglePlaneArray, p1, p2, p3, hasMaterial) {
            var t0;
            var embeddedInPlane = false;
            //defensive programming, actually not needed.
            if (!trianglePlaneArray) {
                trianglePlaneArray = [];
            }
            if (!trianglePlaneArray[faceIndex]) {
                trianglePlaneArray[faceIndex] = new BABYLON.Plane(0, 0, 0, 0);
                trianglePlaneArray[faceIndex].copyFromPoints(p1, p2, p3);
            }
            var trianglePlane = trianglePlaneArray[faceIndex];
            if ((!hasMaterial) && !trianglePlane.isFrontFacingTo(this.normalizedVelocity, 0))
                return;
            var signedDistToTrianglePlane = trianglePlane.signedDistanceTo(this.basePoint);
            var normalDotVelocity = BABYLON.Vector3.Dot(trianglePlane.normal, this.velocity);
            if (normalDotVelocity == 0) {
                if (Math.abs(signedDistToTrianglePlane) >= 1.0)
                    return;
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
                if (t0 > 1.0 || t1 < 0.0)
                    return;
                if (t0 < 0)
                    t0 = 0;
                if (t0 > 1.0)
                    t0 = 1.0;
            }
            this._collisionPoint.copyFromFloats(0, 0, 0);
            var found = false;
            var t = 1.0;
            if (!embeddedInPlane) {
                this.basePoint.subtractToRef(trianglePlane.normal, this._planeIntersectionPoint);
                this.velocity.scaleToRef(t0, this._tempVector);
                this._planeIntersectionPoint.addInPlace(this._tempVector);
                if (this._checkPointInTriangle(this._planeIntersectionPoint, p1, p2, p3, trianglePlane.normal)) {
                    found = true;
                    t = t0;
                    this._collisionPoint.copyFrom(this._planeIntersectionPoint);
                }
            }
            if (!found) {
                var velocitySquaredLength = this.velocity.lengthSquared();
                var a = velocitySquaredLength;
                this.basePoint.subtractToRef(p1, this._tempVector);
                var b = 2.0 * (BABYLON.Vector3.Dot(this.velocity, this._tempVector));
                var c = this._tempVector.lengthSquared() - 1.0;
                var lowestRoot = getLowestRoot(a, b, c, t);
                if (lowestRoot.found) {
                    t = lowestRoot.root;
                    found = true;
                    this._collisionPoint.copyFrom(p1);
                }
                this.basePoint.subtractToRef(p2, this._tempVector);
                b = 2.0 * (BABYLON.Vector3.Dot(this.velocity, this._tempVector));
                c = this._tempVector.lengthSquared() - 1.0;
                lowestRoot = getLowestRoot(a, b, c, t);
                if (lowestRoot.found) {
                    t = lowestRoot.root;
                    found = true;
                    this._collisionPoint.copyFrom(p2);
                }
                this.basePoint.subtractToRef(p3, this._tempVector);
                b = 2.0 * (BABYLON.Vector3.Dot(this.velocity, this._tempVector));
                c = this._tempVector.lengthSquared() - 1.0;
                lowestRoot = getLowestRoot(a, b, c, t);
                if (lowestRoot.found) {
                    t = lowestRoot.root;
                    found = true;
                    this._collisionPoint.copyFrom(p3);
                }
                p2.subtractToRef(p1, this._edge);
                p1.subtractToRef(this.basePoint, this._baseToVertex);
                var edgeSquaredLength = this._edge.lengthSquared();
                var edgeDotVelocity = BABYLON.Vector3.Dot(this._edge, this.velocity);
                var edgeDotBaseToVertex = BABYLON.Vector3.Dot(this._edge, this._baseToVertex);
                a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
                b = edgeSquaredLength * (2.0 * BABYLON.Vector3.Dot(this.velocity, this._baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
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
                p2.subtractToRef(this.basePoint, this._baseToVertex);
                edgeSquaredLength = this._edge.lengthSquared();
                edgeDotVelocity = BABYLON.Vector3.Dot(this._edge, this.velocity);
                edgeDotBaseToVertex = BABYLON.Vector3.Dot(this._edge, this._baseToVertex);
                a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
                b = edgeSquaredLength * (2.0 * BABYLON.Vector3.Dot(this.velocity, this._baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
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
                p3.subtractToRef(this.basePoint, this._baseToVertex);
                edgeSquaredLength = this._edge.lengthSquared();
                edgeDotVelocity = BABYLON.Vector3.Dot(this._edge, this.velocity);
                edgeDotBaseToVertex = BABYLON.Vector3.Dot(this._edge, this._baseToVertex);
                a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
                b = edgeSquaredLength * (2.0 * BABYLON.Vector3.Dot(this.velocity, this._baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
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
                var distToCollision = t * this.velocity.length();
                if (!this.collisionFound || distToCollision < this.nearestDistance) {
                    if (!this.intersectionPoint) {
                        this.intersectionPoint = this._collisionPoint.clone();
                    }
                    else {
                        this.intersectionPoint.copyFrom(this._collisionPoint);
                    }
                    this.nearestDistance = distToCollision;
                    this.collisionFound = true;
                }
            }
        };
        Collider.prototype._collide = function (trianglePlaneArray, pts, indices, indexStart, indexEnd, decal, hasMaterial) {
            for (var i = indexStart; i < indexEnd; i += 3) {
                var p1 = pts[indices[i] - decal];
                var p2 = pts[indices[i + 1] - decal];
                var p3 = pts[indices[i + 2] - decal];
                this._testTriangle(i, trianglePlaneArray, p3, p2, p1, hasMaterial);
            }
        };
        Collider.prototype._getResponse = function (pos, vel) {
            pos.addToRef(vel, this._destinationPoint);
            vel.scaleInPlace((this.nearestDistance / vel.length()));
            this.basePoint.addToRef(vel, pos);
            pos.subtractToRef(this.intersectionPoint, this._slidePlaneNormal);
            this._slidePlaneNormal.normalize();
            this._slidePlaneNormal.scaleToRef(this.epsilon, this._displacementVector);
            pos.addInPlace(this._displacementVector);
            this.intersectionPoint.addInPlace(this._displacementVector);
            this._slidePlaneNormal.scaleInPlace(BABYLON.Plane.SignedDistanceToPlaneFromPositionAndNormal(this.intersectionPoint, this._slidePlaneNormal, this._destinationPoint));
            this._destinationPoint.subtractInPlace(this._slidePlaneNormal);
            this._destinationPoint.subtractToRef(this.intersectionPoint, vel);
        };
        return Collider;
    })();
    BABYLON.Collider = Collider;
})(BABYLON || (BABYLON = {}));
