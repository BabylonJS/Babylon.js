import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../propertyChangedEvent";
import type { IInspectableOptions } from "core/Misc/iInspectable";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Null_Value = Number.MAX_SAFE_INTEGER;

const DEFAULT_FALLBACK_VALUE = -1;

export interface IOptionsLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    options: IInspectableOptions[];
    addInput?: boolean;
    noDirectUpdate?: boolean;
    onSelect?: (value: number | string) => void;
    extractValue?: (target: any) => number | string;
    addVal?: (newVal: { label: string; value: number }, prevVal: number) => void;

    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    allowNullValue?: boolean;
    icon?: string;
    iconLabel?: string;
    className?: string;
    valuesAreStrings?: boolean;
    defaultIfNull?: number;
    fromFontDropdown?: boolean;
    valueProp?: number;
    fallbackValue?: number;
}

export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, { value: number | string; addCustom: boolean }> {
    private _localChange = false;
    private _remapValueIn(value: number | null): number {
        return this.props.allowNullValue && value === null ? Null_Value : value!;
    }

    private _remapValueOut(value: number): number | null {
        return this.props.allowNullValue && value === Null_Value ? null : value;
    }

    private _getValue(props: IOptionsLineComponentProps) {
        if (props.extractValue) {
            return props.extractValue(props.target);
        }
        return props.target && props.propertyName ? props.target[props.propertyName] : props.options[props.defaultIfNull || 0];
    }

    constructor(props: IOptionsLineComponentProps) {
        // Initialize default props
        super(props);

        this.state = { value: this._remapValueIn(this._getValue(props)), addCustom: false };
    }

    shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: { value: number; addCustom: boolean }) {
        if (this._localChange) {
            this._localChange = false;

            return true;
        }

        const newValue = this._remapValueIn(nextProps.extractValue ? nextProps.extractValue(nextProps.target) : nextProps.target[nextProps.propertyName]);

        if (newValue != null && newValue !== nextState.value) {
            nextState.value = newValue;

            return true;
        }

        if (this.props.options !== nextProps.options) {
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

    setValue(value: string | number) {
        this.setState({ value: value });
    }

    updateValue(valueString: string) {
        let value = this.props.valuesAreStrings ? valueString : parseInt(valueString);

        if (isNaN(Number(value))) {
            for (let i = 0; i < this.props.options.length; i++) {
                if (this.props.options.at(i)?.label === valueString) {
                    value = Number(this.props.options.at(i)?.value);
                }
            }
        }

        if (value === 0 && this.props.fromFontDropdown) {
            this.setState({ addCustom: true });
        }

        this._localChange = true;

        const store = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];

        if (!this.props.noDirectUpdate) {
            this.props.target[this.props.propertyName] = this._remapValueOut(value as number);
        }

        //selecting a regular option from font dropdown
        if (value != 0 && this.props.fromFontDropdown) {
            this.setState({ value: value });
            if (this.props.onSelect) {
                this.props.onSelect(value);
            }
            //selecting 'custom font' from font dropdown
        } else if (this.props.fromFontDropdown) {
            if (this.props.onSelect) {
                this.props.onSelect(this.state.value);
            }
        }
        //selecting from a dropdown that's not font dropdown
        else {
            this.setState({ value: value });
            if (this.props.onSelect) {
                this.props.onSelect(value);
            }
        }

        const newValue = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];

        this.raiseOnPropertyChanged(newValue, store);
    }

    updateCustomValue() {
        this.setState({ addCustom: false });
    }

    render() {
        const fallback = this.props.fallbackValue !== undefined ? this.props.fallbackValue : DEFAULT_FALLBACK_VALUE;
        return (
            <div className={`listLine ${this.props.className ?? ""}`}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                <div className="options">
                    {this.state.addCustom ? (
                        <input
                            type="text"
                            placeholder="Enter a custom font here"
                            onKeyDown={(event) => {
                                event.key === "Enter" && this.props.addVal != undefined
                                    ? (this.props.addVal({ label: (event.target as HTMLInputElement).value, value: this.props.options.length + 1 }, Number(this.state.value)),
                                      this.updateCustomValue(),
                                      this.forceUpdate())
                                    : null;
                            }}
                            onBlur={(event) => {
                                this.props.addVal != undefined
                                    ? (this.props.addVal({ label: (event.target as HTMLInputElement).value, value: this.props.options.length + 1 }, Number(this.state.value)),
                                      this.updateCustomValue(),
                                      this.forceUpdate())
                                    : null;
                            }}
                        />
                    ) : (
                        <select
                            onChange={(evt) => this.updateValue(evt.target.value)}
                            value={this.state.value === null || this.state.value === undefined ? fallback : this.state.value}
                        >
                            {this.props.options.map((option, i) => {
                                return (
                                    <option selected={option.selected} key={option.label + i} value={option.value} title={option.label}>
                                        {option.label}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                </div>
            </div>
        );
    }
}
