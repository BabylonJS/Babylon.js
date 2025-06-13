/* eslint-disable jsdoc/require-jsdoc */
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { InputArrowsComponent } from "shared-ui-components/lines/inputArrowsComponent.js";
import * as react from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";

export const ConflictingValuesPlaceholder = "—";

type LazyTextInputLineComponentProps = {
    // The unique key for the component. Used to control re-renders.
    key: react.Key;
    // The target object to set the property on
    target: any;
    // The property name to set on the target object
    propertyName: string;
    // Callback to run side effects when the value changes.
    onSubmit?: () => void;
    // Observable to help run side effects when the value changes.
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    noDirectUpdate?: boolean;
    label?: string;
    lockObject?: LockObject;
    icon?: string;
    iconLabel?: string;
    noUnderline?: boolean;
    numbersOnly?: boolean;
    arrows?: boolean;
    arrowsIncrement?: (amount: number) => void;
    step?: number;
    numeric?: boolean;
    roundValues?: boolean;
    min?: number;
    max?: number;
    placeholder?: string;
    unit?: React.ReactNode;
    // Function to extract the value for target[propertyName] from the input. If this throws, the input is considered invalid.
    extractValue?: (input: string) => any;
    // Function to format the initial target[propertyName] before displaying it in the input.
    formatValue?: (input: any) => string;
    // Callback to handle the side effects of an invalid input
    onExtractValueFailed?: (invalidInput: string) => void;
    multilines?: boolean;
    disabled?: boolean;
};

interface ILazyTextInputLineComponentState {
    input: string;
    originalInput: string;
    dragging: boolean;
    inputValid: boolean;
}

function GetCurrentNumericValue(value: string, props: LazyTextInputLineComponentProps) {
    const numeric = parseFloat(value);
    if (!isNaN(numeric)) {
        return numeric;
    }
    if (props.placeholder !== undefined) {
        const placeholderNumeric = parseFloat(props.placeholder);
        if (!isNaN(placeholderNumeric)) {
            return placeholderNumeric;
        }
    }
    return 0;
}

function FormatValue(value: string, props: LazyTextInputLineComponentProps) {
    if (props.numbersOnly) {
        if (!value) {
            value = "0";
        }

        //Removing starting zero if there is a number of a minus after it.
        if (value.search(/0+[0-9-]/g) === 0) {
            value = value.substring(1);
        }
    }

    if (props.numeric) {
        let numericValue = GetCurrentNumericValue(value, props);
        if (props.roundValues) {
            numericValue = Math.round(numericValue);
        }
        if (props.min !== undefined) {
            numericValue = Math.max(props.min, numericValue);
        }
        if (props.max !== undefined) {
            numericValue = Math.min(props.max, numericValue);
        }
        value = numericValue.toString();
    }
    return value;
}

/**
 * Used to allow the user to input text without updating the source on every keystroke.
 */
export class LazyTextInputLineComponent extends react.Component<LazyTextInputLineComponentProps, ILazyTextInputLineComponentState> {
    private _localChange = false;
    private _lastInvalidSubmission: string | undefined;

    // eslint-disable-next-line babylonjs/available
    constructor(props: LazyTextInputLineComponentProps) {
        super(props);

        const originalInput = this._getInputValue(props);
        this.state = {
            input: originalInput,
            originalInput,
            dragging: false,
            inputValid: true,
        };
    }

    private _getInputValue = (props: LazyTextInputLineComponentProps): string => {
        const emptyValue = props.numeric ? "0" : "";
        const value = props.target[props.propertyName];
        return props.formatValue?.(value) ?? value ?? emptyValue;
    };

    // eslint-disable-next-line babylonjs/available
    override shouldComponentUpdate(nextProps: LazyTextInputLineComponentProps, nextState: { input: string; originalInput: string; dragging: boolean }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = this._getInputValue(nextProps);
        if (newValue !== nextState.originalInput) {
            nextState.originalInput = newValue;
            nextState.input = newValue;
            return true;
        }

        if (nextState.dragging != this.state.dragging) {
            return true;
        }

        return false;
    }

    private _validateInput = (value: string) => {
        if (this.props.extractValue) {
            try {
                this.props.extractValue(value);
            } catch {
                return false;
            }
        }
        return true;
    };

    private _onSubmit = (value: string) => {
        value = FormatValue(value, this.props);

        if (this._validateInput(value) === false) {
            if (this.props.onExtractValueFailed && this._lastInvalidSubmission !== value) {
                this.props.onExtractValueFailed(value);
            }
            this._lastInvalidSubmission = value;
            return;
        }

        const valueToSet = this.props.extractValue ? this.props.extractValue(value) : value;
        const initialValue = this.props.target[this.props.propertyName];
        this.props.target[this.props.propertyName] = valueToSet;
        this.props.onSubmit?.();

        this.setState({
            originalInput: valueToSet,
        });

        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName,
                initialValue,
                value: valueToSet,
            });
        }
    };

    private _setInput = (input: string) => {
        if (this.props.disabled) {
            return;
        }
        if (this.props.numbersOnly) {
            if (/[^0-9.px%-]/g.test(input)) {
                return;
            }
        }

        this.setState({
            input,
            inputValid: this._validateInput(input),
        });
    };

    private _setDragging = (dragging: boolean) => {
        this.setState({ dragging });
    };

    private _incrementValue = (amount: number) => {
        if (this.props.step) {
            amount *= this.props.step;
        }
        if (this.props.arrowsIncrement) {
            this.props.arrowsIncrement(amount);
        }
        const currentValue = GetCurrentNumericValue(this.state.input, this.props);
        const newValue = (currentValue + amount).toFixed(2);

        this._setInput(newValue);

        if (!this.props.arrowsIncrement) {
            this._onSubmit(newValue);
        }
    };

    private _onChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        this._localChange = true;
        this._setInput(event.target.value);
    };

    private _onKeyDown = (event: React.KeyboardEvent) => {
        if (!this.props.disabled) {
            if (event.key === "Enter") {
                this._onSubmit(this.state.input);
            }
            if (this.props.arrows) {
                if (event.key === "ArrowUp") {
                    this._incrementValue(1);
                    event.preventDefault();
                }
                if (event.key === "ArrowDown") {
                    this._incrementValue(-1);
                    event.preventDefault();
                }
            }
        }
    };

    private _onBlur = () => {
        this._onSubmit(this.state.input);
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    };

    private _onFocus = () => {
        if (this.props.lockObject) {
            this.props.lockObject.lock = true;
        }
    };

    /**
     * If this component is unmounted while editing, ensure we submit the value.
     */
    override componentWillUnmount() {
        this._onBlur();
    }

    /**
     * Draw the component.
     * @returns the component's JSX element
     */
    override render() {
        const value = this.state.input === ConflictingValuesPlaceholder ? "" : this.state.input;
        const placeholder = this.state.input === ConflictingValuesPlaceholder ? ConflictingValuesPlaceholder : this.props.placeholder || "";
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
                            onBlur={this._onBlur}
                            onFocus={this._onFocus}
                            onChange={this._onChange}
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
                            onBlur={this._onBlur}
                            onFocus={this._onFocus}
                            onChange={this._onChange}
                            onKeyDown={this._onKeyDown}
                            placeholder={placeholder}
                            type={this.props.numeric ? "number" : "text"}
                            step={step}
                            disabled={this.props.disabled}
                        />
                        {this.props.arrows && <InputArrowsComponent incrementValue={this._incrementValue} setDragging={this._setDragging} />}
                    </div>
                )}
                {this.props.unit}
            </div>
        );
    }
}
