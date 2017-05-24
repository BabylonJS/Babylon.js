/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Control {        
        private _zIndex = 0;
        public _root: Container;
        public _host: AdvancedDynamicTexture;
        public _currentMeasure = Measure.Empty();
        private _fontFamily: string;
        private _fontSize = 18;
        private _font: string;
        private _width = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        private _height = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        private _lastMeasuredFont: string;
        protected _fontOffset: {ascent: number, height: number, descent: number};
        private _color: string;
        private _horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        private _verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        private _isDirty = true;
        private _cachedParentMeasure = Measure.Empty();
        private _marginLeft = new ValueAndUnit(0);
        private _marginRight = new ValueAndUnit(0);
        private _marginTop = new ValueAndUnit(0);
        private _marginBottom = new ValueAndUnit(0);        
        private _left = new ValueAndUnit(0);
        private _top = new ValueAndUnit(0);
        private _scaleX = 1.0;
        private _scaleY = 1.0;
        private _rotation = 0;
        private _transformCenterX = 0.5;
        private _transformCenterY = 0.5;
        private _transformMatrix = Matrix2D.Identity();
        private _invertTransformMatrix = Matrix2D.Identity();
        private _isMatrixDirty = true;
        private _cachedOffsetX: number;
        private _cachedOffsetY: number;

        public isHitTestVisible = true;
        public isPointerBlocker = false;
        
        // Properties

        /**
        * An event triggered when the pointer move over the control.
        * @type {BABYLON.Observable}
        */
        public onPointerMoveObservable = new Observable<Control>();

        /**
        * An event triggered when the pointer move out of the control.
        * @type {BABYLON.Observable}
        */
        public onPointerOutObservable = new Observable<Control>();        

        /**
        * An event triggered when the pointer taps the control
        * @type {BABYLON.Observable}
        */
        public onPointerDownObservable = new Observable<Control>();     

        /**
        * An event triggered when pointer up
        * @type {BABYLON.Observable}
        */
        public onPointerUpObservable = new Observable<Control>();     

        /**
        * An event triggered when pointer enters the control
        * @type {BABYLON.Observable}
        */
        public onPointerEnterObservable = new Observable<Control>();           

        public get scaleX(): number {
            return this._scaleX;
        }

        public set scaleX(value: number) {
            if (this._scaleX === value) {
                return;
            }

            this._scaleX = value;
            this._markAsDirty();
            this._isMatrixDirty = true;
        }     

        public get scaleY(): number {
            return this._scaleY;
        }

        public set scaleY(value: number) {
            if (this._scaleY === value) {
                return;
            }

            this._scaleY = value;
            this._markAsDirty();
            this._isMatrixDirty = true;
        }  

        public get rotation(): number {
            return this._rotation;
        }

        public set rotation(value: number) {
            if (this._rotation === value) {
                return;
            }

            this._rotation = value;
            this._markAsDirty();
            this._isMatrixDirty = true;
        }    

        public get transformCenterY(): number {
            return this._transformCenterY;
        }

        public set transformCenterY(value: number) {
            if (this._transformCenterY === value) {
                return;
            }

            this._transformCenterY = value;
            this._markAsDirty();
            this._isMatrixDirty = true;
        }     

        public get transformCenterX(): number {
            return this._transformCenterX;
        }

        public set transformCenterX(value: number) {
            if (this._transformCenterX === value) {
                return;
            }

            this._transformCenterX = value;
            this._markAsDirty();
            this._isMatrixDirty = true;
        }    

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

        public get width(): string {
            return this._width.toString();
        }

        public set width(value: string) {
            if (this._width.toString() === value) {
                return;
            }

            if (this._width.fromString(value)) {
                this._markAsDirty();
            }
        }

        public get height(): string {
            return this._height.toString();
        }

        public set height(value: string) {
            if (this._height.toString() === value) {
                return;
            }

            if (this._height.fromString(value)) {
                this._markAsDirty();
            }
        }   

        public get fontFamily(): string {
            return this._fontFamily;
        }

        public set fontFamily(value: string) {
            if (this._fontFamily === value) {
                return;
            }

            this._fontFamily = value;
            this._prepareFont();
        }

        public get fontSize(): number {
            return this._fontSize;
        }

        public set fontSize(value: number) {
            if (this._fontSize === value) {
                return;
            }

            this._fontSize = value;
            this._prepareFont();
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

        public get isDirty(): boolean {
            return this._isDirty;
        }
        
        public get marginLeft(): string {
            return this._marginLeft.toString();
        }

        public set marginLeft(value: string) {
            if (this._marginLeft.fromString(value)) {
                this._markAsDirty();
            }
        }    

        public get marginRight(): string {
            return this._marginRight.toString();
        }

        public set marginRight(value: string) {
            if (this._marginRight.fromString(value)) {
                this._markAsDirty();
            }
        }

        public get marginTop(): string {
            return this._marginTop.toString();
        }

        public set marginTop(value: string) {
            if (this._marginTop.fromString(value)) {
                this._markAsDirty();
            }
        }

        public get marginBottom(): string {
            return this._marginBottom.toString();
        }

        public set marginBottom(value: string) {
            if (this._marginBottom.fromString(value)) {
                this._markAsDirty();
            }
        }     

        public get left(): string {
            return this._left.toString();
        }

        public set left(value: string) {
            if (this._left.fromString(value)) {
                this._markAsDirty();
            }
        }  

        public get top(): string {
            return this._top.toString();
        }

        public set top(value: string) {
            if (this._top.fromString(value)) {
                this._markAsDirty();
            }
        }                   

        // Functions
        constructor(public name: string) {
            this.fontFamily = "Arial";
        }

        protected _markAsDirty(): void {            
            this._isDirty = true;

            if (!this._host) {
                return; // Not yet connected
            }
            this._host.markAsDirty();
        }

        public _link(root: Container, host: AdvancedDynamicTexture): void {
            this._root = root;
            this._host = host;
        }

        protected _transform(context: CanvasRenderingContext2D): void {
            if (this._scaleX === 1 && this._scaleY ===1 && this._rotation === 0) {
                return;
            }

            // preTranslate
            var offsetX = this._currentMeasure.width * this._transformCenterX + this._currentMeasure.left;
            var offsetY = this._currentMeasure.height * this._transformCenterY + this._currentMeasure.top;
            context.translate(offsetX, offsetY);

            // scale
            context.scale(this._scaleX, this._scaleY);

            // rotate
            context.rotate(this._rotation);

            // postTranslate
            context.translate(-offsetX, -offsetY);    


            // Need to update matrices?
            if (this._isMatrixDirty || this._cachedOffsetX !== offsetX || this._cachedOffsetY !== offsetY) {
                this._cachedOffsetX = offsetX;
                this._cachedOffsetY = offsetY;
                this._isMatrixDirty = false;

                Matrix2D.ComposeToRef(offsetX, offsetY, this._rotation, this._scaleX, this._scaleY, this._root ? this._root._transformMatrix : null, this._transformMatrix);

                this._transformMatrix.invertToRef(this._invertTransformMatrix);
            }
        }

        protected _applyStates(context: CanvasRenderingContext2D): void {
            if (this._font) {
                context.font = this._font;
            }

            if (this._color) {
                context.fillStyle = this._color;
            }
        }

        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D) {     
            if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
                this._currentMeasure.copyFrom(parentMeasure);

                this._measure(parentMeasure, context);
                this._computeAlignment(parentMeasure, context);

                // Convert to int values
                this._currentMeasure.left = this._currentMeasure.left | 0;
                this._currentMeasure.top = this._currentMeasure.top | 0;
                this._currentMeasure.width = this._currentMeasure.width | 0;
                this._currentMeasure.height = this._currentMeasure.height | 0;

                // Let children add more features
                this._additionalProcessing(parentMeasure, context);

                this._isDirty = false;
                this._cachedParentMeasure.copyFrom(parentMeasure);
            }     

            // Transform
            this._transform(context); 
                        
            // Clip
            this._clip(context);
            context.clip();
        }

        protected _clip( context: CanvasRenderingContext2D) {
            context.beginPath();
            context.rect(this._currentMeasure.left ,this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
        }

        protected _measure(parentMeasure: Measure, context: CanvasRenderingContext2D): void {  
            // Width / Height
            if (this._width.isPixel) {
                this._currentMeasure.width = this._width.value;
            } else {
                this._currentMeasure.width *= this._width.value; 
            }

            if (this._height.isPixel) {
                this._currentMeasure.height = this._height.value;
            } else {
                this._currentMeasure.height *= this._height.value; 
            }
        }

        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var width = this._currentMeasure.width;
            var height = this._currentMeasure.height;

            var parentWidth = parentMeasure.width;
            var parentHeight = parentMeasure.height;

            // Left / top
            var x = 0;
            var y = 0;

            switch (this.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    x = 0
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    x = parentWidth - width;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_CENTER:
                    x = (parentWidth - width) / 2;
                    break;
            }

            switch (this.verticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_TOP:
                    y = 0;
                    break;
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    y = parentHeight - height;
                    break;
                case Control.VERTICAL_ALIGNMENT_CENTER:
                    y = (parentHeight - height) / 2;
                    break;
            }
            
            if (this._marginLeft.isPixel) {
                this._currentMeasure.left += this._marginLeft.value;
                this._currentMeasure.width -= this._marginRight.value;
            } else {
                this._currentMeasure.left += parentWidth * this._marginLeft.value;
                this._currentMeasure.width -= parentWidth * this._marginLeft.value;
            }

            if (this._marginRight.isPixel) {
                this._currentMeasure.width -= this._marginRight.value;
            } else {
                this._currentMeasure.width -= parentWidth * this._marginRight.value;
            }

            if (this._marginTop.isPixel) {
                this._currentMeasure.top += this._marginTop.value;
                this._currentMeasure.height -= this._marginTop.value;
            } else {
                this._currentMeasure.top += parentHeight * this._marginTop.value;
                this._currentMeasure.height -= parentHeight * this._marginTop.value;
            }

            if (this._marginBottom.isPixel) {
                this._currentMeasure.height -= this._marginBottom.value;
            } else {
                this._currentMeasure.height -= parentHeight * this._marginBottom.value;
            }            

            if (this._left.isPixel) {
                this._currentMeasure.left += this._left.value;
            } else {
                this._currentMeasure.left += parentWidth * this._left.value;
            }

            if (this._top.isPixel) {
                this._currentMeasure.top += this._top.value;
            } else {
                this._currentMeasure.top += parentHeight * this._top.value;
            }

            this._currentMeasure.left += x;
            this._currentMeasure.top += y;            
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            // Do nothing
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            // Do nothing
        }

        public contains(x: number, y: number) : boolean {
            // Invert transform
            if (this._scaleX !== 1 || this._scaleY !== 1 || this.rotation !== 0) {
               
            }

            // Check
            if (x < this._currentMeasure.left) {
                return false;
            }

            if (x > this._currentMeasure.left + this._currentMeasure.width) {
                return false;
            }

            if (y < this._currentMeasure.top) {
                return false;
            }

            if (y > this._currentMeasure.top + this._currentMeasure.height) {
                return false;
            } 

            if (this.isPointerBlocker) {
                this._host._shouldBlockPointer = true;
            }
            return true;
        }

        public _processPicking(x: number, y: number, type: number): boolean {
            if (!this.contains(x, y)) {
                return false;
            }

            this._processObservables(type);

            return true;
        }

        protected _onPointerMove(): void {
            if (this.onPointerMoveObservable.hasObservers()) {
                this.onPointerMoveObservable.notifyObservers(this);
            }
        }

        protected _onPointerEnter(): void {
            if (this.onPointerEnterObservable.hasObservers()) {
                this.onPointerEnterObservable.notifyObservers(this);
            }
        }

        protected _onPointerOut(): void {
            if (this.onPointerOutObservable.hasObservers()) {
                this.onPointerOutObservable.notifyObservers(this);
            }
        }

        protected _onPointerDown(): void {
            if (this.onPointerDownObservable.hasObservers()) {
                this.onPointerDownObservable.notifyObservers(this);
            }
        }

        protected _onPointerUp(): void {
            if (this.onPointerUpObservable.hasObservers()) {
                this.onPointerUpObservable.notifyObservers(this);
            }
        }

        protected _processObservables(type: number): boolean {
            if (!this.isHitTestVisible) {
                return false;
            }

            if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                this._onPointerMove();

                var previousControlOver = this._host._lastControlOver;
                if (previousControlOver && previousControlOver !== this) {
                    previousControlOver._onPointerOut();
                }

                if (previousControlOver !== this) {
                    this._onPointerEnter();
                }

                this._host._lastControlOver = this;
                return true;
            }

            if (type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this._onPointerDown();
                this._host._lastControlDown = this;
                return true;
            }

            if (type === BABYLON.PointerEventTypes.POINTERUP) {
                this._onPointerUp();
                if (this._host._lastControlDown !== this) {
                    this._host._lastControlDown._onPointerUp();
                    this._host._lastControlDown = null;
                }
                return true;
            }
        
            return false;
        }

        private _prepareFont() {
            if (!this._fontFamily) {
                return;
            }

            this._font = this._fontSize + "px " + this._fontFamily;
        
            this._fontOffset = Control._GetFontOffset(this._font);
            this._markAsDirty();
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

        public static _GetFontOffset(font: string): {ascent: number, height: number, descent: number} {

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

            var fontAscent = 0;
            var fontHeight = 0;
            try {
                fontHeight = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
                block.style.verticalAlign = "baseline";
                fontAscent = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
            } finally {
                div.remove();
            }
            var result = { ascent: fontAscent, height: fontHeight, descent: fontHeight - fontAscent };
            Control._FontHeightSizes[font] = result;

            return result;
        };
    }    
}