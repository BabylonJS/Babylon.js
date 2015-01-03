declare module BABYLON {
    class FxaaPostProcess extends PostProcess {
        public texelWidth: number;
        public texelHeight: number;
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
