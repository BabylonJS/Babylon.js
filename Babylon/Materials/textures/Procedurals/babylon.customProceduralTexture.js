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
            this._generateTime = true;
            this._time = 0;
            this._shaderLoaded = false;

            this._texturePath = texturePath;

            //readJson
            this.loadJson(texturePath);

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;
        }
        CustomProceduralTexture.prototype.loadJson = function (jsonUrl) {
            var _this = this;
            function noConfigFile() {
                BABYLON.Tools.Log("No config file found in " + jsonUrl);
            }

            var that = this;
            var configFileUrl = jsonUrl + "/config.json";

            var xhr = new XMLHttpRequest();

            xhr.open("GET", configFileUrl, true);
            xhr.addEventListener("load", function () {
                if (xhr.status === 200 || BABYLON.Tools.ValidateXHRData(xhr, 1)) {
                    try  {
                        that._config = JSON.parse(xhr.response);
                        that.updateShaderUniforms();
                        that.setFragment(jsonUrl + "/custom");
                        that._generateTime = that._config.generateTime;
                        if (that._generateTime)
                            _this.refreshRate = 1;
                        that._shaderLoaded = true;
                        that.render();
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

            if (this._generateTime) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }

            _super.prototype.render.call(this, useCameraPostProcess);
        };

        CustomProceduralTexture.prototype.updateShaderUniforms = function () {
            for (var i = 0; i < this._config.texture2Ds.length; i++) {
                this.setTexture(this._config.texture2Ds[i].textureName, new BABYLON.Texture(this._texturePath + "/" + this._config.texture2Ds[i].textureRelativeUrl, this.getScene()));
            }

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
        };

        Object.defineProperty(CustomProceduralTexture.prototype, "generateTime", {
            get: function () {
                return this.generateTime;
            },
            set: function (value) {
                this.generateTime = value;
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
