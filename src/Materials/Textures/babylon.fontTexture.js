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
         * @param superSample if true the FontTexture will be created with a font of a size twice bigger than the given one but all properties (lineHeight, charWidth, etc.) will be according to the original size. This is made to improve the text quality.
         */
        function FontTexture(name, font, scene, maxCharCount, samplingMode, superSample, signedDistanceField) {
            if (maxCharCount === void 0) { maxCharCount = 200; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (superSample === void 0) { superSample = false; }
            if (signedDistanceField === void 0) { signedDistanceField = false; }
            _super.call(this, null, scene, true, false, samplingMode);
            this._charInfos = {};
            this._curCharCount = 0;
            this._lastUpdateCharCount = -1;
            this._usedCounter = 1;
            this.name = name;
            this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._sdfScale = 8;
            this._signedDistanceField = signedDistanceField;
            this._superSample = false;
            // SDF will use supersample no matter what, the resolution is otherwise too poor to produce correct result
            if (superSample || signedDistanceField) {
                var sfont = this.getSuperSampleFont(font);
                if (sfont) {
                    this._superSample = true;
                    font = sfont;
                }
            }
            // First canvas creation to determine the size of the texture to create
            this._canvas = document.createElement("canvas");
            this._context = this._canvas.getContext("2d");
            this._context.font = font;
            this._context.fillStyle = "white";
            this._cachedFontId = null;
            var res = this.getFontHeight(font);
            this._lineHeightSuper = res.height + 4;
            this._lineHeight = this._superSample ? (Math.ceil(this._lineHeightSuper / 2)) : this._lineHeightSuper;
            this._offset = res.offset - 1;
            this._xMargin = 1 + Math.ceil(this._lineHeightSuper / 15); // Right now this empiric formula seems to work...
            this._yMargin = this._xMargin;
            var maxCharWidth = this._context.measureText("W").width;
            this._spaceWidthSuper = this._context.measureText(" ").width;
            this._spaceWidth = this._superSample ? (this._spaceWidthSuper / 2) : this._spaceWidthSuper;
            // This is an approximate size, but should always be able to fit at least the maxCharCount
            var totalEstSurface = (this._lineHeightSuper + this._yMargin) * (maxCharWidth + this._xMargin) * maxCharCount;
            var edge = Math.sqrt(totalEstSurface);
            var textSize = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));
            // Create the texture that will store the font characters
            this._texture = scene.getEngine().createDynamicTexture(textSize, textSize, false, samplingMode);
            var textureSize = this.getSize();
            this.hasAlpha = this._signedDistanceField === false;
            // Recreate a new canvas with the final size: the one matching the texture (resizing the previous one doesn't work as one would expect...)
            this._canvas = document.createElement("canvas");
            this._canvas.width = textureSize.width;
            this._canvas.height = textureSize.height;
            this._context = this._canvas.getContext("2d");
            this._context.textBaseline = "top";
            this._context.font = font;
            this._context.fillStyle = "white";
            this._context.imageSmoothingEnabled = false;
            this._context.clearRect(0, 0, textureSize.width, textureSize.height);
            // Create a canvas for the signed distance field mode, we only have to store one char, the purpose is to render a char scaled _sdfScale times
            //  into this 2D context, then get the bitmap data, create the sdf char and push the result in the _context (which hold the whole Font Texture content)
            // So you can see this context as an intermediate one, because it is.
            if (this._signedDistanceField) {
                var sdfC = document.createElement("canvas");
                var s = this._sdfScale;
                sdfC.width = maxCharWidth * s;
                sdfC.height = this._lineHeightSuper * s;
                var sdfCtx = sdfC.getContext("2d");
                sdfCtx.scale(s, s);
                sdfCtx.textBaseline = "top";
                sdfCtx.font = font;
                sdfCtx.fillStyle = "white";
                sdfCtx.imageSmoothingEnabled = false;
                this._sdfCanvas = sdfC;
                this._sdfContext = sdfCtx;
            }
            this._currentFreePosition = BABYLON.Vector2.Zero();
            // Add the basic ASCII based characters
            for (var i = 0x20; i < 0x7F; i++) {
                var c = String.fromCharCode(i);
                this.getChar(c);
            }
            this.update();
        }
        Object.defineProperty(FontTexture.prototype, "isSuperSampled", {
            get: function () {
                return this._superSample;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FontTexture.prototype, "isSignedDistanceField", {
            get: function () {
                return this._signedDistanceField;
            },
            enumerable: true,
            configurable: true
        });
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
        FontTexture.GetCachedFontTexture = function (scene, fontName, supersample, signedDistanceField) {
            if (supersample === void 0) { supersample = false; }
            if (signedDistanceField === void 0) { signedDistanceField = false; }
            var s = scene;
            if (!s.__fontTextureCache__) {
                s.__fontTextureCache__ = new BABYLON.StringDictionary();
            }
            var dic = s.__fontTextureCache__;
            var lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS") + (signedDistanceField ? "_+SDF" : "_-SDF");
            var ft = dic.get(lfn);
            if (ft) {
                ++ft._usedCounter;
                return ft;
            }
            ft = new FontTexture(null, fontName, scene, supersample ? 100 : 200, BABYLON.Texture.BILINEAR_SAMPLINGMODE, supersample, signedDistanceField);
            ft._cachedFontId = lfn;
            dic.add(lfn, ft);
            return ft;
        };
        FontTexture.ReleaseCachedFontTexture = function (scene, fontName, supersample, signedDistanceField) {
            if (supersample === void 0) { supersample = false; }
            if (signedDistanceField === void 0) { signedDistanceField = false; }
            var s = scene;
            var dic = s.__fontTextureCache__;
            if (!dic) {
                return;
            }
            var lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS") + (signedDistanceField ? "_+SDF" : "_-SDF");
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
            var width = Math.round(measure.width);
            if (this._currentFreePosition.x + width + this._xMargin > textureSize.width) {
                this._currentFreePosition.x = 0;
                this._currentFreePosition.y += this._lineHeightSuper + this._yMargin;
                // No more room?
                if (this._currentFreePosition.y > textureSize.height) {
                    return this.getChar("!");
                }
            }
            // In sdf mode we render the character in an intermediate 2D context which scale the character this._sdfScale times (which is required to compute the sdf map accurately)
            if (this._signedDistanceField) {
                this._sdfContext.clearRect(0, 0, this._sdfCanvas.width, this._sdfCanvas.height);
                this._sdfContext.fillText(char, 0, 0);
                var data = this._sdfContext.getImageData(0, 0, width * this._sdfScale, this._sdfCanvas.height);
                var res = this._computeSDFChar(data);
                this._context.putImageData(res, this._currentFreePosition.x, this._currentFreePosition.y);
            }
            else {
                // Draw the character in the HTML canvas
                this._context.fillText(char, this._currentFreePosition.x, this._currentFreePosition.y - this._offset);
            }
            // Fill the CharInfo object
            info.topLeftUV = new BABYLON.Vector2(this._currentFreePosition.x / textureSize.width, this._currentFreePosition.y / textureSize.height);
            info.bottomRightUV = new BABYLON.Vector2((this._currentFreePosition.x + width) / textureSize.width, info.topLeftUV.y + ((this._lineHeightSuper + 2) / textureSize.height));
            if (this._signedDistanceField) {
                var off = 1 / textureSize.width;
                info.topLeftUV.addInPlace(new BABYLON.Vector2(off, off));
                info.bottomRightUV.addInPlace(new BABYLON.Vector2(off, off));
            }
            info.charWidth = this._superSample ? (width / 2) : width;
            // Add the info structure
            this._charInfos[char] = info;
            this._curCharCount++;
            // Set the next position
            this._currentFreePosition.x += width + this._xMargin;
            return info;
        };
        FontTexture.prototype._computeSDFChar = function (source) {
            var scl = this._sdfScale;
            var sw = source.width;
            var sh = source.height;
            var dw = sw / scl;
            var dh = sh / scl;
            var roffx = 0;
            var roffy = 0;
            // We shouldn't look beyond half of the biggest between width and height
            var radius = scl;
            var br = radius - 1;
            var lookupSrc = function (dx, dy, offX, offY, lookVis) {
                var sx = dx * scl;
                var sy = dy * scl;
                // Looking out of the area? return true to make the test going on
                if (((sx + offX) < 0) || ((sx + offX) >= sw) || ((sy + offY) < 0) || ((sy + offY) >= sh)) {
                    return true;
                }
                // Get the pixel we want
                var val = source.data[(((sy + offY) * sw) + (sx + offX)) * 4];
                var res = (val > 0) === lookVis;
                if (!res) {
                    roffx = offX;
                    roffy = offY;
                }
                return res;
            };
            var lookupArea = function (dx, dy, lookVis) {
                // Fast rejection test, if we have the same result in N, S, W, E at a distance which is the radius-1 then it means the data will be consistent in this area. That's because we've scale the rendering of the letter "radius" times, so a letter's pixel will be at least radius wide
                if (lookupSrc(dx, dy, 0, br, lookVis) &&
                    lookupSrc(dx, dy, 0, -br, lookVis) &&
                    lookupSrc(dx, dy, -br, 0, lookVis) &&
                    lookupSrc(dx, dy, br, 0, lookVis)) {
                    return 0;
                }
                for (var i = 1; i <= radius; i++) {
                    // Quick test N, S, W, E
                    if (!lookupSrc(dx, dy, 0, i, lookVis) || !lookupSrc(dx, dy, 0, -i, lookVis) || !lookupSrc(dx, dy, -i, 0, lookVis) || !lookupSrc(dx, dy, i, 0, lookVis)) {
                        return i * i; // Squared Distance is simple to compute in this case
                    }
                    // Test the frame area (except the N, S, W, E spots) from the nearest point from the center to the further one
                    for (var j = 1; j <= i; j++) {
                        if (!lookupSrc(dx, dy, -j, i, lookVis) || !lookupSrc(dx, dy, j, i, lookVis) ||
                            !lookupSrc(dx, dy, i, -j, lookVis) || !lookupSrc(dx, dy, i, j, lookVis) ||
                            !lookupSrc(dx, dy, -j, -i, lookVis) || !lookupSrc(dx, dy, j, -i, lookVis) ||
                            !lookupSrc(dx, dy, -i, -j, lookVis) || !lookupSrc(dx, dy, -i, j, lookVis)) {
                            // We found the nearest texel having and opposite state, store the squared length
                            var res_1 = (i * i) + (j * j);
                            var count = 1;
                            // To improve quality we will  sample the texels around this one, so it's 8 samples, we consider only the one having an opposite state, add them to the current res and will will compute the average at the end
                            if (!lookupSrc(dx, dy, roffx - 1, roffy, lookVis)) {
                                res_1 += (roffx - 1) * (roffx - 1) + roffy * roffy;
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy, lookVis)) {
                                res_1 += (roffx + 1) * (roffx + 1) + roffy * roffy;
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx, roffy - 1, lookVis)) {
                                res_1 += roffx * roffx + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx, roffy + 1, lookVis)) {
                                res_1 += roffx * roffx + (roffy + 1) * (roffy + 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx - 1, roffy - 1, lookVis)) {
                                res_1 += (roffx - 1) * (roffx - 1) + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy + 1, lookVis)) {
                                res_1 += (roffx + 1) * (roffx + 1) + (roffy + 1) * (roffy + 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy - 1, lookVis)) {
                                res_1 += (roffx + 1) * (roffx + 1) + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx - 1, roffy + 1, lookVis)) {
                                res_1 += (roffx - 1) * (roffx - 1) + (roffy + 1) * (roffy + 1);
                                ++count;
                            }
                            // Compute the average based on the accumulated distance
                            return res_1 / count;
                        }
                    }
                }
                return 0;
            };
            var tmp = new Array(dw * dh);
            for (var y = 0; y < dh; y++) {
                for (var x = 0; x < dw; x++) {
                    var curState = lookupSrc(x, y, 0, 0, true);
                    var d = lookupArea(x, y, curState);
                    if (d === 0) {
                        d = radius * radius * 2;
                    }
                    tmp[(y * dw) + x] = curState ? d : -d;
                }
            }
            var res = this._context.createImageData(dw, dh);
            var size = dw * dh;
            for (var j = 0; j < size; j++) {
                var d = tmp[j];
                var sign = (d < 0) ? -1 : 1;
                d = Math.sqrt(Math.abs(d)) * sign;
                d *= 127.5 / radius;
                d += 127.5;
                if (d < 0) {
                    d = 0;
                }
                else if (d > 255) {
                    d = 255;
                }
                d += 0.5;
                res.data[j * 4 + 0] = d;
                res.data[j * 4 + 1] = d;
                res.data[j * 4 + 2] = d;
                res.data[j * 4 + 3] = 255;
            }
            return res;
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
            return new BABYLON.Size(maxWidth, lineCount * this.lineHeight);
        };
        FontTexture.prototype.getSuperSampleFont = function (font) {
            // Eternal thank to http://stackoverflow.com/a/10136041/802124
            var regex = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\"\sa-z]+?)\s*$/;
            var res = font.toLocaleLowerCase().match(regex);
            if (res == null) {
                return null;
            }
            var size = parseInt(res[4]);
            res[4] = (size * 2).toString() + (res[4].match(/\D+/) || []).pop();
            var newFont = "";
            for (var j = 1; j < res.length; j++) {
                if (res[j] != null) {
                    newFont += res[j] + " ";
                }
            }
            return newFont;
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
            return { height: (end - start) + 1, offset: start - 1 };
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
        /**
         * For FontTexture retrieved using GetCachedFontTexture, use this method when you transfer this object's lifetime to another party in order to share this resource.
         * When the other party is done with this object, decCachedFontTextureCounter must be called.
         */
        FontTexture.prototype.incCachedFontTextureCounter = function () {
            ++this._usedCounter;
        };
        /**
         * Use this method only in conjunction with incCachedFontTextureCounter, call it when you no longer need to use this shared resource.
         */
        FontTexture.prototype.decCachedFontTextureCounter = function () {
            var s = this.getScene();
            var dic = s.__fontTextureCache__;
            if (!dic) {
                return;
            }
            if (--this._usedCounter === 0) {
                dic.remove(this._cachedFontId);
                this.dispose();
            }
        };
        return FontTexture;
    }(BABYLON.Texture));
    BABYLON.FontTexture = FontTexture;
})(BABYLON || (BABYLON = {}));
