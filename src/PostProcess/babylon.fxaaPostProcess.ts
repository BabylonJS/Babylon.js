module BABYLON {
    export class FxaaPostProcess extends PostProcess {
        public texelWidth: number;
        public texelHeight: number;

        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "fxaa", ["texelSize"], null, ratio, camera, samplingMode, engine, reusable);

            this.onSizeChanged = () => {
                this.texelWidth = 1.0 / this.width;
                this.texelHeight = 1.0 / this.height;
            };
            this.onApply = (effect: Effect) => {
                effect.setFloat2("texelSize", this.texelWidth, this.texelHeight);
            }
        }
    }
}