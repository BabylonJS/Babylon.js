
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';

export class CheckboxPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this.checkbox = this.props.guiBlock as BABYLON.GUI.Checkbox;
    }

    private checkbox : BABYLON.GUI.Checkbox;

    render() {
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} guiBlock={this.props.guiBlock}/>
                <LineContainerComponent title="PROPERTIES">
                <FloatLineComponent globalState={this.props.globalState} label="check size ratio" target={this.checkbox} propertyName="checkSizeRatio"/>
                <CheckBoxLineComponent label="is checked" target={this.checkbox} propertyName="isChecked" disabled={this.checkbox.isChecked}/>
                </LineContainerComponent>            
            </>
        );
    }
}