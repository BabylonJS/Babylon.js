/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var DOMImage = Image;

module BABYLON.GUI {
    export class Image extends Control {
        private _domImage: HTMLImageElement;
        private _imageWidth: number;
        private _imageHeight: number;
        private _loaded = false;
        private _stretch = Image.STRETCH_FILL;
        private _source: string;
        private _autoScale = false;

        private _sourceLeft = 0;
        private _sourceTop = 0;
        private _sourceWidth= 0;
        private _sourceHeight = 0;

        public get sourceLeft(): number {
            return this._sourceLeft;
        }

        public set sourceLeft(value: number) {
            if (this._sourceLeft === value) {
                return;
            }

            this._sourceLeft = value;

            this._markAsDirty();
        }   

        public get sourceTop(): number {
            return this._sourceTop;
        }

        public set sourceTop(value: number) {
            if (this._sourceTop === value) {
                return;
            }

            this._sourceTop = value;

            this._markAsDirty();
        }    

        public get sourceWidth(): number {
            return this._sourceWidth;
        }

        public set sourceWidth(value: number) {
            if (this._sourceWidth === value) {
                return;
            }

            this._sourceWidth = value;

            this._markAsDirty();
        }  

        public get sourceHeight(): number {
            return this._sourceHeight;
        }

        public set sourceHeight(value: number) {
            if (this._sourceHeight === value) {
                return;
            }

            this._sourceHeight = value;

            this._markAsDirty();
        }          

        public get autoScale(): boolean {
            return this._autoScale;
        }

        public set autoScale(value: boolean) {
            if (this._autoScale === value) {
                return;
            }

            this._autoScale = value;

            if (value && this._loaded) {
                this.synchronizeSizeWithContent();
            }
        }

        public get stretch(): number {
            return this._stretch;
        }

        public set stretch(value: number) {
            if (this._stretch === value) {
                return;
            }

            this._stretch = value;

            this._markAsDirty();
        }

        public set domImage(value: HTMLImageElement) {
            this._domImage = value;
            this._loaded = false;
            
            if (this._domImage.width) {
                this._onImageLoaded();
            } else {
                this._domImage.onload = () => {
                    this._onImageLoaded();
                }
            }
        }

        public get domImage(): HTMLImageElement {
            return this._domImage;
        }

        private _onImageLoaded(): void {
            this._imageWidth = this._domImage.width;
            this._imageHeight = this._domImage.height;
            this._loaded = true;

            if (this._autoScale) {
                this.synchronizeSizeWithContent();
            }

            this._markAsDirty();
        }

        public set source(value: string) {
            if (this._source === value) {
                return;
            }

            this._loaded = false;
            this._source = value;
            
            this._domImage = new DOMImage();
            
            this._domImage.onload = () => {
                this._onImageLoaded();
            }
            this._domImage.crossOrigin = "anonymous";
            this._domImage.src = value;
        }

        constructor(public name?: string, url?: string) {
            super(name);

            this.source = url;
        }

        protected _getTypeName(): string {
            return "Image";
        }              

        public synchronizeSizeWithContent() {
            if (!this._loaded) {
                return;
            }

            this.width = this._domImage.width + "px";
            this.height = this._domImage.height + "px";
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();          
            let x = this._sourceLeft;
            let y = this._sourceTop;

            let width = this._sourceWidth ? this._sourceWidth : this._imageWidth;
            let height = this._sourceHeight ? this._sourceHeight : this._imageHeight;

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {
                if (this._loaded) {
                    switch (this._stretch) {
                        case Image.STRETCH_NONE:
                            context.drawImage(this._domImage, x, y, width, height,
                                              this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                            break;
                        case Image.STRETCH_FILL:
                            context.drawImage(this._domImage, x, y, width, height, 
                                                            this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                            break;
                        case Image.STRETCH_UNIFORM:
                            var hRatio = this._currentMeasure.width  / width;
                            var vRatio =  this._currentMeasure.height / height;
                            var ratio = Math.min(hRatio, vRatio);
                            var centerX = (this._currentMeasure.width - width * ratio) / 2;
                            var centerY = (this._currentMeasure.height - height * ratio) / 2; 

                            context.drawImage(this._domImage, x, y, width, height,
                                                            this._currentMeasure.left + centerX, this._currentMeasure.top + centerY, width * ratio, height * ratio);
                            break;
                        case Image.STRETCH_EXTEND:
                            context.drawImage(this._domImage, x, y, width, height,
                                              this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                            if (this._autoScale) {
                                this.synchronizeSizeWithContent();
                            } 
                            this._root.width = this.width;
                            this._root.height = this.height;
                            break;
                    }
                }
            }
            context.restore();
        }

        // Static
        private static _STRETCH_NONE = 0;
        private static _STRETCH_FILL = 1;
        private static _STRETCH_UNIFORM = 2;
        private static _STRETCH_EXTEND = 3;

        public static get STRETCH_NONE(): number {
            return Image._STRETCH_NONE;
        }

        public static get STRETCH_FILL(): number {
            return Image._STRETCH_FILL;
        }       

        public static get STRETCH_UNIFORM(): number {
            return Image._STRETCH_UNIFORM;
        }      

        public static get STRETCH_EXTEND(): number {
            return Image._STRETCH_EXTEND;
        }                 
    }    
}
