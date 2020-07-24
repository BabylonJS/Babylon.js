import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { LockObject } from "../tabs/propertyGrids/lockObject";

interface IHexLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    lockObject?: LockObject;
    onChange?: (newValue: number) => void;
    isInteger?: boolean;
    replaySourceReplacement?: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    additionalClass?: string;
    step?: string,
    digits?: number;
    useEuler?: boolean;
    min?: number
}

export class HexLineComponent extends React.Component<IHexLineComponentProps, { value: string }> {
    private _localChange = false;
    private _store: number;
    private _propertyChange = true;

    constructor(props: IHexLineComponentProps) {
        super(props);

        let currentValue = this.props.target[this.props.propertyName];
        this.state = { value: currentValue ? (this.props.isInteger ? currentValue.toFixed(0) : currentValue.toFixed(this.props.digits || 3)) : "0" };
        this._store = currentValue;
    }

    componentWillUnmount() {
        this.unlock();
    }

    shouldComponentUpdate(nextProps: IHexLineComponentProps, nextState: { value: string }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = nextProps.target[nextProps.propertyName];
        const newValueString = newValue ? this.props.isInteger ? newValue.toFixed(0) : newValue.toFixed(this.props.digits || 3) : "0";

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
            object: this.props.replaySourceReplacement ?? this.props.target,
            property: this.props.propertyName,
            value: newValue,
            initialValue: previousValue
        });
    }

    convertToHexString(valueString: string): string
    {
        while(valueString.length < 10)
        {
            valueString += "0";
        }
        return valueString;
    }

    updateValue(valueString: string, raisePropertyChanged: boolean) {

        if(valueString.substr(0,2) != "0x") {
            if(valueString.substr(0,1) != "0") {
                valueString = "0x" + valueString;
            }
            else {
                valueString = "0x" + valueString.substr(1);
            }
        }

        let valueSubstr = valueString.substr(2);
        if (valueSubstr != "" && /^[0-9A-Fa-f]+$/g.test(valueSubstr) == false) {
            return;
        }
    
        if(valueString.length > 10) {
            return;
        }

        let valueStringAsHex = this.convertToHexString(valueString);
        let valueAsNumber: number;

        valueAsNumber = parseInt(valueStringAsHex);

        if (!isNaN(valueAsNumber) && this.props.min !== undefined) {
            if (valueAsNumber < this.props.min) {
                valueAsNumber = this.props.min;
                valueString = valueAsNumber.toString();
            }            
        }

        this._localChange = true;

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.setState({ value: valueString });
        if(raisePropertyChanged)
        {
            this._propertyChange = true;
            this.props.target[this.props.propertyName] = valueAsNumber;
            this.raiseOnPropertyChanged(valueAsNumber, this._store);
        }
        else
        {
            this._propertyChange = false;
        }

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
        
        let valueAsHex : string;
        if(this._propertyChange)
        {
            let valueAsNumber = parseInt(this.state.value);
            valueAsHex = valueAsNumber.toString(16);
            let hex0String = "";
            for (let i = 0; i < 8 - valueAsHex.length; i++) { //padding the '0's
                hex0String += "0";
            }
            valueAsHex = "0x" + valueAsHex.toUpperCase() + hex0String;
        }
        else
        {
            valueAsHex = this.state.value;
        }

        return (
            <div>
                {
                    !this.props.useEuler &&
                    <div className={this.props.additionalClass ? this.props.additionalClass + " floatLine" : "floatLine"}>
                        <div className="label">
                            {this.props.label}
                        </div>
                        <div className="value">
                            <input type="string" className="hex-input" value={valueAsHex} onBlur={() => this.unlock()} onFocus={() => this.lock()} 
                            onChange={evt => this.updateValue(evt.target.value, false)}
                            onKeyDown={evt => {
                                if (evt.keyCode !== 13) {
                                    return;
                                }
                                this.updateValue(this.state.value, true);
                            }}
                            />
                        </div>
                    </div>
                }
            </div>
        );
    }
}
