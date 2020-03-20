
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GlobalState } from '../../globalState';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { NodePort } from '../nodePort';
import { FramePortPosition } from '../graphFrame';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';

export interface INodePortPropertyTabComponentProps {
    globalState: GlobalState
    nodePort: NodePort;
}

export class NodePortPropertyTabComponent extends React.Component<INodePortPropertyTabComponentProps, {framePortPosition: FramePortPosition}> {    
    private _onFramePortPositionChangedObserver: Nullable<Observer<FramePortPosition>>;

    constructor(props: INodePortPropertyTabComponentProps) {
        super(props);
        this.state = {
            framePortPosition: this.props.nodePort.framePortPosition
        };

        this._onFramePortPositionChangedObserver = this.props.nodePort.onFramePortPositionChangedObservable.add((position) => {
            this.setState({framePortPosition: position})
        });
    }

    componentWillUnmount() {
        this.props.nodePort.onFramePortPositionChangedObservable.remove(this._onFramePortPositionChangedObserver)
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
                     {this.state.framePortPosition !== FramePortPosition.Top && <ButtonLineComponent label="Move Node Up" onClick={() => {
                                this.props.nodePort.onFramePortMoveUpObservable.notifyObservers(this.props.nodePort);
                            }} />}

                    {this.state.framePortPosition !== FramePortPosition.Bottom && <ButtonLineComponent label="Move Node Down" onClick={() => {
                                this.props.nodePort.onFramePortMoveDownObservable.notifyObservers(this.props.nodePort);
                            }} />}
                </LineContainerComponent>
            </div>
        </div>
        );
    }
}