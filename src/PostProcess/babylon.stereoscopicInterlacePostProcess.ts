module BABYLON {
    /**
     * StereoscopicInterlacePostProcess used to render stereo views from a rigged camera
     */
    export class StereoscopicInterlacePostProcess extends PostProcess {
        private _stepSize : Vector2;
        private _passedProcess : Nullable<PostProcess>;

        /**
         * Initializes a StereoscopicInterlacePostProcess
         * @param name The name of the effect.
         * @param rigCameras The rig cameras to be appled to the post process
         * @param isStereoscopicHoriz If the rendered results are horizontal or verticle
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         */
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
