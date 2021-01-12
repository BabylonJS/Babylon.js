
import * as React from "react";
import { LineContainerComponent } from '../../sharedUiComponents/lines/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { NumericInputComponent } from '../../sharedComponents/numericInputComponent';
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { TextLineComponent } from "../../sharedUiComponents/lines/textLineComponent";


export class SliderPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this._slider = this.props.guiControl as Slider;
    }

    private _slider : Slider;

    render() {
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} guiControl={this.props.guiControl}/>
                <LineContainerComponent title="PROPERTIES"> 
                <NumericInputComponent globalState={this.props.globalState} label="Minimum Value" value={this._slider.minimum}
                onChange={evt =>{
                    this._slider.minimum = evt;
                }}>
                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Maximum Value" value={this._slider.maximum} 
                onChange={evt =>{
                   this._slider.maximum = evt;
                }}>

                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Value" value={this._slider.value} 
                onChange={evt =>{
                   this._slider.value = evt;
                }}>
                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Height" value={this._slider.heightInPixels} 
                onChange={evt =>{
                   this._slider.height = evt;
                }}>
                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Width" value={this._slider.widthInPixels} 
                onChange={evt =>{
                   this._slider.width = evt;
                }}>
                </NumericInputComponent>
                <TextLineComponent label="Color" value={this._slider.background} />
                </LineContainerComponent>            
            </>
        );
    }
}