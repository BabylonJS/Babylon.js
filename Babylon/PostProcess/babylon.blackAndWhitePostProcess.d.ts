declare module BABYLON {
    class BlackAndWhitePostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
