 module INSPECTOR {
     /**
     * Display a very small div corresponding to the given color
     */
    export class ColorElement extends BasicElement{
                
        // The color as hexadecimal string
        constructor(color:BABYLON.Color4|BABYLON.Color3) {
            super();
            this._div.className = 'color-element';
            this._div.style.backgroundColor = this._toRgba(color);
        }
        
        public update(color?:BABYLON.Color4|BABYLON.Color3) {
            if (color) {
                this._div.style.backgroundColor = this._toRgba(color);
            }
        }
        
        private _toRgba(color:BABYLON.Color4|BABYLON.Color3) : string {
            if (color) {
                let r = (color.r * 255) | 0;
                let g = (color.g * 255) | 0;
                let b = (color.b * 255) | 0;
                let a = 1;
                if (color instanceof BABYLON.Color4) {
                    a = (color as BABYLON.Color4).a;
                }
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            } else {
                return '';
            }
        }
    }
 }