module BABYLON {
    export class ConvolutionPostProcess extends PostProcess{
        constructor(name: string, public kernel: number[], ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "convolution", ["kernel", "screenSize"], null, ratio, camera, samplingMode, engine, reusable);

            this.onApply = (effect: Effect) => {
                effect.setFloat2("screenSize", this.width, this.height);
                effect.setArray("kernel", this.kernel);
            };
        }

    // Statics
    // Based on http://en.wikipedia.org/wiki/Kernel_(image_processing)
    public static EdgeDetect0Kernel = [1, 0, -1, 0, 0, 0, -1, 0, 1];
    public static EdgeDetect1Kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
    public static EdgeDetect2Kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
    public static SharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    public static EmbossKernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
    public static GaussianKernel = [0, 1, 0, 1, 1, 1, 0, 1, 0];
    }
}
