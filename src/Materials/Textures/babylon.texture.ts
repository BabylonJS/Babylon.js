module BABYLON {
    export class Texture extends BaseTexture {
        // Constants
        public static NEAREST_SAMPLINGMODE = 1;
        public static NEAREST_NEAREST_MIPLINEAR = 1; // nearest is mag = nearest and min = nearest and mip = linear

        public static BILINEAR_SAMPLINGMODE = 2;
        public static LINEAR_LINEAR_MIPNEAREST = 2; // Bilinear is mag = linear and min = linear and mip = nearest

        public static TRILINEAR_SAMPLINGMODE = 3;
        public static LINEAR_LINEAR_MIPLINEAR = 3; // Trilinear is mag = linear and min = linear and mip = linear

        public static NEAREST_NEAREST_MIPNEAREST = 4;
        public static NEAREST_LINEAR_MIPNEAREST = 5;
        public static NEAREST_LINEAR_MIPLINEAR = 6;
        public static NEAREST_LINEAR = 7;
        public static NEAREST_NEAREST = 8;
        public static LINEAR_NEAREST_MIPNEAREST = 9;
        public static LINEAR_NEAREST_MIPLINEAR = 10;
        public static LINEAR_LINEAR = 11;
        public static LINEAR_NEAREST = 12;

        public static EXPLICIT_MODE = 0;
        public static SPHERICAL_MODE = 1;
        public static PLANAR_MODE = 2;
        public static CUBIC_MODE = 3;
        public static PROJECTION_MODE = 4;
        public static SKYBOX_MODE = 5;
        public static INVCUBIC_MODE = 6;
        public static EQUIRECTANGULAR_MODE = 7;
        public static FIXED_EQUIRECTANGULAR_MODE = 8;
        public static FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;

        public static CLAMP_ADDRESSMODE = 0;
        public static WRAP_ADDRESSMODE = 1;
        public static MIRROR_ADDRESSMODE = 2;

        // Members
        @serialize()
        public url: Nullable<string>;

        @serialize()
        public uOffset = 0;

        @serialize()
        public vOffset = 0;

        @serialize()
        public uScale = 1.0;

        @serialize()
        public vScale = 1.0;

        @serialize()
        public uAng = 0;

        @serialize()
        public vAng = 0;

        @serialize()
        public wAng = 0;

        get noMipmap(): boolean {
            return this._noMipmap;
        }

        private _noMipmap: boolean;
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
        public _samplingMode: number;
        private _buffer: any;
        private _deleteBuffer: boolean;
        protected _format: Nullable<number>;
        private _delayedOnLoad: Nullable<() => void>;
        private _delayedOnError: Nullable<() => void>;
        private _onLoadObservable: Nullable<Observable<Texture>>;

        protected _isBlocking: boolean = true;
        public set isBlocking(value: boolean) {
            this._isBlocking = value;
        }
        @serialize()
        public get isBlocking(): boolean {
            return this._isBlocking;
        }

        public get samplingMode(): number {
            return this._samplingMode;
        }

        constructor(url: Nullable<string>, scene: Nullable<Scene>, noMipmap: boolean = false, invertY: boolean = true, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, buffer: any = null, deleteBuffer: boolean = false, format?: number) {
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
                if (this._onLoadObservable && this._onLoadObservable.hasObservers()) {
                    this.onLoadObservable.notifyObservers(this);
                }
                if (onLoad) {
                    onLoad();
                }

                if (!this.isBlocking && scene) {
                    scene.resetCachedMaterial();
                }
            }

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

        public updateURL(url: string): void {
            this.url = url;
            this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
            this.delayLoad();
        }

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
                if (this._texture.isReady) {
                    Tools.SetImmediate(() => {
                        if (!this._delayedOnLoad) {
                            return;
                        }
                        this._delayedOnLoad();
                    });
                } else {
                    if (this._delayedOnLoad) {
                        this._texture.onLoadedObservable.add(this._delayedOnLoad);
                    }
                }
            }
        }

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

            x -= 0.5 * this.uScale;
            y -= 0.5 * this.vScale;
            z -= 0.5;

            Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, this._rowGenerationMatrix, t);

            t.x += 0.5 * this.uScale + this.uOffset;
            t.y += 0.5 * this.vScale + this.vOffset;
            t.z += 0.5;
        }

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

            Matrix.IdentityToRef(this._cachedTextureMatrix);
            this._cachedTextureMatrix.m[0] = this._t1.x; this._cachedTextureMatrix.m[1] = this._t1.y; this._cachedTextureMatrix.m[2] = this._t1.z;
            this._cachedTextureMatrix.m[4] = this._t2.x; this._cachedTextureMatrix.m[5] = this._t2.y; this._cachedTextureMatrix.m[6] = this._t2.z;
            this._cachedTextureMatrix.m[8] = this._t0.x; this._cachedTextureMatrix.m[9] = this._t0.y; this._cachedTextureMatrix.m[10] = this._t0.z;

            let scene = this.getScene();
            
            if (!scene) {
                return this._cachedTextureMatrix;
            }

            scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });

            return this._cachedTextureMatrix;
        }

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
                    Matrix.IdentityToRef(this._projectionModeMatrix);

                    this._projectionModeMatrix.m[0] = 0.5;
                    this._projectionModeMatrix.m[5] = -0.5;
                    this._projectionModeMatrix.m[10] = 0.0;
                    this._projectionModeMatrix.m[12] = 0.5;
                    this._projectionModeMatrix.m[13] = 0.5;
                    this._projectionModeMatrix.m[14] = 1.0;
                    this._projectionModeMatrix.m[15] = 1.0;

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

        public clone(): Texture {
            return SerializationHelper.Clone(() => {
                return new Texture(this._texture ? this._texture.url : null, this.getScene(), this._noMipmap, this._invertY, this._samplingMode);
            }, this);
        }

        public get onLoadObservable(): Observable<Texture> {
            if (!this._onLoadObservable) {
                this._onLoadObservable = new Observable<Texture>();
            }
            return this._onLoadObservable;
        }

        public serialize(): any {
            var serializationObject = super.serialize();

            if (typeof this._buffer === "string" && this._buffer.substr(0, 5) === "data:") {
                serializationObject.base64String = this._buffer;
                serializationObject.name = serializationObject.name.replace("data:", "");
            }

            return serializationObject;
        }

        public getClassName(): string {
            return "Texture";
        }

        public dispose(): void {
            super.dispose();

            if (this.onLoadObservable) {
                this.onLoadObservable.clear();
                this._onLoadObservable = null;
            }

            this._delayedOnLoad = null;
            this._delayedOnError = null;
        }

        // Statics
        public static CreateFromBase64String(data: string, name: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, 
                                            onLoad: Nullable<() => void> = null, onError: Nullable<() => void> = null, format: number = Engine.TEXTUREFORMAT_RGBA): Texture {
            return new Texture("data:" + name, scene, noMipmap, invertY, samplingMode, onLoad, onError, data, false, format);
        }

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
                        texture = new Texture(rootUrl + parsedTexture.name, scene, !generateMipMaps);
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

        public static LoadFromDataString(name: string, buffer: any, scene: Scene, deleteBuffer: boolean = false, noMipmap: boolean = false, invertY: boolean = true, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, 
                                    onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format: number = Engine.TEXTUREFORMAT_RGBA): Texture {
            if (name.substr(0, 5) !== "data:") {
                name = "data:" + name;
            }

            return new Texture(name, scene, noMipmap, invertY, samplingMode, onLoad, onError, buffer, deleteBuffer, format);
        }
    }
} 