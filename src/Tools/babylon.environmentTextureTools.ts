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

    /**
     * Defines One Image in the file. It requires only the position in the file 
     * as well as the length.
     */
    interface BufferImageData {
        /**
         * Length of the image data.
         */
        length: number;
        /**
         * Position of the data from the null terminator delimiting the end of the JSON.
         */
        position: number;
    }

    /**
     * Defines the specular data enclosed in the file.
     * This corresponds to the version 1 of the data.
     */
    interface EnvironmentTextureSpecularInfoV1 {
        /**
         * Defines where the specular Payload is located. It is a runtime value only not stored in the file.
         */
        specularDataPosition?: number;
        /**
         * This contains all the images data needed to reconstruct the cubemap.
         */
        mipmaps: Array<BufferImageData>
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

    /**
     * Sets of helpers addressing the serialization and deserialization of environment texture
     * stored in a BabylonJS env file.
     * Those files are usually stored as .env files.
     */
    export class EnvironmentTextureTools {

        /**
         * Magic number identifying the env file.
         */
        private static _MagicBytes = [0x86, 0x16, 0x87, 0x96, 0xf6, 0xd6, 0x96, 0x36];

        /**
         * Gets the environment info from an env file.
         * @param data The array buffer containing the .env bytes.
         * @returns the environment file info (the json header) if successfully parsed.
         */
        public static GetEnvInfo(data: ArrayBuffer): Nullable<EnvironmentTextureInfo> {
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
                // Extend the header with the position of the payload.
                manifest.specular.specularDataPosition = pos;
            }

            return manifest;
        }

        /**
         * Creates an environment texture from a loaded cube texture.
         * @param texture defines the cube texture to convert in env file
         * @return a promise containing the environment data if succesfull.
         */
        public static CreateEnvTextureAsync(texture: CubeTexture): Promise<ArrayBuffer> {
            let internalTexture = texture.getInternalTexture();
            if (!internalTexture) {
                return Promise.reject("The cube texture is invalid.");
            }

            if (!texture._prefiltered) {
                return Promise.reject("The cube texture is invalid (not prefiltered).");
            }

            let engine = internalTexture.getEngine();
            if (engine && !engine.premultipliedAlpha) {
                return Promise.reject("Env texture can only be created when the engine is created with the premultipliedAlpa option.");
            }

            let canvas = engine.getRenderingCanvas();
            if (!canvas) {
                return Promise.reject("Env texture can only be created when the engine is associated to a canvas.");
            }

            let textureType = Engine.TEXTURETYPE_FLOAT;
            if (!engine.getCaps().textureFloatRender) {
                textureType = Engine.TEXTURETYPE_HALF_FLOAT;
                if (!engine.getCaps().textureHalfFloatRender) {
                    return Promise.reject("Env texture can only be created when the browser supports half float or full float rendering.");
                }
            }

            let cubeWidth = internalTexture.width;
            let hostingScene = new Scene(engine);
            let specularTextures: { [key: number]: ArrayBuffer } = { };
            let promises: Promise<void>[] = [];

            // Read and collect all mipmaps data from the cube.
            let mipmapsCount = Scalar.Log2(internalTexture.width);
            mipmapsCount = Math.round(mipmapsCount);
            for (let i = 0; i <= mipmapsCount; i++) {
                let faceWidth = Math.pow(2, mipmapsCount - i);

                // All faces of the cube.
                for (let face = 0; face < 6; face++) {
                    let data = texture.readPixels(face, i);

                    // Creates a temp texture with the face data.
                    let tempTexture = engine.createRawTexture(data, faceWidth, faceWidth, Engine.TEXTUREFORMAT_RGBA, false, false, Texture.NEAREST_SAMPLINGMODE, null, textureType);
                    // And rgbmEncode them. 
                    let promise = new Promise<void>((resolve, reject) => {
                        let rgbmPostProcess = new PostProcess("rgbmEncode", "rgbmEncode", null, null, 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, undefined, Engine.TEXTURETYPE_UNSIGNED_INT, undefined, null, false);
                        rgbmPostProcess.getEffect().executeWhenCompiled(() => {
                            rgbmPostProcess.onApply = (effect) => {
                                effect._bindTexture("textureSampler", tempTexture);
                            }
            
                            // As the process needs to happen on the main canvas, keep track of the current size
                            let currentW = engine.getRenderWidth();
                            let currentH = engine.getRenderHeight();

                            // Set the desired size for the texture
                            engine.setSize(faceWidth, faceWidth);
                            hostingScene.postProcessManager.directRender([rgbmPostProcess], null);

                            // Reading datas from WebGL
                            canvas!.toBlob((blob) => {
                                let fileReader = new FileReader();
                                fileReader.onload = (event) => {
                                    let arrayBuffer = event.target!.result as ArrayBuffer;
                                    specularTextures[i * 6 + face] = arrayBuffer;
                                    resolve();
                                };
                                fileReader.readAsArrayBuffer(blob!);
                            });

                            // Reapply the previous canvas size
                            engine.setSize(currentW, currentH);
                        });
                    });
                    promises.push(promise);
                }
            }

            // Once all the textures haves been collected as RGBM stored in PNGs
            return Promise.all(promises).then(() => {
                // We can delete the hosting scene keeping track of all the creation objects
                hostingScene.dispose();

                // Creates the json header for the env texture
                let info: EnvironmentTextureInfo = {
                    version: 1,
                    width: cubeWidth,
                    irradiance: null,
                    specular: {
                        mipmaps: []
                    }
                };

                // Sets the specular image data information
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

                // Encode the JSON as an array buffer
                let infoString = JSON.stringify(info);
                let infoBuffer = new ArrayBuffer(infoString.length + 1);
                let infoView = new Uint8Array(infoBuffer); // Limited to ascii subset matching unicode.
                for (let i= 0, strLen = infoString.length; i < strLen; i++) {
                    infoView[i] = infoString.charCodeAt(i);
                }
                // Ends up with a null terminator for easier parsing
                infoView[infoString.length] = 0x00;

                // Computes the final required size and creates the storage
                let totalSize = EnvironmentTextureTools._MagicBytes.length + position + infoBuffer.byteLength;
                let finalBuffer = new ArrayBuffer(totalSize);
                let finalBufferView = new Uint8Array(finalBuffer);
                let dataView = new DataView(finalBuffer);

                // Copy the magic bytes identifying the file in
                let pos = 0;
                for (let i = 0; i < EnvironmentTextureTools._MagicBytes.length; i++) {
                    dataView.setUint8(pos++, EnvironmentTextureTools._MagicBytes[i]);
                }

                // Add the json info
                finalBufferView.set(new Uint8Array(infoBuffer), pos);
                pos += infoBuffer.byteLength;

                // Finally inserts the texture data
                for (let i = 0; i <= mipmapsCount; i++) {
                    for (let face = 0; face < 6; face++) {
                        let dataBuffer = specularTextures[i * 6 + face];
                        finalBufferView.set(new Uint8Array(dataBuffer), pos);
                        pos += dataBuffer.byteLength;
                    }
                }

                // Voila
                return finalBuffer;
            });
        }

        /**
         * Uploads the 
         */
        public static UploadLevelsAsync(texture: InternalTexture, arrayBuffer: any, info: EnvironmentTextureInfo): Promise<void> {
            if (info.version !== 1) {
                Tools.Warn('Unsupported babylon environment map version "' + info.version + '"');
            }

            let specularInfo = info.specular as EnvironmentTextureSpecularInfoV1;
            if (!specularInfo) {
                return Promise.resolve();
            }

            let mipmapsCount = Scalar.Log2(info.width);
            mipmapsCount = Math.round(mipmapsCount) + 1;
            if (specularInfo.mipmaps.length !== 6 * mipmapsCount) {
                Tools.Warn('Unsupported specular mipmaps number "' + specularInfo.mipmaps.length + '"');
            }

            let engine = texture.getEngine();
            let textureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            let expandTexture = false;
            let rgbmPostProcess: Nullable<PostProcess> = null;
            let cubeRtt: Nullable<InternalTexture> = null;

            var canRenderToHalfFloat = engine.getCaps().textureHalfFloatRender;
            if (canRenderToHalfFloat) {
                textureType = Engine.TEXTURETYPE_HALF_FLOAT;
                expandTexture = true;
                rgbmPostProcess = new PostProcess("rgbmDecode", "rgbmDecode", null, null, 1, null, Texture.TRILINEAR_SAMPLINGMODE, engine, false, undefined, textureType, undefined, null, false);
                texture._isRGBM = false;
                texture.invertY = false;
                cubeRtt = engine.createRenderTargetCubeTexture(texture.width, {
                    generateDepthBuffer: false,
                    generateMipMaps: true,
                    generateStencilBuffer: false,
                    samplingMode: Texture.TRILINEAR_SAMPLINGMODE,
                    type: textureType,
                    format: Engine.TEXTUREFORMAT_RGBA
                })
            }
            else {
                texture.invertY = true;
                texture._isRGBM = true;
            }
            texture.type = textureType;
            texture.format = Engine.TEXTUREFORMAT_RGBA;
            texture.samplingMode = Texture.TRILINEAR_SAMPLINGMODE;

            let promises: Promise<void>[] = [];
            // All mipmaps
            for (let i = 0; i < mipmapsCount; i++) {
                // All faces
                for (let face = 0; face < 6; face++) {
                    const imageData = specularInfo.mipmaps[i * 6 + face];
                    let bytes = new Uint8Array(arrayBuffer, specularInfo.specularDataPosition! + imageData.position, imageData.length);
                    //construct image element from bytes
                    var blob = new Blob([bytes], { type: 'image/png' });
                    let url = URL.createObjectURL(blob);
                    
                    // let a: any = document.createElement("a");
                    //     document.body.appendChild(a);
                    //     a.style = "display: none";
                    
                    // a.href = url;
                    // a.download = "env_" + i + "_" + face + ".png";
                    // a.click();

                    let image = new Image();
                    image.src = url;

                    // Enqueue promise to upload to the texture.
                    let promise = new Promise<void>((resolve, reject) => {;
                        image.onload = () => {
                            if (expandTexture) {
                                let tempTexture = engine.createTexture(null, true, true, null, Texture.NEAREST_SAMPLINGMODE, null,
                                (message) => {
                                    reject(message);
                                },
                                image);

                                rgbmPostProcess!.getEffect().executeWhenCompiled(() => {
                                    rgbmPostProcess!.onApply = (effect) => {
                                        effect._bindTexture("textureSampler", tempTexture);
                                        effect.setFloat2("scale", 1, 1);
                                    }
                                    engine.scenes[0].postProcessManager.directRender([rgbmPostProcess!], cubeRtt, true, face, i);
                                    engine.restoreDefaultFramebuffer();
                                    tempTexture.dispose();
                                    window.URL.revokeObjectURL(url);
                                    resolve();
                                });
                            }
                            else {
                                engine._uploadImageToTexture(texture, face, i, image);
                                resolve();
                            }
                        };
                        image.onerror = (error) => {
                            reject(error);
                        };
                    });
                    promises.push(promise);
                }
            }

            return Promise.all(promises).then(() => {
                if (cubeRtt) {
                    texture._webGLTexture = cubeRtt._webGLTexture;
                }
                if (rgbmPostProcess) {
                    rgbmPostProcess.dispose();
                }
            });
        }

        public static UploadPolynomials(texture: InternalTexture, arrayBuffer: any, info: EnvironmentTextureInfo): void {
            if (info.version !== 1) {
                Tools.Warn('Unsupported babylon environment map version "' + info.version + '"');
            }

            let irradianceInfo = info.irradiance as EnvironmentTextureIrradianceInfoV1;
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
}