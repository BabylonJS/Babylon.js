module BABYLON {
    export class Texture extends BaseTexture {
        // Constants
        public static NEAREST_SAMPLINGMODE = 1;
        public static BILINEAR_SAMPLINGMODE = 2;
        public static TRILINEAR_SAMPLINGMODE = 3;

        public static EXPLICIT_MODE = 0;
        public static SPHERICAL_MODE = 1;
        public static PLANAR_MODE = 2;
        public static CUBIC_MODE = 3;
        public static PROJECTION_MODE = 4;
        public static SKYBOX_MODE = 5;
        public static INVCUBIC_MODE = 6;
        public static EQUIRECTANGULAR_MODE = 7;
        public static FIXED_EQUIRECTANGULAR_MODE = 8;

        public static CLAMP_ADDRESSMODE = 0;
        public static WRAP_ADDRESSMODE = 1;
        public static MIRROR_ADDRESSMODE = 2;

        // Members
        @serialize()
        public url: string;

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
        private _cachedCoordinatesMode: number;
        public _samplingMode: number;
        private _buffer: any;
        private _deleteBuffer: boolean;
        private _delayedOnLoad: () => void;
        private _delayedOnError: () => void;

        constructor(url: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: () => void = null, onError: () => void = null, buffer: any = null, deleteBuffer: boolean = false) {
            super(scene);

            this.name = url;
            this.url = url;
            this._noMipmap = noMipmap;
            this._invertY = invertY;
            this._samplingMode = samplingMode;
            this._buffer = buffer;
            this._deleteBuffer = deleteBuffer;

            if (!url) {
                return;
            }

            this._texture = this._getFromCache(url, noMipmap, samplingMode);

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this._texture = scene.getEngine().createTexture(url, noMipmap, invertY, scene, this._samplingMode, onLoad, onError, this._buffer);
                    if (deleteBuffer) {
                        delete this._buffer;
                    }
                } else {
                    this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;

                    this._delayedOnLoad = onLoad;
                    this._delayedOnError = onError;
                }
            } else {
                Tools.SetImmediate(() => {
                    if (onLoad) {
                        onLoad();
                    }
                });
            }
        }

        public delayLoad(): void {
            if (this.delayLoadState !== Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }

            this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap, this._samplingMode);

            if (!this._texture) {
                this._texture = this.getScene().getEngine().createTexture(this.url, this._noMipmap, this._invertY, this.getScene(), this._samplingMode, this._delayedOnLoad, this._delayedOnError, this._buffer);
                if (this._deleteBuffer) {
                    delete this._buffer;
                }
            }
        }

        public updateSamplingMode(samplingMode: number): void {
            if (!this._texture) {
                return;
            }

            this._samplingMode = samplingMode;
            this.getScene().getEngine().updateTextureSamplingMode(samplingMode, this._texture);
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

            return this._cachedTextureMatrix;
        }

        public getReflectionTextureMatrix(): Matrix {
            if (
                this.uOffset === this._cachedUOffset &&
                this.vOffset === this._cachedVOffset &&
                this.uScale === this._cachedUScale &&
                this.vScale === this._cachedVScale &&
                this.coordinatesMode === this._cachedCoordinatesMode) {
                return this._cachedTextureMatrix;
            }

            if (!this._cachedTextureMatrix) {
                this._cachedTextureMatrix = Matrix.Zero();
                this._projectionModeMatrix = Matrix.Zero();
            }

            this._cachedCoordinatesMode = this.coordinatesMode;

            switch (this.coordinatesMode) {
                case Texture.PLANAR_MODE:
                    Matrix.IdentityToRef(this._cachedTextureMatrix);
                    this._cachedTextureMatrix[0] = this.uScale;
                    this._cachedTextureMatrix[5] = this.vScale;
                    this._cachedTextureMatrix[12] = this.uOffset;
                    this._cachedTextureMatrix[13] = this.vOffset;
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

                    this.getScene().getProjectionMatrix().multiplyToRef(this._projectionModeMatrix, this._cachedTextureMatrix);
                    break;
                default:
                    Matrix.IdentityToRef(this._cachedTextureMatrix);
                    break;
            }
            return this._cachedTextureMatrix;
        }

        public clone(): Texture {        
            return SerializationHelper.Clone(() => {
                return new Texture(this._texture.url, this.getScene(), this._noMipmap, this._invertY, this._samplingMode);
            }, this);       
        }

        // Statics
        public static CreateFromBase64String(data: string, name: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: () => void = null, onError: () => void = null): Texture {
            return new Texture("data:" + name, scene, noMipmap, invertY, samplingMode, onLoad, onError, data);
        }
        
        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): BaseTexture {
            if (parsedTexture.isCube) {
                return CubeTexture.Parse(parsedTexture, scene, rootUrl);
            }

            if (!parsedTexture.name && !parsedTexture.isRenderTarget) {
                return null;
            }

            var texture = SerializationHelper.Parse(() => {
                if (parsedTexture.customType) {
                    var customTexture = Tools.Instantiate(parsedTexture.customType);
                    return customTexture.Parse(parsedTexture, scene, rootUrl);
                } else if (parsedTexture.mirrorPlane) {
                    var mirrorTexture = new MirrorTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
                    mirrorTexture._waitingRenderList = parsedTexture.renderList;
                    mirrorTexture.mirrorPlane = Plane.FromArray(parsedTexture.mirrorPlane);

                    return mirrorTexture;
                } else if (parsedTexture.isRenderTarget) {
                    var renderTargetTexture = new RenderTargetTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
                    renderTargetTexture._waitingRenderList = parsedTexture.renderList;

                    return renderTargetTexture;
                } else {
                    var texture: Texture;
                    if (parsedTexture.base64String) {
                        texture = Texture.CreateFromBase64String(parsedTexture.base64String, parsedTexture.name, scene);
                    } else {
                        texture = new Texture(rootUrl + parsedTexture.name, scene);
                    }

                    return texture;
                }
            }, parsedTexture, scene);

            // Animations
            if (parsedTexture.animations) {
                for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    var parsedAnimation = parsedTexture.animations[animationIndex];

                    texture.animations.push(Animation.Parse(parsedAnimation));
                }
            }

            return texture;
        }
    }
} 