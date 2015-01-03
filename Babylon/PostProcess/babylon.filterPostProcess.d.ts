declare module BABYLON {
    class FilterPostProcess extends PostProcess {
        public kernelMatrix: Matrix;
        constructor(name: string, kernelMatrix: Matrix, ratio: number, camera?: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
