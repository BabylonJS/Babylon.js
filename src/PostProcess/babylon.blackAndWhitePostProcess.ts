module BABYLON {

    export class BlackAndWhitePostProcess extends PostProcess {
        public degree = 1;
    
        constructor(name: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "blackAndWhite", ["degree"], null, options, camera, samplingMode, engine, reusable);

            this.onApplyObservable.add((effect: Effect) => {
                effect.setFloat("degree", this.degree);
            });
        }
    }
} 