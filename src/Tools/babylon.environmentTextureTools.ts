module BABYLON {
    /**
     * Raw texture data and descriptor sufficient for WebGL texture upload
     */
    export interface EnvironmentTextureInfo {
        /**
         * Version of the environment map
         */
        version: number;

        /**
         * Width of image
         */
        width: number;

        /**
         * Irradiance information stored in the file.
         */
        irradiance: any;

        /**
         * Specular information stored in the file.
         */
        specular: any;
    }

    interface EnvironmentTextureIrradianceInfoV1 {
        l00: Array<number>;

        l1_1: Array<number>;
        l10: Array<number>;
        l11: Array<number>;

        l2_2: Array<number>;
        l2_1: Array<number>;
        l20: Array<number>;
        l21: Array<number>;
        l22: Array<number>;
    }

    interface BufferImageData {
        length: number;
        position: number;
    }

    interface EnvironmentTextureSpecularInfoV1 {
        /**
         * Defines where the specular Payload is located. It is a runtime value only not stored in the file.
         */
        specularDataPosition?: number;
        mipmaps: Array<BufferImageData>
    }

    export class EnvironmentTextureTools {

        private static _MagicBytes = [0x86, 0x16, 0x87, 0x96, 0xf6, 0xd6, 0x96, 0x36];

        public static GetEnvInfo(data: ArrayBuffer): Nullable<EnvironmentTextureInfo> {
            // Close to network
            // let littleEndian = false;

            let dataView = new DataView(data);
            let pos = 0;

            for (let i = 0; i < EnvironmentTextureTools._MagicBytes.length; i++) {
                if (dataView.getUint8(pos++) !== EnvironmentTextureTools._MagicBytes[i]) {
                    Tools.Error('Not a babylon environment map');
                    return null;
                }
            }
            
            // Read json manifest - collect characters up to null terminator
            let manifestString = '';
            let charCode = 0x00;
            while ((charCode = dataView.getUint8(pos++))) {
                manifestString += String.fromCharCode(charCode);
            }

            let manifest: EnvironmentTextureInfo = JSON.parse(manifestString);
            if (manifest.specular) {
                manifest.specular.specularDataPosition = pos;
            }

            return manifest;
        }

        public static CreateEnvTexture(texture: CubeTexture): Nullable<Promise<ArrayBuffer>> {
            var internalTexture = texture.getInternalTexture();
            if (!internalTexture) {
                return null;
            }

            var engine = internalTexture.getEngine();
            var hostingScene = new Scene(engine);
            var screenshotCanvas = document.createElement('canvas');

            var info: EnvironmentTextureInfo = {
                version: 1,
                width: internalTexture.width,
                irradiance: null,
                specular: null
            };

            var specularTextures: { [key: number]: ArrayBuffer } = { };
            var promises: Promise<void>[] = [];

            // All mipmaps
            var mipmapsCount = Scalar.Log2(internalTexture.width);
            mipmapsCount = Math.round(mipmapsCount);
            for (let i = 0; i <= mipmapsCount; i++) {
                let faceWidth = Math.pow(2, mipmapsCount - i);

                // All faces
                for (let face = 0; face < 6; face++) {

                    let data = texture.readPixels(face, i);

                    let textureType = Engine.TEXTURETYPE_FLOAT;
                    let tempTexture = engine.createRawTexture(data, faceWidth, faceWidth, Engine.TEXTUREFORMAT_RGBA, false, false, Texture.NEAREST_SAMPLINGMODE, null, textureType);

                    let rtt = new RenderTargetTexture(
                        'resized' + i + "_" + face,
                        faceWidth,
                        hostingScene,
                        true,
                        true,
                        Engine.TEXTURETYPE_UNSIGNED_INT,
                        false,
                        Texture.NEAREST_SAMPLINGMODE,
                        false
                    );
        
                    let promise = new Promise<void>((resolve, reject) => {
                        //let passPostProcess = new PassPostProcess("rgbmEncode", 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, Engine.TEXTURETYPE_UNSIGNED_INT);
                        let rgbmPostProcess = new PostProcess("rgbmEncode", "rgbmEncode", null, null, 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, undefined, Engine.TEXTURETYPE_UNSIGNED_INT, undefined, null, false);
                        rgbmPostProcess.getEffect().executeWhenCompiled(() => {
                            rgbmPostProcess.onApply = function (effect) {
                                effect._bindTexture("textureSampler", tempTexture);
                            }
            
                            let internalTexture = rtt.getInternalTexture();
            
                            if (internalTexture) {
                                hostingScene.postProcessManager.directRender([rgbmPostProcess], internalTexture);
                            }

                            //Reading datas from WebGL
                            let data = engine.readPixels(0, 0, faceWidth, faceWidth);

                            // //To flip image on Y axis.
                            // for (var i = 0; i < halfHeight; i++) {
                            //     for (var j = 0; j < numberOfChannelsByLine; j++) {
                            //         var currentCell = j + i * numberOfChannelsByLine;
                            //         var targetLine = height - i - 1;
                            //         var targetCell = j + targetLine * numberOfChannelsByLine;

                            //         var temp = data[currentCell];
                            //         data[currentCell] = data[targetCell];
                            //         data[targetCell] = temp;
                            //     }
                            // }

                            screenshotCanvas.width = faceWidth;
                            screenshotCanvas.height = faceWidth;
                            let context = screenshotCanvas.getContext('2d');

                            if (context) {
                                // Copy the pixels to a 2D canvas
                                let imageData = context.createImageData(faceWidth, faceWidth);
                                let castData = <any>(imageData.data);
                                castData.set(data);
                                context.putImageData(imageData, 0, 0);

                                screenshotCanvas.toBlob((blob) => {
                                    var url = window.URL.createObjectURL(blob);

                                    var a: any = document.createElement("a");
                                        document.body.appendChild(a);
                                        a.style = "display: none";

                                    a.href = url;
                                    a.download = "env_" + i + "_" + face + ".png";
                                    a.click();
                                    window.URL.revokeObjectURL(url);

                                    let fileReader = new FileReader();
                                    fileReader.onload = function(event) {
                                        let arrayBuffer = event.target!.result as ArrayBuffer;
                                        specularTextures[i * 6 + face] = arrayBuffer;
                                        resolve();
                                    };
                                    fileReader.readAsArrayBuffer(blob!);
                                });
                            }
                        });
                    });
                    promises.push(promise);
                }
            }

            return Promise.all(promises).then(() => {
                hostingScene.dispose();

                info.specular = {
                    mipmaps: []
                };

                let position = 0;
                for (let i = 0; i <= mipmapsCount; i++) {
                    for (let face = 0; face < 6; face++) {
                        let byteLength = specularTextures[i * 6 + face].byteLength;
                        info.specular.mipmaps.push({
                            length: byteLength,
                            position: position
                        });
                        position += byteLength;
                    }
                }

                function str2ab(str: string) {
                    let buf = new ArrayBuffer(str.length + 1); 
                    let bufView = new Uint8Array(buf); // Limited to ascii subset matching unicode.
                    for (let i=0, strLen=str.length; i < strLen; i++) {
                        bufView[i] = str.charCodeAt(i);
                    }
                    bufView[str.length] = 0x00;
                    return buf;
                }

                let infoString = JSON.stringify(info);
                let infoBuffer = str2ab(infoString);

                let totalSize = EnvironmentTextureTools._MagicBytes.length + position + infoBuffer.byteLength;
                let finalBuffer = new ArrayBuffer(totalSize);
                let finalBufferView = new Uint8Array(finalBuffer);
                let dataView = new DataView(finalBuffer);

                let pos = 0;
                for (let i = 0; i < EnvironmentTextureTools._MagicBytes.length; i++) {
                    dataView.setUint8(pos++, EnvironmentTextureTools._MagicBytes[i]);
                }

                finalBufferView.set(new Uint8Array(infoBuffer), pos);
                pos += infoBuffer.byteLength;

                for (let i = 0; i <= mipmapsCount; i++) {
                    for (let face = 0; face < 6; face++) {
                        var dataBuffer = specularTextures[i * 6 + face];
                        finalBufferView.set(new Uint8Array(dataBuffer), pos);
                        pos += dataBuffer.byteLength;
                    }
                }

                return finalBuffer;
            });
        }

        public static UploadLevelsAsync(texture: InternalTexture, arrayBuffer: any, info: EnvironmentTextureInfo): Promise<void[]> {
            if (info.version !== 1) {
                Tools.Warn('Unsupported babylon environment map version "' + info.version + '"');
            }

            var specularInfo = info.specular as EnvironmentTextureSpecularInfoV1;
            if (!specularInfo) {
                return Promise.resolve([]);
            }

            var mipmapsCount = Scalar.Log2(info.width);
            mipmapsCount = Math.round(mipmapsCount) + 1;
            if (specularInfo.mipmaps.length !== 6 * mipmapsCount) {
                Tools.Warn('Unsupported specular mipmaps number "' + specularInfo.mipmaps.length + '"');
            }

            var engine = texture.getEngine();
            var textureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            var targetTextureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            var expandTexture = false;
            if (engine.getCaps().textureHalfFloatRender) {
                targetTextureType = Engine.TEXTURETYPE_HALF_FLOAT;
                expandTexture = true;
            }
            texture.type = textureType;
            texture.format = Engine.TEXTUREFORMAT_RGBA;
            texture.invertY = false;
            texture._isRGBM = true;
            texture.samplingMode = Texture.TRILINEAR_SAMPLINGMODE;

            var promises: Promise<void>[] = [];
            // All mipmaps
            for (let i = 0; i < mipmapsCount; i++) {
                // All faces
                for (let face = 0; face < 6; face++) {
                    const imageData = specularInfo.mipmaps[i * 6 + face];
                    let bytes = new Uint8Array(arrayBuffer, specularInfo.specularDataPosition! + imageData.position, imageData.length);
                    //construct image element from bytes
                    let image = new Image();
                    let src = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
                    image.src = src;

                    // Enqueue promise to upload to the texture.
                    let promise = new Promise<void>((resolve, reject) => {;
                        image.onload = () => {
                            engine._uploadImageToTexture(texture, face, i, image);
                            resolve();
                        };
                        image.onerror = (error) => {
                            reject(error);
                        };
                    });
                    promises.push(promise);
                }
            }

            // if (expandTexture) {
            //     return Promise.all(promises).then(() => {
            //         return this._expandTexture(texture, targetTextureType);
            //     });
            // }
            // else {
                return Promise.all(promises);
            //}
        }

        public static UploadPolynomials(texture: InternalTexture, arrayBuffer: any, info: EnvironmentTextureInfo): void {
            if (info.version !== 1) {
                Tools.Warn('Unsupported babylon environment map version "' + info.version + '"');
            }

            var irradianceInfo = info.irradiance as EnvironmentTextureIrradianceInfoV1;
            if (!irradianceInfo) {
                return;
            }
            
            //irradiance
            EnvironmentTextureTools._ConvertSHIrradianceToLambertianRadiance(irradianceInfo);

            //harmonics now represent radiance
            texture._sphericalPolynomial = new SphericalPolynomial();
            EnvironmentTextureTools._ConvertSHToSP(irradianceInfo, texture._sphericalPolynomial);
        }

        /**
         * Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
         *	  L = (1/pi) * E * rho
         * 
         * This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.
         * @param harmonics Spherical harmonic coefficients (9)
         */
        private static _ConvertSHIrradianceToLambertianRadiance(harmonics: any): void {
            const scaleFactor = 1 / Math.PI;
            // The resultant SH now represents outgoing radiance, so includes the Lambert 1/pi normalisation factor but without albedo (rho) applied
            // (The pixel shader must apply albedo after texture fetches, etc).
            harmonics.l00[0] *= scaleFactor;
            harmonics.l00[1] *= scaleFactor;
            harmonics.l00[2] *= scaleFactor;
            harmonics.l1_1[0] *= scaleFactor;
            harmonics.l1_1[1] *= scaleFactor;
            harmonics.l1_1[2] *= scaleFactor;
            harmonics.l10[0] *= scaleFactor;
            harmonics.l10[1] *= scaleFactor;
            harmonics.l10[2] *= scaleFactor;
            harmonics.l11[0] *= scaleFactor;
            harmonics.l11[1] *= scaleFactor;
            harmonics.l11[2] *= scaleFactor;
            harmonics.l2_2[0] *= scaleFactor;
            harmonics.l2_2[1] *= scaleFactor;
            harmonics.l2_2[2] *= scaleFactor;
            harmonics.l2_1[0] *= scaleFactor;
            harmonics.l2_1[1] *= scaleFactor;
            harmonics.l2_1[2] *= scaleFactor;
            harmonics.l20[0] *= scaleFactor;
            harmonics.l20[1] *= scaleFactor;
            harmonics.l20[2] *= scaleFactor;
            harmonics.l21[0] *= scaleFactor;
            harmonics.l21[1] *= scaleFactor;
            harmonics.l21[2] *= scaleFactor;
            harmonics.l22[0] *= scaleFactor;
            harmonics.l22[1] *= scaleFactor;
            harmonics.l22[2] *= scaleFactor;
        }

        /**
         * Convert spherical harmonics to spherical polynomial coefficients
         * @param harmonics Spherical harmonic coefficients (9)
         * @param outPolynomialCoefficents Polynomial coefficients (9) object to store result
         */
        private static _ConvertSHToSP(harmonics: any, outPolynomialCoefficents: SphericalPolynomial) {
            const rPi = 1 / Math.PI;

            //x
            outPolynomialCoefficents.x.x = 1.02333 * harmonics.l11[0] * rPi;
            outPolynomialCoefficents.x.y = 1.02333 * harmonics.l11[1] * rPi;
            outPolynomialCoefficents.x.z = 1.02333 * harmonics.l11[2] * rPi;

            outPolynomialCoefficents.y.x = 1.02333 * harmonics.l1_1[0] * rPi;
            outPolynomialCoefficents.y.y = 1.02333 * harmonics.l1_1[1] * rPi;
            outPolynomialCoefficents.y.z = 1.02333 * harmonics.l1_1[2] * rPi;

            outPolynomialCoefficents.z.x = 1.02333 * harmonics.l10[0] * rPi;
            outPolynomialCoefficents.z.y = 1.02333 * harmonics.l10[1] * rPi;
            outPolynomialCoefficents.z.z = 1.02333 * harmonics.l10[2] * rPi;

            //xx
            outPolynomialCoefficents.xx.x = (0.886277 * harmonics.l00[0] - 0.247708 * harmonics.l20[0] + 0.429043 * harmonics.l22[0]) * rPi;
            outPolynomialCoefficents.xx.y = (0.886277 * harmonics.l00[1] - 0.247708 * harmonics.l20[1] + 0.429043 * harmonics.l22[1]) * rPi;
            outPolynomialCoefficents.xx.z = (0.886277 * harmonics.l00[2] - 0.247708 * harmonics.l20[2] + 0.429043 * harmonics.l22[2]) * rPi;

            outPolynomialCoefficents.yy.x = (0.886277 * harmonics.l00[0] - 0.247708 * harmonics.l20[0] - 0.429043 * harmonics.l22[0]) * rPi;
            outPolynomialCoefficents.yy.y = (0.886277 * harmonics.l00[1] - 0.247708 * harmonics.l20[1] - 0.429043 * harmonics.l22[1]) * rPi;
            outPolynomialCoefficents.yy.z = (0.886277 * harmonics.l00[2] - 0.247708 * harmonics.l20[2] - 0.429043 * harmonics.l22[2]) * rPi;

            outPolynomialCoefficents.zz.x = (0.886277 * harmonics.l00[0] + 0.495417 * harmonics.l20[0]) * rPi;
            outPolynomialCoefficents.zz.y = (0.886277 * harmonics.l00[1] + 0.495417 * harmonics.l20[1]) * rPi;
            outPolynomialCoefficents.zz.z = (0.886277 * harmonics.l00[2] + 0.495417 * harmonics.l20[2]) * rPi;

            //yz
            outPolynomialCoefficents.yz.x = 0.858086 * harmonics.l2_1[0] * rPi;
            outPolynomialCoefficents.yz.y = 0.858086 * harmonics.l2_1[1] * rPi;
            outPolynomialCoefficents.yz.z = 0.858086 * harmonics.l2_1[2] * rPi;

            outPolynomialCoefficents.zx.x = 0.858086 * harmonics.l21[0] * rPi;
            outPolynomialCoefficents.zx.y = 0.858086 * harmonics.l21[1] * rPi;
            outPolynomialCoefficents.zx.z = 0.858086 * harmonics.l21[2] * rPi;

            outPolynomialCoefficents.xy.x = 0.858086 * harmonics.l2_2[0] * rPi;
            outPolynomialCoefficents.xy.y = 0.858086 * harmonics.l2_2[1] * rPi;
            outPolynomialCoefficents.xy.z = 0.858086 * harmonics.l2_2[2] * rPi;
        }
    }

    export class EnvironmentTexture extends CubeTexture {
        
        constructor(url: string, scene: Scene) {
           super(url, scene, null, false, null, null, null, undefined, true, ".env", false);


        }

        public clone(): EnvironmentTexture {
            return SerializationHelper.Clone(() => {
                let scene = this.getScene();

                if (!scene) {
                    return this;
                }
                return new EnvironmentTexture(this.url, scene);
            }, this);
        }
    }
} 