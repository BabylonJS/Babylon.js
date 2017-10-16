module INSPECTOR {
    /**
     * Represents a html div element. 
     * The div is built when an instance of BasicElement is created.
     */
    export class ColorPickerElement extends BasicElement {
        
        protected _input : HTMLInputElement;
        private pline : PropertyLine;
        
        constructor(color:BABYLON.Color4|BABYLON.Color3, propertyLine: PropertyLine) {
            super();
            let scheduler = Scheduler.getInstance();
            this._div.className = 'color-element';
            this._div.style.backgroundColor = this._toRgba(color);
            this.pline = propertyLine;

            this._input = Helpers.CreateInput();  
            this._input.type = 'color';
            this._input.style.opacity = "0";
            this._input.style.width = '10px';
            this._input.style.height = '15px';
            this._input.value = color.toHexString();
            
            this._input.addEventListener('input', (e) => {
                let color = BABYLON.Color3.FromHexString(this._input.value);
                color.r = parseFloat(color.r.toPrecision(2));
                color.g = parseFloat(color.g.toPrecision(2));
                color.b = parseFloat(color.b.toPrecision(2));
                this.pline.validateInput(color);
                scheduler.pause = false;
            });
            
            this._div.appendChild(this._input);

            this._input.addEventListener('click', (e) => {
                scheduler.pause = true;
            });
        }

        public update(color?:BABYLON.Color4|BABYLON.Color3) {
            if (color) {
                this._div.style.backgroundColor = this._toRgba(color);
                this._input.value = color.toHexString();
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