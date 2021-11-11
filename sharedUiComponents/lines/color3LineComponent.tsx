import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { NumericInputComponent } from "./numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { ColorPickerLineComponent } from './colorPickerComponent';
import { LockObject } from "../tabs/propertyGrids/lockObject";
import { TextInputLineComponent } from "./textInputLineComponent";

const copyIcon: string = require("./copy.svg");

export interface IColor3LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    isLinear?: boolean;
    icon?: string;
    lockObject?: LockObject;
    iconLabel?: string;
    onValueChange?: (value: string) => void;
}

export class Color3LineComponent extends React.Component<IColor3LineComponentProps, { isExpanded: boolean, color: Color3 | Color4, colorText: string }> {
    private _localChange = false;
    constructor(props: IColor3LineComponentProps) {
        super(props);

        const typeName = typeof (this.props.target[this.props.propertyName]);
        if (typeName === "string") {
            let colorConverted = this.convertToColor3(this.props.target[this.props.propertyName]);
            this.state = { isExpanded: false, color: colorConverted, colorText: this.props.target[this.props.propertyName] };
        } else {
            this.state = { isExpanded: false, color: this.props.target[this.props.propertyName].clone(), colorText: this.props.target[this.props.propertyName].toHexString() };
        }

        if (props.isLinear) {
            (this.state.color as Color3).toGammaSpaceToRef(this.state.color as Color3);
        }

        props.target._isLinearColor = props.isLinear; // so that replayRecorder can append toLinearSpace() as appropriate
        this._colorPickerOpen = false;
    }

    private convertToColor3(color: string) {
        if (color === "" || color === "transparent") {
            return new Color4(0, 0, 0, 0);
        }

        if (color.substring(0, 1) !== "#" || color.length !== 7) {
            const d = document.createElement("div");
            d.style.color = color;
            document.body.append(d);
            const rgb = window.getComputedStyle(d).color;
            document.body.removeChild(d);


            const rgbArray = rgb.substring(4, rgb.length - 1)
                .replace(/ /g, '')
                .split(',');

            return new Color3(parseInt(rgbArray[0]) / 255, parseInt(rgbArray[1]) / 255, parseInt(rgbArray[2]) / 255);
        }

        return Color3.FromHexString(color);
    }

    shouldComponentUpdate(nextProps: IColor3LineComponentProps, nextState: { color: Color3 | Color4, colorText: string }) {

        const isString = typeof (this.props.target[this.props.propertyName]) === "string";

        const currentState = isString ? this.convertToColor3(nextProps.target[nextProps.propertyName]) :
            this.props.isLinear ? nextProps.target[nextProps.propertyName].toGammaSpace() : nextProps.target[nextProps.propertyName];

        if (!currentState.equals(nextState.color) || this._localChange) {
            nextState.color = currentState.clone();
            nextState.colorText = isString ? nextProps.target[nextProps.propertyName] : nextProps.target[nextProps.propertyName].toHexString();
            this._localChange = false;
            return true;
        }
        return false;
    }

    setPropertyValue(newColor: Color3 | Color4, newColorText: string) {
        const isString = typeof (this.props.target[this.props.propertyName]) === "string";
        if (isString) {
            this.props.target[this.props.propertyName] = newColorText;
        }
        else {
            this.props.target[this.props.propertyName] = newColor;
            if (this.props.isLinear) {
                this.props.target[this.props.propertyName] = newColor.toLinearSpace();
            }
        }
    }

    onChange(newValue: string) {
        this._localChange = true;

        const newColor = this.convertToColor3(newValue);
        if (this._colorPickerOpen && this.props.icon) {
            const savedColor = this.convertToColor3(this._colorStringSaved);
            if ((savedColor as Color3).equals(newColor as Color3)) {
                newValue = this._colorStringSaved;
            }
        }

        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName,
                value: newColor,
                initialValue: this.state.color,
            });
        }

        this.setPropertyValue(newColor, newValue);

        this.setState({ color: newColor, colorText: newValue });

        if (this.props.onValueChange) {
            this.props.onValueChange(newValue);
        }
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    raiseOnPropertyChanged(previousValue: Color3 | Color4) {
        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: this.state.color,
            initialValue: previousValue,
        });
    }

    updateStateR(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.state.color.r = value;
        const hex = this.state.color.toHexString();
        this.setPropertyValue(this.state.color, hex);
        this.setState({ color: this.state.color, colorText: hex });
        this.raiseOnPropertyChanged(store);
    }

    updateStateG(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.state.color.g = value;
        const hex = this.state.color.toHexString();
        this.setPropertyValue(this.state.color, hex);
        this.setState({ color: this.state.color, colorText: hex });
        this.raiseOnPropertyChanged(store);
    }

    updateStateB(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.state.color.b = value;
        const hex = this.state.color.toHexString();
        this.setPropertyValue(this.state.color, hex);
        this.setState({ color: this.state.color, colorText: hex });
        this.raiseOnPropertyChanged(store);
    }

    copyToClipboard() {
        const element = document.createElement('div');
        element.textContent = this.state.color.toHexString();
        document.body.appendChild(element);

        if (window.getSelection) {
            const range = document.createRange();
            range.selectNode(element);
            window.getSelection()!.removeAllRanges();
            window.getSelection()!.addRange(range);
        }

        document.execCommand('copy');
        element.remove();
    }

    convert(colorString: string) {
        this.onChange(this._colorString);
    }

    private _colorStringSaved: string;
    private _colorPickerOpen: boolean;
    private _colorString: string;
    render() {

        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;
        this._colorString = this.state.colorText;

        return (
            <div className="color3Line">
                <div className="firstLine" title={this.props.label}>
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="color3">
                        <ColorPickerLineComponent
                            linearHint={this.props.isLinear}
                            value={this.state.color}
                            onColorChanged={color => {
                                if (!this._colorPickerOpen) {
                                    this._colorStringSaved = this._colorString;
                                }
                                this._colorPickerOpen = true;
                                this.onChange(color);
                            }} />
                    </div>
                    {(this.props.icon && this.props.lockObject) &&
                        <TextInputLineComponent lockObject={this.props.lockObject} label="" target={this} propertyName="_colorString" onChange={newValue => {
                            this._colorPickerOpen = false; this.convert(newValue)
                        }}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <div className="copy hoverIcon" onClick={() => this.copyToClipboard()} title="Copy to clipboard">
                        <img src={copyIcon} alt="" />
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                </div>
                {
                    this.state.isExpanded &&
                    <div className="secondLine">
                        <NumericInputComponent label="r" value={this.state.color.r} onChange={(value) => this.updateStateR(value)} />
                        <NumericInputComponent label="g" value={this.state.color.g} onChange={(value) => this.updateStateG(value)} />
                        <NumericInputComponent label="b" value={this.state.color.b} onChange={(value) => this.updateStateB(value)} />
                    </div>
                }
            </div>
        );
    }
}
