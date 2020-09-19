import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { GlobalState } from '../globalState';

interface ITextInputLineComponentProps {
    label: string;
    globalState: GlobalState;
    target?: any;
    propertyName?: string;
    value?: string;
    onChange?: (value: string) => void;
    validator?: (value: string) => boolean;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, { value: string }> {
    private _localChange = false;

    constructor(props: ITextInputLineComponentProps) {
        super(props);

        this.state = { value: this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!] || "" }
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
            initialValue: previousValue
        });
    }

    updateValue(value: string, raisePropertyChanged: boolean) {

        this._localChange = true;
        const store = this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!];

        if(this.props.validator && raisePropertyChanged) {
            if(this.props.validator(value) == false) {
                value = store;
            }
        }

        this.setState({ value: value });

        if (raisePropertyChanged) {
            this.raiseOnPropertyChanged(value, store);
        }

        if (this.props.propertyName) {
            this.props.target[this.props.propertyName] = value;
        }
    }

    render() {
        return (
            <div className="textInputLine">
                <div className="label">
                    {this.props.label}
                </div>
                <div className="value">
                    <input value={this.state.value} 
                        onFocus={() => this.props.globalState.blockKeyboardEvents = true}
                        onChange={evt => this.updateValue(evt.target.value, false)}
                        onKeyDown={evt => {
                            if (evt.keyCode !== 13) {
                                return;
                            }
                            this.updateValue(this.state.value, true);
                        }} onBlur={evt => {
                            this.updateValue(evt.target.value, true)
                            this.props.globalState.blockKeyboardEvents = false;
                        }}/>
                </div>
            </div>
        );
    }
}
