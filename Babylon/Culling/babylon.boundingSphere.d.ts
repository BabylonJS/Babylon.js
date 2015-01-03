declare module BABYLON {
    class BoundingSphere {
        public minimum: Vector3;
        public maximum: Vector3;
        public center: Vector3;
        public radius: number;
        public centerWorld: Vector3;
        public radiusWorld: number;
        private _tempRadiusVector;
        constructor(minimum: Vector3, maximum: Vector3);
        public _update(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public intersectsPoint(point: Vector3): boolean;
        static Intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): boolean;
    }
}
