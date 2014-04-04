"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.RenderEffect = function RenderEffect(engine, name, postProcessType, ratio, samplingMode, singleInstance) {
		this._engine = engine;

		this._name = name;

		this._singleInstance = singleInstance || true;

		this._postProcesses = [];

		this._postProcessType = postProcessType;

		this._ratio = ratio;
		this._samplingMode = samplingMode || null;

		this._cameras = [];
		this._indicesForCamera = [];

		this._renderPasses = [];
		this._renderEffectAsPasses = [];

		this.parameters = function () { };

	};

	BABYLON.RenderEffect.prototype.addPass = function(renderPass) {
		this._renderPasses[renderPass._name] = renderPass;

		this._linkParameters();
	};

	BABYLON.RenderEffect.prototype.removePass = function (renderPass) {
		delete this._renderPasses[renderPass._name];

		this._linkParameters();
	};

	BABYLON.RenderEffect.prototype.addRenderEffectAsPass = function(renderEffect) {
		this._renderEffectAsPasses[renderEffect._name] = renderEffect;

		this._linkParameters();
	};

	BABYLON.RenderEffect.prototype.getPass = function (passName) {
	    for (var renderPassName in this._renderPasses) {
	        if (renderPassName == passName) {
	            return this._renderPasses[passName];
	        }
	    }
	};

	BABYLON.RenderEffect.prototype.emptyPasses = function () {
		this._renderPasses.length = 0;

		this._linkParameters();
	};

	BABYLON.RenderEffect.prototype.attachCameras = function (cameras) {
		var postProcess = null;

		cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		for (var i = 0; i < cameras.length; i++) {
			if (this._singleInstance) {
			    postProcess = this._postProcesses[0] || eval(BABYLON.RenderEffect.getStringToInstantiate(this._postProcessType, this._ratio, this._samplingMode));
				this._postProcesses[0] = postProcess;
			}
			else {
			    postProcess = this._postProcesses[cameras[i]] || eval(BABYLON.RenderEffect.getStringToInstantiate(this._postProcessType, this._ratio, this._samplingMode));
				this._postProcesses[cameras[i].name] = postProcess;
			}

			var index = cameras[i].attachPostProcess(postProcess);

			if (this._indicesForCamera[cameras[i].name] == null) {
				this._indicesForCamera[cameras[i].name] = [];
			}

			this._indicesForCamera[cameras[i].name].push(index);

			if (this._cameras.indexOf(cameras[i].name) == -1) {
				this._cameras.push(cameras[i].name);
			}
		}

		this._linkParameters();
	};

	BABYLON.RenderEffect.prototype.detachCameras = function (cameras) {
		cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		for (var i = 0; i < cameras.length; i++) {
		    if (this._singleInstance) {
			    cameras[i].detachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name]);
			}
			else {
				cameras[i].detachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name]);
			}

			this._indicesForCamera.splice(cameras[i].name, 1);
			this._cameras.splice(this._cameras.indexOf(cameras[i].name), 1);
		}
	};

	BABYLON.RenderEffect.prototype._linkParameters = function () {
		var that = this;
		for (var index in this._postProcesses) {
		    this._postProcesses[index].onApply = function (effect) {
		        that.parameters(effect);
		        that._linkTextures(effect);
		    };
		}
	};

	BABYLON.RenderEffect.prototype._linkTextures = function () {
        for (var renderPassName in this._renderPasses) {
            effect.setTexture(renderPassName, this._renderPasses[renderPassName].getRenderTexture());
        }
      
        for (var renderEffectName in this._renderEffectAsPasses) {
            effect.setTextureFromPostProcess(renderEffectName + "Sampler", this._renderEffectAsPasses[renderEffectName].getPostProcess());
        }
	};

    
	BABYLON.RenderEffect.prototype._update = function () {
		for (var renderPassName in this._renderPasses) {
			this._renderPasses[renderPassName]._update();
		}
	};

	BABYLON.RenderEffect.prototype.enable = function (cameras) {
	    cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

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
		}
	};

	BABYLON.RenderEffect.prototype.disable = function (cameras) {
		cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		for (var i = 0; i < cameras.length; i++) {
		    if (this._singleInstance) {
				cameras[i].detachPostProcess(this._postProcesses[0], this._indicesForCamera[cameras[i].name]);
			}
			else {
				cameras[i].detachPostProcess(this._postProcesses[cameras[i].name], this._indicesForCamera[cameras[i].name]);
			}
		}
	};


	BABYLON.RenderEffect.prototype.getPostProcess = function(camera) {
		return this._postProcess;
	};

	BABYLON.RenderEffect.getStringToInstantiate = function (postProcessType, ratio, samplingMode) {
	    var stringToInstantiate = "new " + postProcessType + "(";

	    var parameters = BABYLON.RenderEffect.getParametersNames(postProcessType);
	    for (var i = 0; i < parameters.length; i++) {
	        switch (parameters[i]) {
	            case "name":
	                stringToInstantiate += "\"" + postProcessType + "\"";
	                break;
	            case "ratio":
	                stringToInstantiate += ratio;
	                break;
	            case "camera":
	                stringToInstantiate += "null";
	                break;
	            case "samplingMode":
	                stringToInstantiate += samplingMode;
	                break;
	            case "engine":
	                stringToInstantiate += "this._engine";
	                break;
	            case "reusable":
	                stringToInstantiate += "true";
	                break;
	            default:
	                stringToInstantiate += "null";
	                break;
	        }

	        if (i + 1 < parameters.length) {
	            stringToInstantiate += ",";
	        }
	    }

	    stringToInstantiate += ")";

	    return stringToInstantiate;
	};

	BABYLON.RenderEffect.getParametersNames = function (func) {
	    var commentsRegex = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	    var functWithoutComments = eval(func).toString().replace(commentsRegex, '');

	    var parameters = functWithoutComments.slice(functWithoutComments.indexOf('(') + 1, functWithoutComments.indexOf(')')).match(/([^\s,]+)/g);

	    if (parameters === null)
	        parameters = [];
	    return parameters;
	};

})();