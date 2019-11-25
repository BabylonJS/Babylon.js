
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';

export class WorleyNoise3DNodePropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        return (
            <>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.block} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                    <TextLineComponent label="Type" value={this.props.block.getClassName()} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Use Manhattan Distance" target={this.props.block} propertyName="manhattanDistance" onValueChanged={() => this.props.globalState.onRebuildRequiredObservable.notifyObservers()} />              
                </LineContainerComponent>        
            </>
        );
    }
}