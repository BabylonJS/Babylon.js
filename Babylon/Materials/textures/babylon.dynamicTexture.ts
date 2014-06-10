module BABYLON {
    export class DynamicTexture extends Texture {
        private _generateMipMaps: boolean;
        private _canvas: HTMLCanvasElement;
        private _context: CanvasRenderingContext2D;

        constructor(name: string, options: any, scene: Scene, generateMipMaps: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(null, scene, !generateMipMaps);

            this.name = name;

            this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

            this._generateMipMaps = generateMipMaps;

            if (options.getContext) {
                this._canvas = options;
                this._texture = scene.getEngine().createDynamicTexture(options.width, options.height, generateMipMaps, samplingMode);
            } else {
                this._canvas = document.createElement("canvas");

                if (options.width) {
                    this._texture = scene.getEngine().createDynamicTexture(options.width, options.height, generateMipMaps, samplingMode);
                } else {
                    this._texture = scene.getEngine().createDynamicTexture(options, options, generateMipMaps, samplingMode);
                }
            }

            var textureSize = this.getSize();

            this._canvas.width = textureSize.width;
            this._canvas.height = textureSize.height;
            this._context = this._canvas.getContext("2d");
        }

        public getContext(): CanvasRenderingContext2D {
            return this._context;
        }

        public update(invertY?: boolean): void {
            this.getScene().getEngine().updateDynamicTexture(this._texture, this._canvas, invertY === undefined ? true : invertY);
        }

        public drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY?: boolean) {
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

            this.update(invertY);
        }

        public clone(): DynamicTexture {
            var textureSize = this.getSize();
            var newTexture = new BABYLON.DynamicTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);

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