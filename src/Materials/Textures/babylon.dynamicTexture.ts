module BABYLON {
    export class DynamicTexture extends Texture {
        private _generateMipMaps: boolean;
        private _canvas: HTMLCanvasElement;
        private _context: CanvasRenderingContext2D;

        constructor(name: string, options: any, scene: Scene, generateMipMaps: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(null, scene, !generateMipMaps);

            this.name = name;

            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;

            this._generateMipMaps = generateMipMaps;

            /* there are probably clearer ways to verify all of this */
            if (typeof options.canvas === "object" && typeof options.canvas.getContext === "function") {
                this._canvas = options;
                this._texture = scene.getEngine().createDynamicTexture(options.canvas.width, options.canvas.height, generateMipMaps, samplingMode);
            } else {
                this._canvas = document.createElement("canvas");

                if (!(options.width === undefined || options.height === undefined)) {
                    this._texture = scene.getEngine().createDynamicTexture(options.width, options.height, generateMipMaps, samplingMode);
                } else if (options.size !== undefined) {
                    this._texture = scene.getEngine().createDynamicTexture(options.size, options.size, generateMipMaps, samplingMode);
                }
            }

            var textureSize = this.getSize();

            this._canvas.width = textureSize.width;
            this._canvas.height = textureSize.height;
            this._context = this._canvas.getContext("2d");

            if (typeof this._options.textAlign === "string") {
                this._context.textAlign = this._options.textAlign;
            }
        }

        public get canRescale(): boolean {
            return true;
        }

        public scale(ratio: number): void {
            var textureSize = this.getSize();

            textureSize.width *= ratio;
            textureSize.height *= ratio;

            this._canvas.width = textureSize.width;
            this._canvas.height = textureSize.height;

            this.releaseInternalTexture();

            this._texture = this.getScene().getEngine().createDynamicTexture(textureSize.width, textureSize.height, this._generateMipMaps, this._samplingMode);
        }

        public getContext(): CanvasRenderingContext2D {
            return this._context;
        }

        public clear(): void {
            var size = this.getSize();
            this._context.fillRect(0, 0, size.width, size.height);
        }

        public update(invertY?: boolean): void {
            this.getScene().getEngine().updateDynamicTexture(this._texture, this._canvas, invertY === undefined ? true : invertY);
        }

        public drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY?: boolean, update = true) {
            var size = this.getSize();

            if (clearColor) {
                this._context.fillStyle = clearColor;
                this._context.fillRect(0, 0, size.width, size.height);
            }

            this._context.font = font;
            if (x === null) {
                var textSize = this._context.measureText(text);
                x = (size.width - textSize.width) / 2;
            }

            this._context.fillStyle = color;
            this._context.fillText(text, x, y);

            if (update) {
                this.update(invertY);
            }
        }

        public clone(): DynamicTexture {
            var textureSize = this.getSize();
            var newTexture = new DynamicTexture(this.name, textureSize, this.getScene(), this._generateMipMaps);

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // Dynamic Texture
            newTexture.wrapU = this.wrapU;
            newTexture.wrapV = this.wrapV;

            return newTexture;
        }
    }
} 