module BABYLON {
    export class AnaglyphPostProcess extends PostProcess {
        private _passedProcess : PostProcess;

        constructor(name: string, ratio: number,  rigCameras: Camera[], samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "anaglyph", null, ["leftSampler"], ratio, rigCameras[1], samplingMode, engine, reusable);
            this._passedProcess = rigCameras[0]._rigPostProcess;

            this.onApplyObservable.add((effect: Effect) => {
                effect.setTextureFromPostProcess("leftSampler", this._passedProcess);
            });
        }
    }
} 