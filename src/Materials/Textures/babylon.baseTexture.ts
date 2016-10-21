module BABYLON {
    export class BaseTexture {
        @serialize()
        public name: string;

        @serialize()
        public hasAlpha = false;

        @serialize()
        public getAlphaFromRGB = false;

        @serialize()
        public level = 1;

        @serialize()
        public coordinatesIndex = 0;

        @serialize()
        public coordinatesMode = Texture.EXPLICIT_MODE;

        @serialize()
        public wrapU = Texture.WRAP_ADDRESSMODE;

        @serialize()
        public wrapV = Texture.WRAP_ADDRESSMODE;

        @serialize()
        public anisotropicFilteringLevel = 4;

        @serialize()
        public isCube = false;

        @serialize()
        public isRenderTarget = false;

        public get uid(): string {
            if (!this._uid) {
                this._uid = Tools.RandomId();
            }
            return this._uid;
        }

        public toString(): string {
            return this.name;
        }

        public animations = new Array<Animation>();

        /**
        * An event triggered when the texture is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<BaseTexture>();

        private _onDisposeObserver: Observer<BaseTexture>;
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        public delayLoadState = Engine.DELAYLOADSTATE_NONE;

        public _cachedAnisotropicFilteringLevel: number;

        private _scene: Scene;
        public _texture: WebGLTexture;
        private _uid: string;

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

        public getSize(): ISize {
            if (this._texture._width) {
                return new Size(this._texture._width, this._texture._height);
            }

            if (this._texture._size) {
                return new Size(this._texture._size, this._texture._size);
            }

            return Size.Zero();
        }

        public getBaseSize(): ISize {
            if (!this.isReady() || !this._texture)
                return Size.Zero();

            if (this._texture._size) {
                return new Size(this._texture._size, this._texture._size);
            }

            return new Size(this._texture._baseWidth, this._texture._baseHeight);
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

            // Release
            this.releaseInternalTexture();

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject = SerializationHelper.Serialize(this);

            // Animations
            Animation.AppendSerializedAnimations(this, serializationObject);

            return serializationObject;
        }
    }
} 