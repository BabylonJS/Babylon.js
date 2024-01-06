import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../propertyChangedEvent";
import type { LockObject } from "../tabs/propertyGrids/lockObject";
import { conflictingValuesPlaceholder } from "./targetsProxy";
import { InputArrowsComponent } from "./inputArrowsComponent";

export interface ITextInputLineComponentProps {
    label?: string;
    lockObject?: LockObject;
    target?: any;
    propertyName?: string;
    value?: string;
    onChange?: (value: string) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    icon?: string;
    iconLabel?: string;
    noUnderline?: boolean;
    numbersOnly?: boolean;
    delayInput?: boolean;
    arrows?: boolean;
    arrowsIncrement?: (amount: number) => void;
    step?: number;
    numeric?: boolean;
    roundValues?: boolean;
    min?: number;
    max?: number;
    placeholder?: string;
    unit?: React.ReactNode;
    validator?: (value: string) => boolean;
    multilines?: boolean;
    throttlePropertyChangedNotification?: boolean;
    throttlePropertyChangedNotificationDelay?: number;
    disabled?: boolean;
}

let throttleTimerId = -1;

export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, { value: string; dragging: boolean }> {
    private _localChange = false;

    constructor(props: ITextInputLineComponentProps) {
        super(props);

        const emptyValue = this.props.numeric ? "0" : "";

        this.state = {
            value: (this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!]) || emptyValue,
            dragging: false,
        };
    }

    componentWillUnmount() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: { value: string; dragging: boolean }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.value !== undefined ? nextProps.value : nextProps.target[nextProps.propertyName!];
        if (newValue !== nextState.value) {
            nextState.value = newValue || "";
            return true;
        }

        if (nextState.dragging != this.state.dragging || nextProps.unit !== this.props.unit) {
            return true;
        }

        return false;
    }

    raiseOnPropertyChanged(newValue: string, previousValue: string) {
        if (this.props.onChange) {
            this.props.onChange(newValue);
            return;
        }

        if (!this.props.onPropertyChangedObservable) {
            return;
        }

        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName!,
            value: newValue,
            initialValue: previousValue,
        });
    }

    getCurrentNumericValue(value: string) {
        const numeric = parseFloat(value);
        if (!isNaN(numeric)) {
            return numeric;
        }
        if (this.props.placeholder !== undefined) {
            const placeholderNumeric = parseFloat(this.props.placeholder);
            if (!isNaN(placeholderNumeric)) {
                return placeholderNumeric;
            }
        }
        return 0;
    }

    updateValue(value: string, valueToValidate?: string) {
        if (this.props.disabled) {
            return;
        }
        if (this.props.numbersOnly) {
            if (/[^0-9.px%-]/g.test(value)) {
                return;
            }
            if (!value) {
                value = "0";
            }

            //Removing starting zero if there is a number of a minus after it.
            if (value.search(/0+[0-9-]/g) === 0) {
                value = value.substring(1);
            }
        }

        if (this.props.numeric) {
            let numericValue = this.getCurrentNumericValue(value);
            if (this.props.roundValues) {
                numericValue = Math.round(numericValue);
            }
            if (this.props.min !== undefined) {
                numericValue = Math.max(this.props.min, numericValue);
            }
            if (this.props.max !== undefined) {
                numericValue = Math.min(this.props.max, numericValue);
            }
            value = numericValue.toString();
        }

        this._localChange = true;
        const store = this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!];

        if (this.props.validator && valueToValidate) {
            if (this.props.validator(valueToValidate) == false) {
                value = store;
            }
        }

        this.setState({ value: value });

        if (this.props.propertyName && !this.props.delayInput) {
            this.props.target[this.props.propertyName] = value;
        }

        if (this.props.throttlePropertyChangedNotification) {
            if (throttleTimerId >= 0) {
                window.clearTimeout(throttleTimerId);
            }
            throttleTimerId = window.setTimeout(() => {
                this.raiseOnPropertyChanged(value, store);
            }, this.props.throttlePropertyChangedNotificationDelay ?? 200);
        } else {
            this.raiseOnPropertyChanged(value, store);
        }
    }

    incrementValue(amount: number) {
        if (this.props.step) {
            amount *= this.props.step;
        }
        if (this.props.arrowsIncrement) {
            this.props.arrowsIncrement(amount);
            return;
        }
        const currentValue = this.getCurrentNumericValue(this.state.value);
        this.updateValue((currentValue + amount).toFixed(2));
    }

    onKeyDown(event: React.KeyboardEvent) {
        if (!this.props.disabled && this.props.arrows) {
            if (event.key === "ArrowUp") {
                this.incrementValue(1);
                event.preventDefault();
            }
            if (event.key === "ArrowDown") {
                this.incrementValue(-1);
                event.preventDefault();
            }
        }
    }

    render() {
        const value = this.state.value === conflictingValuesPlaceholder ? "" : this.state.value;
        const placeholder = this.state.value === conflictingValuesPlaceholder ? conflictingValuesPlaceholder : this.props.placeholder || "";
        const step = this.props.step || (this.props.roundValues ? 1 : 0.01);
        const className = this.props.multilines ? "textInputArea" : this.props.unit !== undefined ? "textInputLine withUnits" : "textInputLine";
        return (
            <div className={className}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                {this.props.label !== undefined && (
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                )}
                {this.props.multilines && (
                    <>
                        <textarea
                            className={this.props.disabled ? "disabled" : ""}
                            value={this.state.value}
                            onFocus={() => {
                                if (this.props.lockObject) {
                                    this.props.lockObject.lock = true;
                                }
                            }}
                            onChange={(evt) => this.updateValue(evt.target.value)}
                            onKeyDown={(evt) => {
                                if (evt.keyCode !== 13) {
                                    return;
                                }
                                this.updateValue(this.state.value);
                            }}
                            onBlur={(evt) => {
                                this.updateValue(evt.target.value, evt.target.value);
                                if (this.props.lockObject) {
                                    this.props.lockObject.lock = false;
                                }
                            }}
                            disabled={this.props.disabled}
                        />
                    </>
                )}
                {!this.props.multilines && (
                    <div
                        className={`value${this.props.noUnderline === true ? " noUnderline" : ""}${this.props.arrows ? " hasArrows" : ""}${this.state.dragging ? " dragging" : ""}`}
                    >
                        <input
                            className={this.props.disabled ? "disabled" : ""}
                            value={value}
                            onBlur={(evt) => {
                                if (this.props.lockObject) {
                                    this.props.lockObject.lock = false;
                                }
                                this.updateValue((this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!]) || "", evt.target.value);
                            }}
                            onFocus={() => {
                                if (this.props.lockObject) {
                                    this.props.lockObject.lock = true;
                                }
                            }}
                            onChange={(evt) => this.updateValue(evt.target.value)}
                            onKeyDown={(evt) => this.onKeyDown(evt)}
                            placeholder={placeholder}
                            type={this.props.numeric ? "number" : "text"}
                            step={step}
                            disabled={this.props.disabled}
                        />
                        {this.props.arrows && (
                            <InputArrowsComponent incrementValue={(amount) => this.incrementValue(amount)} setDragging={(dragging) => this.setState({ dragging })} />
                        )}
                    </div>
                )}
                {this.props.unit}
            </div>
        );
    }
}
