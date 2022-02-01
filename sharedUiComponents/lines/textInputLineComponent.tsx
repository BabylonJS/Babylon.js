import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";

interface ITextInputLineComponentProps {
    label: string;
    lockObject: LockObject;
    targets: any[];
    propertyName?: string;
    value?: string;
    onChange?: (value: string) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    icon?: string;
    iconLabel?: string;
    noUnderline?: boolean;
    numbersOnly?: boolean;
    delayInput?: boolean
    /** the value to show when two or more targets have conflict values */
    conflictingPlaceholder?: string;
}

export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, { value: string }> {
    private _localChange = false;

    constructor(props: ITextInputLineComponentProps) {
        super(props);

        this.state = { value: this.getValue() };
    }

    componentWillUnmount() {
        this.props.lockObject.lock = false;
    }

    shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = this.getValue(nextProps);
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

        for (const target of this.props.targets) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: target,
                property: this.props.propertyName!,
                value: newValue,
                initialValue: previousValue,
            });
        }
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
        const store = this.getValue();
        this.setState({ value: value });

        if (this.props.propertyName && !this.props.delayInput) {
            for(const target of this.props.targets) {
                target[this.props.propertyName] = value;
            }
        }

        this.raiseOnPropertyChanged(value, store);
    }

    getValue(props?: ITextInputLineComponentProps) {
        if (!props) props = this.props;
        if (props.value !== undefined) return props.value;
        if (!props.targets) console.log(props);
        if (props.targets.length == 0) return props.conflictingPlaceholder || "";
        const firstValue = props.targets[0][props.propertyName!];
        for(const target of props.targets) {
            if (target[props.propertyName!] !== firstValue) {
                return props.conflictingPlaceholder || "";
            }
        }
        return firstValue;
    }

    render() {
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
                        value={this.state.value}
                        onBlur={() => {
                            this.props.lockObject.lock = false;
                            this.updateValue(this.getValue());
                        }}
                        onFocus={() => (this.props.lockObject.lock = true)}
                        onChange={(evt) => this.updateValue(evt.target.value)}
                    />
                </div>
            </div>
        );
    }
}
