module BABYLON {
    export class PostProcessRenderPipeline {

        private _renderEffects: {[key: string]: PostProcessRenderEffect};
        private _renderEffectsForIsolatedPass: PostProcessRenderEffect[];

        protected _cameras: Camera[];

        // private
        @serialize()
        public _name: string;

        constructor(private engine: Engine, name: string) {
            this._name = name;

            this._renderEffects = {};
            this._renderEffectsForIsolatedPass = new Array<PostProcessRenderEffect>();

            this._cameras = [];
        }

        public getClassName(): string {
            return "PostProcessRenderPipeline";
        }        

        public get isSupported(): boolean {
            for (var renderEffectName in this._renderEffects) {
                if (this._renderEffects.hasOwnProperty(renderEffectName)) {
                    if (!this._renderEffects[renderEffectName].isSupported) {
                        return false;
                    }
                }
            }

            return true;
        }

        public addEffect(renderEffect: PostProcessRenderEffect): void {
            (<any>this._renderEffects)[renderEffect._name] = renderEffect;
        }

        // private

        public _rebuild() {
            
        }

        public _enableEffect(renderEffectName: string, cameras: Camera): void;
        public _enableEffect(renderEffectName: string, cameras: Camera[]): void;
        public _enableEffect(renderEffectName: string, cameras: any): void {
            var renderEffects: PostProcessRenderEffect = (<any>this._renderEffects)[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects._enable(Tools.MakeArray(cameras || this._cameras));
        }

        public _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void;
        public _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void;
        public _disableEffect(renderEffectName: string, cameras: Nullable<Camera[]>): void {
            var renderEffects: PostProcessRenderEffect = (<any>this._renderEffects)[renderEffectName];

            if (!renderEffects) {
                return;
            }

            renderEffects._disable(Tools.MakeArray(cameras || this._cameras));
        }

        public _attachCameras(cameras: Camera, unique: boolean): void;
        public _attachCameras(cameras: Camera[], unique: boolean): void;
        public _attachCameras(cameras: any, unique: boolean): void {
            var cams = Tools.MakeArray(cameras || this._cameras);

            if (!cams) {
                return;
            }

            var indicesToDelete = [];
            var i: number;
            for (i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.name;

                if (this._cameras.indexOf(camera) === -1) {
                    this._cameras[cameraName] = camera;
                }
                else if (unique) {
                    indicesToDelete.push(i);
                }
            }

            for (i = 0; i < indicesToDelete.length; i++) {
                cameras.splice(indicesToDelete[i], 1);
            }

            for (var renderEffectName in this._renderEffects) {
                if (this._renderEffects.hasOwnProperty(renderEffectName)) {
                    this._renderEffects[renderEffectName]._attachCameras(cams);
                }
            }
        }

        public _detachCameras(cameras: Camera): void;
        public _detachCameras(cameras: Nullable<Camera[]>): void;
        public _detachCameras(cameras: any): void {
            var cams = Tools.MakeArray(cameras || this._cameras);

            if (!cams) {
                return;
            }

            for (var renderEffectName in this._renderEffects) {
                if (this._renderEffects.hasOwnProperty(renderEffectName)) {
                    this._renderEffects[renderEffectName]._detachCameras(cams);
                }
            }

            for (var i = 0; i < cams.length; i++) {
                this._cameras.splice(this._cameras.indexOf(cams[i]), 1);
            }
        }

        public _update(): void {
            for (var renderEffectName in this._renderEffects) {
                if (this._renderEffects.hasOwnProperty(renderEffectName)) {
                    this._renderEffects[renderEffectName]._update();
                }
            }

            for (var i = 0; i < this._cameras.length; i++) {
                var cameraName = this._cameras[i].name;
                if ((<any>this._renderEffectsForIsolatedPass)[cameraName]) {
                    (<any>this._renderEffectsForIsolatedPass)[cameraName]._update();
                }
            }
        }

        public _reset(): void {
            this._renderEffects = {};
            this._renderEffectsForIsolatedPass = new Array<PostProcessRenderEffect>();
        }

        protected _enableMSAAOnFirstPostProcess(sampleCount: number):boolean{
            // Set samples of the very first post process to 4 to enable native anti-aliasing in browsers that support webGL 2.0 (See: https://github.com/BabylonJS/Babylon.js/issues/3754)
            var effectKeys = Object.keys(this._renderEffects);
            if(this.engine.webGLVersion >= 2 && effectKeys.length > 0){
                var postProcesses = this._renderEffects[effectKeys[0]].getPostProcesses();
                if(postProcesses){
                    postProcesses[0].samples = sampleCount;
                    return true;
                }
            }
            return false;
        }

        public dispose() {
           // Must be implemented by children 
        }
    }
}