
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
import { GenericPropertyTabComponent } from './genericNodePropertyComponent';

export class ClampPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    forceRebuild() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
    }

    render() {
        let clampBlock = this.props.block as ClampBlock
      
        return (
            <div>
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                  <FloatLineComponent globalState={this.props.globalState} label="Minimum" propertyName="minimum" target={clampBlock} onChange={() => this.forceRebuild()} />
                  <FloatLineComponent globalState={this.props.globalState} label="Maximum" propertyName="maximum" target={clampBlock} onChange={() => this.forceRebuild()} />
                </LineContainerComponent>
            </div>
        );
    }
}