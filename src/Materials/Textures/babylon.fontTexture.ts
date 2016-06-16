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

        charWidth: number;
    }

    interface ICharInfoMap {
        [char: string]: CharInfo;
    }

    export class FontTexture extends Texture {
        private _canvas: HTMLCanvasElement;
        private _context: CanvasRenderingContext2D;
        private _lineHeight: number;
        private _lineHeightSuper: number;
        private _offset: number;
        private _currentFreePosition: Vector2;
        private _charInfos: ICharInfoMap = {};
        private _curCharCount = 0;
        private _lastUpdateCharCount = -1;
        private _spaceWidth;
        private _spaceWidthSuper;
        private _usedCounter = 1;
        private _superSample: boolean;

        public get isSuperSampled(): boolean {
            return this._superSample;
        }

        public get spaceWidth(): number {
            return this._spaceWidth;
        }

        public get lineHeight(): number {
            return this._lineHeight;
        }

        public static GetCachedFontTexture(scene: Scene, fontName: string, supersample: boolean = false) {
            let s = <any>scene;
            if (!s.__fontTextureCache__) {
                s.__fontTextureCache__ = new StringDictionary<FontTexture>();
            }

            let dic = <StringDictionary<FontTexture>>s.__fontTextureCache__;

            let lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS");
            let ft = dic.get(lfn);
            if (ft) {
                ++ft._usedCounter;
                return ft;
            }

            ft = new FontTexture(null, fontName, scene, supersample ? 100 : 200, Texture.BILINEAR_SAMPLINGMODE, supersample);
            dic.add(lfn, ft);

            return ft;
        }

        public static ReleaseCachedFontTexture(scene: Scene, fontName: string, supersample: boolean = false) {
            let s = <any>scene;
            let dic = <StringDictionary<FontTexture>>s.__fontTextureCache__;
            if (!dic) {
                return;
            }

            let lfn = fontName.toLocaleLowerCase() + (supersample ? "_+SS" : "_-SS");
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
        constructor(name: string, font: string, scene: Scene, maxCharCount=200, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, superSample: boolean = false) {
            super(null, scene, true, false, samplingMode);

            this.name = name;

            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;

            this._superSample = false;
            if (superSample) {
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

            var res = this.getFontHeight(font);
            this._lineHeightSuper = res.height;
            this._lineHeight = this._superSample ? (this._lineHeightSuper / 2) : this._lineHeightSuper;
            this._offset = res.offset-1;

            var maxCharWidth = this._context.measureText("W").width;
            this._spaceWidthSuper = this._context.measureText(" ").width;
            this._spaceWidth = this._superSample ? (this._spaceWidthSuper / 2) : this._spaceWidthSuper;

            // This is an approximate size, but should always be able to fit at least the maxCharCount
            var totalEstSurface = this._lineHeightSuper * maxCharWidth * maxCharCount;
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

            var info = this._charInfos[char];
            if (info) {
                return info;
            }

            info = new CharInfo();

            var measure = this._context.measureText(char);
            var textureSize = this.getSize();

            // we reached the end of the current line?
            let width = Math.round(measure.width);
            var xMargin = Math.ceil(this._lineHeightSuper/20);
            var yMargin = xMargin;
            if (this._currentFreePosition.x + width + xMargin > textureSize.width) {
                this._currentFreePosition.x = 0;
                this._currentFreePosition.y += this._lineHeightSuper + yMargin;

                // No more room?
                if (this._currentFreePosition.y > textureSize.height) {
                    return this.getChar("!");
                }
            }

            // Draw the character in the texture
            this._context.fillText(char, this._currentFreePosition.x, this._currentFreePosition.y - this._offset);

            // Fill the CharInfo object
            info.topLeftUV = new Vector2(this._currentFreePosition.x / textureSize.width, this._currentFreePosition.y / textureSize.height);
            info.bottomRightUV = new Vector2((this._currentFreePosition.x + width) / textureSize.width, info.topLeftUV.y + ((this._lineHeightSuper + 2) / textureSize.height));
            info.charWidth = this._superSample ? (width/2) : width;

            // Add the info structure
            this._charInfos[char] = info;
            this._curCharCount++;

            // Set the next position
            this._currentFreePosition.x += width + xMargin;

            return info;
        }

        public measureText(text: string, tabulationSize: number = 4): Size {
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

                curWidth += this.getChar(char).charWidth;
                ++charxpos;
            }
            maxWidth = Math.max(maxWidth, curWidth);

            return new Size(maxWidth, lineCount * this.lineHeight);
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
        private getFontHeight(font: string): {height: number, offset: number} {
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
            return { height: (end - start)+1, offset: start-1}
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
    }
} 