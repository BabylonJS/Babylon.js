declare module BABYLON {
    class DisplayPassPostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
