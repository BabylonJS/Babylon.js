import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";

interface IFloatLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    lockObject?: LockObject;
    onChange?: (newValue: number) => void;
    isInteger?: boolean;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    additionalClass?: string;
}

export class FloatLineComponent extends React.Component<IFloatLineComponentProps, { value: string }> {
    private _localChange = false;
    private _store: number;

    constructor(props: IFloatLineComponentProps) {
        super(props);

        let currentValue = this.props.target[this.props.propertyName];
        this.state = { value: currentValue ? (this.props.isInteger ? currentValue.toFixed(0) : currentValue.toFixed(3)) : "0" };
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
        const newValueString = newValue ? this.props.isInteger ? newValue.toFixed(0) : newValue.toFixed(3) : "0";

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

        let valueAsNumber: number;

        if (this.props.isInteger) {
            valueAsNumber = parseInt(valueString);
        } else {
            valueAsNumber = parseFloat(valueString);
        }

        this._localChange = true;
        this.setState({ value: valueString });

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.raiseOnPropertyChanged(valueAsNumber, this._store);
        this.props.target[this.props.propertyName] = valueAsNumber;

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
        return (
            <div className={this.props.additionalClass ? this.props.additionalClass + " floatLine" : "floatLine"}>
                <div className="label">
                    {this.props.label}
                </div>
                <div className="value">
                    <input type="number" step="0.01" className="numeric-input" value={this.state.value} onBlur={() => this.unlock()} onFocus={() => this.lock()} onChange={evt => this.updateValue(evt.target.value)} />
                </div>
            </div>
        );
    }
}
