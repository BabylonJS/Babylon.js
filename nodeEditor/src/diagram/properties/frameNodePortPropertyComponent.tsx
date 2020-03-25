
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GlobalState } from '../../globalState';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { FramePortPosition } from '../graphFrame';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { FrameNodePort } from '../frameNodePort';

export interface IFrameNodePortPropertyTabComponentProps {
    globalState: GlobalState
    frameNodePort: FrameNodePort;
}

export class FrameNodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps, {framePortPosition: FramePortPosition}> {    
    private _onFramePortPositionChangedObserver: Nullable<Observer<FramePortPosition>>;

    constructor(props: IFrameNodePortPropertyTabComponentProps) {
        super(props);
        this.state = {
            framePortPosition: this.props.frameNodePort.framePortPosition
        };

        this._onFramePortPositionChangedObserver = this.props.frameNodePort.onFramePortPositionChangedObservable.add((position) => {
            this.setState({framePortPosition: position})
        });
    }

    componentWillUnmount() {
        this.props.frameNodePort.onFramePortPositionChangedObservable.remove(this._onFramePortPositionChangedObserver)
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
                    <TextInputLineComponent globalState={this.props.globalState} label="Port Label" propertyName="portLabel" target={this.props.frameNodePort}/>
                     {this.state.framePortPosition !== FramePortPosition.Top && <ButtonLineComponent label="Move Node Up" onClick={() => {
                                this.props.frameNodePort.onFramePortMoveUpObservable.notifyObservers(this.props.frameNodePort);
                            }} />}

                    {this.state.framePortPosition !== FramePortPosition.Bottom && <ButtonLineComponent label="Move Node Down" onClick={() => {
                                this.props.frameNodePort.onFramePortMoveDownObservable.notifyObservers(this.props.frameNodePort);
                            }} />}
                </LineContainerComponent>
            </div>
        </div>
        );
    }
}