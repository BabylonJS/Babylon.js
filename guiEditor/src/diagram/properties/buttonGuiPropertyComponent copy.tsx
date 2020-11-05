
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { TransformBlock } from 'babylonjs/Materials/Node/Blocks/transformBlock';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { ColorPickerLineComponent } from '../../sharedComponents/colorPickerComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { NumericInputComponent } from '../../sharedComponents/numericInputComponent';
import { SketchPicker } from 'react-color';

export class ButtonPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this.button = this.props.guiBlock as BABYLON.GUI.Button;
    }

    private button : BABYLON.GUI.Button;

    render() {
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES"> 
                <TextInputLineComponent globalState={this.props.globalState} label="Button Text" value={this.button.textBlock?.text}
                onChange={evt =>{
                    if(this.button.textBlock) this.button.textBlock.text = evt;
                }}>
                </TextInputLineComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Width" value={this.button.widthInPixels} 
                onChange={evt =>{
                   this.button.widthInPixels = evt;
                }}>

                </NumericInputComponent>
                <NumericInputComponent globalState={this.props.globalState} label="Height" value={this.button.heightInPixels} 
                onChange={evt =>{
                   this.button.heightInPixels = evt;
                }}>
                </NumericInputComponent>  
                <TextLineComponent label="Background Color" value={this.button.background} />
                <SketchPicker
                    color={ this.button.background }
                    onChangeComplete={evt =>{
                        this.button.background = evt.hex;
                }}/>
                </LineContainerComponent>            
            </>
        );
    }
}