module BABYLON {
    export class CustomProceduralTexture extends ProceduralTexture {
        private _animate: boolean = true;
        private _time: number = 0;
        private _config: any;
        private _texturePath: any;

        constructor(name: string, texturePath: any, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, null, scene, fallbackTexture, generateMipMaps);
            this._texturePath = texturePath;

            //Try to load json
            this.loadJson(texturePath);
            this.refreshRate = 1;
        }

        private loadJson(jsonUrl: string): void {
            let noConfigFile = () => {
                Tools.Log("No config file found in " + jsonUrl + " trying to use ShadersStore or DOM element");
                try {
                    this.setFragment(this._texturePath);
                }
                catch (ex) {
                    Tools.Error("No json or ShaderStore or DOM element found for CustomProceduralTexture");
                }
            }

            var configFileUrl = jsonUrl + "/config.json";
            var xhr: XMLHttpRequest = new XMLHttpRequest();

            xhr.open("GET", configFileUrl, true);
            xhr.addEventListener("load", () => {
                if (xhr.status === 200 || Tools.ValidateXHRData(xhr, 1)) {
                    try {
                        this._config = JSON.parse(xhr.response);

                        this.updateShaderUniforms();
                        this.updateTextures();
                        this.setFragment(this._texturePath + "/custom");

                        this._animate = this._config.animate;
                        this.refreshRate = this._config.refreshrate;
                    }
                    catch (ex) {
                        noConfigFile();
                    }
                }
                else {
                    noConfigFile();
                }
            }, false);

            xhr.addEventListener("error", () => {
                noConfigFile();
            }, false);

            try {
                xhr.send();
            }
            catch (ex) {
                Tools.Error("CustomProceduralTexture: Error on XHR send request.");
            }
        }

        public isReady(): boolean {
            if (!super.isReady()) {
                return false;
            }

            for (var name in this._textures) {
                var texture = this._textures[name];

                if (!texture.isReady()) {
                    return false;
                }
            }

            return true;
        }

        public render(useCameraPostProcess?: boolean): void {
            let scene = this.getScene();
            if (this._animate && scene) {
                this._time += scene.getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }

            super.render(useCameraPostProcess);
        }

        public updateTextures(): void {
            for (var i = 0; i < this._config.sampler2Ds.length; i++) {
                this.setTexture(this._config.sampler2Ds[i].sample2Dname, new Texture(this._texturePath + "/" + this._config.sampler2Ds[i].textureRelativeUrl, this.getScene()));
            }
        }

        public updateShaderUniforms(): void {
            if (this._config) {
                for (var j = 0; j < this._config.uniforms.length; j++) {
                    var uniform = this._config.uniforms[j];

                    switch (uniform.type) {
                        case "float":
                            this.setFloat(uniform.name, uniform.value);
                            break;
                        case "color3":
                            this.setColor3(uniform.name, new Color3(uniform.r, uniform.g, uniform.b));
                            break;
                        case "color4":
                            this.setColor4(uniform.name, new Color4(uniform.r, uniform.g, uniform.b, uniform.a));
                            break;
                        case "vector2":
                            this.setVector2(uniform.name, new Vector2(uniform.x, uniform.y));
                            break;
                        case "vector3":
                            this.setVector3(uniform.name, new Vector3(uniform.x, uniform.y, uniform.z));
                            break;
                    }
                }
            }

            this.setFloat("time", this._time);
        }

        public get animate(): boolean {
            return this._animate;
        }

        public set animate(value: boolean) {
            this._animate = value;
        }
    }
}