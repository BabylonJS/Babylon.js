module BABYLON {
    export class FilterPostProcess extends PostProcess {
        constructor(name: string, public kernelMatrix: Matrix, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "filter", ["kernelMatrix"], null, options, camera, samplingMode, engine, reusable);

            this.onApply = (effect: Effect) => {
                effect.setMatrix("kernelMatrix", this.kernelMatrix);
            }
        }
    }
}