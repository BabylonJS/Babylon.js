import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";
import { SliderLineComponent } from './sliderLineComponent';
import { Tools } from 'babylonjs/Misc/tools';

interface IFloatLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    lockObject?: LockObject;
    onChange?: (newValue: number) => void;
    isInteger?: boolean;
    replaySourceReplacement?: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    additionalClass?: string;
    step?: string,
    digits?: number;
    useEuler?: boolean;
    min?: number
}

export class FloatLineComponent extends React.Component<IFloatLineComponentProps, { value: string }> {
    private _localChange = false;
    private _store: number;

    constructor(props: IFloatLineComponentProps) {
        super(props);

        let currentValue = this.props.target[this.props.propertyName];
        this.state = { value: currentValue ? (this.props.isInteger ? currentValue.toFixed(0) : currentValue.toFixed(this.props.digits || 3)) : "0" };
        this._store = currentValue;
    }

    componentWillUnmount() {
        this.unlock();
    }

    shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.target[nextProps.propertyName];
        const newValueString = newValue ? this.props.isInteger ? newValue.toFixed(0) : newValue.toFixed(this.props.digits || 3) : "0";

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
            object: this.props.replaySourceReplacement ?? this.props.target,
            property: this.props.propertyName,
            value: newValue,
            initialValue: previousValue
        });
    }

    updateValue(valueString: string) {

        if (/[^0-9\.\-]/g.test(valueString)) {
            return;
        }

        let valueAsNumber: number;

        if (this.props.isInteger) {
            valueAsNumber = parseInt(valueString);
        } else {
            valueAsNumber = parseFloat(valueString);
        }

        if (!isNaN(valueAsNumber) && this.props.min !== undefined) {
            if (valueAsNumber < this.props.min) {
                valueAsNumber = this.props.min;
                valueString = valueAsNumber.toString();
            }            
        }

        this._localChange = true;
        this.setState({ value: valueString });

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.props.target[this.props.propertyName] = valueAsNumber;
        this.raiseOnPropertyChanged(valueAsNumber, this._store);

        this._store = valueAsNumber;
    }

    lock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = true;
        }
    }

    unlock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    render() {
        let valueAsNumber: number;

        if (this.props.isInteger) {
            valueAsNumber = parseInt(this.state.value);
        } else {
            valueAsNumber = parseFloat(this.state.value);
        }

        return (
            <div>
                {
                    !this.props.useEuler &&
                    <div className={this.props.additionalClass ? this.props.additionalClass + " floatLine" : "floatLine"}>
                        <div className="label">
                            {this.props.label}
                        </div>
                        <div className="value">
                            <input type="number" step={this.props.step || this.props.isInteger ? "1" : "0.01"} className="numeric-input" value={this.state.value} onBlur={() => this.unlock()} onFocus={() => this.lock()} onChange={evt => this.updateValue(evt.target.value)} />
                        </div>
                    </div>
                }
                {
                    this.props.useEuler &&
                    <SliderLineComponent label={this.props.label} minimum={0} maximum={360} step={0.1} directValue={Tools.ToDegrees(valueAsNumber)} onChange={value => this.updateValue(Tools.ToRadians(value).toString())} />
                }
            </div>
        );
    }
}
