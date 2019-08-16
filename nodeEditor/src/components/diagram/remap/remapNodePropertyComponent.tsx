
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { RemapNodeModel } from './remapNodeModel';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { Vector2LineComponent } from '../../../sharedComponents/vector2LineComponent';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';

interface IRemapPropertyTabComponentProps {
    globalState: GlobalState;
    remapNode: RemapNodeModel;
}

export class RemapPropertyTabComponentProps extends React.Component<IRemapPropertyTabComponentProps> {

    constructor(props: IRemapPropertyTabComponentProps) {
        super(props)
    }

    forceRebuild() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
    }

    render() {
        let remapBlock = this.props.remapNode.remapBlock;
      
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