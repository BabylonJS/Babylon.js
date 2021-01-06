import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { GlobalState } from '../globalState';

interface IFloatLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onChange?: (newValue: number) => void;
    isInteger?: boolean;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    additionalClass?: string;
    step?: string;
    digits?: number;
    globalState: GlobalState;
    min?: number
    max?: number
    smallUI?: boolean;
    onEnter?: (newValue:number) => void;
}

export class FloatLineComponent extends React.Component<IFloatLineComponentProps, { value: string }> {
    private _localChange = false;
    private _store: number;
    private _regExp: RegExp;
    private _digits: number;
    constructor(props: IFloatLineComponentProps) {
        super(props);
        let currentValue = this.props.target[this.props.propertyName];
        
        this._digits == this.props.digits == undefined ? 2 : this.props.digits;
    
        this.state = { value: currentValue ? (this.props.isInteger ? currentValue.toFixed(0) : currentValue.toFixed(this._digits)) : "0" };
        this._store = currentValue;

        let rexp = "(.*\\.";
        let numDigits = this._digits;
        while (numDigits--) {
            rexp += ".";
        }
        rexp += ").+";

        this._regExp = new RegExp(rexp);
    }

    shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.target[nextProps.propertyName];
        const newValueString = newValue ? this.props.isInteger ? newValue.toFixed(0) : newValue.toFixed(this._digits) : "0";

        if (newValueString !== nextState.value) {
            nextState.value = newValueString;
            return true;
        }
        return false;
    }

    raiseOnPropertyChanged(newValue: number, previousValue: number) {
        if (this.props.onChange) {
            this.props.onChange(newValue);
        }

        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: newValue,
            initialValue: previousValue
        });
    }

    updateValue(valueString: string) {
        if (/[^0-9\.\-]/g.test(valueString)) {
            return;
        }

        valueString = valueString.replace(this._regExp, "$1");

        let valueAsNumber: number;

        if (this.props.isInteger) {
            valueAsNumber = parseInt(valueString);
        } else {
            valueAsNumber = parseFloat(valueString);
        }

        this._localChange = true;
        this.setState({ value: valueString});

        if (isNaN(valueAsNumber)) {
            return;
        }
        if(this.props.max != undefined && (valueAsNumber > this.props.max)) {
            valueAsNumber = this.props.max;
        }
        if(this.props.min != undefined && (valueAsNumber < this.props.min)) {
            valueAsNumber = this.props.min;
        }

        this.props.target[this.props.propertyName] = valueAsNumber;
        this.raiseOnPropertyChanged(valueAsNumber, this._store);

        this._store = valueAsNumber;
    }

    render() {
        let className = this.props.smallUI ? "short": "value";

        return (
            <div>
                {
                    <div className={this.props.additionalClass ? this.props.additionalClass + " floatLine" : "floatLine"}>
                        <div className="label">
                            {this.props.label}
                        </div>
                        <div className={className}>
                            <input type="number" step={this.props.step || "0.01"} className="numeric-input"
                            onBlur={(evt) => {
                                this.props.globalState.blockKeyboardEvents = false;
                                if(this.props.onEnter) {
                                    this.props.onEnter(this._store);
                                }
                            }}
                            onKeyDown={evt => {
                                if (evt.keyCode !== 13) {
                                    return;
                                }
                                if(this.props.onEnter) {
                                    this.props.onEnter(this._store);
                                }
                            }}
                            onFocus={() => this.props.globalState.blockKeyboardEvents = true}
                            value={this.state.value} onChange={(evt) => this.updateValue(evt.target.value)} />
                        </div>
                    </div>
                }
            </div>
        );
    }
}
