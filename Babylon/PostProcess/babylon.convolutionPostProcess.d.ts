declare module BABYLON {
    class ConvolutionPostProcess extends PostProcess {
        public kernel: number[];
        constructor(name: string, kernel: number[], ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
        static EdgeDetect0Kernel: number[];
        static EdgeDetect1Kernel: number[];
        static EdgeDetect2Kernel: number[];
        static SharpenKernel: number[];
        static EmbossKernel: number[];
        static GaussianKernel: number[];
    }
}
