import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../propertyChangedEvent";
import type { IInspectableOptions } from "core/Misc/iInspectable";
import type { CommonControlPropertyGridComponent } from "tools/guiEditor/src/components/propertyTab/propertyGrids/gui/commonControlPropertyGridComponent"

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Null_Value = Number.MAX_SAFE_INTEGER;

export interface IOptionsLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    options: IInspectableOptions[];
    addInput?: boolean;
    noDirectUpdate?: boolean;
    onSelect?: (value: number | string) => void;
    extractValue?: (target: any) => number | string;
    addVal?: (newVal: {label: string, value: number}) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    allowNullValue?: boolean;
    icon?: string;
    iconLabel?: string;
    className?: string;
    valuesAreStrings?: boolean;
    defaultIfNull?: number;
}

export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, { value: number | string, newOptions: IInspectableOptions[] }> {
    ccpgc: CommonControlPropertyGridComponent;
    private _localChange = false;
    private _remapValueIn(value: number | null): number {
        return this.props.allowNullValue && value === null ? Null_Value : value!;
    }

    private _remapValueOut(value: number): number | null {
        return this.props.allowNullValue && value === Null_Value ? null : value;
    }

    private _getValue(props: IOptionsLineComponentProps) {
        if (props.extractValue) {
            return props.extractValue(props.target);
        }
        return props.target && props.propertyName ? props.target[props.propertyName] : props.options[props.defaultIfNull || 0];
    }

    constructor(props: IOptionsLineComponentProps) {
        super(props);

        this.state = { value: this._remapValueIn(this._getValue(props)), newOptions: this.props.options };
    }

    shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: { value: number, newOptions: IInspectableOptions[] }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        const newValue = this._remapValueIn(nextProps.extractValue ? nextProps.extractValue(this.props.target) : nextProps.target[nextProps.propertyName]);
        if (newValue != null && newValue !== nextState.value) {
            nextState.value = newValue;
            return true;
        }
        return false;
    }

    raiseOnPropertyChanged(newValue: number, previousValue: number) {
        if (!this.props.onPropertyChangedObservable) {
            return;
        }

        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: newValue,
            initialValue: previousValue,
            allowNullValue: this.props.allowNullValue,
        });
    }

    setValue(value: string | number) {
        this.setState({ value: value });
    }
    // setOptions(label: string, value: number) {
    //     console.log("before", this.state.newOptions)
    //     this.state.newOptions.push({label: label, value: value})
    //     this.setState({ newOptions: this.state.newOptions });
    //     console.log("after", this.state.newOptions)
    // }

    updateValue(valueString: string) {
        let value = this.props.valuesAreStrings ? valueString : parseInt(valueString);
        
       // onkeydown = (event) => { event.keyCode === 13 ? this.ccpgc.fontFamilyOptions = [{label: valueString, value: this.props.options.length}] : null }
       onkeydown = (event) => { event.keyCode === 13 && this.props.addVal != undefined ? (this.props.addVal({label: valueString, value: this.props.options.length}), this.forceUpdate()) : null }
    //onkeydown = (event) => { event.keyCode === 13 && this.props.addVal != undefined ? this.forceUpdate() : null }
        
        if(isNaN(Number(value))){
            for(let i = 0; i < this.props.options.length; i++){
                if(this.props.options.at(i)?.label === valueString){
                    value = Number(this.props.options.at(i)?.value)
                }
            }
        }
        
       
        this._localChange = true;

        const store = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];

        if (!this.props.noDirectUpdate) {
            this.props.target[this.props.propertyName] = this._remapValueOut(value as number);
        }
        this.setState({ value: value });

        if (this.props.onSelect) {
            this.props.onSelect(value);
        }

        const newValue = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];

        this.raiseOnPropertyChanged(newValue, store);
    }

    render() {
       if(this.props.addInput){
        
            return (
                <div className={"listLine" + (this.props.className ? " " + this.props.className : "")}>
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="options">
                        
                        <input type="text" list = "dropdown" onChange={(evt) => this.updateValue(evt.target.value)} />
                        <datalist id="dropdown">
                                {this.props.options.map((option, i) => {
                                    return (
                                        <option selected={option.selected} key={option.label + i} value={option.label} title={option.label}>
                                            {console.log("newoptions", this.props.options)}
                                            {option.label}
                                        </option> 
                                    );
                                })}
                                
                                
                                
                            
                        </datalist>
                       
                    </div>
                    
                </div>
            );

       }
         else{
            return (
                <div className={"listLine" + (this.props.className ? " " + this.props.className : "")}>
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="options">
                        <select onChange={(evt) => this.updateValue(evt.target.value)} value={this.state.value ?? ""}>
                            {this.props.options.map((option, i) => {
                                return (
                                    <option selected={option.selected} key={option.label + i} value={option.value} title={option.label}>
                                        {option.label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            );
         }

        }
        
}
