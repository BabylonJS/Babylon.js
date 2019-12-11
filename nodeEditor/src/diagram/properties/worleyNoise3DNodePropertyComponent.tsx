
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { GenericPropertyTabComponent } from './genericNodePropertyComponent';

export class WorleyNoise3DNodePropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        return (
            <>
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Use Manhattan Distance" target={this.props.block} propertyName="manhattanDistance" onValueChanged={() => this.props.globalState.onRebuildRequiredObservable.notifyObservers()} />              
                </LineContainerComponent>        
            </>
        );
    }
}