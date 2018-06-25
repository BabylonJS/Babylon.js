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

    /**
     * Defines the required storage to save the environment irradiance information.
     */
    interface EnvironmentTextureIrradianceInfoV1 {
        polynomials: boolean;

        l00: Array<number>;

        l1_1: Array<number>;
        l10: Array<number>;
        l11: Array<number>;

        l2_2: Array<number>;
        l2_1: Array<number>;
        l20: Array<number>;
        l21: Array<number>;
        l22: Array<number>;

        x: Array<number>;
        y: Array<number>;
        z: Array<number>;

        xx: Array<number>;
        yy: Array<number>;
        zz: Array<number>;

        yz: Array<number>;
        zx: Array<number>;
        xy: Array<number>;
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
            if (engine && engine.premultipliedAlpha) {
                return Promise.reject("Env texture can only be created when the engine is created with the premultipliedAlpha option set to false.");
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
                    // And rgbdEncode them. 
                    let promise = new Promise<void>((resolve, reject) => {
                        let rgbdPostProcess = new PostProcess("rgbdEncode", "rgbdEncode", null, null, 1, null, Texture.NEAREST_SAMPLINGMODE, engine, false, undefined, Engine.TEXTURETYPE_UNSIGNED_INT, undefined, null, false);
                        rgbdPostProcess.getEffect().executeWhenCompiled(() => {
                            rgbdPostProcess.onApply = (effect) => {
                                effect._bindTexture("textureSampler", tempTexture);
                            }
            
                            // As the process needs to happen on the main canvas, keep track of the current size
                            let currentW = engine.getRenderWidth();
                            let currentH = engine.getRenderHeight();

                            // Set the desired size for the texture
                            engine.setSize(faceWidth, faceWidth);
                            hostingScene.postProcessManager.directRender([rgbdPostProcess], null);

                            // Reading datas from WebGL
                            Tools.ToBlob(canvas!, (blob) => {
                                let fileReader = new FileReader();
                                fileReader.onload = (event: any) => {
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

            // Once all the textures haves been collected as RGBD stored in PNGs
            return Promise.all(promises).then(() => {
                // We can delete the hosting scene keeping track of all the creation objects
                hostingScene.dispose();

                // Creates the json header for the env texture
                let info: EnvironmentTextureInfo = {
                    version: 1,
                    width: cubeWidth,
                    irradiance: this._CreateEnvTextureIrradiance(texture),
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
         * Creates a JSON representation of the spherical data.
         * @param texture defines the texture containing the polynomials
         * @return the JSON representation of the spherical info
         */
        private static _CreateEnvTextureIrradiance(texture: CubeTexture) : Nullable<EnvironmentTextureIrradianceInfoV1> {
            let polynmials = texture.sphericalPolynomial;
            if (polynmials == null) {
                return null;
            }

            return {
                polynomials: true,

                x: [polynmials.x.x, polynmials.x.y, polynmials.x.z],
                y: [polynmials.y.x, polynmials.y.y, polynmials.y.z],
                z: [polynmials.z.x, polynmials.z.y, polynmials.z.z],

                xx: [polynmials.xx.x, polynmials.xx.y, polynmials.xx.z],
                yy: [polynmials.yy.x, polynmials.yy.y, polynmials.yy.z],
                zz: [polynmials.zz.x, polynmials.zz.y, polynmials.zz.z],

                yz: [polynmials.yz.x, polynmials.yz.y, polynmials.yz.z],
                zx: [polynmials.zx.x, polynmials.zx.y, polynmials.zx.z],
                xy: [polynmials.xy.x, polynmials.xy.y, polynmials.xy.z]
            } as any;
        }

        /**
         * Uploads the texture info contained in the env file to te GPU.
         * @param texture defines the internal texture to upload to
         * @param arrayBuffer defines the buffer cotaining the data to load
         * @param info defines the texture info retrieved through the GetEnvInfo method
         * @returns a promise
         */
        public static UploadLevelsAsync(texture: InternalTexture, arrayBuffer: any, info: EnvironmentTextureInfo): Promise<void> {
            if (info.version !== 1) {
                Tools.Warn('Unsupported babylon environment map version "' + info.version + '"');
            }

            let specularInfo = info.specular as EnvironmentTextureSpecularInfoV1;
            if (!specularInfo) {
                // Nothing else parsed so far
                return Promise.resolve();
            }

            // Double checks the enclosed info
            let mipmapsCount = Scalar.Log2(info.width);
            mipmapsCount = Math.round(mipmapsCount) + 1;
            if (specularInfo.mipmaps.length !== 6 * mipmapsCount) {
                Tools.Warn('Unsupported specular mipmaps number "' + specularInfo.mipmaps.length + '"');
            }

            // Gets everything ready.
            let engine = texture.getEngine();
            let expandTexture = false;
            let generateNonLODTextures = false;
            let rgbdPostProcess: Nullable<PostProcess> = null;
            let cubeRtt: Nullable<InternalTexture> = null;
            let lodTextures: Nullable<{ [lod: number]: BaseTexture}> = null;
            let caps = engine.getCaps();

            texture.format = Engine.TEXTUREFORMAT_RGBA;
            texture.type = Engine.TEXTURETYPE_UNSIGNED_INT;
            texture.samplingMode = Texture.TRILINEAR_SAMPLINGMODE;

            // Add extra process if texture lod is not supported
            if (!caps.textureLOD) {
                expandTexture = false;
                generateNonLODTextures = true;
                lodTextures = { };
            }
            // in webgl 1 there are no ways to either render or copy lod level information for float textures.
            else if (engine.webGLVersion < 2) {
                expandTexture = false;
            }
            // If half float available we can uncompress the texture
            else if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                expandTexture = true;
                texture.type = Engine.TEXTURETYPE_HALF_FLOAT;
            }
            // If full float available we can uncompress the texture
            else if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                expandTexture = true;
                texture.type = Engine.TEXTURETYPE_FLOAT;
            }

            // Expand the texture if possible
            if (expandTexture) {
                // Simply run through the decode PP
                rgbdPostProcess = new PostProcess("rgbdDecode", "rgbdDecode", null, null, 1, null, Texture.TRILINEAR_SAMPLINGMODE, engine, false, undefined, texture.type, undefined, null, false);
                
                texture._isRGBD = false;
                texture.invertY = false;
                cubeRtt = engine.createRenderTargetCubeTexture(texture.width, {
                    generateDepthBuffer: false,
                    generateMipMaps: true,
                    generateStencilBuffer: false,
                    samplingMode: Texture.TRILINEAR_SAMPLINGMODE,
                    type: texture.type,
                    format: Engine.TEXTUREFORMAT_RGBA
                });
            }
            else {
                texture._isRGBD = true;
                texture.invertY = true;

                // In case of missing support, applies the same patch than DDS files.
                if (generateNonLODTextures) {
                    let mipSlices = 3;
                    let scale = texture._lodGenerationScale;
                    let offset = texture._lodGenerationOffset;
    
                    for (let i = 0; i < mipSlices; i++) {
                        //compute LOD from even spacing in smoothness (matching shader calculation)
                        let smoothness = i / (mipSlices - 1);
                        let roughness = 1 - smoothness;
    
                        let minLODIndex = offset; // roughness = 0
                        let maxLODIndex = Scalar.Log2(info.width) * scale + offset; // roughness = 1
    
                        let lodIndex = minLODIndex + (maxLODIndex - minLODIndex) * roughness;
                        let mipmapIndex = Math.round(Math.min(Math.max(lodIndex, 0), maxLODIndex));
    
                        let glTextureFromLod = new InternalTexture(engine, InternalTexture.DATASOURCE_TEMP);
                        glTextureFromLod.isCube = true;
                        glTextureFromLod.invertY = true;
                        glTextureFromLod.generateMipMaps = false;
                        engine.updateTextureSamplingMode(Texture.LINEAR_LINEAR, glTextureFromLod);
    
                        // Wrap in a base texture for easy binding.
                        let lodTexture = new BaseTexture(null);
                        lodTexture.isCube = true;
                        lodTexture._texture = glTextureFromLod;
                        lodTextures![mipmapIndex] = lodTexture;

                        switch (i) {
                            case 0:
                            texture._lodTextureLow = lodTexture;
                            break;
                            case 1:
                            texture._lodTextureMid = lodTexture;
                            break;
                            case 2:
                            texture._lodTextureHigh = lodTexture;
                            break;
                        }
                    }
                }
            }

            let promises: Promise<void>[] = [];
            // All mipmaps
            for (let i = 0; i < mipmapsCount; i++) {
                // All faces
                for (let face = 0; face < 6; face++) {
                    // Retrieves the face data
                    let imageData = specularInfo.mipmaps[i * 6 + face];
                    let bytes = new Uint8Array(arrayBuffer, specularInfo.specularDataPosition! + imageData.position, imageData.length);

                    // Constructs an image element from bytes
                    let blob = new Blob([bytes], { type: 'image/png' });
                    let url = URL.createObjectURL(blob);
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

                                rgbdPostProcess!.getEffect().executeWhenCompiled(() => {
                                    // Uncompress the data to a RTT
                                    rgbdPostProcess!.onApply = (effect) => {
                                        effect._bindTexture("textureSampler", tempTexture);
                                        effect.setFloat2("scale", 1, 1);
                                    }
                                    
                                    engine.scenes[0].postProcessManager.directRender([rgbdPostProcess!], cubeRtt, true, face, i);

                                    // Cleanup
                                    engine.restoreDefaultFramebuffer();
                                    tempTexture.dispose();
                                    window.URL.revokeObjectURL(url);
                                    resolve();
                                });
                            }
                            else {
                                engine._uploadImageToTexture(texture, face, i, image);

                                // Upload the face to the none lod texture support
                                if (generateNonLODTextures) {
                                    let lodTexture = lodTextures![i];
                                    if (lodTexture) {
                                        engine._uploadImageToTexture(lodTexture._texture!, face, 0, image);
                                    }
                                }
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

            // Once all done, finishes the cleanup and return
            return Promise.all(promises).then(() => {
                // Relase temp RTT.
                if (cubeRtt) {
                    engine._releaseFramebufferObjects(cubeRtt);
                    cubeRtt._swapAndDie(texture);
                }
                // Relase temp Post Process.
                if (rgbdPostProcess) {
                    rgbdPostProcess.dispose();
                }
                // Flag internal texture as ready in case they are in use.
                if (generateNonLODTextures) {
                    if (texture._lodTextureHigh && texture._lodTextureHigh._texture) {
                        texture._lodTextureHigh._texture.isReady = true;
                    }
                    if (texture._lodTextureMid && texture._lodTextureMid._texture) {
                        texture._lodTextureMid._texture.isReady = true;
                    }
                    if (texture._lodTextureLow && texture._lodTextureLow._texture) {
                        texture._lodTextureLow._texture.isReady = true;
                    }
                }
            });
        }

        /**
         * Uploads spherical polynomials information to the texture.
         * @param texture defines the texture we are trying to upload the information to
         * @param arrayBuffer defines the array buffer holding the data
         * @param info defines the environment texture info retrieved through the GetEnvInfo method
         */
        public static UploadPolynomials(texture: InternalTexture, arrayBuffer: any, info: EnvironmentTextureInfo): void {
            if (info.version !== 1) {
                Tools.Warn('Unsupported babylon environment map version "' + info.version + '"');
            }

            let irradianceInfo = info.irradiance as EnvironmentTextureIrradianceInfoV1;
            if (!irradianceInfo) {
                return;
            }
            
            //harmonics now represent radiance
            texture._sphericalPolynomial = new SphericalPolynomial();

            if (irradianceInfo.polynomials) {
                EnvironmentTextureTools._UploadSP(irradianceInfo, texture._sphericalPolynomial);
            }
            else {
                // convert From SH to SP.
                EnvironmentTextureTools._ConvertSHIrradianceToLambertianRadiance(irradianceInfo);
                EnvironmentTextureTools._ConvertSHToSP(irradianceInfo, texture._sphericalPolynomial);
            }
        }

        /**
         * Upload spherical polynomial coefficients to the texture
         * @param polynmials Spherical polynmial coefficients (9)
         * @param outPolynomialCoefficents Polynomial coefficients (9) object to store result
         */
        private static _UploadSP(polynmials: EnvironmentTextureIrradianceInfoV1, outPolynomialCoefficents: SphericalPolynomial) {
            outPolynomialCoefficents.x.x = polynmials.x[0];
            outPolynomialCoefficents.x.y = polynmials.x[1];
            outPolynomialCoefficents.x.z = polynmials.x[2];

            outPolynomialCoefficents.y.x = polynmials.y[0];
            outPolynomialCoefficents.y.y = polynmials.y[1];
            outPolynomialCoefficents.y.z = polynmials.y[2];

            outPolynomialCoefficents.z.x = polynmials.z[0];
            outPolynomialCoefficents.z.y = polynmials.z[1];
            outPolynomialCoefficents.z.z = polynmials.z[2];

            //xx
            outPolynomialCoefficents.xx.x = polynmials.xx[0];
            outPolynomialCoefficents.xx.y = polynmials.xx[1];
            outPolynomialCoefficents.xx.z = polynmials.xx[2];

            outPolynomialCoefficents.yy.x = polynmials.yy[0];
            outPolynomialCoefficents.yy.y = polynmials.yy[1];
            outPolynomialCoefficents.yy.z = polynmials.yy[2];

            outPolynomialCoefficents.zz.x = polynmials.zz[0];
            outPolynomialCoefficents.zz.y = polynmials.zz[1];
            outPolynomialCoefficents.zz.z = polynmials.zz[2];

            //yz
            outPolynomialCoefficents.yz.x = polynmials.yz[0];
            outPolynomialCoefficents.yz.y = polynmials.yz[1];
            outPolynomialCoefficents.yz.z = polynmials.yz[2];

            outPolynomialCoefficents.zx.x = polynmials.zx[0];
            outPolynomialCoefficents.zx.y = polynmials.zx[1];
            outPolynomialCoefficents.zx.z = polynmials.zx[2];

            outPolynomialCoefficents.xy.x = polynmials.xy[0];
            outPolynomialCoefficents.xy.y = polynmials.xy[1];
            outPolynomialCoefficents.xy.z = polynmials.xy[2];
        }

        /**
         * Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
         *	  L = (1/pi) * E * rho
         * 
         * This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.
         * @param harmonics Spherical harmonic coefficients (9)
         */
        private static _ConvertSHIrradianceToLambertianRadiance(harmonics: any): void {
            let scaleFactor = 1 / Math.PI;
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
            let rPi = 1 / Math.PI;

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