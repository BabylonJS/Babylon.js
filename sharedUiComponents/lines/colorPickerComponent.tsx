import * as React from "react";
import { Color4, Color3 } from 'babylonjs/Maths/math.color';
import { ColorPicker } from '../colorPicker/colorPicker';

export interface IColorPickerComponentProps {
    value: Color4 | Color3;
    linearHint?: boolean;
    onColorChanged: (newOne: string) => void;
    icon? : string;
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

        this.state = {pickerEnabled: false,
            color: this.props.value,
            hex: this.props.value.toHexString()};

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
        let diffProps = nextProps.value.toHexString() !== this.props.value.toHexString();

        if (diffProps) {
            nextState.color =  nextProps.value;
            nextState.hex = nextProps.value.toHexString();
        }

        return diffProps
            || nextState.hex !== this.state.hex
            || nextState.pickerEnabled !== this.state.pickerEnabled;
    }

    componentDidUpdate() {
        this.syncPositions();
    }

    componentDidMount() {
        this.syncPositions();
    }

    render() {
        var color = this.state.color;

        return (
            <div className="color-picker">
                {this.props.icon && <img src={this.props.icon} className="icon"/>}
                <div className="color-rect"  ref={this._floatHostRef}
                    style={{background: this.state.hex}}
                    onClick={() => this.setState({pickerEnabled: true})}>

                </div>
                {
                    this.state.pickerEnabled &&
                    <>
                        <div className="color-picker-cover" onClick={(evt) => {
                                if (evt.target !== this._floatRef.current?.ownerDocument?.querySelector(".color-picker-cover")) {
                                    return;
                                }
                                this.setState({pickerEnabled: false});
                            }}>
                            <div className="color-picker-float" ref={this._floatRef}>
                                <ColorPicker color={color}
                                    linearhint={this.props.linearHint}
                                    onColorChanged={(color: Color3 | Color4) => {
                                        const hex: string = color.toHexString();
                                        this.setState({ hex, color });
                                        this.props.onColorChanged(hex);
                                    }}
                                />
                            </div>
                        </div>
                    </>
                }
            </div>
        );
    }
}