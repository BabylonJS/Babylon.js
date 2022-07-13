import * as React from "react";
import type { LockObject } from "../tabs/propertyGrids/lockObject";

export interface IColorComponentEntryProps {
    value: number;
    label: string;
    max?: number;
    min?: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    lockObject: LockObject;
}

export class ColorComponentEntry extends React.Component<IColorComponentEntryProps> {
    constructor(props: IColorComponentEntryProps) {
        super(props);
    }

    updateValue(valueString: string) {
        if (/[^0-9.-]/g.test(valueString)) {
            return;
        }

        let valueAsNumber = parseInt(valueString);

        if (isNaN(valueAsNumber)) {
            return;
        }
        if (this.props.max != undefined && valueAsNumber > this.props.max) {
            valueAsNumber = this.props.max;
        }
        if (this.props.min != undefined && valueAsNumber < this.props.min) {
            valueAsNumber = this.props.min;
        }

        this.props.onChange(valueAsNumber);
    }

    lock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = true;
        }
    }

    unlock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    public render() {
        return (
            <div className="color-picker-component">
                <div className="color-picker-component-value">
                    <input
                        type="number"
                        step={1}
                        className="numeric-input"
                        value={this.props.value}
                        onBlur={() => this.unlock()}
                        onFocus={() => this.lock()}
                        onChange={(evt) => this.updateValue(evt.target.value)}
                        disabled={this.props.disabled}
                    />
                </div>
                <div className="color-picker-component-label">{this.props.label}</div>
            </div>
        );
    }
}
