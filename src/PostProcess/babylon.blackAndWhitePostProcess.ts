module BABYLON {
    export class BlackAndWhitePostProcess extends PostProcess {
        constructor(name: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "blackAndWhite", null, null, options, camera, samplingMode, engine, reusable);
        }
    }
} 