var BABYLON = BABYLON || {};

(function () {
    BABYLON.Collider = function () {
        this.radius = new BABYLON.Vector3(1, 1, 1);
        this.retry = 0;
    };

    // Methods
    BABYLON.Collider.prototype._initialize = function (source, dir, e) {
        this.velocity = dir;
        this.normalizedVelocity = BABYLON.Vector3.Normalize(dir);
        this.basePoint = source;

        this.basePointWorld = source.multiply(this.radius);
        this.velocityWorld = dir.multiply(this.radius);

        this.velocityWorldLength = this.velocityWorld.length();

        this.epsilon = e;
        this.collisionFound = false;
    };

    var checkPointInTriangle = function (point, pa, pb, pc, n) {
        var e0 = pa.subtract(point);
        var e1 = pb.subtract(point);

        var d = BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(e0, e1), n);
        if (d < 0)
            return false;

        var e2 = pc.subtract(point);
        d = BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(e1, e2), n);
        if (d < 0)
            return false;

        d = BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(e2, e0), n);
        return d >= 0;
    };

    var intersectBoxAASphere = function (boxMin, boxMax, sphereCenter, sphereRadius) {
        var boxMinSphere = new BABYLON.Vector3(sphereCenter.X - sphereRadius, sphereCenter.Y - sphereRadius, sphereCenter.Z - sphereRadius);
        var boxMaxSphere = new BABYLON.Vector3(sphereCenter.X + sphereRadius, sphereCenter.Y + sphereRadius, sphereCenter.Z + sphereRadius);

        if (boxMin.X > boxMaxSphere.X)
            return false;

        if (boxMinSphere.X > boxMax.X)
            return false;

        if (boxMin.Y > boxMaxSphere.Y)
            return false;

        if (boxMinSphere.Y > boxMax.Y)
            return false;

        if (boxMin.Z > boxMaxSphere.Z)
            return false;

        if (boxMinSphere.Z > boxMax.Z)
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

    BABYLON.Collider.prototype._canDoCollision = function (sphereCenter, sphereRadius, vecMin, vecMax) {
        var vecTest = this.basePointWorld.subtract(sphereCenter);
        var distance = vecTest.length();

        var max = Math.max(this.radius.x, this.radius.y);
        max = Math.max(max, this.radius.z);

        if (distance > this.velocityWorldLength + max + sphereRadius) {
            return false;
        }

        if (!intersectBoxAASphere(vecMin, vecMax, this.basePointWorld, this.velocityWorldLength + max))
            return false;

        return true;
    };

    BABYLON.Collider.prototype._testTriangle = function (subMesh, p1, p2, p3) {
        var t0;
        var embeddedInPlane = false;

        var trianglePlane = BABYLON.CollisionPlane.CreateFromPoints(p1, p2, p3);

        if ((!subMesh.getMaterial()) && !trianglePlane.isFrontFacingTo(this.normalizedVelocity, 0))
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

        var collisionPoint = BABYLON.Vector3.Zero();

        var found = false;
        var t = 1.0;

        if (!embeddedInPlane) {
            var planeIntersectionPoint = (this.basePoint.subtract(trianglePlane.normal)).add(this.velocity.scale(t0));

            if (checkPointInTriangle(planeIntersectionPoint, p1, p2, p3, trianglePlane.normal)) {
                found = true;
                t = t0;
                collisionPoint = planeIntersectionPoint;
            }
        }

        if (!found) {
            var velocitySquaredLength = this.velocity.lengthSquared();

            var a = velocitySquaredLength;

            var b = 2.0 * (BABYLON.Vector3.Dot(this.velocity, this.basePoint.subtract(p1)));
            var c = p1.subtract(this.basePoint).lengthSquared() - 1.0;

            var lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                t = lowestRoot.root;
                found = true;
                collisionPoint = p1;
            }

            b = 2.0 * (BABYLON.Vector3.Dot(this.velocity, this.basePoint.subtract(p2)));
            c = p2.subtract(this.basePoint).lengthSquared() - 1.0;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                t = lowestRoot.root;
                found = true;
                collisionPoint = p2;
            }

            b = 2.0 * (BABYLON.Vector3.Dot(this.velocity, this.basePoint.subtract(p3)));
            c = p3.subtract(this.basePoint).lengthSquared() - 1.0;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                t = lowestRoot.root;
                found = true;
                collisionPoint = p3;
            }

            var edge = p2.subtract(p1);
            var baseToVertex = p1.subtract(this.basePoint);
            var edgeSquaredLength = edge.lengthSquared();
            var edgeDotVelocity = BABYLON.Vector3.Dot(edge, this.velocity);
            var edgeDotBaseToVertex = BABYLON.Vector3.Dot(edge, baseToVertex);

            a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
            b = edgeSquaredLength * (2.0 * BABYLON.Vector3.Dot(this.velocity, baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
            c = edgeSquaredLength * (1.0 - baseToVertex.lengthSquared()) + edgeDotBaseToVertex * edgeDotBaseToVertex;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                var f = (edgeDotVelocity * lowestRoot.root - edgeDotBaseToVertex) / edgeSquaredLength;

                if (f >= 0.0 && f <= 1.0) {
                    t = lowestRoot.root;
                    found = true;
                    collisionPoint = p1.add(edge.scale(f));
                }
            }

            edge = p3.subtract(p2);
            baseToVertex = p2.subtract(this.basePoint);
            edgeSquaredLength = edge.lengthSquared();
            edgeDotVelocity = BABYLON.Vector3.Dot(edge, this.velocity);
            edgeDotBaseToVertex = BABYLON.Vector3.Dot(edge, baseToVertex);

            a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
            b = edgeSquaredLength * (2.0 * BABYLON.Vector3.Dot(this.velocity, baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
            c = edgeSquaredLength * (1.0 - baseToVertex.lengthSquared()) + edgeDotBaseToVertex * edgeDotBaseToVertex;
            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                var f = (edgeDotVelocity * lowestRoot.root - edgeDotBaseToVertex) / edgeSquaredLength;

                if (f >= 0.0 && f <= 1.0) {
                    t = lowestRoot.root;
                    found = true;
                    collisionPoint = p2.add(edge.scale(f));
                }
            }

            edge = p1.subtract(p3);
            baseToVertex = p3.subtract(this.basePoint);
            edgeSquaredLength = edge.lengthSquared();
            edgeDotVelocity = BABYLON.Vector3.Dot(edge, this.velocity);
            edgeDotBaseToVertex = BABYLON.Vector3.Dot(edge, baseToVertex);

            a = edgeSquaredLength * (-velocitySquaredLength) + edgeDotVelocity * edgeDotVelocity;
            b = edgeSquaredLength * (2.0 * BABYLON.Vector3.Dot(this.velocity, baseToVertex)) - 2.0 * edgeDotVelocity * edgeDotBaseToVertex;
            c = edgeSquaredLength * (1.0 - baseToVertex.lengthSquared()) + edgeDotBaseToVertex * edgeDotBaseToVertex;

            lowestRoot = getLowestRoot(a, b, c, t);
            if (lowestRoot.found) {
                var f = (edgeDotVelocity * lowestRoot.root - edgeDotBaseToVertex) / edgeSquaredLength;

                if (f >= 0.0 && f <= 1.0) {
                    t = lowestRoot.root;
                    found = true;
                    collisionPoint = p3.add(edge.scale(f));
                }
            }
        }

        if (found) {
            var distToCollision = t * this.velocity.length();

            if (!this.collisionFound || distToCollision < this.nearestDistance) {
                this.nearestDistance = distToCollision;
                this.intersectionPoint = collisionPoint;
                this.collisionFound = true;
            }
        }
    };

    BABYLON.Collider.prototype._collide = function (subMesh, pts, indices, indexStart, indexEnd, decal) {
        for (var i = indexStart; i < indexEnd; i += 3) {
            var p1 = pts[indices[i] - decal];
            var p2 = pts[indices[i + 1] - decal];
            var p3 = pts[indices[i + 2] - decal];

            this._testTriangle(subMesh, p3, p2, p1);
        }
    };

    BABYLON.Collider.prototype._getResponse = function(pos, vel) {
        var destinationPoint = pos.add(vel);
        var V = vel.scale((this.nearestDistance / vel.length()));

        var newPos = this.basePoint.add(V);
        var slidePlaneNormal = newPos.subtract(this.intersectionPoint);
        slidePlaneNormal.normalize();
        var displacementVector = slidePlaneNormal.scale(this.epsilon);

        newPos = newPos.add(displacementVector);
        this.intersectionPoint = this.intersectionPoint.add(displacementVector);

        var slidePlaneOrigin = this.intersectionPoint;
        var slidingPlane = new BABYLON.CollisionPlane(slidePlaneOrigin, slidePlaneNormal);
        var newDestinationPoint = destinationPoint.subtract(slidePlaneNormal.scale(slidingPlane.signedDistanceTo(destinationPoint)));

        var newVel = newDestinationPoint.subtract(this.intersectionPoint);

        return { position: newPos, velocity: newVel };
    };

})();