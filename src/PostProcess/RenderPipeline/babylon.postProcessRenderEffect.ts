module BABYLON {
    export class PostProcessRenderEffect {
        private _postProcesses: any;
        private _getPostProcess: () => Nullable<PostProcess | Array<PostProcess>>;

        private _singleInstance: boolean;

        private _cameras: { [key: string]: Nullable<Camera> };
        private _indicesForCamera: { [key: string]: number[] };

        private _renderEffectAsPasses: any;

        // private
        public _name: string;

        public applyParameters: (postProcess: PostProcess) => void;
        
        constructor(engine: Engine, name: string, getPostProcess: () => Nullable<PostProcess | Array<PostProcess>>, singleInstance?: boolean) {
            this._name = name;
            this._singleInstance = singleInstance || true;

            this._getPostProcess = getPostProcess;

            this._cameras = {};
            this._indicesForCamera = {};

            this._postProcesses = {};

            this._renderEffectAsPasses = {};
        }

        public get isSupported(): boolean {
            for (var index in this._postProcesses) {
                for(var ppIndex in this._postProcesses[index]){
                    if (!this._postProcesses[index][ppIndex].isSupported) {
                        return false;
                    }
                }
            }
            return true;
        }

        public _update(): void {
        }
        public addRenderEffectAsPass(renderEffect: PostProcessRenderEffect): void {
            this._renderEffectAsPasses[renderEffect._name] = renderEffect;

            this._linkParameters();
        }

        // private
        public _attachCameras(cameras: Camera): void;
        public _attachCameras(cameras: Camera[]): void;
        public _attachCameras(cameras: any): void {
            var cameraKey;

            var cams = Tools.MakeArray(cameras || this._cameras);

            if (!cams) {
                return;
            }

            for (var i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.name;

                if (this._singleInstance) {
                    cameraKey = 0;
                }
                else {
                    cameraKey = cameraName;
                }

                if(!this._postProcesses[cameraKey]){
                    var postProcess = this._getPostProcess();
                    if(postProcess){
                        this._postProcesses[cameraKey] = Array.isArray(postProcess) ? postProcess :[postProcess];
                    }
                }

                if (!this._indicesForCamera[cameraName]) {
                    this._indicesForCamera[cameraName] = [];
                }

                this._postProcesses[cameraKey].forEach((postProcess:PostProcess) => {
                    var index = camera.attachPostProcess(postProcess);
    
                    this._indicesForCamera[cameraName].push(index);
                });
                
                if (!this._cameras[cameraName]) {
                    this._cameras[cameraName] = camera;
                }

            }

            this._linkParameters();
        }

        // private
        public _detachCameras(cameras: Camera): void;
        public _detachCameras(cameras: Camera[]): void;
        public _detachCameras(cameras: any): void {
            var cams = Tools.MakeArray(cameras || this._cameras);

            if (!cams) {
                return;
            }

            for (var i = 0; i < cams.length; i++) {
                var camera: Camera = cams[i];
                var cameraName: string = camera.name;
                this._postProcesses[this._singleInstance ? 0 : cameraName].forEach((postProcess:PostProcess)=>{
                    camera.detachPostProcess(postProcess);
                })

                if (this._cameras[cameraName]) {
                    //this._indicesForCamera.splice(index, 1);
                    this._cameras[cameraName] = null;
                }
            }
        }

        // private
        public _enable(cameras: Camera): void;
        public _enable(cameras: Nullable<Camera[]>): void;
        public _enable(cameras: any): void {
            var cams = Tools.MakeArray(cameras || this._cameras);

            if (!cams) {
                return;
            }

            for (var i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.name;

                for (var j = 0; j < this._indicesForCamera[cameraName].length; j++) {
                    if (camera._postProcesses[this._indicesForCamera[cameraName][j]] === undefined) {
                        cameras[i].attachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName], this._indicesForCamera[cameraName][j]);
                    }
                }
            }
        }

        // private
        public _disable(cameras: Camera): void;
        public _disable(cameras: Nullable<Camera[]>): void;
        public _disable(cameras: any): void {
            var cams = Tools.MakeArray(cameras || this._cameras);

            if (!cams) {
                return;
            }

            for (var i = 0; i < cams.length; i++) {
                var camera = cams[i];
                var cameraName = camera.Name;

                camera.detachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName]);
            }
        }

        public getPostProcess(camera?: Camera): Nullable<PostProcess> {
            if (this._singleInstance) {
                return this._postProcesses[0][0];
            }
            else {

                if (!camera) {
                    return null;
                }
                return this._postProcesses[camera.name][0];
            }
        }

        private _linkParameters(): void {
            for (var index in this._postProcesses) {
                this._postProcesses[index].forEach((postProcess:PostProcess)=>{
                    if (this.applyParameters) {
                        this.applyParameters(postProcess);
                    }

                    postProcess.onBeforeRenderObservable.add((effect: Effect) => {
                        this._linkTextures(effect);
                    });
                });
            }
        }

        private _linkTextures(effect: Effect): void {
            for (var renderEffectName in this._renderEffectAsPasses) {
                effect.setTextureFromPostProcess(renderEffectName + "Sampler", this._renderEffectAsPasses[renderEffectName].getPostProcess());
            }
        }
    }
}