module BABYLON {
    export class PostProcessRenderEffect {
        private _engine: Engine;

        private _postProcesses: PostProcess[];
        private _postProcessType; //The type must inherit from PostProcess (example: BABYLON.BlackAndWhitePostProcess, like this without quotes).

        private _ratio: number;
        private _samplingMode: number;
        private _singleInstance: boolean;

        private _cameras: Camera[];
        private _indicesForCamera: number[][];

        private _renderPasses: PostProcessRenderPass[];
        private _renderEffectAsPasses: PostProcessRenderEffect[];

        // private
        public _name: string;

        public parameters: (effect: Effect) => void;

        constructor(engine: Engine, name: string, postProcessType, ratio?: number, samplingMode?: number, singleInstance?: boolean) {
            this._engine = engine;
            this._name = name;
            this._postProcessType = postProcessType;
            this._ratio = ratio || 1.0;
            this._samplingMode = samplingMode || null;
            this._singleInstance = singleInstance || true;

            this._cameras = [];

            this._postProcesses = [];
            this._indicesForCamera = [];

            this._renderPasses = [];
            this._renderEffectAsPasses = [];

            this.parameters = (effect: Effect) => { };
        }

        private static _GetInstance(engine: Engine, postProcessType, ratio: number, samplingMode: number): PostProcess {
            var postProcess;
            var instance;
            var args = [];

            var parameters = PostProcessRenderEffect._GetParametersNames(postProcessType);
            for (var i = 0; i < parameters.length; i++) {
                switch (parameters[i]) {
                    case "name":
                        args[i] = postProcessType.toString();
                        break;
                    case "ratio":
                        args[i] = ratio;
                        break;
                    case "camera":
                        args[i] = null;
                        break;
                    case "samplingMode":
                        args[i] = samplingMode;
                        break;
                    case "engine":
                        args[i] = engine;
                        break;
                    case "reusable":
                        args[i] = true;
                        break;
                    default:
                        args[i] = null;
                        break;
                }
            }

            postProcess = function () { };
            postProcess.prototype = postProcessType.prototype;

            instance = new postProcess();
            postProcessType.apply(instance, args);

            return instance;
        }

        private static _GetParametersNames(func): string[] {
            var commentsRegex = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var functWithoutComments = func.toString().replace(commentsRegex, '');

            var parameters = functWithoutComments.slice(functWithoutComments.indexOf('(') + 1, functWithoutComments.indexOf(')')).match(/([^\s,]+)/g);

            if (parameters === null)
                parameters = [];

            return parameters;
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

        public getPass(passName: string): void {
            for (var renderPassName in this._renderPasses) {
                if (renderPassName === passName) {
                    return this._renderPasses[passName];
                }
            }
        }

        public emptyPasses(): void {
            this._renderPasses.length = 0;

            this._linkParameters();
        }

        // private
        public _attachCameras(cameras: Camera);
        public _attachCameras(cameras: Camera[]);
        public _attachCameras(cameras: any): void {
            var cameraKey;

            var _cam = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;

                if (this._singleInstance) {
                    cameraKey = 0;
                }
                else {
                    cameraKey = cameraName;
                }

                this._postProcesses[cameraKey] = this._postProcesses[cameraKey] || PostProcessRenderEffect._GetInstance(this._engine, this._postProcessType, this._ratio, this._samplingMode);

                var index = camera.attachPostProcess(this._postProcesses[cameraKey]);

                if (this._indicesForCamera[cameraName] === null) {
                    this._indicesForCamera[cameraName] = [];
                }

                this._indicesForCamera[cameraName].push(index);

                if (this._cameras.indexOf(camera) === -1) {
                    this._cameras[cameraName] = camera;
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._incRefCount();
                }
            }

            this._linkParameters();
        }

        // private
        public _detachCameras(cameras: Camera);
        public _detachCameras(cameras: Camera[]);
        public _detachCameras(cameras: any): void {
            var _cam = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.name;

                camera.detachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName], this._indicesForCamera[cameraName]);

                var index = this._cameras.indexOf(cameraName);

                this._indicesForCamera.splice(index, 1);
                this._cameras.splice(index, 1);

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._decRefCount();
                }
            }
        }

        // private
        public _enable(cameras: Camera);
        public _enable(cameras: Camera[]);
        public _enable(cameras: any): void {
            var _cam = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
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
        public _disable(cameras: Camera);
        public _disable(cameras: Camera[]);
        public _disable(cameras: any): void {
            var _cam = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < _cam.length; i++) {
                var camera = _cam[i];
                var cameraName = camera.Name;

                camera.detachPostProcess(this._postProcesses[this._singleInstance ? 0 : cameraName], this._indicesForCamera[cameraName]);

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName]._decRefCount();
                }
            }
        }

        public getPostProcess(camera?: Camera): PostProcess {
            if (this._singleInstance) {
                return this._postProcesses[0];
            }
            else {
                return this._postProcesses[camera.name];
            }
        }

        private _linkParameters(): void {
            for (var index in this._postProcesses) {
                this._postProcesses[index].onApply = (effect: Effect) => {
                    this.parameters(effect);
                    this._linkTextures(effect);
                };
            }
        }

        private _linkTextures(effect): void {
            for (var renderPassName in this._renderPasses) {
                effect.setTexture(renderPassName, this._renderPasses[renderPassName].getRenderTexture());
            }

            for (var renderEffectName in this._renderEffectAsPasses) {
                effect.setTextureFromPostProcess(renderEffectName + "Sampler", this._renderEffectAsPasses[renderEffectName].getPostProcess());
            }
        }
    }
}