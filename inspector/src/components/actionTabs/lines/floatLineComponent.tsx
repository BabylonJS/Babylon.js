import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../propertyChangedEvent";

interface IFloatLineComponentProps {
    label: string,
    target: any,
    propertyName: string,
    step?: number,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>,
    additionalClass?: string
}

export class FloatLineComponent extends React.Component<IFloatLineComponentProps, { value: string }> {
    private _localChange = false;
    private _store: number;

    constructor(props: IFloatLineComponentProps) {
        super(props);

        let currentValue = this.props.target[this.props.propertyName];
        this.state = { value: currentValue ? currentValue.toFixed(3) : "0" }
        this._store = currentValue;
    }

    shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.target[nextProps.propertyName];
        if (newValue !== nextState.value) {
            nextState.value = newValue.toFixed(3);
            return true;
        }
        return false;
    }

    raiseOnPropertyChanged(newValue: number, previousValue: number) {
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

        let valueAsNumber = parseFloat(valueString);

        this._localChange = true;
        this.setState({ value: valueString });

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.raiseOnPropertyChanged(valueAsNumber, this._store);
        this.props.target[this.props.propertyName] = valueAsNumber;

        this._store = valueAsNumber;
    }

    render() {

        const step = this.props.step !== undefined ? this.props.step : 0.1;
        return (
            <div className={this.props.additionalClass ? this.props.additionalClass + " floatLine" : "floatLine"}>
                <div className="label">
                    {this.props.label}
                </div>
                <div className="value">
                    <input className="numeric-input" value={this.state.value} onChange={evt => this.updateValue(evt.target.value)} step={step} />
                </div>
            </div>
        );
    }
}
