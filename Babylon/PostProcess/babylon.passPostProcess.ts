module BABYLON {
    export class PassPostProcess extends PostProcess {
        //ANY
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?, reusable?: boolean) {
            super(name, "pass", null, null, ratio, camera, samplingMode, engine, reusable);
        }
    }
} 