module BABYLON {
    export class FxaaPostProcess extends PostProcess {
        public texelWidth: number;
        public texelHeight: number;

        constructor(name: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "fxaa", ["texelSize"], null, options, camera, samplingMode, engine, reusable);

            this.onSizeChangedObservable.add(() => {
                this.texelWidth = 1.0 / this.width;
                this.texelHeight = 1.0 / this.height;
            });
            this.onApplyObservable.add((effect: Effect) => {
                effect.setFloat2("texelSize", this.texelWidth, this.texelHeight);
            });
        }
    }
}