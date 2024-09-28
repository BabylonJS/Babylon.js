import * as React from "react";
import type { Observable } from "core/Misc/observable";
import { Color3, Color4 } from "core/Maths/math.color";
import { NumericInputComponent } from "./NumericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { PropertyChangedEvent } from "../../propertyChangedEvent";
import { ColorPickerLineComponent } from "./ColorPickerLineComponent";
import type { LockObject } from "../../tabs/propertyGrids/lockObject";
import style from "./ColorLineComponent.modules.scss";

import copyIcon from "../../imgs/copy.svg";
import { JoinClassNames } from "../classNames";
const emptyColor = new Color4(0, 0, 0, 0);

export interface IColorLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onPropertyChangedObservable: Observable<PropertyChangedEvent>;
    onChange?: () => void;
    isLinear?: boolean;
    icon?: string;
    iconLabel?: string;
    disableAlpha?: boolean;
    lockObject: LockObject;
}

interface IColorLineComponentState {
    isExpanded: boolean;
    color: Color4;
}

export class ColorLineComponent extends React.Component<IColorLineComponentProps, IColorLineComponentState> {
    constructor(props: IColorLineComponentProps) {
        super(props);

        this.state = { isExpanded: false, color: this.getValue() };

        const target = this.props.target;
        target._isLinearColor = props.isLinear; // so that replayRecorder can append toLinearSpace() as appropriate
    }

    override shouldComponentUpdate(nextProps: IColorLineComponentProps, nextState: IColorLineComponentState) {
        const stateColor = nextState.color;
        const propsColor = this.getValue(nextProps);
        if (stateColor !== this.state.color) {
            nextState.color = stateColor;
            return true;
        }
        if (propsColor !== this.state.color) {
            nextState.color = propsColor;
            return true;
        }
        if (nextState.isExpanded !== this.state.isExpanded) {
            return true;
        }
        return false;
    }

    getValue(props = this.props): Color4 {
        const target = props.target;
        const property = target[props.propertyName];
        if (!property) return emptyColor;
        if (typeof property === "string") {
            // if (property === conflictingValuesPlaceholder) {
            //     return emptyColor;
            // }
            return this._convertToColor(property);
        } else {
            if (props.isLinear) {
                return property.toGammaSpace();
            }
            return property.clone();
        }
    }

    setColorFromString(colorString: string) {
        const color = this._convertToColor(colorString);
        this.setColor(color);
    }

    setColor(newColor: Color4) {
        this.setState({ color: newColor.clone() });
        if (this.props.isLinear) {
            newColor.toLinearSpaceToRef(newColor);
        }
        // whether to set properties to color3 or color4
        const setColor = this.props.disableAlpha ? this._toColor3(newColor) : newColor;

        const target = this.props.target;
        const initialValue = target[this.props.propertyName];
        const value = typeof target[this.props.propertyName] === "string" ? setColor.toHexString() : setColor;
        // make the change
        target[this.props.propertyName] = value;
        // notify observers
        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: target,
                property: this.props.propertyName,
                value,
                initialValue,
            });
        }

        if (this.props.onChange) {
            this.props.onChange();
        }
    }

    switchExpandState() {
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
        const element = document.createElement("div");
        element.textContent = this.state.color.toHexString();
        document.body.appendChild(element);

        if (window.getSelection) {
            const range = document.createRange();
            range.selectNode(element);
            window.getSelection()!.removeAllRanges();
            window.getSelection()!.addRange(range);
        }

        document.execCommand("copy");
        element.remove();
    }

    private _convertToColor(color: string): Color4 {
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

    private _toColor3(color: Color4) {
        return new Color3(color.r, color.g, color.b);
    }

    override render() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;

        return (
            <div className={style.color3Line}>
                <div className={style.firstLine}>
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                    <div className={style.label} title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className={style.color3}>
                        <ColorPickerLineComponent
                            lockObject={this.props.lockObject}
                            linearHint={this.props.isLinear}
                            value={this.props.disableAlpha ? this._toColor3(this.state.color) : this.state.color}
                            onColorChanged={(colorString) => {
                                this.setColorFromString(colorString);
                            }}
                        />
                    </div>
                    <div className={JoinClassNames(style, "copy", "hoverIcon")} onClick={() => this.copyToClipboard()} title="Copy to clipboard">
                        <img src={copyIcon} alt="Copy" />
                    </div>
                    <div className={JoinClassNames("expand", "hoverIcon")} onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                </div>
                {this.state.isExpanded && (
                    <div className={style.secondLine}>
                        <NumericInputComponent
                            lockObject={this.props.lockObject}
                            label="r"
                            labelTooltip="Red"
                            value={this.state.color.r}
                            onChange={(value) => this.updateStateR(value)}
                        />
                        <NumericInputComponent
                            lockObject={this.props.lockObject}
                            label="g"
                            labelTooltip="Green"
                            value={this.state.color.g}
                            onChange={(value) => this.updateStateG(value)}
                        />
                        <NumericInputComponent
                            lockObject={this.props.lockObject}
                            label="b"
                            labelTooltip="Blue"
                            value={this.state.color.b}
                            onChange={(value) => this.updateStateB(value)}
                        />
                        {this.props.disableAlpha || (
                            <NumericInputComponent
                                lockObject={this.props.lockObject}
                                label="a"
                                labelTooltip="Alpha"
                                value={this.state.color.a}
                                onChange={(value) => this.updateStateA(value)}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    }
}
