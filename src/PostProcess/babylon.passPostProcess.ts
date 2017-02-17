module BABYLON {
    export class PassPostProcess extends PostProcess {
        constructor(name: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "pass", null, null, options, camera, samplingMode, engine, reusable);
        }
    }
} 