import { Nullable } from "../../types";
import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Logger } from '../../Misc/logger';
import { Tools } from '../../Misc/tools';
import { Scene } from '../../scene';
import { Constants } from '../constants';
import { ThinEngine } from '../thinEngine';
import { IWebRequest } from '../../Misc/interfaces/iWebRequest';

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a raw texture
         * @param data defines the data to store in the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param format defines the format of the data
         * @param generateMipMaps defines if the engine should generate the mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
         * @param compression defines the compression used (null by default)
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @returns the raw texture inside an InternalTexture
         */
        createRawTexture(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string>, type: number): InternalTexture;

        /**
         * Update a raw texture
         * @param texture defines the texture to update
         * @param data defines the data to store in the texture
         * @param format defines the format of the data
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw texture
         * @param texture defines the texture to update
         * @param data defines the data to store in the texture
         * @param format defines the format of the data
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         */
        updateRawTexture(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string>, type: number): void;

        /**
         * Creates a new raw cube texture
         * @param data defines the array of data to use to create each face
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
         * @param generateMipMaps  defines if the engine should generate the mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compression used (null by default)
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTexture(data: Nullable<ArrayBufferView[]>, size: number, format: number, type: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string>): InternalTexture;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to udpdate
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to udpdate
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string>): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to udpdate
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param level defines which level of the texture to update
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string>, level: number): void;

        /**
         * Creates a new raw cube texture from a specified url
         * @param url defines the url where the data is located
         * @param scene defines the current scene
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
         * @param noMipmap defines if the engine should avoid generating the mip levels
         * @param callback defines a callback used to extract texture data from loaded data
         * @param mipmapGenerator defines to provide an optional tool to generate mip levels
         * @param onLoad defines a callback called when texture is loaded
         * @param onError defines a callback called if there is an error
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTextureFromUrl(url: string, scene: Nullable<Scene>, size: number, format: number, type: number, noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
            mipmapGenerator: Nullable<((faces: ArrayBufferView[]) => ArrayBufferView[][])>,
            onLoad: Nullable<() => void>,
            onError: Nullable<(message?: string, exception?: any) => void>): InternalTexture;

        /**
         * Creates a new raw cube texture from a specified url
         * @param url defines the url where the data is located
         * @param scene defines the current scene
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
         * @param noMipmap defines if the engine should avoid generating the mip levels
         * @param callback defines a callback used to extract texture data from loaded data
         * @param mipmapGenerator defines to provide an optional tool to generate mip levels
         * @param onLoad defines a callback called when texture is loaded
         * @param onError defines a callback called if there is an error
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param invertY defines if data must be stored with Y axis inverted
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTextureFromUrl(url: string, scene: Nullable<Scene>, size: number, format: number, type: number, noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
            mipmapGenerator: Nullable<((faces: ArrayBufferView[]) => ArrayBufferView[][])>,
            onLoad: Nullable<() => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            samplingMode: number,
            invertY: boolean): InternalTexture;

        /**
         * Creates a new raw 3D texture
         * @param data defines the data used to create the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param depth defines the depth of the texture
         * @param format defines the format of the texture
         * @param generateMipMaps defines if the engine must generate mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compressed used (can be null)
         * @param textureType defines the compressed used (can be null)
         * @returns a new raw 3D texture (stored in an InternalTexture)
         */
        createRawTexture3D(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string>, textureType: number): InternalTexture;

        /**
         * Update a raw 3D texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw 3D texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string>, textureType: number): void;

        /**
         * Creates a new raw 2D array texture
         * @param data defines the data used to create the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param depth defines the number of layers of the texture
         * @param format defines the format of the texture
         * @param generateMipMaps defines if the engine must generate mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compressed used (can be null)
         * @param textureType defines the compressed used (can be null)
         * @returns a new raw 2D array texture (stored in an InternalTexture)
         */
        createRawTexture2DArray(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string>, textureType: number): InternalTexture;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture2DArray(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture2DArray(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string>, textureType: number): void;
    }
}

ThinEngine.prototype.updateRawTexture = function(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): void {
    if (!texture) {
        return;
    }
    // Babylon's internalSizedFomat but gl's texImage2D internalFormat
    var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type, format);

    // Babylon's internalFormat but gl's texImage2D format
    var internalFormat = this._getInternalFormat(format);
    var textureType = this._getWebGLTextureType(type);
    this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);
    this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
        texture.format = format;
        texture.type = type;
        texture.invertY = invertY;
        texture._compression = compression;
    }

    if (texture.width % 4 !== 0) {
        this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
    }

    if (compression && data) {
        this._gl.compressedTexImage2D(this._gl.TEXTURE_2D, 0, (<any>this.getCaps().s3tc)[compression], texture.width, texture.height, 0, <DataView>data);
    } else {
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, data);
    }

    if (texture.generateMipMaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_2D);
    }
    this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
    //  this.resetTextureCache();
    texture.isReady = true;
};

ThinEngine.prototype.createRawTexture = function(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
    var texture = new InternalTexture(this, InternalTextureSource.Raw);
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.width = width;
    texture.height = height;
    texture.format = format;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    texture.invertY = invertY;
    texture._compression = compression;
    texture.type = type;

    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }

    this.updateRawTexture(texture, data, format, invertY, compression, type);
    this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);

    // Filters
    var filters = this._getSamplingParameters(samplingMode, generateMipMaps);

    this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
    this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);

    if (generateMipMaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_2D);
    }

    this._bindTextureDirectly(this._gl.TEXTURE_2D, null);

    this._internalTexturesCache.push(texture);

    return texture;
};

ThinEngine.prototype.createRawCubeTexture = function(data: Nullable<ArrayBufferView[]>, size: number, format: number, type: number,
    generateMipMaps: boolean, invertY: boolean, samplingMode: number,
    compression: Nullable<string> = null): InternalTexture {
    var gl = this._gl;
    var texture = new InternalTexture(this, InternalTextureSource.CubeRaw);
    texture.isCube = true;
    texture.format = format;
    texture.type = type;
    if (!this._doNotHandleContextLost) {
        texture._bufferViewArray = data;
    }

    var textureType = this._getWebGLTextureType(type);
    var internalFormat = this._getInternalFormat(format);

    if (internalFormat === gl.RGB) {
        internalFormat = gl.RGBA;
    }

    // Mipmap generation needs a sized internal format that is both color-renderable and texture-filterable
    if (textureType === gl.FLOAT && !this._caps.textureFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        Logger.Warn("Float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    }
    else if (textureType === this._gl.HALF_FLOAT_OES && !this._caps.textureHalfFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        Logger.Warn("Half float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    }
    else if (textureType === gl.FLOAT && !this._caps.textureFloatRender) {
        generateMipMaps = false;
        Logger.Warn("Render to float textures is not supported. Mipmap generation forced to false.");
    }
    else if (textureType === gl.HALF_FLOAT && !this._caps.colorBufferFloat) {
        generateMipMaps = false;
        Logger.Warn("Render to half float textures is not supported. Mipmap generation forced to false.");
    }

    var width = size;
    var height = width;

    texture.width = width;
    texture.height = height;

    // Double check on POT to generate Mips.
    var isPot = !this.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
    if (!isPot) {
        generateMipMaps = false;
    }

    // Upload data if needed. The texture won't be ready until then.
    if (data) {
        this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
    }

    this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture, true);

    // Filters
    if (data && generateMipMaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP);
    }

    var filters = this._getSamplingParameters(samplingMode, generateMipMaps);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

    texture.generateMipMaps = generateMipMaps;

    return texture;
};

ThinEngine.prototype.updateRawCubeTexture = function(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string> = null, level: number = 0): void {
    texture._bufferViewArray = data;
    texture.format = format;
    texture.type = type;
    texture.invertY = invertY;
    texture._compression = compression;

    var gl = this._gl;
    var textureType = this._getWebGLTextureType(type);
    var internalFormat = this._getInternalFormat(format);
    var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type);

    var needConversion = false;
    if (internalFormat === gl.RGB) {
        internalFormat = gl.RGBA;
        needConversion = true;
    }

    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
    this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

    if (texture.width % 4 !== 0) {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    }

    // Data are known to be in +X +Y +Z -X -Y -Z
    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
        let faceData = data[faceIndex];

        if (compression) {
            gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, (<any>(this.getCaps().s3tc))[compression], texture.width, texture.height, 0, <DataView>faceData);
        } else {
            if (needConversion) {
                faceData = _convertRGBtoRGBATextureData(faceData, texture.width, texture.height, type);
            }
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, faceData);
        }
    }

    var isPot = !this.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
    if (isPot && texture.generateMipMaps && level === 0) {
        this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP);
    }
    this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);

    // this.resetTextureCache();
    texture.isReady = true;
};

ThinEngine.prototype.createRawCubeTextureFromUrl = function(url: string, scene: Nullable<Scene>, size: number, format: number, type: number, noMipmap: boolean,
    callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
    mipmapGenerator: Nullable<((faces: ArrayBufferView[]) => ArrayBufferView[][])>,
    onLoad: Nullable<() => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
    invertY: boolean = false): InternalTexture {

    var gl = this._gl;
    var texture = this.createRawCubeTexture(null, size, format, type, !noMipmap, invertY, samplingMode, null);
    scene?._addPendingData(texture);
    texture.url = url;
    this._internalTexturesCache.push(texture);

    var onerror = (request?: IWebRequest, exception?: any) => {
        scene?._removePendingData(texture);
        if (onError && request) {
            onError(request.status + " " + request.statusText, exception);
        }
    };

    var internalCallback = (data: any) => {
        var width = texture.width;
        var faceDataArrays = callback(data);

        if (!faceDataArrays) {
            return;
        }

        if (mipmapGenerator) {
            var textureType = this._getWebGLTextureType(type);
            var internalFormat = this._getInternalFormat(format);
            var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type);

            var needConversion = false;
            if (internalFormat === gl.RGB) {
                internalFormat = gl.RGBA;
                needConversion = true;
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
            this._unpackFlipY(false);

            var mipData = mipmapGenerator(faceDataArrays);
            for (var level = 0; level < mipData.length; level++) {
                var mipSize = width >> level;

                for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                    let mipFaceData = mipData[level][faceIndex];
                    if (needConversion) {
                        mipFaceData = _convertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                    }
                    gl.texImage2D(faceIndex, level, internalSizedFomat, mipSize, mipSize, 0, internalFormat, textureType, mipFaceData);
                }
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
        }
        else {
            this.updateRawCubeTexture(texture, faceDataArrays, format, type, invertY);
        }

        texture.isReady = true;
        // this.resetTextureCache();
        scene?._removePendingData(texture);

        if (onLoad) {
            onLoad();
        }
    };

    this._loadFile(url, (data) => {
        internalCallback(data);
    }, undefined, scene?.offlineProvider, true, onerror);

    return texture;
};

/** @hidden */
function _convertRGBtoRGBATextureData(rgbData: any, width: number, height: number, textureType: number): ArrayBufferView {
    // Create new RGBA data container.
    var rgbaData: any;
    if (textureType === Constants.TEXTURETYPE_FLOAT) {
        rgbaData = new Float32Array(width * height * 4);
    }
    else {
        rgbaData = new Uint32Array(width * height * 4);
    }

    // Convert each pixel.
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let index = (y * width + x) * 3;
            let newIndex = (y * width + x) * 4;

            // Map Old Value to new value.
            rgbaData[newIndex + 0] = rgbData[index + 0];
            rgbaData[newIndex + 1] = rgbData[index + 1];
            rgbaData[newIndex + 2] = rgbData[index + 2];

            // Add fully opaque alpha channel.
            rgbaData[newIndex + 3] = 1;
        }
    }

    return rgbaData;
}

/**
 * Create a function for createRawTexture3D/createRawTexture2DArray
 * @param is3D true for TEXTURE_3D and false for TEXTURE_2D_ARRAY
 * @hidden
 */
function _makeCreateRawTextureFunction(is3D: boolean) {
    return function(this: ThinEngine, data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
        var target = is3D ? this._gl.TEXTURE_3D : this._gl.TEXTURE_2D_ARRAY;
        var source = is3D ? InternalTextureSource.Raw3D : InternalTextureSource.Raw2DArray;
        var texture = new InternalTexture(this, source);
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.baseDepth = depth;
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        texture.format = format;
        texture.type = textureType;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        if (is3D) {
            texture.is3D = true;
        } else {
            texture.is2DArray = true;
        }

        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
        }

        if (is3D) {
            this.updateRawTexture3D(texture, data, format, invertY, compression, textureType);
        } else {
            this.updateRawTexture2DArray(texture, data, format, invertY, compression, textureType);
        }
        this._bindTextureDirectly(target, texture, true);

        // Filters
        var filters = this._getSamplingParameters(samplingMode, generateMipMaps);

        this._gl.texParameteri(target, this._gl.TEXTURE_MAG_FILTER, filters.mag);
        this._gl.texParameteri(target, this._gl.TEXTURE_MIN_FILTER, filters.min);

        if (generateMipMaps) {
            this._gl.generateMipmap(target);
        }

        this._bindTextureDirectly(target, null);

        this._internalTexturesCache.push(texture);

        return texture;
    };
}

ThinEngine.prototype.createRawTexture2DArray = _makeCreateRawTextureFunction(false);
ThinEngine.prototype.createRawTexture3D = _makeCreateRawTextureFunction(true);

/**
 * Create a function for updateRawTexture3D/updateRawTexture2DArray
 * @param is3D true for TEXTURE_3D and false for TEXTURE_2D_ARRAY
 * @hidden
 */
function _makeUpdateRawTextureFunction(is3D: boolean) {
    return function(this: ThinEngine, texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT): void {
        var target = is3D ? this._gl.TEXTURE_3D : this._gl.TEXTURE_2D_ARRAY;
        var internalType = this._getWebGLTextureType(textureType);
        var internalFormat = this._getInternalFormat(format);
        var internalSizedFomat = this._getRGBABufferInternalSizedFormat(textureType, format);

        this._bindTextureDirectly(target, texture, true);
        this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
            texture.format = format;
            texture.invertY = invertY;
            texture._compression = compression;
        }

        if (texture.width % 4 !== 0) {
            this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
        }

        if (compression && data) {
            this._gl.compressedTexImage3D(target, 0, (<any>this.getCaps().s3tc)[compression], texture.width, texture.height, texture.depth, 0, data);
        } else {
            this._gl.texImage3D(target, 0, internalSizedFomat, texture.width, texture.height, texture.depth, 0, internalFormat, internalType, data);
        }

        if (texture.generateMipMaps) {
            this._gl.generateMipmap(target);
        }
        this._bindTextureDirectly(target, null);
        // this.resetTextureCache();
        texture.isReady = true;
    };
}

ThinEngine.prototype.updateRawTexture2DArray = _makeUpdateRawTextureFunction(false);
ThinEngine.prototype.updateRawTexture3D = _makeUpdateRawTextureFunction(true);
