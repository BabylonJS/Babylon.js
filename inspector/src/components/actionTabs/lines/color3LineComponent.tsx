import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { NumericInputComponent } from "./numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Color3 } from 'babylonjs/Maths/math.color';
import { ColorPickerLineComponent } from './colorPickerComponent';

const copyIcon: string = require("./copy.svg");

export interface IColor3LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    isLinear?: boolean;
}

export class Color3LineComponent extends React.Component<IColor3LineComponentProps, { isExpanded: boolean, color: Color3 }> {
    private _localChange = false;
    constructor(props: IColor3LineComponentProps) {
        super(props);

        this.state = { isExpanded: false, color: this.props.target[this.props.propertyName].clone() };

        if (props.isLinear) {
            this.state.color.toGammaSpaceToRef(this.state.color);
        }

        props.target._isLinearColor = props.isLinear; // so that replayRecorder can append toLinearSpace() as appropriate
    }

    shouldComponentUpdate(nextProps: IColor3LineComponentProps, nextState: { color: Color3 }) {
        const currentState = this.props.isLinear ? nextProps.target[nextProps.propertyName].toGammaSpace() : nextProps.target[nextProps.propertyName];

        if (!currentState.equals(nextState.color) || this._localChange) {
            nextState.color = currentState.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    setPropertyValue(newColor: Color3) {
        this.props.target[this.props.propertyName] = newColor;

        if (this.props.isLinear) {
            this.props.target[this.props.propertyName] = newColor.toLinearSpace();
        }
    }

    onChange(newValue: string) {
        this._localChange = true;
        const newColor = Color3.FromHexString(newValue);

        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName,
                value: newColor,
                initialValue: this.state.color,
            });
        }

        this.setPropertyValue(newColor);

        this.setState({ color: newColor });
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    raiseOnPropertyChanged(previousValue: Color3) {
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

        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;

        return (
            <div className="color3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="color3">
                        <ColorPickerLineComponent value={this.state.color} disableAlpha={true} onColorChanged={color => {
                            this.onChange(color);
                        }} />                             
                    </div>
                    <div className="copy hoverIcon" onClick={() => this.copyToClipboard()} title="Copy to clipboard">
                        <img src={copyIcon} alt=""/>
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
