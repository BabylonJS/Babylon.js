import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";

interface ITextInputLineComponentProps {
    label: string;
    lockObject: LockObject;
    target?: any;
    propertyName?: string;
    value?: string;
    onChange?: (value: string) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    icon?: string;
}

export class TextInputLineComponent extends React.Component<ITextInputLineComponentProps, { value: string }> {
    private _localChange = false;

    constructor(props: ITextInputLineComponentProps) {
        super(props);

        this.state = { value: (this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!]) || "" }
    }

    componentWillUnmount() {
        this.props.lockObject.lock = false;
    }

    shouldComponentUpdate(nextProps: ITextInputLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.value  !== undefined  ? nextProps.value : nextProps.target[nextProps.propertyName!];
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

    updateValue(value: string) {

        this._localChange = true;
        const store = this.props.value !== undefined ? this.props.value : this.props.target[this.props.propertyName!];
        this.setState({ value: value });

        this.raiseOnPropertyChanged(value, store);

        if (this.props.propertyName) {
            this.props.target[this.props.propertyName] = value;
        }
    }

    render() {
        return (
            <div className="textInputLine">
                {this.props.icon && <img src={this.props.icon} color="black" className="icon"/>}
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                <div className="value">
                    <input value={this.state.value} onBlur={() => this.props.lockObject.lock = false} onFocus={() => this.props.lockObject.lock = true} onChange={evt => this.updateValue(evt.target.value)} />
                </div>
            </div>
        );
    }
}
