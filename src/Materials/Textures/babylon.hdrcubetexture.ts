module BABYLON {
    export class HDRCubeTexture extends BaseTexture {
        public url: string;
        public coordinatesMode = Texture.CUBIC_MODE;

        private _noMipmap: boolean;
        private _extensions: string[];
        private _textureMatrix: Matrix;
        private _size: number;

        public sphericalPolynomial: SphericalPolynomial = null;

        constructor(url: string, scene: Scene, size:number, noMipmap?: boolean) {
            super(scene);

            this.name = url;
            this.url = url;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;
            this._size = size;

            if (!url) {
                return;
            }

            this._texture = this._getFromCache(url, noMipmap);

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this.loadTexture();
                } else {
                    this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }

            this.isCube = true;

            this._textureMatrix = Matrix.Identity();
        }
        
        private loadTexture() {
            var callback = (buffer: ArrayBuffer) => {
                var data = BABYLON.Internals.HDRTools.GetCubeMapTextureData(buffer, this._size);
                this.sphericalPolynomial = BABYLON.Internals.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);

                var mapping = [
                    "left",
                    "down",
                    "front",
                    "right",
                    "up",
                    "back"
                ];

                var results = [];
                for (var j = 0; j < 6; j++) {
                    var dataFace = <Float32Array>data[mapping[j]];
// TODO. Support Int Textures...
//                     // 3 channels of 1 bytes per pixel in bytes.
//                     var byteBuffer = new ArrayBuffer(this._size * this._size * 3);
//                     var byteArray = new Uint8Array(byteBuffer);
// 
//                     /* now convert data from buffer into bytes */
//                     for(var i = 0; i < this._size * this._size; i++) {
//                         byteArray[(i * 3) + 0] = dataFace[(i * 3) + 0] * 255;
//                         byteArray[(i * 3) + 1] = dataFace[(i * 3) + 1] * 255;
//                         byteArray[(i * 3) + 2] = dataFace[(i * 3) + 2] * 255;
//                     }

                    results.push(dataFace);
                }
                return results;
            }

            this._texture = (<any>this.getScene().getEngine()).createRawCubeTexture(this.url, this.getScene(), this._size, Engine.TEXTUREFORMAT_RGB, Engine.TEXTURETYPE_FLOAT, this._noMipmap, callback);
        }

        public clone(): HDRCubeTexture {
            var newTexture = new HDRCubeTexture(this.url, this.getScene(), this._size, this._noMipmap);

            // Base texture
            newTexture.level = this.level;
            newTexture.wrapU = this.wrapU;
            newTexture.wrapV = this.wrapV;
            newTexture.coordinatesIndex = this.coordinatesIndex;
            newTexture.coordinatesMode = this.coordinatesMode;

            return newTexture;
        }

        // Methods
        public delayLoad(): void {
            if (this.delayLoadState !== Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }

            this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);

            if (!this._texture) {
                this.loadTexture();
            }
        }

        public getReflectionTextureMatrix(): Matrix {
            return this._textureMatrix;
        }
        
        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): HDRCubeTexture {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                texture = new BABYLON.HDRCubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.size);
                texture.name = parsedTexture.name;
                texture.hasAlpha = parsedTexture.hasAlpha;
                texture.level = parsedTexture.level;
                texture.coordinatesMode = parsedTexture.coordinatesMode;
            }
            return texture;
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject: any = {};
            serializationObject.name = this.name;
            serializationObject.hasAlpha = this.hasAlpha;
            serializationObject.isCube = true;
            serializationObject.level = this.level;
            serializationObject.size = this._size;
            serializationObject.coordinatesMode = this.coordinatesMode;

            return serializationObject;
        }
    }
} 