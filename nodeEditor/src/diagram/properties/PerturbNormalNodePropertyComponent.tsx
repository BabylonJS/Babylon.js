
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { GenericPropertyTabComponent } from './genericNodePropertyComponent';

export class PerturbNormalPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        return (
            <>                
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Invert X axis" target={this.props.block} propertyName="invertX" onValueChanged={() => this.props.globalState.onRebuildRequiredObservable.notifyObservers()} />
                    <CheckBoxLineComponent label="Invert Y axis" target={this.props.block} propertyName="invertY" onValueChanged={() => this.props.globalState.onRebuildRequiredObservable.notifyObservers()}/>                    
                </LineContainerComponent>        
            </>
        );
    }
}