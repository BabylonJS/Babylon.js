
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';

export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        return (
            <>
                <LineContainerComponent title="GENERAL">
                    {
                        (!this.props.block.isInput || !(this.props.block as InputBlock).isAttribute) &&
                        <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.block} 
                            onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                    }
                    <TextLineComponent label="Type" value={this.props.block.getClassName()} />
                    <TextInputLineComponent globalState={this.props.globalState} label="Comments" propertyName="comments" target={this.props.block} 
                            onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                </LineContainerComponent>         
            </>
        );
    }
}