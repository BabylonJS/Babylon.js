import * as React from "react";
import { type Color4, type Color3 } from "core/Maths/math.color";
import { ColorPickerComponent } from "../colorPicker/ColorPicker";
import { type LockObject } from "../../tabs/propertyGrids/lockObject";
import * as style from "./ColorPickerLineComponent.module.scss";

export interface IColorPickerLineComponentProps {
    value: Color4 | Color3;
    linearHint?: boolean;
    onColorChanged: (newOne: string) => void;
    icon?: string;
    iconLabel?: string;
    shouldPopRight?: boolean;
    lockObject?: LockObject;
    backgroundColor?: string;
}

interface IColorPickerComponentState {
    pickerEnabled: boolean;
    color: Color3 | Color4;
    hex: string;
}

export class ColorPickerLineComponent extends React.Component<IColorPickerLineComponentProps, IColorPickerComponentState> {
    private _floatRef: React.RefObject<HTMLDivElement>;
    private _floatHostRef: React.RefObject<HTMLDivElement>;
    private _coverRef: React.RefObject<HTMLDivElement>;
    private _latestColor: Color3 | Color4;

    constructor(props: IColorPickerLineComponentProps) {
        super(props);

        this._latestColor = props.value;
        this.state = { pickerEnabled: false, color: this.props.value, hex: this.getHexString(props) };

        this._floatRef = React.createRef();
        this._floatHostRef = React.createRef();
        this._coverRef = React.createRef();
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

    override shouldComponentUpdate(nextProps: IColorPickerLineComponentProps, nextState: IColorPickerComponentState) {
        const diffProps = !this._areSameColor(nextProps.value, this.props.value);

        if (diffProps) {
            // Cache the latest prop color for when the picker next opens. Don't sync nextState.color
            // here: passing a new color to an already-open ColorPicker can trigger onColorChanged from
            // a prop-driven update rather than user interaction.
            this._latestColor = nextProps.value;
            nextState.hex = this.getHexString(nextProps);
        }

        return diffProps || nextState.hex !== this.state.hex || nextState.pickerEnabled !== this.state.pickerEnabled;
    }

    private _areSameColor(a: Color3 | Color4, b: Color3 | Color4) {
        return a.r === b.r && a.g === b.g && a.b === b.b && (a as Color4).a === (b as Color4).a;
    }

    getHexString(props = this.props) {
        return props.value.toHexString();
    }

    override componentDidUpdate() {
        this.syncPositions();
    }

    override componentDidMount() {
        this.syncPositions();
    }

    override render() {
        return (
            <div className={style.colorPicker}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <div className={style.colorRectBackground} ref={this._floatHostRef} onClick={() => this.setState({ pickerEnabled: true, color: this._latestColor })}>
                    <div className={style.colorRect} style={{ background: this.state.hex }}></div>
                </div>
                {this.state.pickerEnabled && (
                    <>
                        <div
                            ref={this._coverRef}
                            className={style.colorPickerCover}
                            onClick={(evt) => {
                                if (evt.target !== this._coverRef.current) {
                                    return;
                                }
                                this.setState({ pickerEnabled: false });
                            }}
                        >
                            <div className={style.colorPickerFloat} ref={this._floatRef}>
                                <ColorPickerComponent
                                    backgroundColor={this.props.backgroundColor}
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
