import * as React from "react";
import { Color4, Color3 } from 'babylonjs/Maths/math.color';
import { SketchPicker } from 'react-color';
import { GlobalState } from '../globalState';

export interface IColorPickerComponentProps {
    value: Color4 | Color3;
    onColorChanged: (newOne: string) => void;
    globalState: GlobalState;
    disableAlpha?: boolean;
}

interface IColorPickerComponentState {
    pickerEnabled: boolean;
    color: {
        r: number,
        g: number,
        b: number,
        a?: number
    },
    hex: string
}

export class ColorPickerLineComponent extends React.Component<IColorPickerComponentProps, IColorPickerComponentState> {
    private _floatRef: React.RefObject<HTMLDivElement>
    private _floatHostRef: React.RefObject<HTMLDivElement>

    constructor(props: IColorPickerComponentProps) {
        super(props);

        this.state = {pickerEnabled: false, color: {
            r: this.props.value.r * 255,
            g: this.props.value.g * 255,
            b: this.props.value.b * 255,
            a: this.props.value instanceof Color4 ? this.props.value.a * 100 : 100,
        }, hex: this.props.value.toHexString()};
        
        this._floatRef = React.createRef();
        this._floatHostRef = React.createRef();
    }

    syncPositions() {
        const div = this._floatRef.current as HTMLDivElement;
        const host = this._floatHostRef.current as HTMLDivElement;

        if (!div || !host) {
            return;
        }

        let top = host.getBoundingClientRect().top;
        let height = div.getBoundingClientRect().height;

        if (top + height + 10 > window.innerHeight) {
            top = window.innerHeight - height - 10;
        }

        div.style.top = top + "px";
        div.style.left = host.getBoundingClientRect().left - div.getBoundingClientRect().width + "px";
    }

    shouldComponentUpdate(nextProps: IColorPickerComponentProps, nextState: IColorPickerComponentState) {
        return nextProps.value.toHexString() !== this.props.value.toHexString() 
            || nextProps.disableAlpha !== this.props.disableAlpha 
            || nextState.hex !== this.state.hex
            || nextState.pickerEnabled !== this.state.pickerEnabled;
    }

    componentDidUpdate() {
        this.syncPositions();
    }

    componentDidMount() {
        this.syncPositions();
    }

    setPickerState(enabled: boolean) {
        this.setState({ pickerEnabled: enabled });
        this.props.globalState.blockKeyboardEvents = enabled;
    }

    render() {
        var color = this.state.color;

        return (
            <div className="color-picker">
                <div className="color-rect"  ref={this._floatHostRef} 
                    style={{background: this.state.hex}} 
                    onClick={() => this.setPickerState(true)}>

                </div>
                {
                    this.state.pickerEnabled &&
                    <>
                        <div className="color-picker-cover" onClick={() => this.setPickerState(false)}></div>
                        <div className="color-picker-float" ref={this._floatRef}>
                            <SketchPicker color={color} 
                                disableAlpha={this.props.disableAlpha}
                                onChange={(color) => {
                                    let hex: string;

                                    if (this.props.disableAlpha) {
                                        let newColor3 = Color3.FromInts(color.rgb.r, color.rgb.g, color.rgb.b);
                                        hex = newColor3.toHexString();    
                                    } else {
                                        let newColor4 = Color4.FromInts(color.rgb.r, color.rgb.g, color.rgb.b, 255 * (color.rgb.a || 0));
                                        hex = newColor4.toHexString();   
                                    }
                                    this.setState({hex: hex, color: color.rgb});
                                    this.props.onColorChanged(hex);
                                }}
                            />
                        </div>
                    </>
                }                
            </div>
        );
    }
}
