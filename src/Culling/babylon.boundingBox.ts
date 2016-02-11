module BABYLON {
    export class BoundingBox {
        public vectors: Vector3[] = new Array<Vector3>();
        public center: Vector3;
        public extendSize: Vector3;
        public directions: Vector3[];
        public vectorsWorld: Vector3[] = new Array<Vector3>();
        public minimumWorld: Vector3;
        public maximumWorld: Vector3;

        private _worldMatrix: Matrix;

        constructor(public minimum: Vector3, public maximum: Vector3) {
            // Bounding vectors
            this.vectors.push(this.minimum.clone());
            this.vectors.push(this.maximum.clone());

            this.vectors.push(this.minimum.clone());
            this.vectors[2].x = this.maximum.x;

            this.vectors.push(this.minimum.clone());
            this.vectors[3].y = this.maximum.y;

            this.vectors.push(this.minimum.clone());
            this.vectors[4].z = this.maximum.z;

            this.vectors.push(this.maximum.clone());
            this.vectors[5].z = this.minimum.z;

            this.vectors.push(this.maximum.clone());
            this.vectors[6].x = this.minimum.x;

            this.vectors.push(this.maximum.clone());
            this.vectors[7].y = this.minimum.y;

            // OBB
            this.center = this.maximum.add(this.minimum).scale(0.5);
            this.extendSize = this.maximum.subtract(this.minimum).scale(0.5);
            this.directions = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];

            // World
            for (var index = 0; index < this.vectors.length; index++) {
                this.vectorsWorld[index] = Vector3.Zero();
            }
            this.minimumWorld = Vector3.Zero();
            this.maximumWorld = Vector3.Zero();

            this._update(Matrix.Identity());
        }

        // Methods
        public getWorldMatrix(): Matrix {
            return this._worldMatrix;
        }

        public _update(world: Matrix): void {
            Vector3.FromFloatsToRef(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, this.minimumWorld);
            Vector3.FromFloatsToRef(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, this.maximumWorld);

            for (var index = 0; index < this.vectors.length; index++) {
                var v = this.vectorsWorld[index];
                Vector3.TransformCoordinatesToRef(this.vectors[index], world, v);

                if (v.x < this.minimumWorld.x)
                    this.minimumWorld.x = v.x;
                if (v.y < this.minimumWorld.y)
                    this.minimumWorld.y = v.y;
                if (v.z < this.minimumWorld.z)
                    this.minimumWorld.z = v.z;

                if (v.x > this.maximumWorld.x)
                    this.maximumWorld.x = v.x;
                if (v.y > this.maximumWorld.y)
                    this.maximumWorld.y = v.y;
                if (v.z > this.maximumWorld.z)
                    this.maximumWorld.z = v.z;
            }

            // OBB
            this.maximumWorld.addToRef(this.minimumWorld, this.center);
            this.center.scaleInPlace(0.5);

            Vector3.FromFloatArrayToRef(world.m, 0, this.directions[0]);
            Vector3.FromFloatArrayToRef(world.m, 4, this.directions[1]);
            Vector3.FromFloatArrayToRef(world.m, 8, this.directions[2]);

            this._worldMatrix = world;
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return BoundingBox.IsInFrustum(this.vectorsWorld, frustumPlanes);
        }

        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            return BoundingBox.IsCompletelyInFrustum(this.vectorsWorld, frustumPlanes);
        }

        public intersectsPoint(point: Vector3): boolean {
            var delta = -Engine.Epsilon;

            if (this.maximumWorld.x - point.x < delta || delta > point.x - this.minimumWorld.x)
                return false;

            if (this.maximumWorld.y - point.y < delta || delta > point.y - this.minimumWorld.y)
                return false;

            if (this.maximumWorld.z - point.z < delta || delta > point.z - this.minimumWorld.z)
                return false;

            return true;
        }

        public intersectsSphere(sphere: BoundingSphere): boolean {
            return BoundingBox.IntersectsSphere(this.minimumWorld, this.maximumWorld, sphere.centerWorld, sphere.radiusWorld);
        }

        public intersectsMinMax(min: Vector3, max: Vector3): boolean {
            if (this.maximumWorld.x < min.x || this.minimumWorld.x > max.x)
                return false;

            if (this.maximumWorld.y < min.y || this.minimumWorld.y > max.y)
                return false;

            if (this.maximumWorld.z < min.z || this.minimumWorld.z > max.z)
                return false;

            return true;
        }

        // Statics
        public static Intersects(box0: BoundingBox, box1: BoundingBox): boolean {
            if (box0.maximumWorld.x < box1.minimumWorld.x || box0.minimumWorld.x > box1.maximumWorld.x)
                return false;

            if (box0.maximumWorld.y < box1.minimumWorld.y || box0.minimumWorld.y > box1.maximumWorld.y)
                return false;

            if (box0.maximumWorld.z < box1.minimumWorld.z || box0.minimumWorld.z > box1.maximumWorld.z)
                return false;

            return true;
        }

        public static IntersectsSphere(minPoint: Vector3, maxPoint: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean {
            var vector = Vector3.Clamp(sphereCenter, minPoint, maxPoint);
            var num = Vector3.DistanceSquared(sphereCenter, vector);
            return (num <= (sphereRadius * sphereRadius));
        }

        public static IsCompletelyInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean {
            for (var p = 0; p < 6; p++) {
                for (var i = 0; i < 8; i++) {
                    if (frustumPlanes[p].dotCoordinate(boundingVectors[i]) < 0) {
                        return false;
                    }
                }
            }
            return true;
        }

        public static IsInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean {
            for (var p = 0; p < 6; p++) {
                var inCount = 8;

                for (var i = 0; i < 8; i++) {
                    if (frustumPlanes[p].dotCoordinate(boundingVectors[i]) < 0) {
                        --inCount;
                    } else {
                        break;
                    }
                }
                if (inCount === 0)
                    return false;
            }
            return true;
        }
    }
}
