module BABYLON {
    export class PostProcessRenderPipeline {
        private _engine: Engine;

        private _renderEffects: PostProcessRenderEffect[];
        private _renderEffectsPasses: PostProcessRenderEffect[];

        private _cameras: Camera[];

        public name: string;

        public static PASS_EFFECT_NAME: string = "passEffect";
        public static PASS_SAMPLER_NAME: string = "passSampler";

        constructor(engine: Engine, name: string) {
            this._engine = engine;
            this.name = name;

            this._renderEffects = [];
            this._renderEffectsPasses = [];

            this._cameras = [];
        }

        public addEffect(renderEffect: PostProcessRenderEffect): void {
            this._renderEffects[renderEffect.name] = renderEffect;
        }

        public enableEffect(renderEffectName: string, cameras): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.enable(cameras);
        }

        public disableEffect(renderEffectName: string, cameras): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            var renderEffects = this._renderEffects[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects.disable(cameras);
        }

        public attachCameras(cameras, unique: boolean): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            var indicesToDelete = [];

            for (var i = 0; i < cameras.length; i++) {
                if (this._cameras.indexOf(cameras[i]) == -1) {
                    this._cameras[cameras[i].name] = cameras[i];
                }
                else if (unique) {
                    indicesToDelete.push(i);
                }
            }

            for (var i = 0; i < indicesToDelete.length; i++) {
                cameras.splice(indicesToDelete[i], 1);
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName].attachCameras(cameras);
            }
        }

        public detachCameras(cameras): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName].detachCameras(cameras);
            }

            for (var i = 0; i < cameras.length; i++) {
                this._cameras.splice(this._cameras.indexOf(cameras[i]), 1);
            }
        }

        public enableDisplayOnlyPass(passName, cameras): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            var pass = null;

            for (var renderEffectName in this._renderEffects) {
                pass = this._renderEffects[renderEffectName].getPass(passName);

                if (pass != null) {
                    break;
                }
            }

            if (pass == null) {
                return;
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName].disable(cameras);
            }

            pass._name = PostProcessRenderPipeline.PASS_SAMPLER_NAME;

            for (var i = 0; i < cameras.length; i++) {
                this._renderEffectsPasses[cameras[i].name] = this._renderEffectsPasses[cameras[i].name] || new PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsPasses[cameras[i].name].emptyPasses();
                this._renderEffectsPasses[cameras[i].name].addPass(pass);
                this._renderEffectsPasses[cameras[i].name].attachCameras(cameras[i]);
            }
        }

        public disableDisplayOnlyPass(cameras): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                this._renderEffectsPasses[cameras[i].name] = this._renderEffectsPasses[cameras[i].name] || new PostProcessRenderEffect(this._engine, PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0, null, null);
                this._renderEffectsPasses[cameras[i].name].disable(cameras[i]);
            }

            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName].enable(cameras);
            }
        }

        public _update(): void {
            for (var renderEffectName in this._renderEffects) {
                this._renderEffects[renderEffectName]._update();
            }

            for (var i = 0; i < this._cameras.length; i++) {
                if (this._renderEffectsPasses[this._cameras[i].name]) {
                    this._renderEffectsPasses[this._cameras[i].name]._update();
                }
            }
        }
    }
}