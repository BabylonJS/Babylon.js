
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GraphFrame } from '../graphFrame';
import { GlobalState } from '../../globalState';
import { Color3LineComponent } from '../../sharedComponents/color3LineComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { NodePort } from '../nodePort';

export interface INodePortPropertyTabComponentProps {
    globalState: GlobalState
    nodePort: NodePort;
}

export class NodePortPropertyTabComponent extends React.Component<INodePortPropertyTabComponentProps> {
    private onFrameExpandStateChangedObserver: Nullable<Observer<GraphFrame>>;

    constructor(props: INodePortPropertyTabComponentProps) {
        super(props)
    }


    // componentDidMount() {
    //     this.onFrameExpandStateChangedObserver = this.props.frame.onExpandStateChanged.add(() => this.forceUpdate());
    // }

    // componentWillUnmount() {
    //     if (this.onFrameExpandStateChangedObserver) {
    //         this.props.frame.onExpandStateChanged.remove(this.onFrameExpandStateChangedObserver);
    //         this.onFrameExpandStateChangedObserver = null;
    //     }
    // }    

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
                    <div>
                        NodePortPropertyComponent
                    </div>
                    <TextInputLineComponent globalState={this.props.globalState} label="Port Label" propertyName="portLabel" target={this.props.nodePort}/>
                    <ButtonLineComponent label="Move Node Up" onClick={() => {
                                console.log('click on up')
                                console.log(this.props.nodePort.frameId)
                                console.log(this.props.nodePort.node.block.uniqueId)
                                this.props.globalState.onFrameNodeMoveUpObserver.notifyObservers(this.props.nodePort);
                            }} />

                    <ButtonLineComponent label="Move Node Down" onClick={() => {
                                console.log('click on down')
                            }} />
                    {/* <TextInputLineComponent globalState={this.props.globalState} label="Name" prop–ertyName="name" target={this.props.frame} /> */}
                    {/* <Color3LineComponent globalState={this.props.globalState} label="Color" target={this.props.frame} propertyName="color"></Color3LineComponent>
                    <TextInputLineComponent globalState={this.props.globalState} label="Comments" propertyName="comments" target={this.props.frame}
                    />
                    {
                        this.props.frame.ports && this.props.frame.ports.map((port: NodePort) => 
                        )
                    }
                    {
                        !this.props.frame.isCollapsed &&
                        <ButtonLineComponent label="Collapse" onClick={() => {
                                this.props.frame!.isCollapsed = true;
                            }} />
                    }
                    {
                        this.props.frame.isCollapsed &&
                        <ButtonLineComponent label="Expand" onClick={() => {
                                this.props.frame!.isCollapsed = false;
                            }} />
                    }
                    {/* <ButtonLineComponent label="Export" onClick={() => {
                                this.state.currentFrame!.export();
                            }} /> */} 
                </LineContainerComponent>
            </div>
        </div>
        );
    }
}