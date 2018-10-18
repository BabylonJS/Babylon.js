module BABYLON {
    /**
     * Base class of all the textures in babylon.
     * It groups all the common properties the materials, post process, lights... might need
     * in order to make a correct use of the texture.
     */
    export class BaseTexture {
        /**
         * Default anisotropic filtering level for the application.
         * It is set to 4 as a good tradeoff between perf and quality.
         */
        public static DEFAULT_ANISOTROPIC_FILTERING_LEVEL = 4;

        /**
         * Define the name of the texture.
         */
        @serialize()
        public name: string;

        @serialize("hasAlpha")
        private _hasAlpha = false;
        /**
         * Define if the texture is having a usable alpha value (can be use for transparency or glossiness for instance).
         */
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

        /**
         * Defines if the alpha value should be determined via the rgb values.
         * If true the luminance of the pixel might be used to find the corresponding alpha value.
         */
        @serialize()
        public getAlphaFromRGB = false;

        /**
         * Intensity or strength of the texture.
         * It is commonly used by materials to fine tune the intensity of the texture
         */
        @serialize()
        public level = 1;

        /**
         * Define the UV chanel to use starting from 0 and defaulting to 0.
         * This is part of the texture as textures usually maps to one uv set.
         */
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

        /**
         * With compliant hardware and browser (supporting anisotropic filtering)
         * this defines the level of anisotropic filtering in the texture.
         * The higher the better but the slower. This defaults to 4 as it seems to be the best tradeoff.
         */
        @serialize()
        public anisotropicFilteringLevel = BaseTexture.DEFAULT_ANISOTROPIC_FILTERING_LEVEL;

        /**
         * Define if the texture is a cube texture or if false a 2d texture.
         */
        @serialize()
        public isCube = false;

        /**
         * Define if the texture is a 3d texture (webgl 2) or if false a 2d texture.
         */
        @serialize()
        public is3D = false;

        /**
         * Define if the texture contains data in gamma space (most of the png/jpg aside bump).
         * HDR texture are usually stored in linear space.
         * This only impacts the PBR and Background materials
         */
        @serialize()
        public gammaSpace = true;

        /**
         * Gets whether or not the texture contains RGBD data.
         */
        public get isRGBD(): boolean {
            return this._texture != null && this._texture._isRGBD;
        }

        /**
         * Is Z inverted in the texture (useful in a cube texture).
         */
        @serialize()
        public invertZ = false;

        /**
         * @hidden
         */
        @serialize()
        public lodLevelInAlpha = false;

        /**
         * With prefiltered texture, defined the offset used during the prefiltering steps.
         */
        @serialize()
        public get lodGenerationOffset(): number {
            if (this._texture) { return this._texture._lodGenerationOffset; }

            return 0.0;
        }
        public set lodGenerationOffset(value: number) {
            if (this._texture) { this._texture._lodGenerationOffset = value; }
        }

        /**
         * With prefiltered texture, defined the scale used during the prefiltering steps.
         */
        @serialize()
        public get lodGenerationScale(): number {
            if (this._texture) { return this._texture._lodGenerationScale; }

            return 0.0;
        }
        public set lodGenerationScale(value: number) {
            if (this._texture) { this._texture._lodGenerationScale = value; }
        }

        /**
         * Define if the texture is a render target.
         */
        @serialize()
        public isRenderTarget = false;

        /**
         * Define the unique id of the texture in the scene.
         */
        public get uid(): string {
            if (!this._uid) {
                this._uid = Tools.RandomId();
            }
            return this._uid;
        }

        /**
         * Return a string representation of the texture.
         * @returns the texture as a string
         */
        public toString(): string {
            return this.name;
        }

        /**
         * Get the class name of the texture.
         * @returns "BaseTexture"
         */
        public getClassName(): string {
            return "BaseTexture";
        }

        /**
         * Define the list of animation attached to the texture.
         */
        public animations = new Array<Animation>();

        /**
        * An event triggered when the texture is disposed.
        */
        public onDisposeObservable = new Observable<BaseTexture>();

        private _onDisposeObserver: Nullable<Observer<BaseTexture>>;
        /**
         * Callback triggered when the texture has been disposed.
         * Kept for back compatibility, you can use the onDisposeObservable instead.
         */
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
         * Define the current state of the loading sequence when in delayed load mode.
         */
        public delayLoadState = Engine.DELAYLOADSTATE_NONE;

        private _scene: Nullable<Scene>;

        /** @hidden */
        public _texture: Nullable<InternalTexture>;
        private _uid: Nullable<string>;

        /**
         * Define if the texture is preventinga material to render or not.
         * If not and the texture is not ready, the engine will use a default black texture instead.
         */
        public get isBlocking(): boolean {
            return true;
        }

        /**
         * Instantiates a new BaseTexture.
         * Base class of all the textures in babylon.
         * It groups all the common properties the materials, post process, lights... might need
         * in order to make a correct use of the texture.
         * @param scene Define the scene the texture blongs to
         */
        constructor(scene: Nullable<Scene>) {
            this._scene = scene || Engine.LastCreatedScene;
            if (this._scene) {
                this._scene.textures.push(this);
                this._scene.onNewTextureAddedObservable.notifyObservers(this);
            }
            this._uid = null;
        }

        /**
         * Get the scene the texture belongs to.
         * @returns the scene or null if undefined
         */
        public getScene(): Nullable<Scene> {
            return this._scene;
        }

        /**
         * Get the texture transform matrix used to offset tile the texture for istance.
         * @returns the transformation matrix
         */
        public getTextureMatrix(): Matrix {
            return <Matrix>Matrix.IdentityReadOnly;
        }

        /**
         * Get the texture reflection matrix used to rotate/transform the reflection.
         * @returns the reflection matrix
         */
        public getReflectionTextureMatrix(): Matrix {
            return <Matrix>Matrix.IdentityReadOnly;
        }

        /**
         * Get the underlying lower level texture from Babylon.
         * @returns the insternal texture
         */
        public getInternalTexture(): Nullable<InternalTexture> {
            return this._texture;
        }

        /**
         * Get if the texture is ready to be consumed (either it is ready or it is not blocking)
         * @returns true if ready or not blocking
         */
        public isReadyOrNotBlocking(): boolean {
            return !this.isBlocking || this.isReady();
        }

        /**
         * Get if the texture is ready to be used (downloaded, converted, mip mapped...).
         * @returns true if fully ready
         */
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

        private _cachedSize: ISize = Size.Zero();
        /**
         * Get the size of the texture.
         * @returns the texture size.
         */
        public getSize(): ISize {
            if (this._texture) {
                if (this._texture.width) {
                    this._cachedSize.width = this._texture.width;
                    this._cachedSize.height = this._texture.height;
                    return this._cachedSize;
                }

                if (this._texture._size) {
                    this._cachedSize.width = this._texture._size;
                    this._cachedSize.height = this._texture._size;
                    return this._cachedSize;
                }
            }

            return this._cachedSize;
        }

        /**
         * Get the base size of the texture.
         * It can be different from the size if the texture has been resized for POT for instance
         * @returns the base size
         */
        public getBaseSize(): ISize {
            if (!this.isReady() || !this._texture) {
                return Size.Zero();
            }

            if (this._texture._size) {
                return new Size(this._texture._size, this._texture._size);
            }

            return new Size(this._texture.baseWidth, this._texture.baseHeight);
        }

        /**
         * Scales the texture if is `canRescale()`
         * @param ratio the resize factor we want to use to rescale
         */
        public scale(ratio: number): void {
        }

        /**
         * Get if the texture can rescale.
         */
        public get canRescale(): boolean {
            return false;
        }

        /** @hidden */
        public _getFromCache(url: Nullable<string>, noMipmap: boolean, sampling?: number): Nullable<InternalTexture> {
            if (!this._scene) {
                return null;
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

        /** @hidden */
        public _rebuild(): void {

        }

        /**
         * Triggers the load sequence in delayed load mode.
         */
        public delayLoad(): void {
        }

        /**
         * Clones the texture.
         * @returns the cloned texture
         */
        public clone(): Nullable<BaseTexture> {
            return null;
        }

        /**
         * Get the texture underlying type (INT, FLOAT...)
         */
        public get textureType(): number {
            if (!this._texture) {
                return Engine.TEXTURETYPE_UNSIGNED_INT;
            }

            return (this._texture.type !== undefined) ? this._texture.type : Engine.TEXTURETYPE_UNSIGNED_INT;
        }

        /**
         * Get the texture underlying format (RGB, RGBA...)
         */
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
         * @param faceIndex defines the face of the texture to read (in case of cube texture)
         * @param level defines the LOD level of the texture to read (in case of Mip Maps)
         * @param buffer defines a user defined buffer to fill with data (can be null)
         * @returns The Array buffer containing the pixels data.
         */
        public readPixels(faceIndex = 0, level = 0, buffer: Nullable<ArrayBufferView> = null): Nullable<ArrayBufferView> {
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
                return engine._readTexturePixels(this._texture, width, height, faceIndex, level, buffer);
            }

            return engine._readTexturePixels(this._texture, width, height, -1, level, buffer);
        }

        /**
         * Release and destroy the underlying lower level texture aka internalTexture.
         */
        public releaseInternalTexture(): void {
            if (this._texture) {
                this._texture.dispose();
                this._texture = null;
            }
        }

        /**
         * Get the polynomial representation of the texture data.
         * This is mainly use as a fast way to recover IBL Diffuse irradiance data.
         * @see https://learnopengl.com/PBR/IBL/Diffuse-irradiance
         */
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

        /** @hidden */
        public get _lodTextureHigh(): Nullable<BaseTexture> {
            if (this._texture) {
                return this._texture._lodTextureHigh;
            }
            return null;
        }

        /** @hidden */
        public get _lodTextureMid(): Nullable<BaseTexture> {
            if (this._texture) {
                return this._texture._lodTextureMid;
            }
            return null;
        }

        /** @hidden */
        public get _lodTextureLow(): Nullable<BaseTexture> {
            if (this._texture) {
                return this._texture._lodTextureLow;
            }
            return null;
        }

        /**
         * Dispose the texture and release its associated resources.
         */
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
            this._scene.onTextureRemovedObservable.notifyObservers(this);

            if (this._texture === undefined) {
                return;
            }

            // Release
            this.releaseInternalTexture();

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
        }

        /**
         * Serialize the texture into a JSON representation that can be parsed later on.
         * @returns the JSON representation of the texture
         */
        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject = SerializationHelper.Serialize(this);

            // Animations
            Animation.AppendSerializedAnimations(this, serializationObject);

            return serializationObject;
        }

        /**
         * Helper function to be called back once a list of texture contains only ready textures.
         * @param textures Define the list of textures to wait for
         * @param callback Define the callback triggered once the entire list will be ready
         */
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
