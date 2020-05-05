import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "./propertyChangedEvent";

class ListLineOption {
    public label: string;
    public value: number | string;
}

interface IOptionsLineComponentProps {
    label: string,
    target: any,
    className?: string,
    propertyName?: string,
    options: ListLineOption[],
    noDirectUpdate?: boolean,
    onSelect?: (value: number | string) => void,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>,
    valuesAreStrings?: boolean
    defaultIfNull?: number,
    getSelection?: (target: any) => number;
}

export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, { value: number | string }> {
    private _localChange = false;

    private _getValue(props: IOptionsLineComponentProps) {
        if (props.getSelection) {
            return props.getSelection(props.target);
        }
        return (props.target && props.propertyName) ? props.target[props.propertyName] : props.options[props.defaultIfNull || 0];
    }

    constructor(props: IOptionsLineComponentProps) {
        super(props);

        this.state = { value: this._getValue(props) };
    }

    setValue(value: string | number) {
        this.setState({ value: value });
    }

    shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: { value: number }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = this._getValue(nextProps);
        if (newValue != null && newValue !== nextState.value) {
            nextState.value = newValue;
            return true;
        }
        return false;
    }

    raiseOnPropertyChanged(newValue: number | string, previousValue: number | string) {
        if (!this.props.onPropertyChangedObservable) {
            return;
        }

        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName!,
            value: newValue,
            initialValue: previousValue
        });
    }

    updateValue(valueString: string) {
        const value = this.props.valuesAreStrings ? valueString : parseInt(valueString);
        this._localChange = true;

        const store = this.state.value;
        if (!this.props.noDirectUpdate) {
            this.props.target[this.props.propertyName!] = value;
        }
        this.setState({ value: value });

        this.raiseOnPropertyChanged(value, store);

        if (this.props.onSelect) {
            this.props.onSelect(value);
        }
    }

    render() {
        return (
            <div className="listLine">
                <div className="label">
                    {this.props.label}

                </div>
                <div className={"options" + (this.props.className ? " " + this.props.className : "")}>
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
