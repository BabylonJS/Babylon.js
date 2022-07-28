import * as React from "react";
import type { LockObject } from "../tabs/propertyGrids/lockObject";

interface INumericInputComponentProps {
    label: string;
    value: number;
    step?: number;
    onChange: (value: number) => void;
    precision?: number;
    icon?: string;
    iconLabel?: string;
    lockObject: LockObject;
}

export class NumericInputComponent extends React.Component<INumericInputComponentProps, { value: string }> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static defaultProps = {
        step: 1,
    };

    private _localChange = false;
    constructor(props: INumericInputComponentProps) {
        super(props);

        this.state = { value: this.props.value.toFixed(this.props.precision !== undefined ? this.props.precision : 3) };
    }

    componentWillUnmount() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    shouldComponentUpdate(nextProps: INumericInputComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            return true;
        }

        if (nextProps.value.toString() !== nextState.value) {
            nextState.value = nextProps.value.toFixed(this.props.precision !== undefined ? this.props.precision : 3);
            return true;
        }
        return false;
    }

    updateValue(evt: any) {
        const value = evt.target.value;

        if (/[^0-9.-]/g.test(value)) {
            return;
        }

        const valueAsNumber = parseFloat(value);

        this._localChange = true;
        this.setState({ value: value });

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

    onKeyDown(evt: any) {
        this.handleStepModifier(evt);
    }

    private handleStepModifier(evt: any) {
        if (!evt.shiftKey) {
            return;
        }

        const value = evt.target.value;
        if (/[^0-9.-]/g.test(value)) {
            return;
        }
        let valueAsNumber = parseFloat(value);
        const step = this.props.step || 0;
        const handleModifier = (sign: number) => {
            valueAsNumber -= step * sign; // Undo the step change that the browser did
            if (evt.ctrlKey || evt.metaKey) {
                valueAsNumber += step * 100 * sign;
            } else {
                valueAsNumber += step * 10 * sign;
            }
        };

        if (evt.key === "ArrowUp") {
            handleModifier(1);
        } else if (evt.key === "ArrowDown") {
            handleModifier(-1);
        }
        evt.target.value = valueAsNumber;
    }

    render() {
        return (
            <div className="numeric">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                {this.props.label && (
                    <div className="numeric-label" title={this.props.label}>
                        {`${this.props.label}: `}
                    </div>
                )}
                <input
                    type="number"
                    step={this.props.step}
                    className="numeric-input"
                    value={this.state.value}
                    onChange={(evt) => this.updateValue(evt)}
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
