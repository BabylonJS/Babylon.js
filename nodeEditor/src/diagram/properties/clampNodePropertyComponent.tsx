
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';

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
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={clampBlock} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                    <TextLineComponent label="Type" value={clampBlock.getClassName()} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES">
                  <FloatLineComponent label="Minimum" propertyName="minimum" target={clampBlock} onChange={() => this.forceRebuild()} />
                  <FloatLineComponent label="Maximum" propertyName="maximum" target={clampBlock} onChange={() => this.forceRebuild()} />
                </LineContainerComponent>
            </div>
        );
    }
}