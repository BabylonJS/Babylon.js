declare module BABYLON {
    class BoundingInfo {
        public minimum: Vector3;
        public maximum: Vector3;
        public boundingBox: BoundingBox;
        public boundingSphere: BoundingSphere;
        constructor(minimum: Vector3, maximum: Vector3);
        public _update(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        public _checkCollision(collider: Collider): boolean;
        public intersectsPoint(point: Vector3): boolean;
        public intersects(boundingInfo: BoundingInfo, precise: boolean): boolean;
    }
}
