module BABYLON {
    export class Ray {
        private _edge1: Vector3;
        private _edge2: Vector3;
        private _pvec: Vector3;
        private _tvec: Vector3;
        private _qvec: Vector3;

        constructor(public origin: Vector3, public direction: Vector3, public length: number = Number.MAX_VALUE) {
        }

        // Methods
        public intersectsBoxMinMax(minimum: Vector3, maximum: Vector3): boolean {
            var d = 0.0;
            var maxValue = Number.MAX_VALUE;
            var inv: number;
            var min: number;
            var max: number;
            var temp: number;
            if (Math.abs(this.direction.x) < 0.0000001) {
                if (this.origin.x < minimum.x || this.origin.x > maximum.x) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.x;
                min = (minimum.x - this.origin.x) * inv;
                max = (maximum.x - this.origin.x) * inv;
                if (max === -Infinity) {
                    max = Infinity;
                }

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }

            if (Math.abs(this.direction.y) < 0.0000001) {
                if (this.origin.y < minimum.y || this.origin.y > maximum.y) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.y;
                min = (minimum.y - this.origin.y) * inv;
                max = (maximum.y - this.origin.y) * inv;

                if (max === -Infinity) {
                    max = Infinity;
                }

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }

            if (Math.abs(this.direction.z) < 0.0000001) {
                if (this.origin.z < minimum.z || this.origin.z > maximum.z) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.z;
                min = (minimum.z - this.origin.z) * inv;
                max = (maximum.z - this.origin.z) * inv;

                if (max === -Infinity) {
                    max = Infinity;
                }

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }
            return true;
        }

        public intersectsBox(box: BoundingBox): boolean {
            return this.intersectsBoxMinMax(box.minimum, box.maximum);
        }

        public intersectsSphere(sphere): boolean {
            var x = sphere.center.x - this.origin.x;
            var y = sphere.center.y - this.origin.y;
            var z = sphere.center.z - this.origin.z;
            var pyth = (x * x) + (y * y) + (z * z);
            var rr = sphere.radius * sphere.radius;

            if (pyth <= rr) {
                return true;
            }

            var dot = (x * this.direction.x) + (y * this.direction.y) + (z * this.direction.z);
            if (dot < 0.0) {
                return false;
            }

            var temp = pyth - (dot * dot);

            return temp <= rr;
        }

        public intersectsTriangle(vertex0: Vector3, vertex1: Vector3, vertex2: Vector3): IntersectionInfo {
            if (!this._edge1) {
                this._edge1 = Vector3.Zero();
                this._edge2 = Vector3.Zero();
                this._pvec = Vector3.Zero();
                this._tvec = Vector3.Zero();
                this._qvec = Vector3.Zero();
            }

            vertex1.subtractToRef(vertex0, this._edge1);
            vertex2.subtractToRef(vertex0, this._edge2);
            Vector3.CrossToRef(this.direction, this._edge2, this._pvec);
            var det = Vector3.Dot(this._edge1, this._pvec);

            if (det === 0) {
                return null;
            }

            var invdet = 1 / det;

            this.origin.subtractToRef(vertex0, this._tvec);

            var bu = Vector3.Dot(this._tvec, this._pvec) * invdet;

            if (bu < 0 || bu > 1.0) {
                return null;
            }

            Vector3.CrossToRef(this._tvec, this._edge1, this._qvec);

            var bv = Vector3.Dot(this.direction, this._qvec) * invdet;

            if (bv < 0 || bu + bv > 1.0) {
                return null;
            }

            //check if the distance is longer than the predefined length.
            var distance = Vector3.Dot(this._edge2, this._qvec) * invdet;
            if (distance > this.length) {
                return null;
            }

            return new IntersectionInfo(bu, bv, distance);
        }

        public intersectsPlane(plane: Plane): IntersectionInfo {
            var distance: number;
            var result1 = Vector3.Dot(plane.normal, this.direction);
            if (Math.abs(result1) < 9.99999997475243E-07) {
                return null;
            }
            else {
                var result2 = Vector3.Dot(plane.normal, this.origin);
                distance = (-plane.d - result2) / result1;
                if (distance < 0.0) {
                    if (distance < -9.99999997475243E-07) {
                        return null;
                    } else {
                        distance = 0;
                    }
                }

                return new IntersectionInfo(undefined, undefined, distance);
            }
        }

        private static smallnum = 0.00000001;
        private static rayl = 10e8;

        /**
         * Intersection test between the ray and a given segment whithin a given tolerance (threshold)
         * @param sega the first point of the segment to test the intersection against
         * @param segb the second point of the segment to test the intersection against
         * @param threshold the tolerance margin, if the ray doesn't intersect the segment but is close to the given threshold, the intersection is successful
         * @return the distance from the ray origin to the intersection point if there's intersection, or -1 if there's no intersection
         */
        intersectionSegment(sega: Vector3, segb: Vector3, threshold: number) : number
        {
            var rsegb = this.origin.add(this.direction.multiplyByFloats(Ray.rayl, Ray.rayl, Ray.rayl));

            var u = segb.subtract(sega);
            var v = rsegb.subtract(this.origin);
            var w = sega.subtract(this.origin);
            var a = Vector3.Dot(u, u);                  // always >= 0
            var b = Vector3.Dot(u, v);
            var c = Vector3.Dot(v, v);                  // always >= 0
            var d = Vector3.Dot(u, w);
            var e = Vector3.Dot(v, w);
            var D = a * c - b * b;                      // always >= 0
            var sc: number, sN: number, sD = D;         // sc = sN / sD, default sD = D >= 0
            var tc: number, tN: number, tD = D;         // tc = tN / tD, default tD = D >= 0

            // compute the line parameters of the two closest points
            if (D < Ray.smallnum) {                     // the lines are almost parallel
                sN = 0.0;                               // force using point P0 on segment S1
                sD = 1.0;                               // to prevent possible division by 0.0 later
                tN = e;
                tD = c;
            }
            else {                                      // get the closest points on the infinite lines
                sN = (b * e - c * d);
                tN = (a * e - b * d);
                if (sN < 0.0) {                         // sc < 0 => the s=0 edge is visible
                    sN = 0.0;
                    tN = e;
                    tD = c;
                } else if (sN > sD) {                   // sc > 1 => the s=1 edge is visible
                    sN = sD;
                    tN = e + b;
                    tD = c;
                }
            }

            if (tN < 0.0) {                             // tc < 0 => the t=0 edge is visible
                tN = 0.0;
                // recompute sc for this edge
                if (-d < 0.0) {
                    sN = 0.0;
                } else if (-d > a)
                    sN = sD;
                else {
                    sN = -d;
                    sD = a;
                }
            } else if (tN > tD) {                       // tc > 1 => the t=1 edge is visible
                tN = tD;
                // recompute sc for this edge
                if ((-d + b) < 0.0) {
                    sN = 0;
                } else if ((-d + b) > a) {
                    sN = sD;
                } else {
                    sN = (-d + b);
                    sD = a;
                }
            }
            // finally do the division to get sc and tc
            sc = (Math.abs(sN) < Ray.smallnum ? 0.0 : sN / sD);
            tc = (Math.abs(tN) < Ray.smallnum ? 0.0 : tN / tD);

            // get the difference of the two closest points
            var dP = w.add(u.multiplyByFloats(sc, sc, sc)).subtract(v.multiplyByFloats(tc, tc, tc));  // = S1(sc) - S2(tc)

            var isIntersected = (tc > 0) && (tc <= this.length) && (dP.lengthSquared() < (threshold * threshold));   // return intersection result

            if (isIntersected) {
                return tc;
            }
            return -1;
        }
        
        // Statics
        public static CreateNew(x: number, y: number, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Ray {
            var start = Vector3.Unproject(new Vector3(x, y, 0), viewportWidth, viewportHeight, world, view, projection);
            var end = Vector3.Unproject(new Vector3(x, y, 1), viewportWidth, viewportHeight, world, view, projection);

            var direction = end.subtract(start);
            direction.normalize();

            return new Ray(start, direction);
        }

        /**
        * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
        * transformed to the given world matrix.
        * @param origin The origin point
        * @param end The end point
        * @param world a matrix to transform the ray to. Default is the identity matrix.
        */
        public static CreateNewFromTo(origin: Vector3, end: Vector3, world: Matrix = Matrix.Identity()): Ray {
            var direction = end.subtract(origin);
            var length = Math.sqrt((direction.x * direction.x) + (direction.y * direction.y) + (direction.z * direction.z));
            direction.normalize();

            return Ray.Transform(new Ray(origin, direction, length), world);
        }

        public static Transform(ray: Ray, matrix: Matrix): Ray {
            var newOrigin = Vector3.TransformCoordinates(ray.origin, matrix);
            var newDirection = Vector3.TransformNormal(ray.direction, matrix);

            return new Ray(newOrigin, newDirection, ray.length);
        }
    }
}