import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../propertyChangedEvent";

class ListLineOption {
    public label: string;
    public value: number;
}

interface IOptionsLineComponentProps {
    label: string,
    target: any,
    propertyName: string,
    options: ListLineOption[],
    noDirectUpdate?: boolean,
    onSelect?: (value: number) => void,
    extractValue?: () => number,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, { value: number }> {
    private _localChange = false;

    constructor(props: IOptionsLineComponentProps) {
        super(props);

        this.state = { value: this.props.extractValue ? this.props.extractValue() : props.target[props.propertyName] };
    }

    shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: { value: number }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.extractValue ? nextProps.extractValue() : nextProps.target[nextProps.propertyName];
        if (newValue != null && newValue !== nextState.value) {
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
        const value = parseInt(valueString);
        this._localChange = true;

        const store = this.props.extractValue ? this.props.extractValue() : this.props.target[this.props.propertyName]

        if (!this.props.noDirectUpdate) {
            this.props.target[this.props.propertyName] = value;
        }
        this.setState({ value: value });
        
        if (this.props.onSelect) {
            this.props.onSelect(value);
        }

        const newValue = this.props.extractValue ? this.props.extractValue() : this.props.target[this.props.propertyName]

        this.raiseOnPropertyChanged(newValue, store);

    }

    render() {
        return (
            <div className="listLine">
                <div className="label">
                    {this.props.label}

                </div>
                <div className="options">
                    <select onChange={evt => this.updateValue(evt.target.value)} value={this.state.value ?? ""}>
                        {
                            this.props.options.map(option => {
                                return (
                                    <option key={option.label} value={option.value}>{option.label}</option>
                                )
                            })
                        }
                    </select>
                </div>
            </div>
        );
    }
}
