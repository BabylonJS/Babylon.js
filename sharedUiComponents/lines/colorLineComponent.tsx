import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Color3, Color4 } from "babylonjs/Maths/math.color";
import { NumericInputComponent } from "./numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { ColorPickerLineComponent } from "./colorPickerComponent";
import { LockObject } from "../tabs/propertyGrids/lockObject";
import { TextInputLineComponent } from "./textInputLineComponent";

const copyIcon: string = require("./copy.svg");
const emptyColor = new Color4(1, 1, 1, 0);

export interface IColorLineComponentProps {
    label: string;
    target?: any;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onChange?: () => void;
    isLinear?: boolean;
    icon?: string;
    iconLabel?: string;
    lockObject?: LockObject;
    disableAlpha?: boolean;
}

export class ColorLineComponent extends React.Component<IColorLineComponentProps, { isExpanded: boolean; color: Color4 }> {
    private _localChange = false;
    constructor(props: IColorLineComponentProps) {
        super(props);

        const currentColor = this.getValue();
        this.state = { isExpanded: false, color: currentColor };

        if (props.isLinear) {
            this.state.color.toGammaSpaceToRef(this.state.color);
        }

        const target = this.props.target;
        target._isLinearColor = props.isLinear; // so that replayRecorder can append toLinearSpace() as appropriate
    }

    shouldComponentUpdate(nextProps: IColorLineComponentProps, nextState: { color: Color4 }) {
        const currentColor = this.getValue();

        if (this.props.isLinear) {
            currentColor.toGammaSpaceToRef(currentColor as any);
        }

        if (!currentColor.equals(nextState.color) || this._localChange) {
            // nextState.color = currentColor.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    getValue(props = this.props): Color4 {
        const target = props.target;
        const property = target[props.propertyName];
        if (!property) return emptyColor;
        if (typeof property === "string") {
            return this.convertToColor(property);
        } else {
            return property as Color4;
        }
    }

    setColor(newColor: Color4) {
        if (this.props.isLinear) {
            newColor = newColor.toLinearSpace();
        }
        this._localChange = true;
        this.setState({color: newColor});

        // whether to set properties to color3 or color4
        const setColor = this.props.disableAlpha ? this.toColor3(newColor) : newColor;

        const target = this.props.target;
        const previousValue = target[this.props.propertyName];
        const value = typeof target[this.props.propertyName] === "string" ? setColor.toHexString() : setColor;
        // make the change
        target[this.props.propertyName] = value;
        // notify observers
        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: target,
                property: this.props.propertyName,
                value,
                previousValue
            });
        }
        
        if (this.props.onChange) {
            this.props.onChange();
        }
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    updateStateR(value: number) {
        this.setColor(new Color4(value, this.state.color.g, this.state.color.b, this.state.color.a));
    }

    updateStateG(value: number) {
        this.setColor(new Color4(this.state.color.r, value, this.state.color.b, this.state.color.a));
    }

    updateStateB(value: number) {
        this.setColor(new Color4(this.state.color.r, this.state.color.g, value, this.state.color.a));
    }

    updateStateA(value: number) {
        if (this.props.disableAlpha) {
            return;
        }
        this.setColor(new Color4(this.state.color.r, this.state.color.g, this.state.color.b, value));
    }

    copyToClipboard() {
        var element = document.createElement("div");
        element.textContent = this.state.color.toHexString();
        document.body.appendChild(element);

        if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(element);
            window.getSelection()!.removeAllRanges();
            window.getSelection()!.addRange(range);
        }

        document.execCommand("copy");
        element.remove();
    }

    private getColorString() {
        const hexString = (this.state.color as Color4).toHexString();
        if (this.props.disableAlpha) {
            return hexString.substring(0, 7);
        }
        return hexString;
    }

    private convertToColor(color: string): Color4 {
        if (color === "" || color === "transparent") {
            return emptyColor;
        }

        if (color.substring(0, 1) !== "#" || (color.length !== 7 && color.length !== 9)) {
            const d = document.createElement("div");
            d.style.color = color;
            document.body.append(d);
            const rgb = window.getComputedStyle(d).color;
            document.body.removeChild(d);

            const rgbArray = rgb
                .substring(4, rgb.length - 1)
                .replace(/ /g, "")
                .split(",");

            const alpha = rgbArray.length > 3 ? parseInt(rgbArray[3]) / 255 : 1.0;

            return new Color4(parseInt(rgbArray[0]) / 255, parseInt(rgbArray[1]) / 255, parseInt(rgbArray[2]) / 255, alpha);
        }

        if (this.props.disableAlpha) {
            const color3 = Color3.FromHexString(color);
            return new Color4(color3.r, color3.g, color3.b, 1.0);
        }

        return Color4.FromHexString(color);
    }

    private toColor3(color: Color4) {
        return new Color3(color.r, color.g, color.b);
    }

    private _colorStringSaved: string;
    private _colorPickerOpen: boolean;
    private _colorString: string;
    render() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;
        this._colorString = this.getColorString();
        return (
            <div className="color3Line">
                <div className="firstLine">
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="color3">
                        <ColorPickerLineComponent
                            linearHint={this.props.isLinear}
                            value={this.props.disableAlpha ? this.toColor3(this.state.color) : this.state.color}
                            onColorChanged={(color) => {
                                if (!this._colorPickerOpen) {
                                    this._colorStringSaved = this._colorString;
                                }
                                this._colorPickerOpen = true;
                                this.setColor(this.convertToColor(color));
                            }}
                        />
                    </div>
                    {this.props.icon && this.props.lockObject && (
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            label=""
                            target={this}
                            propertyName="_colorString"
                            onChange={(newValue) => {
                                this._colorPickerOpen = false;
                                this.setColor(this.convertToColor(newValue));
                            }}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <div className="copy hoverIcon" onClick={() => this.copyToClipboard()} title="Copy to clipboard">
                        <img src={copyIcon} alt="" />
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                </div>
                {this.state.isExpanded && (
                    <div className="secondLine">
                        <NumericInputComponent label="r" value={this.state.color.r} onChange={(value) => this.updateStateR(value)} />
                        <NumericInputComponent label="g" value={this.state.color.g} onChange={(value) => this.updateStateG(value)} />
                        <NumericInputComponent label="b" value={this.state.color.b} onChange={(value) => this.updateStateB(value)} />
                        {this.props.disableAlpha || <NumericInputComponent label="a" value={this.state.color.a} onChange={(value) => this.updateStateA(value)} />}
                    </div>
                )}
            </div>
        );
    }
}
