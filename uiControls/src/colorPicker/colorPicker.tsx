import * as React from "react";
import { Color3, Color4 } from "babylonjs/Maths/math.color";
import { ColorComponentEntry } from './colorComponentEntry';

require("./colorPicker.scss");

/**
 * Interface used to specify creation options for color picker
 */
export interface IColorPickerProps {
    color: Color3 | Color4,
    debugMode?: boolean,
    onColorChanged?: (color: Color3 | Color4) => void
}

/**
 * Interface used to specify creation options for color picker
 */
export interface IColorPickerState {
    color: Color3;
    alpha: number;
}

/**
 * Class used to create a color picker
 */
export class ColorPicker extends React.Component<IColorPickerProps, IColorPickerState> {
    private _saturationRef: React.RefObject<HTMLDivElement>
    private _isPointerDown: boolean;

    constructor(props: IColorPickerProps) {
        super(props);
        if (this.props.color instanceof Color4) {
            this.state = {color: new Color3(this.props.color.r, this.props.color.g, this.props.color.b), alpha: this.props.color.a};
        } else {
            this.state = {color : this.props.color.clone(), alpha: 1};
        }
        this._saturationRef = React.createRef();
    }

    onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._evaluateSaturation(evt);
        this._isPointerDown = true;

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }
    
    onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._isPointerDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    onPointerMove(evt: React.PointerEvent<HTMLDivElement>) {
        if (!this._isPointerDown) {
            return;
        }
        this._evaluateSaturation(evt);
    }

    private _evaluateSaturation(evt: React.PointerEvent<HTMLDivElement>) {
        let left = evt.clientX;
        let top = evt.clientY;
      
        const saturation =  Math.min(1, Math.max(0.0001, left / this._saturationRef.current!.clientWidth));
        const value = Math.min(1, Math.max(0.0001, 1 - (top / this._saturationRef.current!.clientHeight)));

        if (this.props.debugMode) {
            console.log("Saturation: " + saturation);
            console.log("Value: " + value);
        }

        let hsv = this.state.color.toHSV();
        Color3.HSVtoRGBToRef(hsv.r, saturation, value, this.state.color);
        this.setState({color: this.state.color});
    }

    componentDidUpdate() {
        this.raiseOnColorChanged();
    }

    raiseOnColorChanged() {
        if (!this.props.onColorChanged) {
            return;
        }

        if (this.props.color instanceof Color4) {
            let newColor4 = Color4.FromColor3(this.state.color, this.state.alpha);

            this.props.onColorChanged(newColor4);

            return;
        }

        this.props.onColorChanged(this.state.color.clone());
    }

    updateHexValue(valueString: string) {
        if (valueString != "" && /^[0-9A-Fa-f]+$/g.test(valueString) == false) {
            return;
        }
    
        if(valueString.length > 10) {
            return;
        }
       
        this.setState({color: Color3.FromHexString("#" + valueString)});
    }

    public render() {
        let colorHex = this.state.color.toHexString();
        let hsv = this.state.color.toHSV();
        let colorRef = new Color3();
        Color3.HSVtoRGBToRef(hsv.r, 1, 1, colorRef)
        let colorHexRef = colorRef.toHexString();
        let hasAlpha = this.props.color instanceof Color4;

        return (
            <div className="color-picker-container">
                <div className="color-picker-saturation"  
                    onPointerMove={e => this.onPointerMove(e)}               
                    onPointerDown={e => this.onPointerDown(e)}
                    onPointerUp={e => this.onPointerUp(e)}
                    ref={this._saturationRef}
                    style={{
                        background: colorHexRef
                    }}>
                    <div className="color-picker-saturation-white">
                    </div>
                    <div className="color-picker-saturation-black">
                    </div>
                    <div className="color-picker-saturation-cursor" style={{
                        top: `${ -(hsv.b * 100) + 100 }%`,
                        left: `${ hsv.g * 100 }%`,
                    }}>
                    </div>
                </div>
                <div className="color-picker-hue">
                    <div className="color-picker-hue-color" style={{
                        background: colorHex
                    }}>
                    </div>
                    <div className="color-picker-hue-slider">                    
                    </div>
                </div>
                <div className={hasAlpha ? "color-picker-rgba" : "color-picker-rgb"}>
                    <div className="red">
                        <ColorComponentEntry label="R" min={0} max={255} value={this.state.color.r * 255 | 0} onChange={value => {
                            this.state.color.r = value / 255.0;
                            this.forceUpdate();
                        }}/>
                    </div>   
                    <div className="green">
                        <ColorComponentEntry label="G" min={0} max={255}  value={this.state.color.g * 255 | 0} onChange={value => {
                            this.state.color.g = value / 255.0;
                            this.forceUpdate();
                        }}/>
                    </div>  
                    <div className="blue">
                        <ColorComponentEntry label="B" min={0} max={255}  value={this.state.color.b * 255 | 0} onChange={value => {
                            this.state.color.b = value / 255.0;
                            this.forceUpdate();
                        }}/>
                    </div>        
                    {
                        hasAlpha &&
                        <div className="alpha">
                            <ColorComponentEntry label="A" min={0} max={255} value={this.state.alpha * 255 | 0} onChange={value => {
                                    this.setState({alpha: value / 255.0});
                                    this.forceUpdate();
                            }}/>
                        </div>
                    }          
                </div>
                <div className="color-picker-hex">
                    <div className="color-picker-hex-label">
                        Hex
                    </div>
                    <div className="color-picker-hex-value">     
                        <input type="string" className="hex-input" value={colorHex.replace("#", "")} 
                            onChange={evt => this.updateHexValue(evt.target.value)}/>               
                    </div>
                </div>
            </div>
        );
    }
}

