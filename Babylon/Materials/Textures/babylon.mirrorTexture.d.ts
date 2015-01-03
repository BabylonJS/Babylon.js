declare module BABYLON {
    class MirrorTexture extends RenderTargetTexture {
        public mirrorPlane: Plane;
        private _transformMatrix;
        private _mirrorMatrix;
        private _savedViewMatrix;
        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean);
        public clone(): MirrorTexture;
    }
}
