import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";
import { conflictingValuesPlaceholder } from './targetsProxy';

interface ITextInputLineComponentProps {
    label: string;
    lockObject: LockObject;
    target?: any;
    propertyName?: string;
    value?: string;
    onChange?: (value: string) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    icon?: string;
    iconLabel?: string;
    noUnderline?: boolean;
    numbersOnly?: boolean;
    delayInput?: boolean
}

export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, { value: string }> {
    private _localChange = false;

    constructor(props: ITextInputLineComponentProps) {
        super(props);

        this.state = { value: (this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!]) || "" };
    }

    componentWillUnmount() {
        this.props.lockObject.lock = false;
    }

    shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.value !== undefined ? nextProps.value : nextProps.target[nextProps.propertyName!];
        if (newValue !== nextState.value) {
            nextState.value = newValue || "";
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

    updateValue(value: string) {
        if (this.props.numbersOnly) {
            if (/[^0-9\.\p\x\%\-]/g.test(value)) {
                return;
            }
            if (!value) {
                value = "0";
            }

            //Removing starting zero if there is a number of a minus after it.
            if (value.search(/0+[0-9\-]/g) === 0) {
                value = value.substr(1);
            }
        }

        this._localChange = true;
        const store = this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!];
        this.setState({ value: value });

        if (this.props.propertyName && !this.props.delayInput) {
            this.props.target[this.props.propertyName] = value;
        }

        this.raiseOnPropertyChanged(value, store);
    }

    render() {
        const value = this.state.value === conflictingValuesPlaceholder ? "" : this.state.value;
        const placeholder = this.state.value === conflictingValuesPlaceholder ? conflictingValuesPlaceholder : "";
        return (
            <div className="textInputLine">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                {(!this.props.icon || (this.props.icon && this.props.label != "")) && (
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                )}
                <div className={"value" + (this.props.noUnderline === true ? " noUnderline" : "")}>
                    <input
                        value={value}
                        onBlur={() => {
                            this.props.lockObject.lock = false;
                            this.updateValue((this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!]) || "" );
                        }}
                        onFocus={() => (this.props.lockObject.lock = true)}
                        onChange={(evt) => this.updateValue(evt.target.value)}
                        placeholder={placeholder}
                    />
                </div>
            </div>
        );
    }
}