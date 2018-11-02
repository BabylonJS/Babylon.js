import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../propertyChangedEvent";

interface IFloatLineComponentProps {
    label: string,
    target: any,
    propertyName: string,
    step?: number,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class FloatLineComponent extends React.Component<IFloatLineComponentProps, { value: number }> {
    private _localChange = false;

    constructor(props: IFloatLineComponentProps) {
        super(props);

        this.state = { value: this.props.target[this.props.propertyName] }
    }

    shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: { value: number }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.target[nextProps.propertyName];
        if (newValue !== nextState.value) {
            nextState.value = newValue;
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
        const value = parseFloat(valueString);
        this._localChange = true;

        const store = this.state.value;
        this.props.target[this.props.propertyName] = value;
        this.setState({ value: value });

        this.raiseOnPropertyChanged(value, store);
    }

    render() {

        const step = this.props.step !== undefined ? this.props.step : 0.1;
        return (
            <div className="floatLine">
                <div className="label">
                    {this.props.label}
                </div>
                <div className="value">
                    <input className="numeric-input" value={this.state.value ? parseFloat(this.state.value.toFixed(3)) : 0} type="number" onChange={evt => this.updateValue(evt.target.value)} step={step} />
                </div>
            </div>
        );
    }
}
