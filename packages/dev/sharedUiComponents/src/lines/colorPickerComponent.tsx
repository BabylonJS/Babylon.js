import * as React from "react";
import type { Color4, Color3 } from "core/Maths/math.color";
import { ColorPicker } from "../colorPicker/colorPicker";
import type { LockObject } from "../tabs/propertyGrids/lockObject";

export interface IColorPickerComponentProps {
    value: Color4 | Color3;
    linearHint?: boolean;
    onColorChanged: (newOne: string) => void;
    icon?: string;
    iconLabel?: string;
    shouldPopRight?: boolean;
    lockObject?: LockObject;
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

        this.state = { pickerEnabled: false, color: this.props.value, hex: this.getHexString(props) };

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
        const height = div.getBoundingClientRect().height;

        if (top + height + 10 > window.innerHeight) {
            top = window.innerHeight - height - 10;
        }

        div.style.top = top + "px";
        if (!this.props.shouldPopRight) {
            div.style.left = host.getBoundingClientRect().left - div.getBoundingClientRect().width + "px";
        } else {
            div.style.left = host.getBoundingClientRect().left + "px";
        }
    }

    shouldComponentUpdate(nextProps: IColorPickerComponentProps, nextState: IColorPickerComponentState) {
        const diffProps = this.getHexString(nextProps) !== this.getHexString();

        if (diffProps) {
            nextState.color = nextProps.value;
            nextState.hex = this.getHexString(nextProps);
        }

        return diffProps || nextState.hex !== this.state.hex || nextState.pickerEnabled !== this.state.pickerEnabled;
    }

    getHexString(props = this.props) {
        return props.value.toHexString();
    }

    componentDidUpdate() {
        this.syncPositions();
    }

    componentDidMount() {
        this.syncPositions();
    }

    render() {
        return (
            <div className="color-picker">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <div className="color-rect-background" ref={this._floatHostRef} onClick={() => this.setState({ pickerEnabled: true })}>
                    <div className="color-rect" style={{ background: this.state.hex }}></div>
                </div>
                {this.state.pickerEnabled && (
                    <>
                        <div
                            className="color-picker-cover"
                            onClick={(evt) => {
                                if (evt.target !== this._floatRef.current?.ownerDocument?.querySelector(".color-picker-cover")) {
                                    return;
                                }
                                this.setState({ pickerEnabled: false });
                            }}
                        >
                            <div className="color-picker-float" ref={this._floatRef}>
                                <ColorPicker
                                    lockObject={this.props.lockObject || ({} as any)}
                                    color={this.state.color}
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
                )}
            </div>
        );
    }
}
