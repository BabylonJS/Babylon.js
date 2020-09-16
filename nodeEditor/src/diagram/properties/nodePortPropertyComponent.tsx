
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GlobalState } from '../../globalState';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import {  GraphFrame } from '../graphFrame';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { NodePort } from '../nodePort';
import { GraphNode } from '../graphNode';
import { NodeLink } from '../nodeLink';
import { FramePortData } from '../graphCanvas';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';

export interface IFrameNodePortPropertyTabComponentProps {
    globalState: GlobalState
    nodePort: NodePort;
}

export class NodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps> {
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GraphFrame | NodePort | GraphNode | NodeLink | FramePortData>>>;

    constructor(props: IFrameNodePortPropertyTabComponentProps) {
        super(props);
    }

    componentWillUnmount() {
        this.props.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
    }

    toggleExposeOnFrame(value: boolean){
        this.props.nodePort.exposedOnFrame = value;
        this.props.globalState.onExposePortOnFrameObservable.notifyObservers(this.props.nodePort.node);
    }

    render() {

        let info =  this.props.nodePort.hasLabel() ?
            <>
            {this.props.nodePort.hasLabel() && <TextInputLineComponent globalState={this.props.globalState} label="Port Label" propertyName="portName" target={this.props.nodePort} />}
            {this.props.nodePort.node.enclosingFrameId !== -1 && <CheckBoxLineComponent label= "Expose Port on Frame" target={this.props.nodePort} isSelected={() => this.props.nodePort.exposedOnFrame} onSelect={(value: boolean) => this.toggleExposeOnFrame(value)}  propertyName="exposedOnFrame" disabled={this.props.nodePort.disabled} />}
            </> :
            <TextLineComponent label="This node is a constant input node and cannot be exposed to the frame." value=" " ></TextLineComponent>

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
                   {info}
                </LineContainerComponent>
                </div>
            </div>
        );
    }
}