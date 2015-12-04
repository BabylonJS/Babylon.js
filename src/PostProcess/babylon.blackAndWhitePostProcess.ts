module BABYLON {
    export class BlackAndWhitePostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "blackAndWhite", null, null, ratio, camera, samplingMode, engine, reusable);
        }
    }
} 