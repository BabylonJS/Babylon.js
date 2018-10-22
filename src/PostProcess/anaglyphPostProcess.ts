module BABYLON {
    /**
     * Postprocess used to generate anaglyphic rendering
     */
    export class AnaglyphPostProcess extends PostProcess {
        private _passedProcess : Nullable<PostProcess>;

        /**
         * Creates a new AnaglyphPostProcess
         * @param name defines postprocess name
         * @param options defines creation options or target ratio scale
         * @param rigCameras defines cameras using this postprocess
         * @param samplingMode defines required sampling mode (BABYLON.Texture.NEAREST_SAMPLINGMODE by default)
         * @param engine defines hosting engine
         * @param reusable defines if the postprocess will be reused multiple times per frame
         */
        constructor(name: string, options: number | PostProcessOptions,  rigCameras: Camera[], samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "anaglyph", null, ["leftSampler"], options, rigCameras[1], samplingMode, engine, reusable);
            this._passedProcess = rigCameras[0]._rigPostProcess;

            this.onApplyObservable.add((effect: Effect) => {
                effect.setTextureFromPostProcess("leftSampler", this._passedProcess);
            });
        }
    }
}