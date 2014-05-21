module BABYLON {
    export class PostProcessRenderEffect {
        private _engine: Engine;
        private _name: string;

        private _postProcesses: PostProcess[];
        private _postProcessType;

        private _ratio: number;
        private _samplingMode: number;
        private _singleInstance: boolean;

        private _cameras: Camera[];
        private _indicesForCamera: number[];

        private _renderPasses: PostProcessRenderPass[];
        private _renderEffectAsPasses: PostProcessRenderEffect[];

        public name: string;
        public parameters: (effect) => void;


        constructor(engine: Engine, name: string, postProcessType, ratio: number, samplingMode: number, singleInstance: boolean) {
            this.name = name;
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

            this.parameters = function () { };
        }

        public static getInstance(engine: Engine, postProcessType, ratio: number, samplingMode: number): PostProcess {
            var tmpClass;
            var instance;
            var args = new Array();

            var parameters = PostProcessRenderEffect.getParametersNames(postProcessType);
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

            tmpClass = function () { };
            tmpClass.prototype = postProcessType.prototype;

            instance = new tmpClass();
            postProcessType.apply(instance, args);

            return instance;
        }

        public static getParametersNames(func): string[] {
            var commentsRegex = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var functWithoutComments = eval(func).toString().replace(commentsRegex, '');

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
            this._renderPasses[renderPass.name] = renderPass;

            this._linkParameters();
        }

        public removePass(renderPass: PostProcessRenderPass): void {
            delete this._renderPasses[renderPass.name];

            this._linkParameters();
        }

        public addRenderEffectAsPass(renderEffect: PostProcessRenderEffect): void {
            this._renderEffectAsPasses[renderEffect.name] = renderEffect;

            this._linkParameters();
        }

        public getPass(passName: string): void {
            for (var renderPassName in this._renderPasses) {
                if (renderPassName == passName) {
                    return this._renderPasses[passName];
                }
            }
        }

        public emptyPasses(): void {
            this._renderPasses.length = 0;

            this._linkParameters();
        }

        public attachCameras(cameras: Camera[]): void {
            var postProcess = null;

            cameras = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                if (this._singleInstance) {
                    postProcess = this._postProcesses[0] || PostProcessRenderEffect.getInstance(this._engine, this._postProcessType, this._ratio, this._samplingMode);
                    this._postProcesses[0] = postProcess;
                }
                else {
                    postProcess = this._postProcesses[cameras[i].name] || PostProcessRenderEffect.getInstance(this._engine, this._postProcessType, this._ratio, this._samplingMode);
                    this._postProcesses[cameras[i].name] = postProcess;
                }
                var index = cameras[i].attachPostProcess(postProcess);

                if (this._indicesForCamera[cameras[i].name] == null) {
                    this._indicesForCamera[cameras[i].name] = [];
                }

                this._indicesForCamera[cameras[i].name].push(index);

                if (this._cameras.indexOf(cameras[i]) == -1) {
                    this._cameras.push(cameras[i]);
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].incRefCount();
                }
            }

            this._linkParameters();
        }

        public detachCamera(cameras): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                if (this._singleInstance) {
                    cameras[i].detachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name]);
                }
                else {
                    cameras[i].detachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name]);
                }

                var index = this._cameras.indexOf(cameras[i].name);

                this._indicesForCamera.splice(index, 1);
                this._cameras.splice(index, 1);

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].decRefCount();
                }
            }
        }

        public enable(cameras: Camera[]): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                for (var j = 0; j < this._indicesForCamera[cameras[i].name].length; j++) {
                    if (cameras[i]._postProcesses[this._indicesForCamera[cameras[i].name][j]] === undefined) {
                        if (this._singleInstance) {
                            cameras[i].attachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name][j]);
                        }
                        else {
                            cameras[i].attachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name][j]);
                        }
                    }
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].incRefCount();
                }
            }
        }

        public disable(cameras: Camera[]): void {
            cameras = Tools.MakeArray(cameras || this._cameras);

            for (var i = 0; i < cameras.length; i++) {
                if (this._singleInstance) {
                    cameras[i].detachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name]);
                }
                else {
                    cameras[i].detachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name]);
                }

                for (var passName in this._renderPasses) {
                    this._renderPasses[passName].decRefCount();
                }
            }
        }

        public getPostProcess(): PostProcess {
            return this._postProcesses[0];
        }

        private _linkParameters(): void {
            var that = this;
            for (var index in this._postProcesses) {
                this._postProcesses[index].onApply = function (effect) {
                    that.parameters(effect);
                    that._linkTextures(effect);
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