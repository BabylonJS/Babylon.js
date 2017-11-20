module BABYLON {
    export class PostProcessRenderEffect {
        private _postProcesses: any;
        private _getPostProcess: () => Nullable<PostProcess>;

        private _singleInstance: boolean;

        private _cameras: { [key: string]: Nullable<Camera> };
        private _indicesForCamera: { [key: string]: number[] };

        private _renderPasses: any;
        private _renderEffectAsPasses: any;

        // private
        public _name: string;

        public applyParameters: (postProcess: PostProcess) => void;

        constructor(engine: Engine, name: string, getPostProcess: () => Nullable<PostProcess>, singleInstance?: boolean) {
            this._name = name;
            this._singleInstance = singleInstance || true;

            this._getPostProcess = getPostProcess;

            this._cameras = {};
            this._indicesForCamera = {};

            this._postProcesses = {};

            this._renderPasses = {};
            this._renderEffectAsPasses = {};
        }

        public get isSupported(): boolean {
            for (var index in this._postProcesses) {
                if (!this._postProcesses[index].isSupported) {
                    return false;
                }
            }
            return true;
        }

        public _update(): void {
            for (var renderPassName in this._renderPasses) {
                this._renderPasses[renderPassName]._update();
            }
        }

        public addPass(renderPass: PostProcessRenderPass): void {
            this._renderPasses[renderPass._name] = renderPass;

            this._linkParameters();
        }

        public removePass(renderPass: PostProcessRenderPass): void {
            delete this._renderPasses[renderPass._name];

            this._linkParameters();
        }

        public addRenderEffectAsPass(renderEffect: PostProcessRenderEffect): void {
            this._renderEffectAsPasses[renderEffect._name] = renderEffect;

            this._linkParameters();
        }

        public getPass(passName: string): Nullable<PostProcessRenderPass> {
            for (var renderPassName in this._renderPasses) {
                if (renderPassName === passName) {
                    return this._renderPasses[passName];
                }
            }

            return null;
        }

        public emptyPasses(): void {
            this._renderPasses = {};

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

                this._postProcesses[cameraKey] = this._postProcesses[cameraKey] || this._getPostProcess();

                var index = camera.attachPostProcess(this._postProcesses[cameraKey]);

                if (!this._indicesForCamera[cameraName]) {
                    this._indicesForCamera[cameraName] = [];
                }

                this._indicesForCamera[cameraName].push(index);

                if (!this._cameras[cameraName]) {
                    this._cameras[cameraName] = camera;
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._incRefCount();
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

                camera.detachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName]);

                if (this._cameras[cameraName]) {
                    //this._indicesForCamera.splice(index, 1);
                    this._cameras[cameraName] = null;
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._decRefCount();
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

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._incRefCount();
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

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._decRefCount();
                }
            }
        }

        public getPostProcess(camera?: Camera): Nullable<PostProcess> {
            if (this._singleInstance) {
                return this._postProcesses[0];
            }
            else {

                if (!camera) {
                    return null;
                }
                return this._postProcesses[camera.name];
            }
        }

        private _linkParameters(): void {
            for (var index in this._postProcesses) {
                if (this.applyParameters) {
                    this.applyParameters(this._postProcesses[index]);
                }

                this._postProcesses[index].onBeforeRenderObservable.add((effect: Effect) => {
                    this._linkTextures(effect);
                });
            }
        }

        private _linkTextures(effect: Effect): void {
            for (var renderPassName in this._renderPasses) {
                effect.setTexture(renderPassName, this._renderPasses[renderPassName].getRenderTexture());
            }

            for (var renderEffectName in this._renderEffectAsPasses) {
                effect.setTextureFromPostProcess(renderEffectName + "Sampler", this._renderEffectAsPasses[renderEffectName].getPostProcess());
            }
        }
    }
}