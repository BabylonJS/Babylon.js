module BABYLON {
    export class AnaglyphPostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "anaglyph", null, ["leftSampler"], ratio, camera, samplingMode, engine, reusable);
        }
    }
} 