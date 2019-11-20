
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';

export class RemapPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    forceRebuild() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
    }

    render() {
        let remapBlock = this.props.block as RemapBlock;
      
        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={remapBlock} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                    <TextLineComponent label="Type" value={remapBlock.getClassName()} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES">
                  <Vector2LineComponent label="From" propertyName="sourceRange" target={remapBlock} onChange={() => this.forceRebuild()} />
                  <Vector2LineComponent label="To" propertyName="targetRange" target={remapBlock} onChange={() => this.forceRebuild()} />
                </LineContainerComponent>
            </div>
        );
    }
}