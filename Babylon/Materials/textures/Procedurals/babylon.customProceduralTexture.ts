module BABYLON {
    export class CustomProceduralTexture extends ProceduralTexture {
        private _animate: boolean = true;
        private _time: number = 0;
        private _shaderLoaded: boolean = false;
        private _config: any;
        private _texturePath: string;
        private _updateTexture: boolean = false;

        constructor(name: string, texturePath: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "empty", scene, fallbackTexture, generateMipMaps);
            this._texturePath = texturePath;
          
            //readJson
            this.loadJson(texturePath);
            this.refreshRate = 1;
        }

        private loadJson(jsonUrl: string) {
            function noConfigFile() {
                BABYLON.Tools.Log("No config file found in " + jsonUrl);
            }

            var that = this;
            var configFileUrl = jsonUrl + "/config.json";
            var xhr: XMLHttpRequest = new XMLHttpRequest();

            xhr.open("GET", configFileUrl, true);
            xhr.addEventListener("load", function () {
                if (xhr.status === 200 || BABYLON.Tools.ValidateXHRData(xhr, 1)) {
                    try {
                        that._config = JSON.parse(xhr.response);
                        that._updateTexture = true;
                        that._shaderLoaded = true;
                    }
                    catch (ex) {
                        noConfigFile();
                    }
                }
                else {
                    noConfigFile();
                }
            }, false);

            xhr.addEventListener("error", event => {
                noConfigFile();
            }, false);

            try {
                xhr.send();
            }
            catch (ex) {
                BABYLON.Tools.Error("Error on XHR send request.");
            }
        }

        public render(useCameraPostProcess?: boolean) {
            //if config and shader not loaded, do not render
            if (!this._shaderLoaded)
                return;

            if (this._updateTexture) {
                this.reset();
                this.setFragment(this._texturePath + "/custom")
                this.updateTextures();
                this.updateShaderUniforms();
                this._shaderLoaded = true;
                this._animate = this._config.animate;
                this.refreshRate = this._config.refreshrate;
                this.isReady();
                this._updateTexture = false;
                return;
            }

            if (this._animate) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }

            super.render(useCameraPostProcess);
        }

        public updateTextures() {
            for (var i = 0; i < this._config.texture2Ds.length; i++) {
                this.setTexture(this._config.texture2Ds[i].textureName, new BABYLON.Texture(this._texturePath + "/" + this._config.texture2Ds[i].textureRelativeUrl, this.getScene(), false, false, Texture.TRILINEAR_SAMPLINGMODE, null, null, null, true));
            }
        }

        public updateShaderUniforms() {
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

            this.setFloat("time", this._time);
        }

        public get animate(): boolean {
            return this._animate;
        }

        public set animate(value: boolean) {
            this._animate = value;
            this.updateShaderUniforms();
        }
    }
}