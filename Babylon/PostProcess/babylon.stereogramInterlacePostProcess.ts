module BABYLON {
    export class StereogramInterlacePostProcess extends PostProcess {
        private _stepSize : Vector2;

        constructor(name: string, camB: Camera, postProcessA : PostProcess, isStereogramHoriz: boolean, samplingMode?: number) {
            super(name, "stereogramInterlace", ['stepSize'], ['camASampler'], 1, camB, samplingMode, camB.getScene().getEngine(), false, isStereogramHoriz ? "#define IS_STEREOGRAM_HORIZ 1" : undefined);
            
            this._stepSize = new Vector2(1 / this.width, 1 / this.height);

            this.onSizeChanged = () => {
                this._stepSize = new Vector2(1 / this.width, 1 / this.height);
            };
            this.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("camASampler", postProcessA);
                effect.setFloat2("stepSize", this._stepSize.x, this._stepSize.y);
            };
        }
    }
}
