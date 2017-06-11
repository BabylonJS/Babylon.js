module BABYLON {
    export class DefaultRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
        private _scene: Scene;     

        /**
        * The FxaaPostProcess Id
        * @type {string}
        */
        readonly FxaaPostProcessId: string = "FxaaPostProcessEffect";           

        // Post-processes
        public fxaa: FxaaPostProcess;
        public imageProcessing: ImageProcessingPostProcess;

        // IAnimatable
        public animations: Animation[] = [];        

        // Values       
        private _fxaaEnabled: boolean = false;
        private _imageProcessingEnabled: boolean = false;

        @serialize()
        private _hdr: boolean;

        public set FxaaEnabled(enabled: boolean) {
            if (this._fxaaEnabled === enabled) {
                return;
            }
            this._fxaaEnabled = enabled;

            if (enabled) {
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, this.FxaaPostProcessId, this._scene.cameras);
            }
            else {
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, this.FxaaPostProcessId, this._scene.cameras);
            }
        }

        @serialize()
        public get FxaaEnabled(): boolean {
            return this._fxaaEnabled;
        }

        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, hdr: boolean, scene: Scene, cameras?: Camera[]) {
            super(scene.getEngine(), name);
            this._cameras = cameras || [];

            // Initialize
            this._hdr = hdr;
            this._scene = scene;

            // Misc
            var floatTextureType = scene.getEngine().getCaps().textureFloatRender ? Engine.TEXTURETYPE_FLOAT : Engine.TEXTURETYPE_HALF_FLOAT;

            // fxaa
            this.fxaa = new FxaaPostProcess("fxaa", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, floatTextureType);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.FxaaPostProcessId, () => { return this.fxaa; }, true));

            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);

            if (cameras !== null) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }

            // Deactivate
            this.FxaaEnabled = false;
        }
        // Dispose
        public dispose(): void {
            for (var i = 0; i < this._cameras.length; i++) {
                var camera = this._cameras[i];

                this.fxaa.dispose(camera);
            }

            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);

            super.dispose();
        }

        // Serialize rendering pipeline
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);   
            serializationObject.customType = "DefaultRenderingPipeline";

            return serializationObject;
        }

        // Parse serialized pipeline
        public static Parse(source: any, scene: Scene, rootUrl: string): DefaultRenderingPipeline {
            return SerializationHelper.Parse(() => new DefaultRenderingPipeline(source._name, source._name._hdr, scene), source, scene, rootUrl);
        }
    }
}
