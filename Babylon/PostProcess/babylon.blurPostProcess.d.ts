declare module BABYLON {
    class BlurPostProcess extends PostProcess {
        public direction: Vector2;
        public blurWidth: number;
        constructor(name: string, direction: Vector2, blurWidth: number, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
