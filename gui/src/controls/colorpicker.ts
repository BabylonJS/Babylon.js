/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class ColorPicker extends Control {
        private _colorWheelCanvas: HTMLCanvasElement;
        
        private _value: Color3 = Color3.Red();
        private _tmpColor = new Color3();

        private _pointerStartedOnSquare = false;
        private _pointerStartedOnWheel = false;
        
        private _squareLeft = 0;
        private _squareTop = 0;
        private _squareSize = 0;

        private _h = 360;
        private _s = 1;
        private _v = 1;
        
        public onValueChangedObservable = new Observable<Color3>();

        public get value(): Color3 {
            return this._value;
        }

        public set value(value: Color3) {
            if (this._value.equals(value)) {
                return;
            }

            this._value.copyFrom(value);

            this._RGBtoHSV(this._value, this._tmpColor);
            
            this._h = this._tmpColor.r;
            this._s = Math.max(this._tmpColor.g, 0.00001);
            this._v = Math.max(this._tmpColor.b, 0.00001);

            this._markAsDirty();

            this.onValueChangedObservable.notifyObservers(this._value);
        }

        public set width(value: string | number ) {
            if (this._width.toString(this._host) === value) {
                return;
            }

            if (this._width.fromString(value)) {
                this._height.fromString(value);
                this._markAsDirty();
            }
        }

        public set height(value: string | number ) {
            if (this._height.toString(this._host) === value) {
                return;
            }

            if (this._height.fromString(value)) {
                this._width.fromString(value);
                this._markAsDirty();
            }
        }

        public get size(): string | number {
            return this.width;
        }

        public set size(value: string | number){
            this.width = value;
        }              

        constructor(public name?: string) {
            super(name);
            this.value = new BABYLON.Color3(.88, .1, .1);
            this.size = "200px";
            this.isPointerBlocker = true;
        }

        protected _getTypeName(): string {
            return "ColorPicker";
        }        

        private _updateSquareProps():void {
            var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height)*.5;
            var wheelThickness = radius*.2;
            var innerDiameter = (radius-wheelThickness)*2;
            var squareSize = innerDiameter/(Math.sqrt(2));
            var offset = radius - squareSize*.5;

            this._squareLeft = this._currentMeasure.left + offset;
            this._squareTop = this._currentMeasure.top + offset;
            this._squareSize = squareSize;
        }

        private _drawGradientSquare(hueValue:number, left:number, top:number, width:number, height:number, context: CanvasRenderingContext2D) {
            var lgh = context.createLinearGradient(left, top, width+left, top);
            lgh.addColorStop(0, '#fff');
            lgh.addColorStop(1,  'hsl(' + hueValue + ', 100%, 50%)');

            context.fillStyle = lgh;
            context.fillRect(left, top,  width, height);

            var lgv = context.createLinearGradient(left, top, left, height+top);
            lgv.addColorStop(0, 'rgba(0,0,0,0)');
            lgv.addColorStop(1,  '#000');

            context.fillStyle = lgv;
            context.fillRect(left, top, width, height);
        }

        private _drawCircle(centerX:number, centerY:number, radius:number, context: CanvasRenderingContext2D) {
            context.beginPath();
            context.arc(centerX, centerY, radius+1, 0, 2 * Math.PI, false);
            context.lineWidth = 3;
            context.strokeStyle = '#333333';
            context.stroke();
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.lineWidth = 3;
            context.strokeStyle = '#ffffff';
            context.stroke();
        }

        private _createColorWheelCanvas(radius:number, thickness:number): HTMLCanvasElement {
            var canvas = document.createElement("canvas");
            canvas.width = radius * 2;
            canvas.height = radius * 2;
            var context = canvas.getContext("2d");
            var image = context.getImageData(0, 0, radius * 2, radius * 2);
            var data = image.data;
            
            var color = this._tmpColor;
            var maxDistSq = radius*radius;
            var innerRadius = radius - thickness;
            var minDistSq = innerRadius*innerRadius;

            for (var x = -radius; x < radius; x++) {
                for (var y = -radius; y < radius; y++) {
                    
                    var distSq = x*x + y*y;
                    
                    if (distSq > maxDistSq || distSq < minDistSq) {
                        continue;
                    }

                    var dist = Math.sqrt(distSq);
                    var ang = Math.atan2(y, x);
                    
                    this._HSVtoRGB(ang * 180/Math.PI + 180, dist/radius, 1, color);
                    
                    var index = ((x + radius) + ((y + radius)*2*radius)) * 4;
                    
                    data[index] = color.r*255;
                    data[index + 1] = color.g*255;
                    data[index + 2] = color.b*255;      
                    var alphaRatio = (dist - innerRadius) / (radius - innerRadius);

                    //apply less alpha to bigger color pickers
                    var alphaAmount = .2;
                    var maxAlpha = .2;
                    var minAlpha = .04;
                    var lowerRadius = 50;
                    var upperRadius = 150;

                    if(radius < lowerRadius){
                        alphaAmount = maxAlpha;
                    }else if(radius > upperRadius){
                        alphaAmount = minAlpha;
                    }else{
                        alphaAmount = (minAlpha - maxAlpha)*(radius - lowerRadius)/(upperRadius - lowerRadius) + maxAlpha;
                    }
                    
                    var alphaRatio = (dist - innerRadius) / (radius - innerRadius);

                    if (alphaRatio < alphaAmount) {
                        data[index + 3] = 255 * (alphaRatio / alphaAmount);
                    } else if (alphaRatio > 1 - alphaAmount) {
                        data[index + 3] = 255 * (1.0 - ((alphaRatio - (1 - alphaAmount)) / alphaAmount));
                    } else {
                        data[index + 3] = 255;
                    }

                }
            }

            context.putImageData(image, 0, 0);

            return canvas;
        }

        private _RGBtoHSV(color:Color3, result:Color3){
            var r = color.r;
            var g = color.g;
            var b = color.b;

            var max = Math.max(r, g, b);
            var min = Math.min(r, g, b);
            var h = 0;
            var s = 0;
            var v = max;
            
            var dm = max - min;
            
            if(max !== 0){
                s = dm / max;
            }

            if(max != min) {
                if(max == r){
                    h = (g - b) / dm;
                    if(g < b){
                        h += 6;
                    }
                }else if(max == g){
                    h = (b - r) / dm + 2;
                }else if(max == b){
                    h = (r - g) / dm + 4;
                }
                h *= 60;
            }
            
            result.r = h;
            result.g = s;
            result.b = v;
        }

        private _HSVtoRGB(hue:number, saturation:number, value:number, result:Color3) {
            var chroma = value * saturation;
            var h = hue / 60;
            var x = chroma * (1- Math.abs((h % 2) - 1));
            var r = 0;
            var g = 0;
            var b = 0;

            if (h >= 0 && h <= 1) {
                r = chroma;
                g = x;
            } else if (h >= 1 && h <= 2) {
                r = x;
                g = chroma;
            } else if (h >= 2 && h <= 3) {
                g = chroma;
                b = x;
            } else if (h >= 3 && h <= 4) {
                g = x;
                b = chroma;
            } else if (h >= 4 && h <= 5) {
                r = x;
                b = chroma;
            } else if (h >= 5 && h <= 6) {
                r = chroma;
                b = x;
            }
            
            var m = value - chroma;
            result.set((r+m), (g+m), (b+m));            
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {

                var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height)*.5;
                var wheelThickness = radius*.2;
                var left = this._currentMeasure.left;
                var top = this._currentMeasure.top;

                if(!this._colorWheelCanvas || this._colorWheelCanvas.width != radius*2){
                    this._colorWheelCanvas = this._createColorWheelCanvas(radius, wheelThickness);
                }

                context.drawImage(this._colorWheelCanvas, left, top);

                this._updateSquareProps();

                this._drawGradientSquare(this._h, 
                                        this._squareLeft,
                                        this._squareTop,
                                        this._squareSize, 
                                        this._squareSize,
                                        context);
                
                var cx = this._squareLeft + this._squareSize*this._s;
                var cy = this._squareTop + this._squareSize*(1 - this._v);
                
                this._drawCircle(cx, cy, radius*.04, context);

                var dist = radius - wheelThickness*.5;
                cx = left + radius + Math.cos((this._h-180)*Math.PI/180)*dist;
                cy = top + radius + Math.sin((this._h-180)*Math.PI/180)*dist;
                this._drawCircle(cx, cy, wheelThickness*.35, context);

            }
            context.restore();
        }

        // Events
        private _pointerIsDown = false;

        private _updateValueFromPointer(x: number, y:number): void {
            if(this._pointerStartedOnWheel)
            {
                var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height)*.5;
                var centerX = radius + this._currentMeasure.left;
                var centerY = radius + this._currentMeasure.top;
                this._h = Math.atan2(y - centerY, x - centerX)*180/Math.PI + 180;
            }
            else if(this._pointerStartedOnSquare)
            {
                this._updateSquareProps();
                this._s = (x - this._squareLeft) / this._squareSize;
                this._v = 1 - (y - this._squareTop) / this._squareSize;
                this._s = Math.min(this._s, 1);
                this._s = Math.max(this._s, 0.00001);
                this._v = Math.min(this._v, 1);
                this._v = Math.max(this._v, 0.00001);
            }

            this._HSVtoRGB(this._h, this._s, this._v, this._tmpColor);

            this.value = this._tmpColor;
        }

        private _isPointOnSquare(coordinates: Vector2):boolean {
            this._updateSquareProps();

            var left = this._squareLeft;
            var top = this._squareTop;
            var size = this._squareSize;

            if(coordinates.x >= left && coordinates.x <= left + size &&
               coordinates.y >= top && coordinates.y <= top + size){
                return true;
            }

            return false;
        }

        private _isPointOnWheel(coordinates: Vector2):boolean {
            var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height)*.5;
            var centerX = radius + this._currentMeasure.left;
            var centerY = radius + this._currentMeasure.top;
            var wheelThickness = radius*.2;
            var innerRadius = radius-wheelThickness;
            var radiusSq = radius*radius;
            var innerRadiusSq = innerRadius*innerRadius;

            var dx = coordinates.x - centerX;
            var dy = coordinates.y - centerY;

            var distSq = dx*dx + dy*dy;

            if(distSq <= radiusSq && distSq >= innerRadiusSq){
                return true;
            }

            return false;
        }

        public _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean {
            if (!super._onPointerDown(target, coordinates, buttonIndex)) {
                return false;
            }            

            this._pointerIsDown = true;

            this._pointerStartedOnSquare = false;
            this._pointerStartedOnWheel = false;

            if(this._isPointOnSquare(coordinates)){
                this._pointerStartedOnSquare = true;
            }else if(this._isPointOnWheel(coordinates)){
                this._pointerStartedOnWheel = true;
            }

            this._updateValueFromPointer(coordinates.x, coordinates.y);
            this._host._capturingControl = this;

            return true;
        }

        public _onPointerMove(target: Control, coordinates: Vector2): void {
            if (this._pointerIsDown) {
                this._updateValueFromPointer(coordinates.x, coordinates.y);
            }

            super._onPointerMove(target, coordinates);
        }

        public _onPointerUp (target: Control, coordinates: Vector2, buttonIndex: number): void {
            this._pointerIsDown = false;
            
            this._host._capturingControl = null;
            super._onPointerUp(target, coordinates, buttonIndex);
        }     
    }    
}