
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { NumericInputComponent } from '../../sharedComponents/numericInputComponent';
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { TextLineComponent } from "../../sharedUiComponents/lines/textLineComponent";


export class SliderPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this.slider = this.props.guiBlock as Slider;
    }

    private slider : Slider;

    render() {
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} guiBlock={this.props.guiBlock}/>
                <LineContainerComponent title="PROPERTIES"> 
                <NumericInputComponent globalState={this.props.globalState} label="Minimum Value" value={this.slider.minimum}
                onChange={evt =>{
                    this.slider.minimum = evt;
                }}>
                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Maximum Value" value={this.slider.maximum} 
                onChange={evt =>{
                   this.slider.maximum = evt;
                }}>

                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Value" value={this.slider.value} 
                onChange={evt =>{
                   this.slider.value = evt;
                }}>
                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Height" value={this.slider.heightInPixels} 
                onChange={evt =>{
                   this.slider.height = evt;
                }}>
                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Width" value={this.slider.widthInPixels} 
                onChange={evt =>{
                   this.slider.width = evt;
                }}>
                </NumericInputComponent>
                <TextLineComponent label="Color" value={this.slider.background} />
                </LineContainerComponent>            
            </>
        );
    }
}