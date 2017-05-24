/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var DOMImage = Image;

module BABYLON.GUI {
    export class Image extends Control {
        private _domImage: HTMLImageElement;
        private _imageWidth: number;
        private _imageHeight: number;
        private _loaded = false;
        private _stretch = Image.STRETCH_FILL;

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

        constructor(public name: string, url: string) {
            super(name);

            this._domImage = new DOMImage();
            
            this._domImage.onload = () => {
                this._imageWidth = this._domImage.width;
                this._imageHeight = this._domImage.height;
                this._loaded = true;
                this._markAsDirty();
            }
            
            this._domImage.src = url;
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);
            super._processMeasures(parentMeasure, context);

            if (this._loaded) {
                switch (this._stretch) {
                    case Image.STRETCH_NONE:
                        context.drawImage(this._domImage, this._currentMeasure.left, this._currentMeasure.top);
                        break;
                    case Image.STRETCH_FILL:
                        context.drawImage(this._domImage, 0, 0, this._imageWidth, this._imageHeight, 
                                                          this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                        break;
                    case Image.STRETCH_UNIFORM:
                        var hRatio = this._currentMeasure.width  / this._imageWidth;
                        var vRatio =  this._currentMeasure.height / this._imageHeight;
                        var ratio = Math.min(hRatio, vRatio);
                        var centerX = (this._currentMeasure.width - this._imageWidth * ratio) / 2;
                        var centerY = (this._currentMeasure.height - this._imageHeight * ratio) / 2; 

                        context.drawImage(this._domImage, 0, 0, this._imageWidth, this._imageHeight,
                                                          this._currentMeasure.left + centerX, this._currentMeasure.top + centerY, this._imageWidth * ratio, this._imageHeight * ratio);
                        break;
                }
            }
            context.restore();
        }

        // Static
        private static _STRETCH_NONE = 0;
        private static _STRETCH_FILL = 1;
        private static _STRETCH_UNIFORM = 2;

        public static get STRETCH_NONE(): number {
            return Image._STRETCH_NONE;
        }

        public static get STRETCH_FILL(): number {
            return Image._STRETCH_FILL;
        }       

        public static get STRETCH_UNIFORM(): number {
            return Image._STRETCH_UNIFORM;
        }              
    }    
}