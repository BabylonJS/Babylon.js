declare module BABYLON {
    class BoundingBox {
        public minimum: Vector3;
        public maximum: Vector3;
        public vectors: Vector3[];
        public center: Vector3;
        public extendSize: Vector3;
        public directions: Vector3[];
        public vectorsWorld: Vector3[];
        public minimumWorld: Vector3;
        public maximumWorld: Vector3;
        private _worldMatrix;
        constructor(minimum: Vector3, maximum: Vector3);
        public getWorldMatrix(): Matrix;
        public _update(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        public intersectsPoint(point: Vector3): boolean;
        public intersectsSphere(sphere: BoundingSphere): boolean;
        public intersectsMinMax(min: Vector3, max: Vector3): boolean;
        static Intersects(box0: BoundingBox, box1: BoundingBox): boolean;
        static IntersectsSphere(minPoint: Vector3, maxPoint: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean;
        static IsCompletelyInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
        static IsInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
    }
}
