declare module BABYLON {
    class AnaglyphPostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
