import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";
import { SliderLineComponent } from "./sliderLineComponent";
import { Tools } from "babylonjs/Misc/tools";
import { conflictingValuesPlaceholder } from "./targetsProxy";

interface IFloatLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    lockObject?: LockObject;
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
    defaultValue?: number
}

export class FloatLineComponent extends React.Component<IFloatLineComponentProps, { value: string }> {
    private _localChange = false;
    private _store: number;

    constructor(props: IFloatLineComponentProps) {
        super(props);

        let currentValue = this.props.target[this.props.propertyName];
        this.state = { value: this.getValueString(currentValue) };
        this._store = currentValue;
    }

    componentWillUnmount() {
        this.unlock();
    }

    getValueString(value: any): string {
        if (value) {
            if (value === conflictingValuesPlaceholder) {
                return conflictingValuesPlaceholder;
            }
            else if (this.props.isInteger) {
                return value.toFixed(0);
            } else {
                return value.toFixed(this.props.digits || 4);
            }
        }
        return "0";
    }

    shouldComponentUpdate(nextProps: IFloatLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.target[nextProps.propertyName];
        const newValueString = this.getValueString(newValue);

        if (newValueString !== nextState.value) {
            nextState.value = newValueString;
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
        if (/[^0-9\.\-]/g.test(valueString)) {
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

    render() {
        let valueAsNumber: number;

        if (this.props.isInteger) {
            valueAsNumber = parseInt(this.state.value);
        } else {
            valueAsNumber = parseFloat(this.state.value);
        }

        let className = this.props.smallUI ? "short" : "value";

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
                                onKeyDown={(evt) => {
                                    if (evt.keyCode !== 13) {
                                        return;
                                    }
                                    if (this.props.onEnter) {
                                        this.props.onEnter(this._store);
                                    }
                                }}
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
                            />
                        </div>
                    </div>
                )}
                {this.props.useEuler && (
                    <SliderLineComponent
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