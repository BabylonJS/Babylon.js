/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Control {        
        private _zIndex = 0;
        public _root: Container;
        public _currentMeasure: Measure;
        private _font: string;
        private _lastMeasuredFont: string;
        protected _fontHeight: number;
        private _color: string;
        private _horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        private _verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        
        public get horizontalAlignment(): number {
            return this._horizontalAlignment;
        }

        public set horizontalAlignment(value: number) {
            if (this._horizontalAlignment === value) {
                return;
            }

            this._horizontalAlignment = value;
            this._markAsDirty();
        } 

        public get verticalAlignment(): number {
            return this._verticalAlignment;
        }

        public set verticalAlignment(value: number) {
            if (this._verticalAlignment === value) {
                return;
            }

            this._verticalAlignment = value;
            this._markAsDirty();
        } 

        public get font(): string {
            return this._font;
        }

        public set font(value: string) {
            if (this._font === value) {
                return;
            }

            this._font = value;
            this._fontHeight = Control._GetFontHeight(this._font);
            this._markAsDirty();
        }

        public get color(): string {
            return this._color;
        }

        public set color(value: string) {
            if (this._color === value) {
                return;
            }

            this._color = value;
            this._markAsDirty();
        }                       

        public get zIndex(): number {
            return this._zIndex;
        }

        public set zIndex(value: number) {
            if (this.zIndex === value) {
                return;
            }

            this._zIndex = value;
            this._root._reOrderControl(this);
        }

        constructor(public name: string) {
        }

        protected _markAsDirty(): void {
            if (!this._root) {
                return; // Not yet connected
            }
            this._root._markAsDirty();
        }

        public _setRoot(root: Container): void {
            this._root = root;
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            this._currentMeasure = parentMeasure.copy();
            // Do nothing
        }

        // Statics
        private static _HORIZONTAL_ALIGNMENT_LEFT = 0;
        private static _HORIZONTAL_ALIGNMENT_RIGHT = 1;
        private static _HORIZONTAL_ALIGNMENT_CENTER = 2;
        private static _VERTICAL_ALIGNMENT_TOP = 0;
        private static _VERTICAL_ALIGNMENT_BOTTOM = 1;
        private static _VERTICAL_ALIGNMENT_CENTER = 2;

        public static get HORIZONTAL_ALIGNMENT_LEFT(): number {
            return Control._HORIZONTAL_ALIGNMENT_LEFT;
        }

        public static get HORIZONTAL_ALIGNMENT_RIGHT(): number {
            return Control._HORIZONTAL_ALIGNMENT_RIGHT;
        }

        public static get HORIZONTAL_ALIGNMENT_CENTER(): number {
            return Control._HORIZONTAL_ALIGNMENT_CENTER;
        }

        public static get VERTICAL_ALIGNMENT_TOP(): number {
            return Control._VERTICAL_ALIGNMENT_TOP;
        }

        public static get VERTICAL_ALIGNMENT_BOTTOM(): number {
            return Control._VERTICAL_ALIGNMENT_BOTTOM;
        }

        public static get VERTICAL_ALIGNMENT_CENTER(): number {
            return Control._VERTICAL_ALIGNMENT_CENTER;
        }

        private static _FontHeightSizes = {};

        public static _GetFontHeight(font: string): number {

            if (Control._FontHeightSizes[font]) {
                return Control._FontHeightSizes[font];
            }

            var text = document.createElement("span");
            text.innerHTML = "Hg";
            text.style.font = font;

            var block = document.createElement("div");
            block.style.display = "inline-block";
            block.style.width = "1px";
            block.style.height = "0px";
            block.style.verticalAlign = "bottom";

            var div = document.createElement("div");
            div.appendChild(text);
            div.appendChild(block);

            document.body.appendChild(div);

            var fontHeight = 0;
            try {
                fontHeight = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
            } finally {
                div.remove();
            }

            Control._FontHeightSizes[font] = fontHeight;

            return fontHeight;
        };
    }    
}