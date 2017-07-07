module BABYLON {
    export class BaseTexture {
        public static DEFAULT_ANISOTROPIC_FILTERING_LEVEL = 4;

        @serialize()
        public name: string;

        @serialize("hasAlpha")
        private _hasAlpha = false;
        public set hasAlpha(value : boolean) {
            if (this._hasAlpha === value) {
                return;
            }
            this._hasAlpha = value;
            this._scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }
        public get hasAlpha(): boolean {
            return this._hasAlpha;
        }    

        @serialize()
        public getAlphaFromRGB = false;

        @serialize()
        public level = 1;

        @serialize()
        public coordinatesIndex = 0;

        @serialize("coordinatesMode")
        private _coordinatesMode = Texture.EXPLICIT_MODE;
        public set coordinatesMode(value : number) {
            if (this._coordinatesMode === value) {
                return;
            }
            this._coordinatesMode = value;
            this._scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
        }
        public get coordinatesMode(): number {
            return this._coordinatesMode;
        }            

        @serialize()
        public wrapU = Texture.WRAP_ADDRESSMODE;

        @serialize()
        public wrapV = Texture.WRAP_ADDRESSMODE;

        @serialize()
        public anisotropicFilteringLevel = BaseTexture.DEFAULT_ANISOTROPIC_FILTERING_LEVEL;

        @serialize()
        public isCube = false;

        @serialize()
        public gammaSpace = true;

        @serialize()
        public invertZ = false;

        @serialize()
        public lodLevelInAlpha = false;

        @serialize()
        public lodGenerationOffset = 1.0;

        @serialize()
        public lodGenerationScale = 0.8;

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

        public get isBlocking(): boolean {
            return true;
        }

        constructor(scene: Scene) {
            this._scene = scene || Engine.LastCreatedScene;
            this._scene.textures.push(this);
            this._uid = null;
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

        public isReadyOrNotBlocking(): boolean {
            return !this.isBlocking || this.isReady();
        }

        public isReady(): boolean {
            if (this.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) {
                this.delayLoad();
                return false;
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

        public get textureType(): number {
            if (!this._texture) {
                return Engine.TEXTURETYPE_UNSIGNED_INT;
            }

            return (this._texture.type !== undefined) ? this._texture.type : Engine.TEXTURETYPE_UNSIGNED_INT;
        }

        public get textureFormat(): number {
            if (!this._texture) {
                return Engine.TEXTUREFORMAT_RGBA;
            }

            return (this._texture.format !== undefined) ? this._texture.format : Engine.TEXTUREFORMAT_RGBA;
        }

        public readPixels(faceIndex = 0): ArrayBufferView {
            if (!this._texture) {
                return null;
            }

            var size = this.getSize();
            var engine = this.getScene().getEngine();

            if (this._texture.isCube) {
                return engine._readTexturePixels(this._texture, size.width, size.height, faceIndex);
            }

            return engine._readTexturePixels(this._texture, size.width, size.height, -1);
        }

        public releaseInternalTexture(): void {
            if (this._texture) {
                this._scene.getEngine().releaseInternalTexture(this._texture);
                delete this._texture;
            }
        }

        public get sphericalPolynomial(): SphericalPolynomial {
            if (!this._texture || !Internals.CubeMapToSphericalPolynomialTools || !this.isReady()) {
                return null;
            }

            if (!this._texture._sphericalPolynomial) {
                this._texture._sphericalPolynomial = 
                    Internals.CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this);
            }

            return this._texture._sphericalPolynomial;
        }

        public set sphericalPolynomial(value: SphericalPolynomial) {
            if (this._texture) {
                this._texture._sphericalPolynomial = value;
            }
        }

        public get lodTextureHigh(): BaseTexture {
            if (this._texture) {
                return this._texture._lodTextureHigh;
            }
            return null;
        }

        public get lodTextureMid(): BaseTexture {
            if (this._texture) {
                return this._texture._lodTextureMid;
            }
            return null;
        }

        public get lodTextureLow(): BaseTexture {
            if (this._texture) {
                return this._texture._lodTextureLow;
            }
            return null;
        }

        public dispose(): void {
            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            this._scene._removePendingData(this);
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

        public static WhenAllReady(textures: BaseTexture[], onLoad: () => void): void {
            var numReady = 0;

            for (var i = 0; i < textures.length; i++) {
                var texture = textures[i];

                if (texture.isReady()) {
                    if (++numReady === textures.length) {
                        onLoad();
                    }
                }
                else {
                    var observable = (texture as any).onLoadObservable as Observable<Texture>;

                    let callback = () => {
                        observable.removeCallback(callback);
                        if (++numReady === textures.length) {
                            onLoad();
                        }
                    };

                    observable.add(callback);
                }
            }
        }
    }
} 