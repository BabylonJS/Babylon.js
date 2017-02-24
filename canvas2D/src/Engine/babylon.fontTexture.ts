module BABYLON {

    /**
     * This class given information about a given character.
     */
    export class CharInfo {
        /**
         * The normalized ([0;1]) top/left position of the character in the texture
         */
        topLeftUV: Vector2;

        /**
         * The normalized ([0;1]) right/bottom position of the character in the texture
         */
        bottomRightUV: Vector2;

        xOffset: number;
        yOffset: number;
        xAdvance: number;

        charWidth: number;
    }

    /**
     * This is an abstract base class to hold a Texture that will contain a FontMap
     */
    export abstract class BaseFontTexture extends Texture {

        constructor(url: string, scene: Scene, noMipmap: boolean = false, invertY: boolean = true, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {

            super(url, scene, noMipmap, invertY, samplingMode);

            this._cachedFontId = null;
            this._charInfos = new StringDictionary<CharInfo>();
        }

        /**
         * Is the Font is using Super Sampling (each font texel is doubled).
         */
        public get isSuperSampled(): boolean {
            return this._superSample;
        }

        /**
         * Is the Font was rendered using the Signed Distance Field algorithm
         * @returns {} 
         */
        public get isSignedDistanceField(): boolean {
            return this._signedDistanceField;
        }

        /**
         * Get the Width (in pixel) of the Space character
         */
        public get spaceWidth(): number {
            return this._spaceWidth;
        }

        /**
         * Get the Line height (in pixel)
         */
        public get lineHeight(): number {
            return this._lineHeight;
        }

        /**
         * When the FontTexture is retrieved through the FontCache, there's a reference counter that is incremented for each use.
         * You also have the possibility to extend the lifetime of the FontTexture when passing it to another object by calling this method
         * Don't forget to call the corresponding decCachedFontTextureCounter method when you no longer have use of the FontTexture.
         * Each call to incCachedFontTextureCounter must have a corresponding call to decCachedFontTextureCounter.
         */
        abstract incCachedFontTextureCounter();

        /**
         * Decrement the reference counter, if it reaches 0 the FontTexture is disposed
         */
        abstract decCachedFontTextureCounter();

        /**
         * Is the font dynamically updated, if true is returned then you have to call the update() before using the font in rendering if new character were adding using getChar()
         */
        abstract get isDynamicFontTexture(): boolean;

        /**
         * Will fetch the new characters retrieved with getChar() to the texture.
         * If there were no new char, this call is harmless and quit in no time.
         * If there were new chars a texture lock/update is made, which is a costy operation.
         */
        abstract update(): void;

        /**
         * Measure the width/height that will take a given text
         * @param text the text to measure
         * @param tabulationSize the size (in space character) of the tabulation character, default value must be 4
         */
        measureText(text: string, tabulationSize?: number): Size {
            let maxWidth: number = 0;
            let curWidth: number = 0;
            let lineCount = 1;
            let charxpos: number = 0;

            // Parse each char of the string
            for (var char of text) {

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
                    let nextPos = charxpos + tabulationSize;
                    nextPos = nextPos - (nextPos % tabulationSize);

                    curWidth += (nextPos - charxpos) * this.spaceWidth;
                    charxpos = nextPos;
                    continue;
                }

                if (char < " ") {
                    continue;
                }

                let ci = this.getChar(char);
                if (!ci) {
                    throw new Error(`Character ${char} is not supported by FontTexture ${this.name}`);
                }
                curWidth += ci.charWidth;
                ++charxpos;
            }
            maxWidth = Math.max(maxWidth, curWidth);

            return new Size(maxWidth, lineCount * this.lineHeight);
        }

        /**
         * Retrieve the CharInfo object for a given character
         * @param char the character to retrieve the CharInfo object from (e.g.: "A", "a", etc.)
         */
        abstract getChar(char: string): CharInfo;

        protected _charInfos: StringDictionary<CharInfo>;
        protected _lineHeight: number;
        protected _spaceWidth;
        protected _superSample: boolean;
        protected _signedDistanceField: boolean;
        protected _cachedFontId: string;
    }

    export class BitmapFontInfo {
        kerningDic = new StringDictionary<number>();
        charDic = new StringDictionary<CharInfo>();

        textureSize : Size;
        atlasName   : string;
        padding     : Vector4;       // Left, Top, Right, Bottom
        lineHeight  : number;
        baseLine    : number;
        textureUrl  : string;
        textureFile : string;
    }

    export interface IBitmapFontLoader {
        loadFont(fontDataContent: any, scene: Scene, invertY: boolean): { bfi: BitmapFontInfo, errorMsg: string, errorCode: number };
    }

    export class BitmapFontTexture extends BaseFontTexture {
        public constructor( scene: Scene,
                            bmFontUrl: string,
                            textureUrl: string = null,
                            noMipmap: boolean = false,
                            invertY: boolean = true,
                            samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, 
                            onLoad: () => void = null,
                            onError: (msg: string, code: number) => void = null)
        {
            super(null, scene, noMipmap, invertY, samplingMode);

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        let ext = bmFontUrl.split('.').pop().split(/\#|\?/)[0];
                        let plugins = BitmapFontTexture.plugins.get(ext.toLocaleLowerCase());
                        if (!plugins) {
                            if (onError) {
                                onError("couldn't find a plugin for this file extension", -1);
                            }
                            return;
                        }

                        for (let p of plugins) {
                            let ret = p.loadFont(xhr.response, scene, invertY);
                            if (ret) {
                                let bfi = ret.bfi;

                                if (textureUrl != null) {
                                    bfi.textureUrl = textureUrl;
                                } else {
                                    let baseUrl = bmFontUrl.substr(0, bmFontUrl.lastIndexOf("/") + 1);
                                    bfi.textureUrl = baseUrl + bfi.textureFile;
                                }

                                this._texture = scene.getEngine().createTexture(bfi.textureUrl, noMipmap, invertY, scene, samplingMode, () => {
                                    if (ret.bfi && onLoad) {
                                        onLoad();
                                    }
                                });

                                this._lineHeight = bfi.lineHeight;
                                this._charInfos.copyFrom(bfi.charDic);
                                let ci = this.getChar(" ");
                                if (ci) {
                                    this._spaceWidth = ci.charWidth;
                                } else {
                                    this._charInfos.first((k, v) => this._spaceWidth = v.charWidth);
                                }

                                if (!ret.bfi && onError) {
                                    onError(ret.errorMsg, ret.errorCode);
                                }
                                return;
                            }
                        }

                        if (onError) {
                            onError("No plugin to load this BMFont file format", -1);
                        }
                    } else {
                        if (onError) {
                            onError("Couldn't load file through HTTP Request, HTTP Status " + xhr.status, xhr.status);
                        }
                    }
                }
            }
            xhr.open("GET", bmFontUrl, true);
            xhr.send();
        }

        public static GetCachedFontTexture(scene: Scene, fontTexture: BitmapFontTexture): BitmapFontTexture {
            let dic = scene.getOrAddExternalDataWithFactory("BitmapFontTextureCache", () => new StringDictionary<BitmapFontTexture>());

            let ft = dic.get(fontTexture.uid);
            if (ft) {
                ++ft._usedCounter;
                return ft;
            }

            dic.add(fontTexture.uid, fontTexture);

            return ft;
        }

        public static ReleaseCachedFontTexture(scene: Scene, fontTexture: BitmapFontTexture) {
            let dic = scene.getExternalData<StringDictionary<BitmapFontTexture>>("BitmapFontTextureCache");
            if (!dic) {
                return;
            }

            var font = dic.get(fontTexture.uid);
            if (--font._usedCounter === 0) {
                dic.remove(fontTexture.uid);
                font.dispose();
            }
        }

        /**
         * Is the font dynamically updated, if true is returned then you have to call the update() before using the font in rendering if new character were adding using getChar()
         */
        get isDynamicFontTexture(): boolean {
            return false;
        }

        /**
         * This method does nothing for a BitmapFontTexture object as it's a static texture
         */
        update(): void {
        }

        /**
         * Retrieve the CharInfo object for a given character
         * @param char the character to retrieve the CharInfo object from (e.g.: "A", "a", etc.)
         */
        getChar(char: string): CharInfo {
            return this._charInfos.get(char);
        }

        /**
         * For FontTexture retrieved using GetCachedFontTexture, use this method when you transfer this object's lifetime to another party in order to share this resource.
         * When the other party is done with this object, decCachedFontTextureCounter must be called.
         */
        public incCachedFontTextureCounter() {
            ++this._usedCounter;
        }

        /**
         * Use this method only in conjunction with incCachedFontTextureCounter, call it when you no longer need to use this shared resource.
         */
        public decCachedFontTextureCounter() {
            let dic = this.getScene().getExternalData<StringDictionary<BitmapFontTexture>>("BitmapFontTextureCache");
            if (!dic) {
                return;
            }
            if (--this._usedCounter === 0) {
                dic.remove(this._cachedFontId);
                this.dispose();
            }
        }
        private _usedCounter = 1;

        static addLoader(fileExtension: string, plugin: IBitmapFontLoader) {
            let a = BitmapFontTexture.plugins.getOrAddWithFactory(fileExtension.toLocaleLowerCase(), () => new Array<IBitmapFontLoader>());
            a.push(plugin);
        }

        static plugins: StringDictionary<IBitmapFontLoader[]> = new StringDictionary<Array<IBitmapFontLoader>>();
    }

    /**
     * This class is a special kind of texture which generates on the fly characters of a given css style "fontName".
     * The generated texture will be updated when new characters will be retrieved using the getChar() method, but you have
     *  to call the update() method for the texture to fetch these changes, you can harmlessly call update any time you want, if no
     *  change were made, nothing will happen.
     * The Font Texture can be rendered in three modes: normal size, super sampled size (x2) or using Signed Distance Field rendering.
     * Signed Distance Field should be prefered because the texture can be rendered using AlphaTest instead of Transparency, which is way more faster. More about SDF here (http://www.valvesoftware.com/publications/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf).
     * The only flaw of SDF is that the rendering quality may not be the best or the edges too sharp is the font thickness is too thin.
     */
    export class FontTexture extends BaseFontTexture {
        private _canvas: HTMLCanvasElement;
        private _context: CanvasRenderingContext2D;
        private _lineHeightSuper: number;
        private _xMargin: number;
        private _yMargin: number;
        private _offset: number;
        private _baseLine: number;
        private _currentFreePosition: Vector2;
        private _curCharCount = 0;
        private _lastUpdateCharCount = -1;
        private _spaceWidthSuper;
        private _sdfCanvas: HTMLCanvasElement;
        private _sdfContext: CanvasRenderingContext2D;
        private _sdfScale: number;
        private _usedCounter = 1;
        public debugMode: boolean;

        get isDynamicFontTexture(): boolean {
            return true;
        }

        public static GetCachedFontTexture(scene: Scene, fontName: string, supersample: boolean = false, signedDistanceField: boolean = false): FontTexture {
            let dic = scene.getOrAddExternalDataWithFactory("FontTextureCache", () => new StringDictionary<FontTexture>());

            let lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS") + (signedDistanceField ? "_+SDF" : "_-SDF");
            let ft = dic.get(lfn);
            if (ft) {
                ++ft._usedCounter;
                return ft;
            }

            ft = new FontTexture(null, fontName, scene, supersample ? 100 : 200, Texture.BILINEAR_SAMPLINGMODE, supersample, signedDistanceField);
            ft._cachedFontId = lfn;
            dic.add(lfn, ft);

            return ft;
        }

        public static ReleaseCachedFontTexture(scene: Scene, fontName: string, supersample: boolean = false, signedDistanceField: boolean = false) {
            let dic = scene.getExternalData<StringDictionary<FontTexture>>("FontTextureCache");
            if (!dic) {
                return;
            }

            let lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS") + (signedDistanceField ? "_+SDF" : "_-SDF");
            var font = dic.get(lfn);
            if (--font._usedCounter === 0) {
                dic.remove(lfn);
                font.dispose();
            }
        }

        /**
         * Create a new instance of the FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param scene the scene that owns the texture
         * @param maxCharCount the approximative maximum count of characters that could fit in the texture. This is an approximation because most of the fonts are proportional (each char has its own Width). The 'W' character's width is used to compute the size of the texture based on the given maxCharCount
         * @param samplingMode the texture sampling mode
         * @param superSample if true the FontTexture will be created with a font of a size twice bigger than the given one but all properties (lineHeight, charWidth, etc.) will be according to the original size. This is made to improve the text quality.
         */
        constructor(name: string, font: string, scene: Scene, maxCharCount = 200, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, superSample: boolean = false, signedDistanceField: boolean = false) {

            super(null, scene, true, false, samplingMode);

            this.name = name;
            this.debugMode = false;

            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;

            this._sdfScale = 8;
            this._signedDistanceField = signedDistanceField;
            this._superSample = false;

            // SDF will use super sample no matter what, the resolution is otherwise too poor to produce correct result
            if (superSample || signedDistanceField) {
                let sfont = this.getSuperSampleFont(font);
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
            this._context.textBaseline = "top";

            var res = this.getFontHeight(font, "j$|");
            this._lineHeightSuper = res.height; //+4;
            this._lineHeight = this._superSample ? (Math.ceil(this._lineHeightSuper / 2)) : this._lineHeightSuper;
            this._offset = res.offset;
            res = this.getFontHeight(font, "f");
            this._baseLine = res.height + res.offset - this._offset;

            var maxCharWidth = Math.max(this._context.measureText("W").width, this._context.measureText("_").width);
            this._spaceWidthSuper = this._context.measureText(" ").width;
            this._spaceWidth = this._superSample ? (this._spaceWidthSuper / 2) : this._spaceWidthSuper;

            this._xMargin = Math.ceil(maxCharWidth / 32);
            this._yMargin = this._xMargin;

            // This is an approximate size, but should always be able to fit at least the maxCharCount
            var totalEstSurface = (Math.ceil(this._lineHeightSuper) + (this._yMargin*2)) * (Math.ceil(maxCharWidth) + (this._xMargin*2)) * maxCharCount;
            var edge = Math.sqrt(totalEstSurface);
            var textSize = Math.pow(2, Math.ceil(Math.log(edge) / Math.log(2)));

            // Create the texture that will store the font characters
            this._texture = scene.getEngine().createDynamicTexture(textSize, textSize, false, samplingMode);
            var textureSize = this.getSize();

            this.hasAlpha = this._signedDistanceField===false;

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
            //  into this 2D context, then get the bitmap data, create the SDF char and push the result in the _context (which hold the whole Font Texture content)
            // So you can see this context as an intermediate one, because it is.
            if (this._signedDistanceField) {
                let sdfC = document.createElement("canvas");
                let s = this._sdfScale;
                sdfC.width = (Math.ceil(maxCharWidth) + this._xMargin * 2) * s;
                sdfC.height = (Math.ceil(this._lineHeightSuper) + this._yMargin * 2) * s;
                let sdfCtx = sdfC.getContext("2d");
                sdfCtx.scale(s, s);
                sdfCtx.textBaseline = "top";
                sdfCtx.font = font;
                sdfCtx.fillStyle = "white";
                sdfCtx.imageSmoothingEnabled = false;

                this._sdfCanvas = sdfC;
                this._sdfContext = sdfCtx;
            }

            this._currentFreePosition = Vector2.Zero();

            // Add the basic ASCII based characters
            for (let i = 0x20; i < 0x7F; i++) {
                var c = String.fromCharCode(i);
                this.getChar(c);
            }

            this.update();
        }

        /**
         * Make sure the given char is present in the font map.
         * @param char the character to get or add
         * @return the CharInfo instance corresponding to the given character
         */
        public getChar(char: string): CharInfo {
            if (char.length !== 1) {
                return null;
            }

            var info = this._charInfos.get(char);
            if (info) {
                return info;
            }

            info = new CharInfo();

            var measure = this._context.measureText(char);
            var textureSize = this.getSize();

            // we reached the end of the current line?
            let width = Math.ceil(measure.width);
            if (this._currentFreePosition.x + width + this._xMargin > textureSize.width) {
                this._currentFreePosition.x = 0;
                this._currentFreePosition.y += Math.ceil(this._lineHeightSuper + this._yMargin*2);

                // No more room?
                if (this._currentFreePosition.y > textureSize.height) {
                    return this.getChar("!");
                }
            }

            let curPosX = this._currentFreePosition.x + 0.5;
            let curPosY = this._currentFreePosition.y + 0.5;
            let curPosXMargin = curPosX + this._xMargin;
            let curPosYMargin = curPosY + this._yMargin;

            let drawDebug = (ctx: CanvasRenderingContext2D) => {
                ctx.strokeStyle = "green";
                ctx.beginPath();
                ctx.rect(curPosXMargin, curPosYMargin, width, this._lineHeightSuper);
                ctx.closePath();
                ctx.stroke();

                ctx.strokeStyle = "blue";
                ctx.beginPath();
                ctx.moveTo(curPosXMargin, curPosYMargin + Math.round(this._baseLine));
                ctx.lineTo(curPosXMargin + width, curPosYMargin + Math.round(this._baseLine));
                ctx.closePath();
                ctx.stroke();
            }

            // In SDF mode we render the character in an intermediate 2D context which scale the character this._sdfScale times (which is required to compute the SDF map accurately)
            if (this._signedDistanceField) {
                let s = this._sdfScale;
                this._sdfContext.clearRect(0, 0, this._sdfCanvas.width, this._sdfCanvas.height);

                // Coordinates are subject to the context's scale
                this._sdfContext.fillText(char, this._xMargin + 0.5, this._yMargin + 0.5 - this._offset);

                // Canvas Pixel Coordinates, no scale
                let data = this._sdfContext.getImageData(0, 0, (width + (this._xMargin * 2)) * s, this._sdfCanvas.height);
                let res = this._computeSDFChar(data);
                this._context.putImageData(res, curPosX, curPosY);
                if (this.debugMode) {
                    drawDebug(this._context);
                }
            } else {
                if (this.debugMode) {
                    drawDebug(this._context);
                }

                // Draw the character in the HTML canvas
                this._context.fillText(char, curPosXMargin, curPosYMargin - this._offset);
            }

            // Fill the CharInfo object
            info.topLeftUV = new Vector2((curPosXMargin) / textureSize.width, (this._currentFreePosition.y + this._yMargin) / textureSize.height);
            info.bottomRightUV = new Vector2((curPosXMargin + width) / textureSize.width, info.topLeftUV.y + ((this._lineHeightSuper + this._yMargin) / textureSize.height));
            info.yOffset = info.xOffset = 0;

            if (this._signedDistanceField) {
                let off = 1/textureSize.width;
                info.topLeftUV.addInPlace(new Vector2(off, off));
                info.bottomRightUV.addInPlace(new Vector2(off, off));
            }

            info.charWidth = this._superSample ? (width/2) : width;
            info.xAdvance = info.charWidth;

            // Add the info structure
            this._charInfos.add(char, info);
            this._curCharCount++;

            // Set the next position
            this._currentFreePosition.x += Math.ceil(width + this._xMargin*2);

            return info;
        }

        private _computeSDFChar(source: ImageData): ImageData {
            let scl = this._sdfScale;
            let sw = source.width;
            let sh = source.height;
            let dw = sw / scl;
            let dh = sh / scl;
            let roffx = 0;
            let roffy = 0;

            // We shouldn't look beyond half of the biggest between width and height
            let radius = scl;
            let br = radius - 1;

            let lookupSrc = (dx: number, dy: number, offX: number, offY: number, lookVis: boolean): boolean => {
                let sx = dx * scl;
                let sy = dy * scl;

                // Looking out of the area? return true to make the test going on
                if (((sx + offX) < 0) || ((sx + offX) >= sw) || ((sy + offY) < 0) || ((sy + offY) >= sh)) {
                    return true;
                }

                // Get the pixel we want
                let val = source.data[(((sy + offY) * sw) + (sx + offX)) * 4];

                let res = (val > 0) === lookVis;
                if (!res) {
                    roffx = offX;
                    roffy = offY;
                }
                return res;
            }

            let lookupArea = (dx: number, dy: number, lookVis: boolean): number => {

                // Fast rejection test, if we have the same result in N, S, W, E at a distance which is the radius-1 then it means the data will be consistent in this area. That's because we've scale the rendering of the letter "radius" times, so a letter's pixel will be at least radius wide
                if (lookupSrc(dx, dy, 0, br, lookVis) &&
                    lookupSrc(dx, dy, 0, -br, lookVis) &&
                    lookupSrc(dx, dy, -br, 0, lookVis) &&
                    lookupSrc(dx, dy, br, 0, lookVis)) {
                    return 0;
                }

                for (let i = 1; i <= radius; i++) {
                    // Quick test N, S, W, E
                    if (!lookupSrc(dx, dy, 0, i, lookVis) || !lookupSrc(dx, dy, 0, -i, lookVis) || !lookupSrc(dx, dy, -i, 0, lookVis) || !lookupSrc(dx, dy, i, 0, lookVis)) {
                        return i * i;   // Squared Distance is simple to compute in this case
                    }

                    // Test the frame area (except the N, S, W, E spots) from the nearest point from the center to the further one
                    for (let j = 1; j <= i; j++) {
                        if (
                            !lookupSrc(dx, dy, -j, i, lookVis) || !lookupSrc(dx, dy, j, i, lookVis) ||
                            !lookupSrc(dx, dy, i, -j, lookVis) || !lookupSrc(dx, dy, i, j, lookVis) ||
                            !lookupSrc(dx, dy, -j, -i, lookVis) || !lookupSrc(dx, dy, j, -i, lookVis) ||
                            !lookupSrc(dx, dy, -i, -j, lookVis) || !lookupSrc(dx, dy, -i, j, lookVis)) {

                            // We found the nearest texel having and opposite state, store the squared length
                            let res = (i * i) + (j * j);
                            let count = 1;

                            // To improve quality we will  sample the texels around this one, so it's 8 samples, we consider only the one having an opposite state, add them to the current res and will will compute the average at the end
                            if (!lookupSrc(dx, dy, roffx - 1, roffy, lookVis)) {
                                res += (roffx - 1) * (roffx - 1) + roffy * roffy;
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy, lookVis)) {
                                res += (roffx + 1) * (roffx + 1) + roffy * roffy;
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx, roffy - 1, lookVis)) {
                                res += roffx * roffx + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx, roffy + 1, lookVis)) {
                                res += roffx * roffx + (roffy + 1) * (roffy + 1);
                                ++count;
                            }

                            if (!lookupSrc(dx, dy, roffx - 1, roffy - 1, lookVis)) {
                                res += (roffx - 1) * (roffx - 1) + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy + 1, lookVis)) {
                                res += (roffx + 1) * (roffx + 1) + (roffy + 1) * (roffy + 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx + 1, roffy - 1, lookVis)) {
                                res += (roffx + 1) * (roffx + 1) + (roffy - 1) * (roffy - 1);
                                ++count;
                            }
                            if (!lookupSrc(dx, dy, roffx - 1, roffy + 1, lookVis)) {
                                res += (roffx - 1) * (roffx - 1) + (roffy + 1) * (roffy + 1);
                                ++count;
                            }

                            // Compute the average based on the accumulated distance
                            return res / count;
                        }
                    }
                }

                return 0;
            }

            let tmp = new Array<number>(dw * dh);
            for (let y = 0; y < dh; y++) {
                for (let x = 0; x < dw; x++) {

                    let curState = lookupSrc(x, y, 0, 0, true);

                    let d = lookupArea(x, y, curState);
                    if (d === 0) {
                        d = radius * radius * 2;
                    }
                    tmp[(y * dw) + x] = curState ? d : -d;
                }
            }

            let res = this._context.createImageData(dw, dh);

            let size = dw * dh;
            for (let j = 0; j < size; j++) {
                let d = tmp[j];

                let sign = (d < 0) ? -1 : 1;

                d = Math.sqrt(Math.abs(d)) * sign;

                d *= 127.5 / radius;
                d += 127.5;
                if (d < 0) {
                    d = 0;
                } else if (d > 255) {
                    d = 255;
                }
                d += 0.5;

                res.data[j*4 + 0] = d;
                res.data[j*4 + 1] = d;
                res.data[j*4 + 2] = d;
                res.data[j*4 + 3] = 255;
            }

            return res;
        }

        private getSuperSampleFont(font: string): string {
            // Eternal thank to http://stackoverflow.com/a/10136041/802124
            let regex = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\"\sa-z]+?)\s*$/;
            let res = font.toLocaleLowerCase().match(regex);
            if (res == null) {
                return null;
            }
            let size = parseInt(res[4]);
            res[4] = (size * 2).toString() + (res[4].match(/\D+/) || []).pop();

            let newFont = "";
            for (let j = 1; j < res.length; j++) {
                if (res[j] != null) {
                    newFont += res[j] + " ";
                }
            }
            return newFont;
        }

        // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
        private getFontHeight(font: string, chars: string): {height: number, offset: number} {
            var fontDraw = document.createElement("canvas");
            fontDraw.width = 600;
            fontDraw.height = 600;
            var ctx = fontDraw.getContext('2d');
            ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'white';
            ctx.font = font;
            ctx.fillText(chars, 0, 0);
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
            return { height: (end - start)+1, offset: start}
        }

        public get canRescale(): boolean {
            return false;
        }

        public getContext(): CanvasRenderingContext2D {
            return this._context;
        }

        /**
         * Call this method when you've call getChar() at least one time, this will update the texture if needed.
         * Don't be afraid to call it, if no new character was added, this method simply does nothing.
         */
        public update(): void {
            // Update only if there's new char added since the previous update
            if (this._lastUpdateCharCount < this._curCharCount) {
                this.getScene().getEngine().updateDynamicTexture(this._texture, this._canvas, false, true);
                this._lastUpdateCharCount = this._curCharCount;
            }
        }

        // cloning should be prohibited, there's no point to duplicate this texture at all
        public clone(): FontTexture {
            return null;
        }

        /**
         * For FontTexture retrieved using GetCachedFontTexture, use this method when you transfer this object's lifetime to another party in order to share this resource.
         * When the other party is done with this object, decCachedFontTextureCounter must be called.
         */
        public incCachedFontTextureCounter() {
            ++this._usedCounter;
        }

        /**
         * Use this method only in conjunction with incCachedFontTextureCounter, call it when you no longer need to use this shared resource.
         */
        public decCachedFontTextureCounter() {
            let dic = this.getScene().getExternalData<StringDictionary<FontTexture>>("FontTextureCache");
            if (!dic) {
                return;
            }
            if (--this._usedCounter === 0) {
                dic.remove(this._cachedFontId);
                this.dispose();
            }
        }

    }

    /**
     * Orginial code from cocos2d-js, converted to TypeScript by Nockawa
     * Load the Text version of the BMFont format, no XML or binary supported, just plain old text
     */
    @BitmapFontLoaderPlugin("fnt", new BMFontLoaderTxt())
    class BMFontLoaderTxt implements IBitmapFontLoader {
        private static INFO_EXP    = /info [^\r\n]*(\r\n|$)/gi;
        private static COMMON_EXP  = /common [^\n]*(\n|$)/gi;
        private static PAGE_EXP    = /page [^\n]*(\n|$)/gi;
        private static CHAR_EXP    = /char [^\n]*(\n|$)/gi;
        private static KERNING_EXP = /kerning [^\n]*(\n|$)/gi;
        private static ITEM_EXP    = /\w+=[^ \r\n]+/gi;
        private static INT_EXP     = /^[\-]?\d+$/;

        private _parseStrToObj(str) {
            var arr = str.match(BMFontLoaderTxt.ITEM_EXP);
            if (!arr) {
                return null;
            }

            var obj = {};
            for (var i = 0, li = arr.length; i < li; i++) {
                var tempStr = arr[i];
                var index = tempStr.indexOf("=");
                var key = tempStr.substring(0, index);
                var value = tempStr.substring(index + 1);
                if (value.match(BMFontLoaderTxt.INT_EXP)) value = parseInt(value);
                else if (value[0] === '"') value = value.substring(1, value.length - 1);
                obj[key] = value;
            }
            return obj;
        }

        private _buildCharInfo(bfi: BitmapFontInfo, initialLine: string, obj: any, textureSize: Size, invertY: boolean, chars: StringDictionary<CharInfo>) {
            let char: string = null;
            let x: number = null;
            let y: number = null;
            let width: number = null;
            let height: number = null;
            let xoffset = 0;
            let yoffset = 0;
            let xadvance = 0;
            let ci = new CharInfo();
            for (let key in obj) {
                let value = obj[key];
                switch (key) {
                    case "id":
                        char = String.fromCharCode(value);
                        break;
                    case "x":
                        x = value;
                        break;
                    case "y":
                        y = value;
                        break;
                    case "width":
                        width = value;
                        break;
                    case "height":
                        height = value;
                        break;
                    case "xadvance":
                        xadvance = value;
                        break;
                    case "xoffset":
                        xoffset = value;
                        break;
                    case "yoffset":
                        yoffset = value;
                        break;
                }
            }

            if (x != null && y != null && width != null && height != null && char != null) {
                ci.xAdvance = xadvance;
                ci.xOffset = xoffset;
                ci.yOffset = bfi.lineHeight -height - yoffset;

                if (invertY) {
                    ci.topLeftUV = new Vector2(1 - (x / textureSize.width), 1 - (y / textureSize.height));
                    ci.bottomRightUV = new Vector2(1 - ((x + width) / textureSize.width), 1 - ((y + height) / textureSize.height));
                } else {
                    ci.topLeftUV = new Vector2(x / textureSize.width, y / textureSize.height);
                    ci.bottomRightUV = new Vector2((x + width) / textureSize.width, (y + height) / textureSize.height);
                }
                ci.charWidth = width;
                chars.add(char, ci);
            } else {
                console.log("Error while parsing line " + initialLine);
            }
        }

        public loadFont(fontContent: any, scene: Scene, invertY: boolean): { bfi: BitmapFontInfo, errorMsg: string, errorCode: number } {
            let fontStr = <string>fontContent;
            let bfi = new BitmapFontInfo();
            let errorCode = 0;
            let errorMsg = "OK";

            //padding
            let info = fontStr.match(BMFontLoaderTxt.INFO_EXP);
            let infoObj = this._parseStrToObj(info[0]);
            if (!infoObj) {
                return null;
            }
            let paddingArr = infoObj["padding"].split(",");
            bfi.padding = new Vector4(parseInt(paddingArr[0]), parseInt(paddingArr[1]), parseInt(paddingArr[2]), parseInt(paddingArr[3]));

            //common
            var commonObj = this._parseStrToObj(fontStr.match(BMFontLoaderTxt.COMMON_EXP)[0]);
            bfi.lineHeight = commonObj["lineHeight"];
            bfi.baseLine = commonObj["base"];
            bfi.textureSize = new Size(commonObj["scaleW"], commonObj["scaleH"]);

            var maxTextureSize = scene.getEngine()._gl.getParameter(0xd33);
            if (commonObj["scaleW"] > maxTextureSize.width || commonObj["scaleH"] > maxTextureSize.height) {
                errorMsg = "FontMap texture's size is bigger than what WebGL supports";
                errorCode = -1;
            } else {
                if (commonObj["pages"] !== 1) {
                    errorMsg = "FontMap must contain one page only.";
                    errorCode = -1;
                } else {
                    //page
                    let pageObj = this._parseStrToObj(fontStr.match(BMFontLoaderTxt.PAGE_EXP)[0]);
                    if (pageObj["id"] !== 0) {
                        errorMsg = "Only one page of ID 0 is supported";
                        errorCode = -1;
                    } else {
                        bfi.textureFile = pageObj["file"];

                        //char
                        let charLines = fontStr.match(BMFontLoaderTxt.CHAR_EXP);
                        for (let i = 0, li = charLines.length; i < li; i++) {
                            let charObj = this._parseStrToObj(charLines[i]);
                            this._buildCharInfo(bfi, charLines[i], charObj, bfi.textureSize, invertY, bfi.charDic);
                        }

                        //kerning
                        var kerningLines = fontStr.match(BMFontLoaderTxt.KERNING_EXP);
                        if (kerningLines) {
                            for (let i = 0, li = kerningLines.length; i < li; i++) {
                                let kerningObj = this._parseStrToObj(kerningLines[i]);
                                bfi.kerningDic.add(((kerningObj["first"] << 16) | (kerningObj["second"] & 0xffff)).toString(), kerningObj["amount"]);
                            }
                        }
                    }
                }

            }
            return { bfi: bfi, errorCode: errorCode, errorMsg: errorMsg };
        }
    };

    export function BitmapFontLoaderPlugin(fileExtension: string, plugin: IBitmapFontLoader): (target: Object) => void {
        return () => {
            BitmapFontTexture.addLoader(fileExtension, plugin);
        }
    }

} 