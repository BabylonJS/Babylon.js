declare module BABYLON {
    class IntersectionInfo {
        public bu: number;
        public bv: number;
        public distance: number;
        public faceId: number;
        constructor(bu: number, bv: number, distance: number);
    }
    class PickingInfo {
        public hit: boolean;
        public distance: number;
        public pickedPoint: Vector3;
        public pickedMesh: AbstractMesh;
        public bu: number;
        public bv: number;
        public faceId: number;
        public getNormal(): Vector3;
        public getTextureCoordinates(): Vector2;
    }
}
