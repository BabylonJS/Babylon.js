import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { IInspectableOptions } from "babylonjs/Misc/iInspectable";

export const Null_Value = Number.MAX_SAFE_INTEGER;

export interface IOptionsLineComponentProps {
    label: string;
    targets: any[];
    propertyName: string;
    options: IInspectableOptions[];
    noDirectUpdate?: boolean;
    onSelect?: (value: number) => void;
    extractValue?: () => number;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    allowNullValue?: boolean;
    icon?: string;
    iconLabel?: string;
    conflictingPlaceholderLabel?: string;
}

export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, { value: number }> {
    private _localChange = false;

    private remapValueIn(value: number | null): number {
        return this.props.allowNullValue && value === null ? Null_Value : value!;
    }

    private remapValueOut(value: number): number | null {
        return this.props.allowNullValue && value === Null_Value ? null : value;
    }

    getValue(props?: IOptionsLineComponentProps) {
        if (!props) props = this.props;
        if (this.props.extractValue) return this.props.extractValue();
        if (props.targets.length === 0) return props.conflictingPlaceholderLabel || "";
        const firstValue = props.targets[0][props.propertyName];
        for(const target of props.targets) {
            if (target[props.propertyName] !== firstValue) {
                return props.conflictingPlaceholderLabel || "";
            }
        }
        return firstValue;
    }

    constructor(props: IOptionsLineComponentProps) {
        super(props);

        this.state = { value: this.remapValueIn(this.getValue()) };
    }

    shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: { value: number }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        let newValue = this.remapValueIn(this.getValue(nextProps));
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

        for (const target of this.props.targets) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: target,
                property: this.props.propertyName,
                value: newValue,
                initialValue: previousValue,
                allowNullValue: this.props.allowNullValue,
            });
        }
    }

    updateValue(valueString: string) {
        const value = parseInt(valueString);
        this._localChange = true;

        const store = this.getValue();

        if (!this.props.noDirectUpdate) {
            for(const target of this.props.targets) {
                target[this.props.propertyName] = this.remapValueOut(value);
            }
        }
        this.setState({ value: value });

        if (this.props.onSelect) {
            this.props.onSelect(value);
        }

        const newValue = this.getValue();

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
