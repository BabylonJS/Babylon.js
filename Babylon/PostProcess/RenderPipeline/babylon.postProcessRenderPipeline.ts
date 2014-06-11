module BABYLON {
    export class PostProcessRenderPipeline {
        private _engine: Engine;

        private _renderEffects: PostProcessRenderEffect[];
        private _renderEffectsForIsolatedPass: PostProcessRenderEffect[];

        private _cameras: Camera[];

        // private
        public _name: string;

        private static PASS_EFFECT_NAME: string = "passEffect";
        private static PASS_SAMPLER_NAME: string = "passSampler";

        constructor(engine: Engine, name: string) {
            this._engine = engine;
            this._name = name;

            this._renderEffects = [];
            this._renderEffectsForIsolatedPass = [];

            this._cameras = [];
        }

        public addEffect(renderEffect: PostProcessRenderEffect): void {
            this._renderEffects[renderEffect._name] = renderEffect;
        }

        // private

        public _enableEffect(renderEffectName: string, cameras: Camera);
        public _enableEffect(renderEffectName: string, cameras: Camera[]);
        public _enableEffect(renderEffectName: string, cameras: any): void {
            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.enable(Tools.MakeArray(cameras || this._cameras));
        }

        public _disableEffect(renderEffectName: string, cameras: Camera);
        public _disableEffect(renderEffectName: string, cameras: Camera[]);
        public _disableEffect(renderEffectName: string, cameras): void {
            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.disable(Tools.MakeArray(cameras || this._cameras));
        }

        public _attachCameras(cameras: Camera, unique: boolean);
        public _attachCameras(cameras: Camera[], unique: boolean);
        public _attachCameras(cameras: any, unique: boolean): void {
            var _cam = Tools.MakeArray(cameras || this._cameras);

            var indicesToDelete = [];

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;

                if (this._cameras.indexOf(camera) === -1) {
                    this._cameras[cameraName] = camera;
                }
                else if (unique) {
                    indicesToDelete.push(i);
                }
            }

            for (var i = 0; i < indicesToDelete.length; i++) {
                cameras.splice(indicesToDelete[i], 1);
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._attachCameras(_cam);
            }
        }

        public _detachCameras(cameras: Camera);
        public _detachCameras(cameras: Camera[]);
        public _detachCameras(cameras: any): void {
            var _cam = Tools.MakeArray(cameras || this._cameras);

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._detachCameras(_cam);
            }

            for (var i = 0; i < _cam.length; i++) {
                this._cameras.splice(this._cameras.indexOf(_cam[i]), 1);
            }
        }

        public _enableDisplayOnlyPass(passName, cameras: Camera);
        public _enableDisplayOnlyPass(passName, cameras: Camera[]);
        public _enableDisplayOnlyPass(passName, cameras: any): void {
            var _cam = Tools.MakeArray(cameras || this._cameras);

            var pass = null;

            for (var renderEffectName in this._renderEffects) {
                pass = this._renderEffects[renderEffectName].getPass(passName);

                if (pass != null) {
                    break;
                }
            }

            if (pass === null) {
                return;
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._disable(_cam);
            }

            pass._name = PostProcessRenderPipeline.PASS_SAMPLER_NAME;

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;

                this._renderEffectsForIsolatedPass[cameraName] = this._renderEffectsForIsolatedPass[cameraName] || new PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsForIsolatedPass[cameraName].emptyPasses();
                this._renderEffectsForIsolatedPass[cameraName].addPass(pass);
                this._renderEffectsForIsolatedPass[cameraName]._attachCameras(camera);
            }
        }

        public _disableDisplayOnlyPass(cameras: Camera);
        public _disableDisplayOnlyPass(cameras: Camera[]);
        public _disableDisplayOnlyPass(cameras: any): void {
            var _cam = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;

                this._renderEffectsForIsolatedPass[cameraName] = this._renderEffectsForIsolatedPass[cameraName] || new PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsForIsolatedPass[cameraName]._disable(camera);
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._enable(_cam);
            }
        }

        public _update(): void {
            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._update();
            }

            for (var i = 0; i < this._cameras.length; i++) {
                var cameraName = this._cameras[i].name;
                if (this._renderEffectsForIsolatedPass[cameraName]) {
                    this._renderEffectsForIsolatedPass[cameraName]._update();
                }
            }
        }
    }
}