module BABYLON {
    export class BaseTexture {
        public static DEFAULT_ANISOTROPIC_FILTERING_LEVEL = 4;

        @serialize()
        public name: string;

        @serialize("hasAlpha")
        private _hasAlpha = false;
        public set hasAlpha(value: boolean) {
            if (this._hasAlpha === value) {
                return;
            }
            this._hasAlpha = value;
            if (this._scene) {
                this._scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag | Material.MiscDirtyFlag);
            }
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
        
        /**
        * How a texture is mapped.
        *
        * | Value | Type                                | Description |
        * | ----- | ----------------------------------- | ----------- |
        * | 0     | EXPLICIT_MODE                       |             |
        * | 1     | SPHERICAL_MODE                      |             |
        * | 2     | PLANAR_MODE                         |             |
        * | 3     | CUBIC_MODE                          |             |
        * | 4     | PROJECTION_MODE                     |             |
        * | 5     | SKYBOX_MODE                         |             |
        * | 6     | INVCUBIC_MODE                       |             |
        * | 7     | EQUIRECTANGULAR_MODE                |             |
        * | 8     | FIXED_EQUIRECTANGULAR_MODE          |             |
        * | 9     | FIXED_EQUIRECTANGULAR_MIRRORED_MODE |             |
        */
        public set coordinatesMode(value: number) {
            if (this._coordinatesMode === value) {
                return;
            }
            this._coordinatesMode = value;
            if (this._scene) {
                this._scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
            }
        }
        public get coordinatesMode(): number {
            return this._coordinatesMode;
        } 
        
        /**
        * | Value | Type               | Description |
        * | ----- | ------------------ | ----------- |
        * | 0     | CLAMP_ADDRESSMODE  |             |
        * | 1     | WRAP_ADDRESSMODE   |             |
        * | 2     | MIRROR_ADDRESSMODE |             |
        */
        @serialize()
        public wrapU = Texture.WRAP_ADDRESSMODE;
        
        /**
        * | Value | Type               | Description |
        * | ----- | ------------------ | ----------- |
        * | 0     | CLAMP_ADDRESSMODE  |             |
        * | 1     | WRAP_ADDRESSMODE   |             |
        * | 2     | MIRROR_ADDRESSMODE |             |
        */
        @serialize()
        public wrapV = Texture.WRAP_ADDRESSMODE;
        
        /**
        * | Value | Type               | Description |
        * | ----- | ------------------ | ----------- |
        * | 0     | CLAMP_ADDRESSMODE  |             |
        * | 1     | WRAP_ADDRESSMODE   |             |
        * | 2     | MIRROR_ADDRESSMODE |             |
        */
        @serialize()
        public wrapR = Texture.WRAP_ADDRESSMODE;

        @serialize()
        public anisotropicFilteringLevel = BaseTexture.DEFAULT_ANISOTROPIC_FILTERING_LEVEL;

        @serialize()
        public isCube = false;

        @serialize()
        public is3D = false;

        @serialize()
        public gammaSpace = true;

        /**
         * Gets whether or not the texture contains RGBD data.
         */
        public get isRGBD(): boolean {
            return this._texture != null && this._texture._isRGBD;
        }

        @serialize()
        public invertZ = false;

        @serialize()
        public lodLevelInAlpha = false;

        @serialize()
        public get lodGenerationOffset(): number {
            if (this._texture) return this._texture._lodGenerationOffset;

            return 0.0;
        }
        public set lodGenerationOffset(value: number) {
            if (this._texture) this._texture._lodGenerationOffset = value;
        }

        @serialize()
        public get lodGenerationScale(): number {
            if (this._texture) return this._texture._lodGenerationScale;

            return 0.0;
        }
        public set lodGenerationScale(value: number) {
            if (this._texture) this._texture._lodGenerationScale = value;
        }

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

        public getClassName(): string {
            return "BaseTexture";
        }

        public animations = new Array<Animation>();

        /**
        * An event triggered when the texture is disposed.
        */
        public onDisposeObservable = new Observable<BaseTexture>();

        private _onDisposeObserver: Nullable<Observer<BaseTexture>>;
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        public delayLoadState = Engine.DELAYLOADSTATE_NONE;

        private _scene: Nullable<Scene>;
        public _texture: Nullable<InternalTexture>;
        private _uid: Nullable<string>;

        public get isBlocking(): boolean {
            return true;
        }

        constructor(scene: Nullable<Scene>) {
            this._scene = scene || Engine.LastCreatedScene;
            if (this._scene) {
                this._scene.textures.push(this);
            }
            this._uid = null;
        }

        public getScene(): Nullable<Scene> {
            return this._scene;
        }

        public getTextureMatrix(): Matrix {
            return Matrix.IdentityReadOnly;
        }

        public getReflectionTextureMatrix(): Matrix {
            return Matrix.IdentityReadOnly;
        }

        public getInternalTexture(): Nullable<InternalTexture> {
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
            if (this._texture && this._texture.width) {
                return new Size(this._texture.width, this._texture.height);
            }

            if (this._texture && this._texture._size) {
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

            return new Size(this._texture.baseWidth, this._texture.baseHeight);
        }

        public scale(ratio: number): void {
        }

        public get canRescale(): boolean {
            return false;
        }

        public _getFromCache(url: Nullable<string>, noMipmap: boolean, sampling?: number): Nullable<InternalTexture> {
            if (!this._scene) {
                return null
            }

            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];

                if (texturesCacheEntry.url === url && texturesCacheEntry.generateMipMaps === !noMipmap) {
                    if (!sampling || sampling === texturesCacheEntry.samplingMode) {
                        texturesCacheEntry.incrementReferences();
                        return texturesCacheEntry;
                    }
                }
            }

            return null;
        }

        public _rebuild(): void {

        }

        public delayLoad(): void {
        }

        public clone(): Nullable<BaseTexture> {
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

        /**
         * Reads the pixels stored in the webgl texture and returns them as an ArrayBuffer.
         * This will returns an RGBA array buffer containing either in values (0-255) or
         * float values (0-1) depending of the underlying buffer type.
         * @param faceIndex The face of the texture to read (in case of cube texture)
         * @param level The LOD level of the texture to read (in case of Mip Maps)
         * @returns The Array buffer containing the pixels data.
         */
        public readPixels(faceIndex = 0, level = 0): Nullable<ArrayBufferView> {
            if (!this._texture) {
                return null;
            }

            var size = this.getSize();
            var width = size.width;
            var height = size.height;
            let scene = this.getScene();

            if (!scene) {
                return null;
            }

            var engine = scene.getEngine();

            if (level != 0) {
                width = width / Math.pow(2, level);
                height = height / Math.pow(2, level);

                width = Math.round(width);
                height = Math.round(height);
            }

            if (this._texture.isCube) {
                return engine._readTexturePixels(this._texture, width, height, faceIndex, level);
            }

            return engine._readTexturePixels(this._texture, width, height, -1, level);
        }

        public releaseInternalTexture(): void {
            if (this._texture) {
                this._texture.dispose();
                this._texture = null;
            }
        }

        public get sphericalPolynomial(): Nullable<SphericalPolynomial> {
            if (!this._texture || !CubeMapToSphericalPolynomialTools || !this.isReady()) {
                return null;
            }

            if (!this._texture._sphericalPolynomial) {
                this._texture._sphericalPolynomial =
                    CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this);
            }

            return this._texture._sphericalPolynomial;
        }

        public set sphericalPolynomial(value: Nullable<SphericalPolynomial>) {
            if (this._texture) {
                this._texture._sphericalPolynomial = value;
            }
        }

        public get _lodTextureHigh(): Nullable<BaseTexture> {
            if (this._texture) {
                return this._texture._lodTextureHigh;
            }
            return null;
        }

        public get _lodTextureMid(): Nullable<BaseTexture> {
            if (this._texture) {
                return this._texture._lodTextureMid;
            }
            return null;
        }

        public get _lodTextureLow(): Nullable<BaseTexture> {
            if (this._texture) {
                return this._texture._lodTextureLow;
            }
            return null;
        }

        public dispose(): void {
            if (!this._scene) {
                return;
            }

            // Animations
            this._scene.stopAnimation(this);

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

        public static WhenAllReady(textures: BaseTexture[], callback: () => void): void {
            let numRemaining = textures.length;
            if (numRemaining === 0) {
                callback();
                return;
            }

            for (var i = 0; i < textures.length; i++) {
                var texture = textures[i];

                if (texture.isReady()) {
                    if (--numRemaining === 0) {
                        callback();
                    }
                }
                else {
                    var onLoadObservable = (texture as any).onLoadObservable as Observable<Texture>;

                    let onLoadCallback = () => {
                        onLoadObservable.removeCallback(onLoadCallback);
                        if (--numRemaining === 0) {
                            callback();
                        }
                    };

                    onLoadObservable.add(onLoadCallback);
                }
            }
        }
    }
} 
