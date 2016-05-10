module BABYLON {
    export class StereoscopicInterlacePostProcess extends PostProcess {
        private _stepSize : Vector2;
        private _passedProcess : PostProcess;

        constructor(name: string, rigCameras: Camera[], isStereoscopicHoriz: boolean, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "stereoscopicInterlace", ['stepSize'], ['camASampler'], 1, rigCameras[1], samplingMode, engine, reusable, isStereoscopicHoriz ? "#define IS_STEREOSCOPIC_HORIZ 1" : undefined);
            
            this._passedProcess = rigCameras[0]._rigPostProcess;
            this._stepSize = new Vector2(1 / this.width, 1 / this.height);

            this.onSizeChangedObservable.add(() => {
                this._stepSize = new Vector2(1 / this.width, 1 / this.height);
            });
            this.onApplyObservable.add((effect: Effect) => {
                effect.setTextureFromPostProcess("camASampler", this._passedProcess);
                effect.setFloat2("stepSize", this._stepSize.x, this._stepSize.y);
            });
        }
    }
}
