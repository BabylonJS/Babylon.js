import * as React from "react";
import { Color4, Color3 } from 'babylonjs/Maths/math.color';
import { GlobalState } from '../globalState';
import { ColorPicker } from '../sharedUiComponents/colorPicker/colorPicker';

export interface IColorPickerComponentProps {
    value: Color4 | Color3;
    onColorChanged: (newOne: string) => void;
    globalState: GlobalState;
}

interface IColorPickerComponentState {
    pickerEnabled: boolean;
    color: Color3 | Color4;
    hex: string;
}

export class ColorPickerLineComponent extends React.Component<IColorPickerComponentProps, IColorPickerComponentState> {
    private _floatRef: React.RefObject<HTMLDivElement>;
    private _floatHostRef: React.RefObject<HTMLDivElement>;

    constructor(props: IColorPickerComponentProps) {
        super(props);

        this.state = {pickerEnabled: false, color: this.props.value, hex: this.props.value.toHexString()};

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
        let result = nextProps.value.toHexString() !== this.props.value.toHexString()            
            || nextState.hex !== this.state.hex
            || nextState.pickerEnabled !== this.state.pickerEnabled;

        if (result) {
            nextState.color = nextProps.value;
            nextState.hex = nextProps.value.toHexString();
        }
        return result;
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

        this.props.globalState.blockKeyboardEvents = this.state.pickerEnabled;

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
                            <ColorPicker color={color}
                                onColorChanged={(color: Color3 | Color4) => {
                                    const hex = color.toHexString();
                                    this.setState({ hex, color });
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