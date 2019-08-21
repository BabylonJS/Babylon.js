
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { ClampNodeModel } from './clampNodeModel';
import { FloatLineComponent } from '../../../sharedComponents/floatLineComponent';

interface IClampPropertyTabComponentProps {
    globalState: GlobalState;
    remapNode: ClampNodeModel;
}

export class ClampPropertyTabComponentProps extends React.Component<IClampPropertyTabComponentProps> {

    constructor(props: IClampPropertyTabComponentProps) {
        super(props)
    }

    forceRebuild() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
    }

    render() {
        let clampBlock = this.props.remapNode.clampBlock;
      
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