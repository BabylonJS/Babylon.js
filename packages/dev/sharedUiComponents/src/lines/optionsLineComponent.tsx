import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { IInspectableOptions } from "core/Misc/iInspectable";

export const Null_Value = Number.MAX_SAFE_INTEGER;

export interface IOptionsLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    options: IInspectableOptions[];
    noDirectUpdate?: boolean;
    onSelect?: (value: number) => void;
    extractValue?: () => number;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    allowNullValue?: boolean;
    icon?: string;
    iconLabel?: string;
}

export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, { value: number }> {
    private _localChange = false;

    private remapValueIn(value: number | null): number {
        return this.props.allowNullValue && value === null ? Null_Value : value!;
    }

    private remapValueOut(value: number): number | null {
        return this.props.allowNullValue && value === Null_Value ? null : value;
    }

    constructor(props: IOptionsLineComponentProps) {
        super(props);

        this.state = { value: this.remapValueIn(this.props.extractValue ? this.props.extractValue() : props.target[props.propertyName]) };
    }

    shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: { value: number }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = this.remapValueIn(nextProps.extractValue ? nextProps.extractValue() : nextProps.target[nextProps.propertyName]);
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
            initialValue: previousValue,
            allowNullValue: this.props.allowNullValue,
        });
    }

    updateValue(valueString: string) {
        const value = parseInt(valueString);
        this._localChange = true;

        const store = this.props.extractValue ? this.props.extractValue() : this.props.target[this.props.propertyName];

        if (!this.props.noDirectUpdate) {
            this.props.target[this.props.propertyName] = this.remapValueOut(value);
        }
        this.setState({ value: value });

        if (this.props.onSelect) {
            this.props.onSelect(value);
        }

        const newValue = this.props.extractValue ? this.props.extractValue() : this.props.target[this.props.propertyName];

        this.raiseOnPropertyChanged(newValue, store);
    }

    render() {
        return (
            <div className="listLine">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                <div className="options">
                    <select onChange={(evt) => this.updateValue(evt.target.value)} value={this.state.value ?? ""}>
                        {this.props.options.map((option, i) => {
                            return (
                                <option selected={option.selected} key={option.label + i} value={option.value} title={option.label}>
                                    {option.label}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        );
    }
}
