var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var CustomProceduralTexture = (function (_super) {
        __extends(CustomProceduralTexture, _super);
        function CustomProceduralTexture(name, texturePath, size, scene, fallbackTexture, generateMipMaps) {
            _super.call(this, name, size, "empty", scene, fallbackTexture, generateMipMaps);
            this._animate = true;
            this._time = 0;
            this._shaderLoaded = false;
            this._updateTexture = false;
            this._texturePath = texturePath;

            //readJson
            this.loadJson(texturePath);
            this.refreshRate = 1;
        }
        CustomProceduralTexture.prototype.loadJson = function (jsonUrl) {
            var that = this;

            function noConfigFile() {
                BABYLON.Tools.Log("No config file found in " + jsonUrl + " trying as a shaderstore or dom");
                try  {
                    that._customFragment = that._texturePath;
                    that._updateTexture = true;
                    that._shaderLoaded = true;
                } catch (ex) {
                    BABYLON.Tools.Error("No json or shaderStore or Dom element found for the Custom Procedural Texture");
                }
            }

            var configFileUrl = jsonUrl + "/config.json";
            var xhr = new XMLHttpRequest();

            xhr.open("GET", configFileUrl, true);
            xhr.addEventListener("load", function () {
                if (xhr.status === 200 || BABYLON.Tools.ValidateXHRData(xhr, 1)) {
                    try  {
                        that._config = JSON.parse(xhr.response);
                        that._customFragment = this._texturePath + "/custom";
                        that._updateTexture = true;
                        that._shaderLoaded = true;
                    } catch (ex) {
                        noConfigFile();
                    }
                } else {
                    noConfigFile();
                }
            }, false);

            xhr.addEventListener("error", function (event) {
                noConfigFile();
            }, false);

            try  {
                xhr.send();
            } catch (ex) {
                BABYLON.Tools.Error("Error on XHR send request.");
            }
        };

        CustomProceduralTexture.prototype.render = function (useCameraPostProcess) {
            //if config and shader not loaded, do not render
            if (!this._shaderLoaded)
                return;

            if (this._updateTexture) {
                this.reset();
                this.setFragment(this._customFragment);
                this.updateTextures();
                this.updateShaderUniforms();
                this._shaderLoaded = true;
                if (this._config) {
                    this._animate = this._config.animate;
                    this.refreshRate = this._config.refreshrate;
                }
                this.isReady();
                this._updateTexture = false;
                return;
            }

            if (this._animate) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }

            _super.prototype.render.call(this, useCameraPostProcess);
        };

        CustomProceduralTexture.prototype.updateTextures = function () {
            if (this._config) {
                for (var i = 0; i < this._config.texture2Ds.length; i++) {
                    this.setTexture(this._config.texture2Ds[i].textureName, new BABYLON.Texture(this._texturePath + "/" + this._config.texture2Ds[i].textureRelativeUrl, this.getScene(), false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, null, null, null, true));
                }
            }
        };

        CustomProceduralTexture.prototype.updateShaderUniforms = function () {
            if (this._config) {
                for (var j = 0; j < this._config.uniforms.length; j++) {
                    var uniform = this._config.uniforms[j];

                    switch (uniform.type) {
                        case "float":
                            this.setFloat(uniform.name, uniform.value);
                            break;
                        case "color3":
                            this.setColor3(uniform.name, new BABYLON.Color3(uniform.r, uniform.g, uniform.b));
                            break;
                        case "color4":
                            this.setColor4(uniform.name, new BABYLON.Color4(uniform.r, uniform.g, uniform.b, uniform.a));
                            break;
                        case "vector2":
                            this.setVector2(uniform.name, new BABYLON.Vector2(uniform.x, uniform.y));
                            break;
                        case "vector3":
                            this.setVector3(uniform.name, new BABYLON.Vector3(uniform.x, uniform.y, uniform.z));
                            break;
                    }
                }
            }

            this.setFloat("time", this._time);
        };

        Object.defineProperty(CustomProceduralTexture.prototype, "animate", {
            get: function () {
                return this._animate;
            },
            set: function (value) {
                this._animate = value;
                this.updateShaderUniforms();
            },
            enumerable: true,
            configurable: true
        });

        return CustomProceduralTexture;
    })(BABYLON.ProceduralTexture);
    BABYLON.CustomProceduralTexture = CustomProceduralTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.customProceduralTexture.js.map
