var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * This class given information about a given character.
     */
    var CharInfo = (function () {
        function CharInfo() {
        }
        return CharInfo;
    }());
    BABYLON.CharInfo = CharInfo;
    var FontTexture = (function (_super) {
        __extends(FontTexture, _super);
        /**
         * Create a new instance of the FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param scene the scene that owns the texture
         * @param maxCharCount the approximative maximum count of characters that could fit in the texture. This is an approximation because most of the fonts are proportional (each char has its own Width). The 'W' character's width is used to compute the size of the texture based on the given maxCharCount
         * @param samplingMode the texture sampling mode
         */
        function FontTexture(name, font, scene, maxCharCount, samplingMode) {
            if (maxCharCount === void 0) { maxCharCount = 200; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            _super.call(this, null, scene, true, false, samplingMode);
            this._charInfos = {};
            this._curCharCount = 0;
            this._lastUpdateCharCount = -1;
            this._usedCounter = 1;
            this.name = name;
            this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            // First canvas creation to determine the size of the texture to create
            this._canvas = document.createElement("canvas");
            this._context = this._canvas.getContext("2d");
            this._context.font = font;
            this._context.fillStyle = "white";
            var res = this.getFontHeight(font);
            this._lineHeight = res.height;
            this._offset = res.offset - 1;
            var maxCharWidth = this._context.measureText("W").width;
            this._spaceWidth = this._context.measureText(" ").width;
            // This is an approximate size, but should always be able to fit at least the maxCharCount
            var totalEstSurface = this._lineHeight * maxCharWidth * maxCharCount;
            var edge = Math.sqrt(totalEstSurface);
            var textSize = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));
            // Create the texture that will store the font characters
            this._texture = scene.getEngine().createDynamicTexture(textSize, textSize, false, samplingMode);
            var textureSize = this.getSize();
            // Recreate a new canvas with the final size: the one matching the texture (resizing the previous one doesn't work as one would expect...)
            this._canvas = document.createElement("canvas");
            this._canvas.width = textureSize.width;
            this._canvas.height = textureSize.height;
            this._context = this._canvas.getContext("2d");
            this._context.textBaseline = "top";
            this._context.font = font;
            this._context.fillStyle = "white";
            this._context.imageSmoothingEnabled = false;
            this._currentFreePosition = BABYLON.Vector2.Zero();
            // Add the basic ASCII based characters
            for (var i = 0x20; i < 0x7F; i++) {
                var c = String.fromCharCode(i);
                this.getChar(c);
            }
            this.update();
        }
        Object.defineProperty(FontTexture.prototype, "spaceWidth", {
            get: function () {
                return this._spaceWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FontTexture.prototype, "lineHeight", {
            get: function () {
                return this._lineHeight;
            },
            enumerable: true,
            configurable: true
        });
        FontTexture.GetCachedFontTexture = function (scene, fontName) {
            var s = scene;
            if (!s.__fontTextureCache__) {
                s.__fontTextureCache__ = new BABYLON.StringDictionary();
            }
            var dic = s.__fontTextureCache__;
            var lfn = fontName.toLocaleLowerCase();
            var ft = dic.get(lfn);
            if (ft) {
                ++ft._usedCounter;
                return ft;
            }
            ft = new FontTexture(null, lfn, scene, 200, BABYLON.Texture.NEAREST_SAMPLINGMODE);
            dic.add(lfn, ft);
            return ft;
        };
        FontTexture.ReleaseCachedFontTexture = function (scene, fontName) {
            var s = scene;
            var dic = s.__fontTextureCache__;
            if (!dic) {
                return;
            }
            var lfn = fontName.toLocaleLowerCase();
            var font = dic.get(lfn);
            if (--font._usedCounter === 0) {
                dic.remove(lfn);
                font.dispose();
            }
        };
        /**
         * Make sure the given char is present in the font map.
         * @param char the character to get or add
         * @return the CharInfo instance corresponding to the given character
         */
        FontTexture.prototype.getChar = function (char) {
            if (char.length !== 1) {
                return null;
            }
            var info = this._charInfos[char];
            if (info) {
                return info;
            }
            info = new CharInfo();
            var measure = this._context.measureText(char);
            var textureSize = this.getSize();
            // we reached the end of the current line?
            var xMargin = 2;
            var yMargin = 2;
            var width = measure.width;
            if (this._currentFreePosition.x + width + xMargin > textureSize.width) {
                this._currentFreePosition.x = 0;
                this._currentFreePosition.y += this._lineHeight + yMargin; // +2 for safety margin
                // No more room?
                if (this._currentFreePosition.y > textureSize.height) {
                    return this.getChar("!");
                }
            }
            // Draw the character in the texture
            this._context.fillText(char, this._currentFreePosition.x - 0.5, this._currentFreePosition.y - this._offset - 0.5);
            // Fill the CharInfo object
            info.topLeftUV = new BABYLON.Vector2(this._currentFreePosition.x / textureSize.width, this._currentFreePosition.y / textureSize.height);
            info.bottomRightUV = new BABYLON.Vector2(info.topLeftUV.x + (width / textureSize.width), info.topLeftUV.y + ((this._lineHeight + 2) / textureSize.height));
            info.charWidth = width;
            // Add the info structure
            this._charInfos[char] = info;
            this._curCharCount++;
            // Set the next position
            this._currentFreePosition.x += width + xMargin;
            return info;
        };
        FontTexture.prototype.measureText = function (text, tabulationSize) {
            if (tabulationSize === void 0) { tabulationSize = 4; }
            var maxWidth = 0;
            var curWidth = 0;
            var lineCount = 1;
            var charxpos = 0;
            // Parse each char of the string
            for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
                var char = text_1[_i];
                // Next line feed?
                if (char === "\n") {
                    maxWidth = Math.max(maxWidth, curWidth);
                    charxpos = 0;
                    curWidth = 0;
                    ++lineCount;
                    continue;
                }
                // Tabulation ?
                if (char === "\t") {
                    var nextPos = charxpos + tabulationSize;
                    nextPos = nextPos - (nextPos % tabulationSize);
                    curWidth += (nextPos - charxpos) * this.spaceWidth;
                    charxpos = nextPos;
                    continue;
                }
                if (char < " ") {
                    continue;
                }
                curWidth += this.getChar(char).charWidth;
                ++charxpos;
            }
            maxWidth = Math.max(maxWidth, curWidth);
            return new BABYLON.Size(maxWidth, lineCount * this._lineHeight);
        };
        // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
        FontTexture.prototype.getFontHeight = function (font) {
            var fontDraw = document.createElement("canvas");
            var ctx = fontDraw.getContext('2d');
            ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'white';
            ctx.font = font;
            ctx.fillText('jH|', 0, 0);
            var pixels = ctx.getImageData(0, 0, fontDraw.width, fontDraw.height).data;
            var start = -1;
            var end = -1;
            for (var row = 0; row < fontDraw.height; row++) {
                for (var column = 0; column < fontDraw.width; column++) {
                    var index = (row * fontDraw.width + column) * 4;
                    if (pixels[index] === 0) {
                        if (column === fontDraw.width - 1 && start !== -1) {
                            end = row;
                            row = fontDraw.height;
                            break;
                        }
                        continue;
                    }
                    else {
                        if (start === -1) {
                            start = row;
                        }
                        break;
                    }
                }
            }
            return { height: end - start, offset: start - 1 };
        };
        Object.defineProperty(FontTexture.prototype, "canRescale", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        FontTexture.prototype.getContext = function () {
            return this._context;
        };
        /**
         * Call this method when you've call getChar() at least one time, this will update the texture if needed.
         * Don't be afraid to call it, if no new character was added, this method simply does nothing.
         */
        FontTexture.prototype.update = function () {
            // Update only if there's new char added since the previous update
            if (this._lastUpdateCharCount < this._curCharCount) {
                this.getScene().getEngine().updateDynamicTexture(this._texture, this._canvas, false, true);
                this._lastUpdateCharCount = this._curCharCount;
            }
        };
        // cloning should be prohibited, there's no point to duplicate this texture at all
        FontTexture.prototype.clone = function () {
            return null;
        };
        return FontTexture;
    }(BABYLON.Texture));
    BABYLON.FontTexture = FontTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.fontTexture.js.map