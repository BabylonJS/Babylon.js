
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';
import { GenericPropertyTabComponent } from './genericNodePropertyComponent';

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
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                  <Vector2LineComponent globalState={this.props.globalState} label="From" propertyName="sourceRange" target={remapBlock} onChange={() => this.forceRebuild()} />
                  <Vector2LineComponent globalState={this.props.globalState} label="To" propertyName="targetRange" target={remapBlock} onChange={() => this.forceRebuild()} />
                </LineContainerComponent>
            </div>
        );
    }
}