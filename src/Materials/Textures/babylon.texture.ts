module BABYLON {
    /**
     * This represents a texture in babylon. It can be easily loaded from a network, base64 or html input.
     * @see http://doc.babylonjs.com/babylon101/materials#texture
     */
    export class Texture extends BaseTexture {
        /** nearest is mag = nearest and min = nearest and mip = linear */
        public static readonly NEAREST_SAMPLINGMODE = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
        /** nearest is mag = nearest and min = nearest and mip = linear */
        public static readonly NEAREST_NEAREST_MIPLINEAR = Engine.TEXTURE_NEAREST_NEAREST_MIPLINEAR; // nearest is mag = nearest and min = nearest and mip = linear

        /** Bilinear is mag = linear and min = linear and mip = nearest */
        public static readonly BILINEAR_SAMPLINGMODE = Engine.TEXTURE_BILINEAR_SAMPLINGMODE;
        /** Bilinear is mag = linear and min = linear and mip = nearest */
        public static readonly LINEAR_LINEAR_MIPNEAREST = Engine.TEXTURE_LINEAR_LINEAR_MIPNEAREST; // Bilinear is mag = linear and min = linear and mip = nearest

        /** Trilinear is mag = linear and min = linear and mip = linear */
        public static readonly TRILINEAR_SAMPLINGMODE = Engine.TEXTURE_TRILINEAR_SAMPLINGMODE;
        /** Trilinear is mag = linear and min = linear and mip = linear */
        public static readonly LINEAR_LINEAR_MIPLINEAR = Engine.TEXTURE_LINEAR_LINEAR_MIPLINEAR; // Trilinear is mag = linear and min = linear and mip = linear

        /** mag = nearest and min = nearest and mip = nearest */
        public static readonly NEAREST_NEAREST_MIPNEAREST = Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
        /** mag = nearest and min = linear and mip = nearest */
        public static readonly NEAREST_LINEAR_MIPNEAREST = Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
        /** mag = nearest and min = linear and mip = linear */
        public static readonly NEAREST_LINEAR_MIPLINEAR = Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
        /** mag = nearest and min = linear and mip = none */
        public static readonly NEAREST_LINEAR = Engine.TEXTURE_NEAREST_LINEAR;
        /** mag = nearest and min = nearest and mip = none */
        public static readonly NEAREST_NEAREST = Engine.TEXTURE_NEAREST_NEAREST;
        /** mag = linear and min = nearest and mip = nearest */
        public static readonly LINEAR_NEAREST_MIPNEAREST = Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
        /** mag = linear and min = nearest and mip = linear */
        public static readonly LINEAR_NEAREST_MIPLINEAR = Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
        /** mag = linear and min = linear and mip = none */
        public static readonly LINEAR_LINEAR = Engine.TEXTURE_LINEAR_LINEAR;
        /** mag = linear and min = nearest and mip = none */
        public static readonly LINEAR_NEAREST = Engine.TEXTURE_LINEAR_NEAREST;

        /** Explicit coordinates mode */
        public static readonly EXPLICIT_MODE = Engine.TEXTURE_EXPLICIT_MODE;
        /** Spherical coordinates mode */
        public static readonly SPHERICAL_MODE = Engine.TEXTURE_SPHERICAL_MODE;
        /** Planar coordinates mode */
        public static readonly PLANAR_MODE = Engine.TEXTURE_PLANAR_MODE;
        /** Cubic coordinates mode */
        public static readonly CUBIC_MODE = Engine.TEXTURE_CUBIC_MODE;
        /** Projection coordinates mode */
        public static readonly PROJECTION_MODE = Engine.TEXTURE_PROJECTION_MODE;
        /** Inverse Cubic coordinates mode */
        public static readonly SKYBOX_MODE = Engine.TEXTURE_SKYBOX_MODE;
        /** Inverse Cubic coordinates mode */
        public static readonly INVCUBIC_MODE = Engine.TEXTURE_INVCUBIC_MODE;
        /** Equirectangular coordinates mode */
        public static readonly EQUIRECTANGULAR_MODE = Engine.TEXTURE_EQUIRECTANGULAR_MODE;
        /** Equirectangular Fixed coordinates mode */
        public static readonly FIXED_EQUIRECTANGULAR_MODE = Engine.TEXTURE_FIXED_EQUIRECTANGULAR_MODE;
        /** Equirectangular Fixed Mirrored coordinates mode */
        public static readonly FIXED_EQUIRECTANGULAR_MIRRORED_MODE = Engine.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE;

        /** Texture is not repeating outside of 0..1 UVs */
        public static readonly CLAMP_ADDRESSMODE = Engine.TEXTURE_CLAMP_ADDRESSMODE;
        /** Texture is repeating outside of 0..1 UVs */
        public static readonly WRAP_ADDRESSMODE = Engine.TEXTURE_WRAP_ADDRESSMODE;
        /** Texture is repeating and mirrored */
        public static readonly MIRROR_ADDRESSMODE = Engine.TEXTURE_MIRROR_ADDRESSMODE;

        /**
         * Gets or sets a boolean which defines if the texture url must be build from the serialized URL instead of just using the name and loading them side by side with the scene file
         */
        public static UseSerializedUrlIfAny = false;

        /**
         * Define the url of the texture.
         */
        @serialize()
        public url: Nullable<string>;

        /**
         * Define an offset on the texture to offset the u coordinates of the UVs
         * @see http://doc.babylonjs.com/how_to/more_materials#offsetting
         */
        @serialize()
        public uOffset = 0;

        /**
         * Define an offset on the texture to offset the v coordinates of the UVs
         * @see http://doc.babylonjs.com/how_to/more_materials#offsetting
         */
        @serialize()
        public vOffset = 0;

        /**
         * Define an offset on the texture to scale the u coordinates of the UVs
         * @see http://doc.babylonjs.com/how_to/more_materials#tiling
         */
        @serialize()
        public uScale = 1.0;

        /**
         * Define an offset on the texture to scale the v coordinates of the UVs
         * @see http://doc.babylonjs.com/how_to/more_materials#tiling
         */
        @serialize()
        public vScale = 1.0;

        /**
         * Define an offset on the texture to rotate around the u coordinates of the UVs
         * @see http://doc.babylonjs.com/how_to/more_materials
         */
        @serialize()
        public uAng = 0;

        /**
         * Define an offset on the texture to rotate around the v coordinates of the UVs
         * @see http://doc.babylonjs.com/how_to/more_materials
         */
        @serialize()
        public vAng = 0;

        /**
         * Define an offset on the texture to rotate around the w coordinates of the UVs (in case of 3d texture)
         * @see http://doc.babylonjs.com/how_to/more_materials
         */
        @serialize()
        public wAng = 0;

        /**
         * Defines the center of rotation (U)
         */
        @serialize()
        public uRotationCenter = 0.5;

        /**
         * Defines the center of rotation (V)
         */
        @serialize()
        public vRotationCenter = 0.5;

        /**
         * Defines the center of rotation (W)
         */
        @serialize()
        public wRotationCenter = 0.5;

        /**
         * Are mip maps generated for this texture or not.
         */
        get noMipmap(): boolean {
            return this._noMipmap;
        }

        private _noMipmap: boolean;
        /** @hidden */
        public _invertY: boolean;
        private _rowGenerationMatrix: Matrix;
        private _cachedTextureMatrix: Matrix;
        private _projectionModeMatrix: Matrix;
        private _t0: Vector3;
        private _t1: Vector3;
        private _t2: Vector3;

        private _cachedUOffset: number;
        private _cachedVOffset: number;
        private _cachedUScale: number;
        private _cachedVScale: number;
        private _cachedUAng: number;
        private _cachedVAng: number;
        private _cachedWAng: number;
        private _cachedProjectionMatrixId: number;
        private _cachedCoordinatesMode: number;
        /** @hidden */
        public _samplingMode: number;
        /** @hidden */
        public _buffer: Nullable<string | ArrayBuffer | HTMLImageElement | Blob>;
        private _deleteBuffer: boolean;
        protected _format: Nullable<number>;
        private _delayedOnLoad: Nullable<() => void>;
        private _delayedOnError: Nullable<() => void>;

        /**
         * Observable triggered once the texture has been loaded.
         */
        public onLoadObservable: Observable<Texture> = new Observable<Texture>();

        protected _isBlocking: boolean = true;
        /**
         * Is the texture preventing material to render while loading.
         * If false, a default texture will be used instead of the loading one during the preparation step.
         */
        public set isBlocking(value: boolean) {
            this._isBlocking = value;
        }
        @serialize()
        public get isBlocking(): boolean {
            return this._isBlocking;
        }

        /**
         * Get the current sampling mode associated with the texture.
         */
        public get samplingMode(): number {
            return this._samplingMode;
        }

        /**
         * Instantiates a new texture.
         * This represents a texture in babylon. It can be easily loaded from a network, base64 or html input.
         * @see http://doc.babylonjs.com/babylon101/materials#texture
         * @param url define the url of the picture to load as a texture
         * @param scene define the scene the texture will belong to
         * @param noMipmap define if the texture will require mip maps or not
         * @param invertY define if the texture needs to be inverted on the y axis during loading
         * @param samplingMode define the sampling mode we want for the texture while fectching from it (Texture.NEAREST_SAMPLINGMODE...)
         * @param onLoad define a callback triggered when the texture has been loaded
         * @param onError define a callback triggered when an error occurred during the loading session
         * @param buffer define the buffer to load the texture from in case the texture is loaded from a buffer representation
         * @param deleteBuffer define if the buffer we are loading the texture from should be deleted after load
         * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
         */
        constructor(url: Nullable<string>, scene: Nullable<Scene>, noMipmap: boolean = false, invertY: boolean = true, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, buffer: Nullable<string | ArrayBuffer | HTMLImageElement | Blob> = null, deleteBuffer: boolean = false, format?: number) {
            super(scene);

            this.name = url || "";
            this.url = url;
            this._noMipmap = noMipmap;
            this._invertY = invertY;
            this._samplingMode = samplingMode;
            this._buffer = buffer;
            this._deleteBuffer = deleteBuffer;
            if (format) {
                this._format = format;
            }

            scene = this.getScene();

            if (!scene) {
                return;
            }
            scene.getEngine().onBeforeTextureInitObservable.notifyObservers(this);

            let load = () => {
                if (this.onLoadObservable.hasObservers()) {
                    this.onLoadObservable.notifyObservers(this);
                }
                if (onLoad) {
                    onLoad();
                }

                if (!this.isBlocking && scene) {
                    scene.resetCachedMaterial();
                }
            };

            if (!this.url) {
                this._delayedOnLoad = load;
                this._delayedOnError = onError;
                return;
            }

            this._texture = this._getFromCache(this.url, noMipmap, samplingMode);

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this._texture = scene.getEngine().createTexture(this.url, noMipmap, invertY, scene, this._samplingMode, load, onError, this._buffer, undefined, this._format);
                    if (deleteBuffer) {
                        delete this._buffer;
                    }
                } else {
                    this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;

                    this._delayedOnLoad = load;
                    this._delayedOnError = onError;
                }
            } else {
                if (this._texture.isReady) {
                    Tools.SetImmediate(() => load());
                } else {
                    this._texture.onLoadedObservable.add(load);
                }
            }
        }

        /**
         * Update the url (and optional buffer) of this texture if url was null during construction.
         * @param url the url of the texture
         * @param buffer the buffer of the texture (defaults to null)
         */
        public updateURL(url: string, buffer: Nullable<string | ArrayBuffer | HTMLImageElement | Blob> = null): void {
            if (this.url) {
                throw new Error("URL is already set");
            }

            this.url = url;
            this._buffer = buffer;
            this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
            this.delayLoad();
        }

        /**
         * Finish the loading sequence of a texture flagged as delayed load.
         * @hidden
         */
        public delayLoad(): void {
            if (this.delayLoadState !== Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }

            let scene = this.getScene();

            if (!scene) {
                return;
            }

            this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap, this._samplingMode);

            if (!this._texture) {
                this._texture = scene.getEngine().createTexture(this.url, this._noMipmap, this._invertY, scene, this._samplingMode, this._delayedOnLoad, this._delayedOnError, this._buffer, null, this._format);
                if (this._deleteBuffer) {
                    delete this._buffer;
                }
            } else {
                if (this._delayedOnLoad) {
                    if (this._texture.isReady) {
                        Tools.SetImmediate(this._delayedOnLoad);
                    } else {
                        this._texture.onLoadedObservable.add(this._delayedOnLoad);
                    }
                }
            }

            this._delayedOnLoad = null;
            this._delayedOnError = null;
        }

        /**
          * Update the sampling mode of the texture.
         * Default is Trilinear mode.
         *
         * | Value | Type               | Description |
         * | ----- | ------------------ | ----------- |
         * | 1     | NEAREST_SAMPLINGMODE or NEAREST_NEAREST_MIPLINEAR  | Nearest is: mag = nearest, min = nearest, mip = linear |
         * | 2     | BILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPNEAREST | Bilinear is: mag = linear, min = linear, mip = nearest |
         * | 3     | TRILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPLINEAR | Trilinear is: mag = linear, min = linear, mip = linear |
         * | 4     | NEAREST_NEAREST_MIPNEAREST |             |
         * | 5    | NEAREST_LINEAR_MIPNEAREST |             |
         * | 6    | NEAREST_LINEAR_MIPLINEAR |             |
         * | 7    | NEAREST_LINEAR |             |
         * | 8    | NEAREST_NEAREST |             |
         * | 9   | LINEAR_NEAREST_MIPNEAREST |             |
         * | 10   | LINEAR_NEAREST_MIPLINEAR |             |
         * | 11   | LINEAR_LINEAR |             |
         * | 12   | LINEAR_NEAREST |             |
         *
         *    > _mag_: magnification filter (close to the viewer)
         *    > _min_: minification filter (far from the viewer)
         *    > _mip_: filter used between mip map levels
         *@param samplingMode Define the new sampling mode of the texture
         */
        public updateSamplingMode(samplingMode: number): void {
            if (!this._texture) {
                return;
            }

            let scene = this.getScene();

            if (!scene) {
                return;
            }

            this._samplingMode = samplingMode;
            scene.getEngine().updateTextureSamplingMode(samplingMode, this._texture);
        }

        private _prepareRowForTextureGeneration(x: number, y: number, z: number, t: Vector3): void {
            x *= this.uScale;
            y *= this.vScale;

            x -= this.uRotationCenter * this.uScale;
            y -= this.vRotationCenter * this.vScale;
            z -= this.wRotationCenter;

            Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, this._rowGenerationMatrix, t);

            t.x += this.uRotationCenter * this.uScale + this.uOffset;
            t.y += this.vRotationCenter * this.vScale + this.vOffset;
            t.z += this.wRotationCenter;
        }

        /**
         * Get the current texture matrix which includes the requested offsetting, tiling and rotation components.
         * @returns the transform matrix of the texture.
         */
        public getTextureMatrix(): Matrix {
            if (
                this.uOffset === this._cachedUOffset &&
                this.vOffset === this._cachedVOffset &&
                this.uScale === this._cachedUScale &&
                this.vScale === this._cachedVScale &&
                this.uAng === this._cachedUAng &&
                this.vAng === this._cachedVAng &&
                this.wAng === this._cachedWAng) {
                return this._cachedTextureMatrix;
            }

            this._cachedUOffset = this.uOffset;
            this._cachedVOffset = this.vOffset;
            this._cachedUScale = this.uScale;
            this._cachedVScale = this.vScale;
            this._cachedUAng = this.uAng;
            this._cachedVAng = this.vAng;
            this._cachedWAng = this.wAng;

            if (!this._cachedTextureMatrix) {
                this._cachedTextureMatrix = Matrix.Zero();
                this._rowGenerationMatrix = new Matrix();
                this._t0 = Vector3.Zero();
                this._t1 = Vector3.Zero();
                this._t2 = Vector3.Zero();
            }

            Matrix.RotationYawPitchRollToRef(this.vAng, this.uAng, this.wAng, this._rowGenerationMatrix);

            this._prepareRowForTextureGeneration(0, 0, 0, this._t0);
            this._prepareRowForTextureGeneration(1.0, 0, 0, this._t1);
            this._prepareRowForTextureGeneration(0, 1.0, 0, this._t2);

            this._t1.subtractInPlace(this._t0);
            this._t2.subtractInPlace(this._t0);

            Matrix.FromValuesToRef(
                this._t1.x, this._t1.y, this._t1.z, 0.0,
                this._t2.x, this._t2.y, this._t2.z, 0.0,
                this._t0.x, this._t0.y, this._t0.z, 0.0,
                       0.0,        0.0,        0.0, 1.0,
                this._cachedTextureMatrix
            );

            let scene = this.getScene();

            if (!scene) {
                return this._cachedTextureMatrix;
            }

            scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });

            return this._cachedTextureMatrix;
        }

        /**
         * Get the current matrix used to apply reflection. This is useful to rotate an environment texture for instance.
         * @returns The reflection texture transform
         */
        public getReflectionTextureMatrix(): Matrix {
            let scene = this.getScene();

            if (!scene) {
                return this._cachedTextureMatrix;
            }

            if (
                this.uOffset === this._cachedUOffset &&
                this.vOffset === this._cachedVOffset &&
                this.uScale === this._cachedUScale &&
                this.vScale === this._cachedVScale &&
                this.coordinatesMode === this._cachedCoordinatesMode) {
                if (this.coordinatesMode === Texture.PROJECTION_MODE) {
                    if (this._cachedProjectionMatrixId === scene.getProjectionMatrix().updateFlag) {
                        return this._cachedTextureMatrix;
                    }
                } else {
                    return this._cachedTextureMatrix;
                }
            }

            if (!this._cachedTextureMatrix) {
                this._cachedTextureMatrix = Matrix.Zero();
            }

            if (!this._projectionModeMatrix) {
                this._projectionModeMatrix = Matrix.Zero();
            }

            this._cachedUOffset = this.uOffset;
            this._cachedVOffset = this.vOffset;
            this._cachedUScale = this.uScale;
            this._cachedVScale = this.vScale;
            this._cachedCoordinatesMode = this.coordinatesMode;

            switch (this.coordinatesMode) {
                case Texture.PLANAR_MODE:
                    Matrix.IdentityToRef(this._cachedTextureMatrix);
                    (<any>this._cachedTextureMatrix)[0] = this.uScale;
                    (<any>this._cachedTextureMatrix)[5] = this.vScale;
                    (<any>this._cachedTextureMatrix)[12] = this.uOffset;
                    (<any>this._cachedTextureMatrix)[13] = this.vOffset;
                    break;
                case Texture.PROJECTION_MODE:
                    Matrix.FromValuesToRef(
                        0.5,  0.0, 0.0, 0.0,
                        0.0, -0.5, 0.0, 0.0,
                        0.0,  0.0, 0.0, 0.0,
                        0.5,  0.5, 1.0, 1.0,
                        this._projectionModeMatrix
                    );

                    let projectionMatrix = scene.getProjectionMatrix();
                    this._cachedProjectionMatrixId = projectionMatrix.updateFlag;
                    projectionMatrix.multiplyToRef(this._projectionModeMatrix, this._cachedTextureMatrix);
                    break;
                default:
                    Matrix.IdentityToRef(this._cachedTextureMatrix);
                    break;
            }

            scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag, (mat) => {
                return (mat.getActiveTextures().indexOf(this) !== -1);
            });

            return this._cachedTextureMatrix;
        }

        /**
         * Clones the texture.
         * @returns the cloned texture
         */
        public clone(): Texture {
            return SerializationHelper.Clone(() => {
                return new Texture(this._texture ? this._texture.url : null, this.getScene(), this._noMipmap, this._invertY, this._samplingMode);
            }, this);
        }

        /**
         * Serialize the texture to a JSON representation we can easily use in the resepective Parse function.
         * @returns The JSON representation of the texture
         */
        public serialize(): any {
            var serializationObject = super.serialize();

            if (typeof this._buffer === "string" && (this._buffer as string).substr(0, 5) === "data:") {
                serializationObject.base64String = this._buffer;
                serializationObject.name = serializationObject.name.replace("data:", "");
            }

            serializationObject.invertY = this._invertY;
            serializationObject.samplingMode = this.samplingMode;

            return serializationObject;
        }

        /**
         * Get the current class name of the texture usefull for serialization or dynamic coding.
         * @returns "Texture"
         */
        public getClassName(): string {
            return "Texture";
        }

        /**
         * Dispose the texture and release its associated resources.
         */
        public dispose(): void {
            super.dispose();

            this.onLoadObservable.clear();

            this._delayedOnLoad = null;
            this._delayedOnError = null;
        }

        /**
         * Parse the JSON representation of a texture in order to recreate the texture in the given scene.
         * @param parsedTexture Define the JSON representation of the texture
         * @param scene Define the scene the parsed texture should be instantiated in
         * @param rootUrl Define the root url of the parsing sequence in the case of relative dependencies
         * @returns The parsed texture if successful
         */
        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<BaseTexture> {
            if (parsedTexture.customType) {
                var customTexture = Tools.Instantiate(parsedTexture.customType);
                // Update Sampling Mode
                var parsedCustomTexture: any = customTexture.Parse(parsedTexture, scene, rootUrl);
                if (parsedTexture.samplingMode && parsedCustomTexture.updateSamplingMode && parsedCustomTexture._samplingMode) {
                    if (parsedCustomTexture._samplingMode !== parsedTexture.samplingMode) {
                        parsedCustomTexture.updateSamplingMode(parsedTexture.samplingMode);
                    }
                }
                return parsedCustomTexture;
            }

            if (parsedTexture.isCube) {
                return CubeTexture.Parse(parsedTexture, scene, rootUrl);
            }

            if (!parsedTexture.name && !parsedTexture.isRenderTarget) {
                return null;
            }

            var texture = SerializationHelper.Parse(() => {
                var generateMipMaps: boolean = true;
                if (parsedTexture.noMipmap) {
                    generateMipMaps = false;
                }
                if (parsedTexture.mirrorPlane) {
                    var mirrorTexture = new MirrorTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene, generateMipMaps);
                    mirrorTexture._waitingRenderList = parsedTexture.renderList;
                    mirrorTexture.mirrorPlane = Plane.FromArray(parsedTexture.mirrorPlane);

                    return mirrorTexture;
                } else if (parsedTexture.isRenderTarget) {
                    var renderTargetTexture = new RenderTargetTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene, generateMipMaps);
                    renderTargetTexture._waitingRenderList = parsedTexture.renderList;

                    return renderTargetTexture;
                } else {
                    var texture: Texture;
                    if (parsedTexture.base64String) {
                        texture = Texture.CreateFromBase64String(parsedTexture.base64String, parsedTexture.name, scene, !generateMipMaps);
                    } else {
                        let url = rootUrl + parsedTexture.name;

                        if (Texture.UseSerializedUrlIfAny && parsedTexture.url) {
                            url = parsedTexture.url;
                        }
                        texture = new Texture(url, scene, !generateMipMaps, parsedTexture.invertY);
                    }

                    return texture;
                }
            }, parsedTexture, scene);

            // Update Sampling Mode
            if (parsedTexture.samplingMode) {
                var sampling: number = parsedTexture.samplingMode;
                if (texture._samplingMode !== sampling) {
                    texture.updateSamplingMode(sampling);
                }
            }

            // Animations
            if (parsedTexture.animations) {
                for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    var parsedAnimation = parsedTexture.animations[animationIndex];

                    texture.animations.push(Animation.Parse(parsedAnimation));
                }
            }

            return texture;
        }

        /**
         * Creates a texture from its base 64 representation.
         * @param data Define the base64 payload without the data: prefix
         * @param name Define the name of the texture in the scene useful fo caching purpose for instance
         * @param scene Define the scene the texture should belong to
         * @param noMipmap Forces the texture to not create mip map information if true
         * @param invertY define if the texture needs to be inverted on the y axis during loading
         * @param samplingMode define the sampling mode we want for the texture while fectching from it (Texture.NEAREST_SAMPLINGMODE...)
         * @param onLoad define a callback triggered when the texture has been loaded
         * @param onError define a callback triggered when an error occurred during the loading session
         * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
         * @returns the created texture
         */
        public static CreateFromBase64String(data: string, name: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
            onLoad: Nullable<() => void> = null, onError: Nullable<() => void> = null, format: number = Engine.TEXTUREFORMAT_RGBA): Texture {
            return new Texture("data:" + name, scene, noMipmap, invertY, samplingMode, onLoad, onError, data, false, format);
        }

        /**
         * Creates a texture from its data: representation. (data: will be added in case only the payload has been passed in)
         * @param data Define the base64 payload without the data: prefix
         * @param name Define the name of the texture in the scene useful fo caching purpose for instance
         * @param buffer define the buffer to load the texture from in case the texture is loaded from a buffer representation
         * @param scene Define the scene the texture should belong to
         * @param deleteBuffer define if the buffer we are loading the texture from should be deleted after load
         * @param noMipmap Forces the texture to not create mip map information if true
         * @param invertY define if the texture needs to be inverted on the y axis during loading
         * @param samplingMode define the sampling mode we want for the texture while fectching from it (Texture.NEAREST_SAMPLINGMODE...)
         * @param onLoad define a callback triggered when the texture has been loaded
         * @param onError define a callback triggered when an error occurred during the loading session
         * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
         * @returns the created texture
         */
        public static LoadFromDataString(name: string, buffer: any, scene: Scene, deleteBuffer: boolean = false, noMipmap: boolean = false, invertY: boolean = true, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
            onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format: number = Engine.TEXTUREFORMAT_RGBA): Texture {
            if (name.substr(0, 5) !== "data:") {
                name = "data:" + name;
            }

            return new Texture(name, scene, noMipmap, invertY, samplingMode, onLoad, onError, buffer, deleteBuffer, format);
        }
    }
}
