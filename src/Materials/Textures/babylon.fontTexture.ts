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
    }

    interface ICharInfoMap {
        [char: string]: CharInfo;
    }

    export class FontTexture extends Texture {
        private _canvas: HTMLCanvasElement;
        private _context: CanvasRenderingContext2D;
        private _lineHeight: number;
        private _offset: number;
        private _currentFreePosition: Vector2;
        private _charInfos: ICharInfoMap = {};
        private _curCharCount = 0;
        private _lastUpdateCharCount = -1;
        private _spaceWidth;

        public get spaceWidth() {
            return this._spaceWidth;
        }

        /**
         * Create a new instance of the FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param scene the scene that owns the texture
         * @param maxCharCount the approximative maximum count of characters that could fit in the texture. This is an approximation because most of the fonts are proportional (each char has its own Width). The 'W' character's width is used to compute the size of the texture based on the given maxCharCount
         * @param samplingMode the texture sampling mode
         */
        constructor(name: string, font: string, scene: Scene, maxCharCount=200, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(null, scene, true, false, samplingMode);

            this.name = name;

            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;

            // First canvas creation to determine the size of the texture to create
            this._canvas = document.createElement("canvas");
            this._context = this._canvas.getContext("2d");
            this._context.font = font;
            this._context.fillStyle = "white";

            var res = this.getFontHeight(font);
            this._lineHeight = res.height;
            this._offset = res.offset-1;

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
            var xMargin = 2;
            var yMargin = 2;
            let width = measure.width;
            if (this._currentFreePosition.x + width + xMargin > textureSize.width) {
                this._currentFreePosition.x = 0;
                this._currentFreePosition.y += this._lineHeight + yMargin;      // +2 for safety marging

                // No more room?
                if (this._currentFreePosition.y > textureSize.height) {
                    return this.getChar("!");
                }
            }

            // Draw the character in the texture
            this._context.fillText(char, this._currentFreePosition.x - 0.5, this._currentFreePosition.y - this._offset - 0.5);

            // Fill the CharInfo object
            info.topLeftUV = new Vector2(this._currentFreePosition.x / textureSize.width, this._currentFreePosition.y / textureSize.height);
            info.bottomRightUV = new Vector2(info.topLeftUV.x + (width / textureSize.width), info.topLeftUV.y + ((this._lineHeight+1) / textureSize.height));

            // Add the info structure
            this._charInfos[char] = info;
            this._curCharCount++;

            // Set the next position
            this._currentFreePosition.x += width + xMargin;

            return info;
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
            return { height: end - start, offset: start-1}
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