import * as React from "react";
import type { LockObject } from "../tabs/propertyGrids/lockObject";

interface INumericInputProps {
    label: string;
    labelTooltip?: string;
    value: number;
    step?: number;
    onChange: (value: number) => void;
    precision?: number;
    icon?: string;
    iconLabel?: string;
    lockObject: LockObject;
}

export class NumericInput extends React.Component<INumericInputProps, { value: string }> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static defaultProps = {
        step: 1,
    };

    private _localChange = false;
    constructor(props: INumericInputProps) {
        super(props);

        this.state = { value: this.props.value.toFixed(this.props.precision !== undefined ? this.props.precision : 3) };
    }

    override componentWillUnmount() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    override shouldComponentUpdate(nextProps: INumericInputProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        if (nextProps.value.toString() !== nextState.value) {
            nextState.value = nextProps.value.toFixed(this.props.precision !== undefined ? this.props.precision : 3);
            return true;
        }
        return false;
    }

    updateValue(valueString: string) {
        if (/[^0-9.-]/g.test(valueString)) {
            return;
        }

        const valueAsNumber = parseFloat(valueString);

        this._localChange = true;
        this.setState({ value: valueString });

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.props.onChange(valueAsNumber);
    }

    onBlur() {
        this._localChange = false;
        const valueAsNumber = parseFloat(this.state.value);

        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }

        if (isNaN(valueAsNumber)) {
            this.props.onChange(this.props.value);
            return;
        }

        this.props.onChange(valueAsNumber);
    }

    incrementValue(amount: number) {
        let currentValue = parseFloat(this.state.value);
        if (isNaN(currentValue)) {
            currentValue = 0;
        }
        this.updateValue((currentValue + amount).toFixed(this.props.precision !== undefined ? this.props.precision : 3));
    }

    onKeyDown(evt: React.KeyboardEvent<HTMLInputElement>) {
        const step = this.props.step || 1;
        const handleArrowKey = (sign: number) => {
            if (evt.shiftKey) {
                sign *= 10;
                if (evt.ctrlKey || evt.metaKey) {
                    sign *= 10;
                }
            }

            this.incrementValue(sign * step);
            evt.preventDefault();
        };

        if (evt.key === "ArrowUp") {
            handleArrowKey(1);
        } else if (evt.key === "ArrowDown") {
            handleArrowKey(-1);
        }
    }

    override render() {
        return (
            <div className="numeric">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                {this.props.label && (
                    <div className="numeric-label" title={this.props.labelTooltip ?? this.props.label}>
                        {`${this.props.label}: `}
                    </div>
                )}
                <input
                    type="number"
                    step={this.props.step}
                    className="numeric-input"
                    value={this.state.value}
                    onChange={(evt) => this.updateValue(evt.target.value)}
                    onKeyDown={(evt) => this.onKeyDown(evt)}
                    onFocus={() => {
                        if (this.props.lockObject) {
                            this.props.lockObject.lock = true;
                        }
                    }}
                    onBlur={() => this.onBlur()}
                />
            </div>
        );
    }
}
