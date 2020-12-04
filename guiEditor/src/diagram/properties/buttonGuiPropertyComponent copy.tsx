
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { NumericInputComponent } from '../../sharedComponents/numericInputComponent';
import { Color4 } from 'babylonjs';

export class ButtonPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this.button = this.props.guiBlock as BABYLON.GUI.Button;
    }

    private button : BABYLON.GUI.Button;
    
    getColorString()
    {
        return Color4.FromHexString(this.button.background);
    }

    render() {
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} guiBlock={this.props.guiBlock}/>
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
                </LineContainerComponent>            
            </>
        );
    }
}