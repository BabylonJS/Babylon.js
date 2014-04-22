module BABYLON {
    export class AnaglyphPostProcess extends PostProcess {
        //ANY
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?, reusable?: boolean) {
            super(name, "anaglyph", null, ["leftSampler"], ratio, camera, samplingMode, engine, reusable);
        }
    }
} 