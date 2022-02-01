import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Color4 } from "babylonjs/Maths/math.color";
import { NumericInputComponent } from "../lines/numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { ColorPickerLineComponent } from "./colorPickerComponent";
import { LockObject } from "../tabs/propertyGrids/lockObject";
import { TextInputLineComponent } from "./textInputLineComponent";

const copyIcon: string = require("./copy.svg");

export interface IColor4LineComponentProps {
    label: string;
    targets: any[];
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onChange?: () => void;
    isLinear?: boolean;
    icon?: string;
    iconLabel?: string;
    lockObject?: LockObject;
}

export class Color4LineComponent extends React.Component<IColor4LineComponentProps, { isExpanded: boolean; color: Color4 }> {
    private _localChange = false;
    constructor(props: IColor4LineComponentProps) {
        super(props);

        let value = this.getValue();
        let currentColor = value.getClassName() === "Color4" ? value.clone() : new Color4(value.r, value.g, value.b, value.a);
        this.state = { isExpanded: false, color: currentColor };

        if (props.isLinear) {
            this.state.color.toGammaSpaceToRef(this.state.color);
        }
        for (const target of props.targets) {
            target._isLinearColor = props.isLinear; // so that replayRecorder can append toLinearSpace() as appropriate
        }
    }

    shouldComponentUpdate(nextProps: IColor4LineComponentProps, nextState: { color: Color4 }) {
        let value = this.getValue();
        let currentColor = value.getClassName() === "Color4" ? value : new Color4(value.r, value.g, value.b, value.a);

        if (this.props.isLinear) {
            currentColor.toGammaSpaceRef(currentColor);
        }

        if (!currentColor.equals(nextState.color) || this._localChange) {
            nextState.color = currentColor.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    getValue(): Color4 {
        this._isConflict = false;
        const emptyColor = new Color4(0, 0, 0, 0);
        const getColor4FromProperty = (property: any) : Color4 => {
            if (!property) return emptyColor;
            if (typeof property === "string") {
                return this.convertToColor4(property);
            } else if (property.getClassName() === "Color4"){
                return property as Color4;
            } else {
                return property;
            }
        }
        if (this.props.targets.length === 0) return emptyColor;
        const props = this.props;
        const firstValue: Color4 = getColor4FromProperty(props.targets[0][props.propertyName]);
        for(const target of props.targets) {
            console.log(target, props.propertyName, target[props.propertyName])
            const value: Color4 = getColor4FromProperty(target[props.propertyName]);
            if (!value.equals(firstValue)) {
                this._isConflict = true;
                return emptyColor;
            }
        }
        return firstValue;
    }

    setPropertyValue(newColor: Color4) {
        if (this.props.isLinear) {
            newColor = newColor.toLinearSpace();
        }
        for(const target of this.props.targets) {
            target[this.props.propertyName] = newColor;
        }
    }

    onChange(newValue: string) {
        this._localChange = true;
        const newColor = this.convertToColor4(newValue);
        if (this._colorPickerOpen && this.props.icon) {
            const savedColor = this.convertToColor4(this._colorStringSaved);
            if (savedColor.equals(newColor)) {
                newValue = this._colorStringSaved;
            }
        }

        if (this.props.onPropertyChangedObservable) {
            for (const target of this.props.targets) {
                this.props.onPropertyChangedObservable.notifyObservers({
                    object: target,
                    property: this.props.propertyName,
                    value: newColor,
                    initialValue: this.state.color,
                });
            }
        }

        this.setPropertyValue(newColor);

        this.setState({ color: newColor });

        if (this.props.onChange) {
            this.props.onChange();
        }
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    raiseOnPropertyChanged(previousValue: Color4) {
        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        for(const target of this.props.targets) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: target,
                property: this.props.propertyName,
                value: this.state.color,
                initialValue: previousValue,
            });
        }
    }

    updateStateR(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.state.color.r = value;
        this.setPropertyValue(this.state.color);
        this.setState({ color: this.state.color });

        this.raiseOnPropertyChanged(store);
    }

    updateStateG(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.state.color.g = value;
        this.setPropertyValue(this.state.color);
        this.setState({ color: this.state.color });

        this.raiseOnPropertyChanged(store);
    }

    updateStateB(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.state.color.b = value;
        this.setPropertyValue(this.state.color);
        this.setState({ color: this.state.color });

        this.raiseOnPropertyChanged(store);
    }

    updateStateA(value: number) {
        this._localChange = true;
        const store = this.state.color.clone();
        this.state.color.a = value;
        for(const target of this.props.targets) {
            target[this.props.propertyName] = this.state.color.clone();
        }

        this.setState({ color: this.state.color });

        this.raiseOnPropertyChanged(store);
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

    private convertToColor4(color: string) {
        if (color === "" || color === "transparent" || !color) {
            return new Color4(0, 0, 0, 0);
        }

        if (color.substring(0, 1) !== "#" || color.length !== 9) {
            const d = document.createElement("div");
            d.style.color = color;
            document.body.append(d);
            const rgb = window.getComputedStyle(d).color;
            document.body.removeChild(d);

            const rgbArray = rgb
                .substring(4, rgb.length - 1)
                .replace(/ /g, "")
                .split(",");

            return new Color4(parseInt(rgbArray[0]) / 255, parseInt(rgbArray[1]) / 255, parseInt(rgbArray[2]) / 255, parseInt(rgbArray[3]) / 255);
        }

        return Color4.FromHexString(color);
    }

    private _colorStringSaved: string;
    private _colorPickerOpen: boolean;
    private _colorString: string;
    private _isConflict: boolean;
    render() {
        this.getValue();
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;

        return (
            <div className="color3Line">
                <div className="firstLine">
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="color4">
                        <ColorPickerLineComponent
                            linearHint={this.props.isLinear}
                            value={this.state.color}
                            onColorChanged={(color) => {
                                if (!this._colorPickerOpen) {
                                    this._colorStringSaved = this._colorString;
                                }
                                this._colorPickerOpen = true;
                                this.onChange(color);
                            }}
                        />
                    </div>
                    {this.props.icon && this.props.lockObject && (
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            label=""
                            targets={[this]}
                            propertyName="_colorString"
                            onChange={(newValue) => {
                                this._colorPickerOpen = false;
                                this.onChange(newValue);
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
                        <NumericInputComponent label="a" value={this.state.color.a} onChange={(value) => this.updateStateA(value)} />
                    </div>
                )}
            </div>
        );
    }
}
