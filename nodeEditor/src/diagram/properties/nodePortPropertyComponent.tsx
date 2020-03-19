
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GlobalState } from '../../globalState';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { NodePort } from '../nodePort';

export interface INodePortPropertyTabComponentProps {
    globalState: GlobalState
    nodePort: NodePort;
}

export class NodePortPropertyTabComponent extends React.Component<INodePortPropertyTabComponentProps> {

    constructor(props: INodePortPropertyTabComponentProps) {
        super(props)
    }

    render() {      
        return (
            <div id="propertyTab">
            <div id="header">
                <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                <div id="title">
                    NODE MATERIAL EDITOR
                </div>
            </div>
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Port Label" propertyName="portLabel" target={this.props.nodePort}/>
                    <ButtonLineComponent label="Move Node Up" onClick={() => {
                                this.props.globalState.onFramePortMoveUpObserver.notifyObservers(this.props.nodePort);
                            }} />

                    <ButtonLineComponent label="Move Node Down" onClick={() => {
                                this.props.globalState.onFramePortMoveDownObserver.notifyObservers(this.props.nodePort);
                            }} />
                </LineContainerComponent>
            </div>
        </div>
        );
    }
}