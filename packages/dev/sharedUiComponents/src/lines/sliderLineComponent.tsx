import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../propertyChangedEvent";
import { Tools } from "core/Misc/tools";
import { FloatLineComponent } from "./floatLineComponent";
import type { LockObject } from "../tabs/propertyGrids/lockObject";

interface ISliderLineComponentProps {
    label: string;
    target?: any;
    propertyName?: string;
    minimum: number;
    maximum: number;
    step: number;
    directValue?: number;
    useEuler?: boolean;
    onChange?: (value: number) => void;
    onInput?: (value: number) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    decimalCount?: number;
    margin?: boolean;
    icon?: string;
    iconLabel?: string;
    lockObject: LockObject;
    unit?: React.ReactNode;
}

export class SliderLineComponent extends React.Component<ISliderLineComponentProps, { value: number }> {
    private _localChange = false;
    constructor(props: ISliderLineComponentProps) {
        super(props);

        if (this.props.directValue !== undefined) {
            this.state = {
                value: this.props.directValue,
            };
        } else {
            let value = this.props.target![this.props.propertyName!];

            if (value === undefined) {
                value = this.props.maximum;
            }
            this.state = { value: value };
        }
    }

    shouldComponentUpdate(nextProps: ISliderLineComponentProps, nextState: { value: number }) {
        if (nextProps.directValue !== undefined) {
            nextState.value = nextProps.directValue;
            return true;
        }

        let currentState = nextProps.target![nextProps.propertyName!];
        if (currentState === undefined) {
            currentState = nextProps.maximum;
        }

        if (currentState !== nextState.value || this._localChange || nextProps.maximum !== this.props.maximum || nextProps.minimum !== this.props.minimum) {
            nextState.value = currentState;
            this._localChange = false;
            return true;
        }

        if (nextProps.unit !== this.props.unit) {
            return true;
        }

        return false;
    }

    onChange(newValueString: any) {
        if (newValueString === "—") return;
        this._localChange = true;
        let newValue = parseFloat(newValueString);

        if (this.props.useEuler) {
            newValue = Tools.ToRadians(newValue);
        }

        if (this.props.target) {
            if (this.props.onPropertyChangedObservable) {
                this.props.onPropertyChangedObservable.notifyObservers({
                    object: this.props.target,
                    property: this.props.propertyName!,
                    value: newValue,
                    initialValue: this.state.value,
                });
            }

            this.props.target[this.props.propertyName!] = newValue;
        }

        if (this.props.onChange) {
            this.props.onChange(newValue);
        }

        this.setState({ value: newValue });
    }

    onInput(newValueString: any) {
        const newValue = parseFloat(newValueString);
        if (this.props.onInput) {
            this.props.onInput(newValue);
        }
    }

    prepareDataToRead(value: number) {
        if (value === null) {
            value = 0;
        }

        if (this.props.useEuler) {
            return Tools.ToDegrees(value);
        }

        return value;
    }

    render() {
        return (
            <div className="sliderLine">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                {(!this.props.icon || this.props.label != "") && (
                    <div className={this.props.margin ? "label withMargins" : "label"} title={this.props.label}>
                        {this.props.label}
                    </div>
                )}
                <FloatLineComponent
                    lockObject={this.props.lockObject}
                    isInteger={this.props.decimalCount === 0}
                    smallUI={true}
                    label=""
                    target={this.state}
                    digits={this.props.decimalCount === undefined ? 4 : this.props.decimalCount}
                    propertyName="value"
                    min={this.props.minimum}
                    max={this.props.maximum}
                    onEnter={() => {
                        const changed = this.prepareDataToRead(this.state.value);
                        this.onChange(changed);
                    }}
                    onChange={() => {
                        const changed = this.prepareDataToRead(this.state.value);
                        this.onChange(changed);
                    }}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    unit={this.props.unit}
                />
                <div className="slider">
                    <input
                        className="range"
                        type="range"
                        step={this.props.step}
                        min={this.prepareDataToRead(this.props.minimum)}
                        max={this.prepareDataToRead(this.props.maximum)}
                        value={this.prepareDataToRead(this.state.value)}
                        onInput={(evt) => this.onInput((evt.target as HTMLInputElement).value)}
                        onChange={(evt) => this.onChange(evt.target.value)}
                    />
                </div>
            </div>
        );
    }
}
