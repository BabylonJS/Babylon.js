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
    onKeyDown?: (value: string) => void
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


export class OptionsLineComponent extends React.Component<IOptionsLineComponentProps, { value: number | string, newOptions: IInspectableOptions[] , addCustom: boolean}> {
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

        this.state = { value: this._remapValueIn(this._getValue(props)), newOptions: this.props.options, addCustom: false };
    }

    shouldComponentUpdate(nextProps: IOptionsLineComponentProps, nextState: { value: number, newOptions: IInspectableOptions[], addCustom: boolean}) {
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
        console.log(value)
        this.setState({ value: value });
        console.log(this.state.value)
    }
   

    updateValue(valueString: string) {
        console.log(valueString)
        let value = this.props.valuesAreStrings ? valueString : parseInt(valueString);
        console.log(value)
        
        if(isNaN(Number(value))){
            for(let i = 0; i < this.props.options.length; i++){
                if(this.props.options.at(i)?.label === valueString){
                    value = Number(this.props.options.at(i)?.value)
                }
            }
        }
        // onkeydown = (event) => { event.keyCode === 13 && this.props.addVal != undefined ? (this.props.addVal({label: valueString, value: this.props.options.length}), this.setState({addCustom : false}), this.setValue(this.props.options.length)) : null }
        this.forceUpdate()

        console.log(value)
        if(value === 0){
            this.setState({addCustom : true,

                
            })
        }
        console.log("val", value)
       
        this._localChange = true;

        const store = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];
    
        if (!this.props.noDirectUpdate) {
            this.props.target[this.props.propertyName] = this._remapValueOut(value as number);
        }
        this.setState({ value: value });
        console.log("value", this.state.value)

        if (this.props.onSelect) {
            console.log("we select?" + value)
            this.props.onSelect(value);
        }



        const newValue = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];

        this.raiseOnPropertyChanged(newValue, store);
    }

     updateCustomValue(){
        //console.log("called", valueString)
        //console.log("the value", val)
      
       this.setValue(this.props.options.length - 1)
       console.log("I set value", this.state.value)
       setTimeout(() => {
        this.setState({addCustom : false})
        if(this.props.onSelect){
            console.log("onselect", JSON.parse(String(window.sessionStorage.getItem("fonts"))), JSON.parse(String(window.sessionStorage.getItem("fonts"))).length - 1)
            this.props.onSelect(JSON.parse(String(window.sessionStorage.getItem("fonts"))).length - 1)
            this.forceUpdate()
            
        }
        
      }, 100)
    
        // if (this.props.onSelect) {
        //     console.log("selected?" + this.state.value)
        //     console.log("options", this.props.options)
           
            
            
        // }

     }

    render() {
       if(this.state.addCustom){
            return (
                <div className={"listLine" + (this.props.className ? " " + this.props.className : "")}>
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="options">
                        
                        {/* <input type="text" list = "dropdown" onChange={(evt) => this.updateValue(evt.target.value)} />
                        <datalist id="dropdown">
                                {this.props.options.map((option, i) => {
                                    return (
                                        <option selected={option.selected} key={option.label + i} value={option.label} title={option.label}>
                                            {console.log("newoptions", this.props.options)}
                                            {option.label}
                                        </option> 
                                    );
                                })}
                                
                                                                                                                                    
                                
                            
                        </datalist> */}
                        <input type = "text" placeholder = "Enter a custom font here" id = "customFont" onKeyDown = {(event) => { event.keyCode === 13 && this.props.addVal != undefined ? (this.props.addVal({label: (document.getElementById("customFont") as HTMLInputElement).value, value: this.props.options.length}), this.updateCustomValue()) : null }} />
                       
                    </div>
                    
                </div>
            );

       }
         else{
            console.log("hereee")
            return (
                <div className={"listLine" + (this.props.className ? " " + this.props.className : "")}>
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="options">
                        {console.log("value of select", this.state.value)}
                        <select onChange={(evt) => this.updateValue(evt.target.value)} value={this.state.value === -1 || null || undefined ? 1 : this.state.value}>
                            {this.props.options.map((option, i) => {
                                //const select = option.label === "Custom Font" ?  option.selected = false : option.selected = true
                                return (
                                    
                                    <option selected={option.selected} key={option.label + i} value={option.value} title={option.label}>
                                        {/* {console.log("here", this.props.options)} */}
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
