module BABYLON {
    export class BaseTexture {
        public name: string;
        public delayLoadState = Engine.DELAYLOADSTATE_NONE;
        public hasAlpha = false;
        public getAlphaFromRGB = false;
        public level = 1;
        public isCube = false;
        public isRenderTarget = false;
        public animations = new Array<Animation>();
        public onDispose: () => void;
        public coordinatesIndex = 0;
        public coordinatesMode = Texture.EXPLICIT_MODE;
        public wrapU = Texture.WRAP_ADDRESSMODE;
        public wrapV = Texture.WRAP_ADDRESSMODE;
        public anisotropicFilteringLevel = 4;
        public _cachedAnisotropicFilteringLevel: number;

        private _scene: Scene;
        public _texture: WebGLTexture;

        constructor(scene: Scene) {
            this._scene = scene;
            this._scene.textures.push(this);
        }

        public getScene(): Scene {
            return this._scene;
        }

        public getTextureMatrix(): Matrix {
            return null;
        }

        public getReflectionTextureMatrix(): Matrix {
            return null;
        }

        public getInternalTexture(): WebGLTexture {
            return this._texture;
        }

        public isReady(): boolean {
            if (this.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) {
                return true;
            }

            if (this._texture) {
                return this._texture.isReady;
            }

            return false;
        }

        public getSize(): ISize  {
            if (this._texture._width) {
                return { width: this._texture._width, height: this._texture._height };
            }

            if (this._texture._size) {
                return { width: this._texture._size, height: this._texture._size };
            }

            return { width: 0, height: 0 };
        }

        public getBaseSize(): ISize {
            if (!this.isReady())
                return { width: 0, height: 0 };

            if (this._texture._size) {
                return { width: this._texture._size, height: this._texture._size };
            }

            return { width: this._texture._baseWidth, height: this._texture._baseHeight };
        }

        public scale(ratio: number): void {
        }

        public get canRescale(): boolean {
            return false;
        }

        public _removeFromCache(url: string, noMipmap: boolean): void {
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];

                if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                    texturesCache.splice(index, 1);
                    return;
                }
            }
        }

        public _getFromCache(url: string, noMipmap: boolean, sampling?: number): WebGLTexture {
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];

                if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                    if (!sampling || sampling === texturesCacheEntry.samplingMode) {
                        texturesCacheEntry.references++;
                        return texturesCacheEntry;
                    }
                }
            }

            return null;
        }

        public delayLoad(): void {
        }        

        public clone(): BaseTexture {
            return null;
        }

        public releaseInternalTexture(): void {
            if (this._texture) {
                this._scene.getEngine().releaseInternalTexture(this._texture);
                delete this._texture;
            }
        }

        public dispose(): void {
            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            var index = this._scene.textures.indexOf(this);

            if (index >= 0) {
                this._scene.textures.splice(index, 1);
            }

            if (this._texture === undefined) {
                return;
            }

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        }

        public serialize(): any {
            var serializationObject: any = {};

            if (!this.name) {
                return null;
            }
            
            serializationObject.name = this.name;
            serializationObject.hasAlpha = this.hasAlpha;
            serializationObject.level = this.level;

            serializationObject.coordinatesIndex = this.coordinatesIndex;
            serializationObject.coordinatesMode = this.coordinatesMode;
            serializationObject.wrapU = this.wrapU;
            serializationObject.wrapV = this.wrapV;

            // Animations
            Animation.AppendSerializedAnimations(this, serializationObject);

            return serializationObject;
        }

        public static ParseCubeTexture(parsedTexture: any, scene: Scene, rootUrl: string): CubeTexture {
            var texture = null;
            if ((parsedTexture.name || parsedTexture.extensions) && !parsedTexture.isRenderTarget) {
                texture = new BABYLON.CubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.extensions);
                texture.name = parsedTexture.name;
                texture.hasAlpha = parsedTexture.hasAlpha;
                texture.level = parsedTexture.level;
                texture.coordinatesMode = parsedTexture.coordinatesMode;
            }
            return texture;
        }

        public static ParseTexture(parsedTexture: any, scene: Scene, rootUrl: string): BaseTexture {
            if (parsedTexture.isCube) {
                return BaseTexture.ParseCubeTexture(parsedTexture, scene, rootUrl);
            }

            if (!parsedTexture.name && !parsedTexture.isRenderTarget) {
                return null;
            }

            var texture;

            if (parsedTexture.mirrorPlane) {
                texture = new MirrorTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
                texture._waitingRenderList = parsedTexture.renderList;
                texture.mirrorPlane = Plane.FromArray(parsedTexture.mirrorPlane);
            } else if (parsedTexture.isRenderTarget) {
                texture = new RenderTargetTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
                texture._waitingRenderList = parsedTexture.renderList;
            } else {
                if (parsedTexture.base64String) {
                    texture = Texture.CreateFromBase64String(parsedTexture.base64String, parsedTexture.name, scene);
                } else {
                    texture = new Texture(rootUrl + parsedTexture.name, scene);
                }
            }

            texture.name = parsedTexture.name;
            texture.hasAlpha = parsedTexture.hasAlpha;
            texture.getAlphaFromRGB = parsedTexture.getAlphaFromRGB;
            texture.level = parsedTexture.level;

            texture.coordinatesIndex = parsedTexture.coordinatesIndex;
            texture.coordinatesMode = parsedTexture.coordinatesMode;
            texture.uOffset = parsedTexture.uOffset;
            texture.vOffset = parsedTexture.vOffset;
            texture.uScale = parsedTexture.uScale;
            texture.vScale = parsedTexture.vScale;
            texture.uAng = parsedTexture.uAng;
            texture.vAng = parsedTexture.vAng;
            texture.wAng = parsedTexture.wAng;

            texture.wrapU = parsedTexture.wrapU;
            texture.wrapV = parsedTexture.wrapV;

            // Animations
            if (parsedTexture.animations) {
                for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    var parsedAnimation = parsedTexture.animations[animationIndex];

                    texture.animations.push(Animation.ParseAnimation(parsedAnimation));
                }
            }

            return texture;
        }
    }
} 