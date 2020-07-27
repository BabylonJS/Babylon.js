import { Nullable } from '../../types';
import { Engine } from '../engine';

declare module "../../Engines/engine" {
    export interface Engine {
        /** @hidden */
        _excludedCompressedTextures: string[];

        /** @hidden */
        _textureFormatInUse: string;

        /**
         * Gets the list of texture formats supported
         */
        readonly texturesSupported: Array<string>;

        /**
         * Gets the texture format in use
         */
        readonly textureFormatInUse: Nullable<string>;

        /**
         * Set the compressed texture extensions or file names to skip.
         *
         * @param skippedFiles defines the list of those texture files you want to skip
         * Example: [".dds", ".env", "myfile.png"]
         */
        setCompressedTextureExclusions(skippedFiles: Array<string>): void;

        /**
         * Set the compressed texture format to use, based on the formats you have, and the formats
         * supported by the hardware / browser.
         *
         * Khronos Texture Container (.ktx) files are used to support this.  This format has the
         * advantage of being specifically designed for OpenGL.  Header elements directly correspond
         * to API arguments needed to compressed textures.  This puts the burden on the container
         * generator to house the arcane code for determining these for current & future formats.
         *
         * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
         * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
         *
         * Note: The result of this call is not taken into account when a texture is base64.
         *
         * @param formatsAvailable defines the list of those format families you have created
         * on your server.  Syntax: '-' + format family + '.ktx'.  (Case and order do not matter.)
         *
         * Current families are astc, dxt, pvrtc, etc2, & etc1.
         * @returns The extension selected.
         */
        setTextureFormatToUse(formatsAvailable: Array<string>): Nullable<string>;
    }
}

function transformTextureUrl(this: Engine, url: string): string {
    const excludeFn = (entry: string) => {
        const strRegExPattern: string = '\\b' + entry + '\\b';
        return (url && (url === entry || url.match(new RegExp(strRegExPattern, 'g'))));
    };

    if (this._excludedCompressedTextures && this._excludedCompressedTextures.some(excludeFn)) {
        return url;
    }

    const lastDot = url.lastIndexOf('.');
    const lastQuestionMark = url.lastIndexOf('?');    
    const querystring = lastQuestionMark > -1 ? url.substring(lastQuestionMark, url.length) : ''
    return (lastDot > -1 ? url.substring(0, lastDot) : url) + this._textureFormatInUse + querystring;
}

Object.defineProperty(Engine.prototype, "texturesSupported", {
    get: function(this: Engine) {
        // Intelligently add supported compressed formats in order to check for.
        // Check for ASTC support first as it is most powerful and to be very cross platform.
        // Next PVRTC & DXT, which are probably superior to ETC1/2.
        // Likely no hardware which supports both PVR & DXT, so order matters little.
        // ETC2 is newer and handles ETC1 (no alpha capability), so check for first.
        const texturesSupported = new Array<string>();
        if (this._caps.astc) { texturesSupported.push('-astc.ktx'); }
        if (this._caps.s3tc) { texturesSupported.push('-dxt.ktx'); }
        if (this._caps.pvrtc) { texturesSupported.push('-pvrtc.ktx'); }
        if (this._caps.etc2) { texturesSupported.push('-etc2.ktx'); }
        if (this._caps.etc1) { texturesSupported.push('-etc1.ktx'); }
        return texturesSupported;
    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(Engine.prototype, "textureFormatInUse", {
    get: function(this: Engine) {
        return this._textureFormatInUse || null;
    },
    enumerable: true,
    configurable: true
});

Engine.prototype.setCompressedTextureExclusions = function(skippedFiles: Array<string>): void {
    this._excludedCompressedTextures = skippedFiles;
};

Engine.prototype.setTextureFormatToUse = function(formatsAvailable: Array<string>): Nullable<string> {
    const texturesSupported = this.texturesSupported;
    for (let i = 0, len1 = texturesSupported.length; i < len1; i++) {
        for (let j = 0, len2 = formatsAvailable.length; j < len2; j++) {
            if (texturesSupported[i] === formatsAvailable[j].toLowerCase()) {
                this._transformTextureUrl = transformTextureUrl.bind(this);
                return this._textureFormatInUse = texturesSupported[i];
            }
        }
    }
    // actively set format to nothing, to allow this to be called more than once
    // and possibly fail the 2nd time
    delete this._textureFormatInUse;
    delete this._transformTextureUrl;
    return null;
};
