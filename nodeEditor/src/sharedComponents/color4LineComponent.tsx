import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Color4 } from "babylonjs/Maths/math.color";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { NumericInputComponent } from "./numericInputComponent";
import { GlobalState } from '../globalState';
import { ColorPickerLineComponent } from './colorPickerComponent';

const copyIcon: string = require("./copy.svg");
const plusIcon: string = require("./plus.svg");
const minusIcon: string = require("./minus.svg");

export interface IColor4LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onChange?: () => void;
    globalState: GlobalState;
}

export class Color4LineComponent extends React.Component<IColor4LineComponentProps, { isExpanded: boolean, color: Color4 }> {
    private _localChange = false;
    constructor(props: IColor4LineComponentProps) {
        super(props);

        let value = this.props.target[this.props.propertyName];
        let currentColor = value.getClassName() === "Color4" ? value.clone() : new Color4(value.r, value.g, value.b, 1.0);
        this.state = { isExpanded: false, color: currentColor };
    }

    shouldComponentUpdate(nextProps: IColor4LineComponentProps, nextState: { color: Color4 }) {
        let value = this.props.target[this.props.propertyName];
        let currentColor = value.getClassName() === "Color4" ? value : new Color4(value.r, value.g, value.b, 1.0);

        if (!currentColor.equals(nextState.color) || this._localChange) {
            nextState.color = currentColor.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    onChange(newValue: string) {
        this._localChange = true;
        const newColor = Color4.FromHexString(newValue);

        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName,
                value: newColor,
                initialValue: this.state.color
            });
        }

        this.props.target[this.props.propertyName] = newColor;

        this.setState({ color: this.props.target[this.props.propertyName] });

        if (this.props.onChange) {
            this.props.onChange();
        }
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    raiseOnPropertyChanged(previousValue: Color4) {
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

    updateStateA(value: number) {
        this._localChange = true;

        const store = this.state.color.clone();
        this.props.target[this.props.propertyName].a = value;
        this.state.color.a = value;
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
                        <ColorPickerLineComponent globalState={this.props.globalState} value={this.state.color} onColorChanged={color => {
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
                        <NumericInputComponent globalState={this.props.globalState} label="a" value={this.state.color.a} onChange={(value) => this.updateStateA(value)} />
                    </div>
                }
            </div>
        );
    }
}
