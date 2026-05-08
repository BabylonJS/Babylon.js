/** This file must only contain pure code and pure imports */

import { Nullable } from "../../types";
import { AbstractEngine } from "../abstractEngine.pure";

let _registered = false;
export function registerAbstractEngineTextureSelector(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    function TransformTextureUrl(this: AbstractEngine, url: string): string {
        const excludeFn = (entry: string) => {
            const strRegExPattern: string = "\\b" + entry + "\\b";
            return url && (url === entry || url.match(new RegExp(strRegExPattern, "g")));
        };

        if (this._excludedCompressedTextures && this._excludedCompressedTextures.some(excludeFn)) {
            return url;
        }

        const lastDot = url.lastIndexOf(".");
        const lastQuestionMark = url.lastIndexOf("?");
        const querystring = lastQuestionMark > -1 ? url.substring(lastQuestionMark, url.length) : "";
        return (lastDot > -1 ? url.substring(0, lastDot) : url) + this._textureFormatInUse + querystring;
    }

    Object.defineProperty(AbstractEngine.prototype, "texturesSupported", {
        get: function (this: AbstractEngine) {
            // Intelligently add supported compressed formats in order to check for.
            // Check for ASTC support first as it is most powerful and to be very cross platform.
            // Next PVRTC & DXT, which are probably superior to ETC1/2.
            // Likely no hardware which supports both PVR & DXT, so order matters little.
            // ETC2 is newer and handles ETC1 (no alpha capability), so check for first.
            const texturesSupported: string[] = [];
            if (this._caps.astc) {
                texturesSupported.push("-astc.ktx");
            }
            if (this._caps.s3tc) {
                texturesSupported.push("-dxt.ktx");
            }
            if (this._caps.pvrtc) {
                texturesSupported.push("-pvrtc.ktx");
            }
            if (this._caps.etc2) {
                texturesSupported.push("-etc2.ktx");
            }
            if (this._caps.etc1) {
                texturesSupported.push("-etc1.ktx");
            }
            return texturesSupported;
        },
        enumerable: true,
        configurable: true,
    });

    Object.defineProperty(AbstractEngine.prototype, "textureFormatInUse", {
        get: function (this: AbstractEngine) {
            return this._textureFormatInUse || null;
        },
        enumerable: true,
        configurable: true,
    });

    AbstractEngine.prototype.setCompressedTextureExclusions = function (skippedFiles: Array<string>): void {
        this._excludedCompressedTextures = skippedFiles;
    };

    AbstractEngine.prototype.setTextureFormatToUse = function (formatsAvailable: Array<string>): Nullable<string> {
        const texturesSupported = this.texturesSupported;
        for (let i = 0, len1 = texturesSupported.length; i < len1; i++) {
            for (let j = 0, len2 = formatsAvailable.length; j < len2; j++) {
                if (texturesSupported[i] === formatsAvailable[j].toLowerCase()) {
                    this._transformTextureUrl = (url: string) => TransformTextureUrl.call(this, url);
                    return (this._textureFormatInUse = texturesSupported[i]);
                }
            }
        }
        // actively set format to nothing, to allow this to be called more than once
        // and possibly fail the 2nd time
        this._textureFormatInUse = "";
        this._transformTextureUrl = null;
        return null;
    };
}
