import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../propertyChangedEvent";
import type { LockObject } from "../tabs/propertyGrids/lockObject";
import { SliderLineComponent } from "./sliderLineComponent";
import { Tools } from "core/Misc/tools";
import { conflictingValuesPlaceholder } from "./targetsProxy";
import { InputArrowsComponent } from "./inputArrowsComponent";

interface IFloatLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    lockObject: LockObject;
    onChange?: (newValue: number) => void;
    isInteger?: boolean;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    additionalClass?: string;
    step?: string;
    digits?: number;
    useEuler?: boolean;
    min?: number;
    max?: number;
    smallUI?: boolean;
    onEnter?: (newValue: number) => void;
    icon?: string;
    iconLabel?: string;
    defaultValue?: number;
    arrows?: boolean;
    unit?: React.ReactNode;
    onDragStart?: (newValue: number) => void;
    onDragStop?: (newValue: number) => void;
    disabled?: boolean;
}

export class FloatLineComponent extends React.Component<IFloatLineComponentProps, { value: string; dragging: boolean }> {
    private _localChange = false;
    private _store: number;

    constructor(props: IFloatLineComponentProps) {
        super(props);

        const currentValue = this.props.target[this.props.propertyName];
        this.state = { value: this.getValueString(currentValue, this.props), dragging: false };
        this._store = currentValue;
    }

    componentWillUnmount() {
        this.unlock();
    }

    getValueString(value: any, props: IFloatLineComponentProps): string {
        if (value) {
            if (value === conflictingValuesPlaceholder) {
                return conflictingValuesPlaceholder;
            } else if (props.isInteger) {
                return value.toFixed(0);
            } else {
                return value.toFixed(props.digits || 4);
            }
        }
        return "0";
    }

    shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: { value: string; dragging: boolean }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.target[nextProps.propertyName];
        const newValueString = this.getValueString(newValue, nextProps);

        if (newValueString !== nextState.value) {
            nextState.value = newValueString;
            return true;
        }

        if (nextState.dragging != this.state.dragging || nextProps.unit !== this.props.unit || nextProps.isInteger !== this.props.isInteger) {
            return true;
        }

        return false;
    }

    raiseOnPropertyChanged(newValue: number, previousValue: number) {
        if (this.props.onChange) {
            this.props.onChange(newValue);
        }

        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: newValue,
            initialValue: previousValue,
        });
    }

    updateValue(valueString: string) {
        if (/[^0-9.-]/g.test(valueString)) {
            return;
        }

        let valueAsNumber: number;

        if (this.props.isInteger) {
            valueAsNumber = parseInt(valueString);
        } else {
            valueAsNumber = parseFloat(valueString);
        }

        if (!isNaN(valueAsNumber)) {
            if (this.props.min !== undefined) {
                if (valueAsNumber < this.props.min) {
                    valueAsNumber = this.props.min;
                    valueString = valueAsNumber.toString();
                }
            }
            if (this.props.max !== undefined) {
                if (valueAsNumber > this.props.max) {
                    valueAsNumber = this.props.max;
                    valueString = valueAsNumber.toString();
                }
            }
        } else if (this.props.defaultValue != null) {
            valueAsNumber = this.props.defaultValue;
        }

        this._localChange = true;
        this.setState({ value: valueString });

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.props.target[this.props.propertyName] = valueAsNumber;
        this.raiseOnPropertyChanged(valueAsNumber, this._store);

        this._store = valueAsNumber;
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

    incrementValue(amount: number, processStep: boolean = true) {
        if (processStep && this.props.step) {
            amount *= parseFloat(this.props.step);
        }

        let currentValue = parseFloat(this.state.value);
        if (isNaN(currentValue)) {
            currentValue = 0;
        }
        this.updateValue((currentValue + amount).toFixed(2));
    }

    onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        const step = parseFloat(this.props.step || this.props.isInteger ? "1" : "0.01");
        const handleArrowKey = (sign: number) => {
            if (event.shiftKey) {
                sign *= 10;
                if (event.ctrlKey || event.metaKey) {
                    sign *= 10;
                }
            }

            this.incrementValue(sign * step, false);
            event.preventDefault();
        };

        if (event.key === "ArrowUp") {
            handleArrowKey(1);
        } else if (event.key === "ArrowDown") {
            handleArrowKey(-1);
        }
        if (event.key === "Enter" && this.props.onEnter) {
            this.props.onEnter(this._store);
        }
    }

    render() {
        let valueAsNumber: number;

        if (this.props.isInteger) {
            valueAsNumber = parseInt(this.state.value);
        } else {
            valueAsNumber = parseFloat(this.state.value);
        }

        let className = this.props.smallUI ? "short" : "value";
        if (this.state.dragging) {
            className += " dragging";
        }
        if (this.props.arrows) {
            className += " hasArrows";
        }

        const value = this.state.value === conflictingValuesPlaceholder ? "" : this.state.value;
        const placeholder = this.state.value === conflictingValuesPlaceholder ? conflictingValuesPlaceholder : "";
        return (
            <>
                {!this.props.useEuler && (
                    <div className={this.props.additionalClass ? this.props.additionalClass + " floatLine" : "floatLine"}>
                        {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                        {(!this.props.icon || this.props.label != "") && (
                            <div className="label" title={this.props.label}>
                                {this.props.label}
                            </div>
                        )}
                        <div className={className}>
                            <input
                                type={"number"}
                                step={this.props.step || this.props.isInteger ? "1" : "0.01"}
                                className="numeric-input"
                                onKeyDown={(evt) => this.onKeyDown(evt)}
                                value={value}
                                onBlur={() => {
                                    this.unlock();
                                    if (this.props.onEnter) {
                                        this.props.onEnter(this._store);
                                    }
                                }}
                                placeholder={placeholder}
                                onFocus={() => this.lock()}
                                onChange={(evt) => this.updateValue(evt.target.value)}
                                disabled={this.props.disabled}
                            />
                            {this.props.arrows && (
                                <InputArrowsComponent
                                    incrementValue={(amount) => this.incrementValue(amount)}
                                    setDragging={(newDragging) => {
                                        const currentDragging = this.state.dragging;
                                        // drag stopped
                                        if (!currentDragging && newDragging && this.props.onDragStart) {
                                            this.props.onDragStart(valueAsNumber);
                                        } else if (currentDragging && !newDragging && this.props.onDragStop) {
                                            this.props.onDragStop(valueAsNumber);
                                        }
                                        this.setState({ dragging: newDragging });
                                    }}
                                />
                            )}
                        </div>
                        {this.props.unit}
                    </div>
                )}
                {this.props.useEuler && (
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label={this.props.label}
                        minimum={0}
                        maximum={360}
                        step={0.1}
                        directValue={Tools.ToDegrees(valueAsNumber)}
                        onChange={(value) => this.updateValue(Tools.ToRadians(value).toString())}
                    />
                )}
            </>
        );
    }
}
