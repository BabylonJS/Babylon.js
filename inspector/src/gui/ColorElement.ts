import { BasicElement } from "./BasicElement";
import { Color4, Color3 } from "babylonjs";

/**
* Display a very small div corresponding to the given color
*/
export class ColorElement extends BasicElement {

    // The color as hexadecimal string
    constructor(color: Color4 | Color3) {
        super();
        this._div.className = 'color-element';
        this._div.style.backgroundColor = this._toRgba(color);
    }

    public update(color?: Color4 | Color3) {
        if (color) {
            this._div.style.backgroundColor = this._toRgba(color);
        }
    }

    private _toRgba(color: Color4 | Color3): string {
        if (color) {
            let r = (color.r * 255) | 0;
            let g = (color.g * 255) | 0;
            let b = (color.b * 255) | 0;
            let a = 1;
            if (color instanceof Color4) {
                a = (color as Color4).a;
            }
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        } else {
            return '';
        }
    }
}
