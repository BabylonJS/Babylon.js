import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Color3, Color4 } from "babylonjs/Maths/math.color";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { NumericInputComponent } from "./numericInputComponent";
import { GlobalState } from '../globalState';
import { ColorPickerLineComponent } from './colorPickerComponent';

const copyIcon: string = require("./copy.svg");
const plusIcon: string = require("./plus.svg");
const minusIcon: string = require("./minus.svg");

export interface IColor3LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onChange?: () => void;
    globalState: GlobalState;
}

export class Color3LineComponent extends React.Component<IColor3LineComponentProps, { isExpanded: boolean, color: Color3 }> {
    private _localChange = false;
    constructor(props: IColor3LineComponentProps) {
        super(props);

        this.state = { isExpanded: false, color: this.props.target[this.props.propertyName].clone() };
    }

    shouldComponentUpdate(nextProps: IColor3LineComponentProps, nextState: { color: Color3 }) {
        const currentState = nextProps.target[nextProps.propertyName];

        if (!currentState.equals(nextState.color) || this._localChange) {
            nextState.color = currentState.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    onChange(newValue: string) {
        this._localChange = true;
        const newColor = Color3.FromHexString(newValue);

        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName,
                value: newColor,
                initialValue: this.state.color
            });
        }

        if (this.props.target[this.props.propertyName].getClassName() === "Color4") {
            this.props.target[this.props.propertyName] = new Color4(newColor.r, newColor.g, newColor.b, 1.0);
        } else {
            this.props.target[this.props.propertyName] = newColor;
        }

        this.setState({ color: newColor });

        if (this.props.onChange) {
            this.props.onChange();
        }
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    raiseOnPropertyChanged(previousValue: Color3) {
        if (this.props.onChange) {
            this.props.onChange();
        }

        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: this.state.color,
            initialValue: previousValue
        });
    }

    updateStateR(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.props.target[this.props.propertyName].x = value;
        this.state.color.r = value;
        this.props.target[this.props.propertyName] = this.state.color;
        this.setState({ color: this.state.color });

        this.raiseOnPropertyChanged(store);
    }

    updateStateG(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.props.target[this.props.propertyName].g = value;
        this.state.color.g = value;
        this.props.target[this.props.propertyName] = this.state.color;
        this.setState({ color: this.state.color });

        this.raiseOnPropertyChanged(store);
    }

    updateStateB(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.props.target[this.props.propertyName].b = value;
        this.state.color.b = value;
        this.props.target[this.props.propertyName] = this.state.color;
        this.setState({ color: this.state.color });

        this.raiseOnPropertyChanged(store);
    }

    copyToClipboard() {
        var element = document.createElement('div');
        element.textContent = this.state.color.toHexString();
        document.body.appendChild(element);

        if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(element);
            window.getSelection()!.removeAllRanges();
            window.getSelection()!.addRange(range);
        }

        document.execCommand('copy');
        element.remove();
    }

    render() {

        const expandedIcon = this.state.isExpanded ? minusIcon : plusIcon;

        return (
            <div className="color3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="color3">
                        <ColorPickerLineComponent value={this.state.color} disableAlpha={true} globalState={this.props.globalState} onColorChanged={color => {
                                this.onChange(color);
                            }} />  
                    </div>
                    <div className="copy hoverIcon" onClick={() => this.copyToClipboard()} title="Copy to clipboard">
                        <img src={copyIcon} alt=""/>
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        <img src={expandedIcon} alt=""/>
                    </div>
                </div>
                {
                    this.state.isExpanded &&
                    <div className="secondLine">
                        <NumericInputComponent globalState={this.props.globalState} label="r" value={this.state.color.r} onChange={(value) => this.updateStateR(value)} />
                        <NumericInputComponent globalState={this.props.globalState} label="g" value={this.state.color.g} onChange={(value) => this.updateStateG(value)} />
                        <NumericInputComponent globalState={this.props.globalState} label="b" value={this.state.color.b} onChange={(value) => this.updateStateB(value)} />
                    </div>
                }
            </div>
        );
    }
}
