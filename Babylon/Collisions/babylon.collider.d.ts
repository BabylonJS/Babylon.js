declare module BABYLON {
    class Collider {
        public radius: Vector3;
        public retry: number;
        public velocity: Vector3;
        public basePoint: Vector3;
        public epsilon: number;
        public collisionFound: boolean;
        public velocityWorldLength: number;
        public basePointWorld: Vector3;
        public velocityWorld: Vector3;
        public normalizedVelocity: Vector3;
        public initialVelocity: Vector3;
        public initialPosition: Vector3;
        public nearestDistance: number;
        public intersectionPoint: Vector3;
        public collidedMesh: AbstractMesh;
        private _collisionPoint;
        private _planeIntersectionPoint;
        private _tempVector;
        private _tempVector2;
        private _tempVector3;
        private _tempVector4;
        private _edge;
        private _baseToVertex;
        private _destinationPoint;
        private _slidePlaneNormal;
        private _displacementVector;
        public _initialize(source: Vector3, dir: Vector3, e: number): void;
        public _checkPointInTriangle(point: Vector3, pa: Vector3, pb: Vector3, pc: Vector3, n: Vector3): boolean;
        public _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): boolean;
        public _testTriangle(faceIndex: number, subMesh: SubMesh, p1: Vector3, p2: Vector3, p3: Vector3): void;
        public _collide(subMesh: any, pts: Vector3[], indices: number[], indexStart: number, indexEnd: number, decal: number): void;
        public _getResponse(pos: Vector3, vel: Vector3): void;
    }
}
