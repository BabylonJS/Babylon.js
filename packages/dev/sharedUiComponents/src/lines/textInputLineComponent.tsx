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
    validator?: (input: string) => boolean;
    onValidateChangeFailed?: (invalidInput: string) => void;
    multilines?: boolean;
    throttlePropertyChangedNotification?: boolean;
    throttlePropertyChangedNotificationDelay?: number;
    disabled?: boolean;
}

interface ITextInputLineComponentState {
    input: string;
    dragging: boolean;
    inputValid: boolean;
}

let throttleTimerId = -1;

export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, ITextInputLineComponentState> {
    private _localChange = false;

    constructor(props: ITextInputLineComponentProps) {
        super(props);

        const emptyValue = this.props.numeric ? "0" : "";

        this.state = {
            input: (this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!]) || emptyValue,
            dragging: false,
            inputValid: true,
        };
    }

    override componentWillUnmount() {
        this.updateValue(undefined, false);
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    override shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: ITextInputLineComponentState) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.value !== undefined ? nextProps.value : nextProps.target[nextProps.propertyName!];
        if (newValue !== nextState.input) {
            nextState.input = newValue || "";
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

    updateInput(input: string) {
        if (this.props.disabled) {
            return;
        }
        if (this.props.numbersOnly) {
            if (/[^0-9.px%-]/g.test(input)) {
                return;
            }
        }

        this._localChange = true;
        this.setState({
            input,
            inputValid: this.props.validator ? this.props.validator(input) : true,
        });
    }

    updateValue(adjustedInput?: string, updateState: boolean = true) {
        let value = adjustedInput ?? this.state.input;

        if (this.props.numbersOnly) {
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

        const store = this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!];

        if (updateState) {
            this._localChange = true;
            this.setState({ input: value });
        }

        if (this.props.validator && this.props.validator(value) == false && this.props.onValidateChangeFailed) {
            this.props.onValidateChangeFailed(value);
            return;
        }

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
        const currentValue = this.getCurrentNumericValue(this.state.input);
        this.updateValue((currentValue + amount).toFixed(2));
    }

    onKeyDown(event: React.KeyboardEvent) {
        if (!this.props.disabled) {
            if (event.key === "Enter") {
                this.updateValue();
            }
            if (this.props.arrows) {
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
    }

    override render() {
        const value = this.state.input === conflictingValuesPlaceholder ? "" : this.state.input;
        const placeholder = this.state.input === conflictingValuesPlaceholder ? conflictingValuesPlaceholder : this.props.placeholder || "";
        const step = this.props.step || (this.props.roundValues ? 1 : 0.01);
        const className = this.props.multilines ? "textInputArea" : this.props.unit !== undefined ? "textInputLine withUnits" : "textInputLine";
        const style = { background: this.state.inputValid ? undefined : "lightpink" };
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
                            style={style}
                            value={this.state.input}
                            onFocus={() => {
                                if (this.props.lockObject) {
                                    this.props.lockObject.lock = true;
                                }
                            }}
                            onChange={(evt) => this.updateInput(evt.target.value)}
                            onBlur={(evt) => {
                                this.updateValue();
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
                            style={style}
                            value={value}
                            onBlur={(evt) => {
                                if (this.props.lockObject) {
                                    this.props.lockObject.lock = false;
                                }
                                this.updateValue();
                            }}
                            onFocus={() => {
                                if (this.props.lockObject) {
                                    this.props.lockObject.lock = true;
                                }
                            }}
                            onChange={(evt) => this.updateInput(evt.target.value)}
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
