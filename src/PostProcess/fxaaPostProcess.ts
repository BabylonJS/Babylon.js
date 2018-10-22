module BABYLON {
    /**
     * Fxaa post process
     * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#fxaa
     */
    export class FxaaPostProcess extends PostProcess {
        /** @hidden */
        public texelWidth: number;
        /** @hidden */
        public texelHeight: number;

        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "fxaa", ["texelSize"], null, options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "fxaa", undefined, true);

            const defines = this._getDefines();
            this.updateEffect(defines);

            this.onApplyObservable.add((effect: Effect) => {
                var texelSize = this.texelSize;
                effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            });
        }

        private _getDefines(): Nullable<string> {
            const engine = this.getEngine();
            if (!engine) {
                return null;
            }

            const glInfo = engine.getGlInfo();
            if (glInfo && glInfo.renderer && glInfo.renderer.toLowerCase().indexOf("mali") > -1) {
                return "#define MALI 1\n";
            }

            return null;
        }
    }
}