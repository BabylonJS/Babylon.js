
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GraphFrame } from '../graphFrame';
import { GlobalState } from '../../globalState';
import { Color3LineComponent } from '../../sharedComponents/color3LineComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';

export interface IFramePropertyTabComponentProps {
    globalState: GlobalState
    frame: GraphFrame;
}

export class FramePropertyTabComponent extends React.Component<IFramePropertyTabComponentProps> {
    private onFrameExpandStateChangedObserver: Nullable<Observer<GraphFrame>>;

    constructor(props: IFramePropertyTabComponentProps) {
        super(props)
    }


    componentDidMount() {
        this.onFrameExpandStateChangedObserver = this.props.frame.onExpandStateChanged.add(() => this.forceUpdate());
    }

    componentWillUnmount() {
        if (this.onFrameExpandStateChangedObserver) {
            this.props.frame.onExpandStateChanged.remove(this.onFrameExpandStateChangedObserver);
            this.onFrameExpandStateChangedObserver = null;
        }
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
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.frame} />
                    <Color3LineComponent globalState={this.props.globalState} label="Color" target={this.props.frame} propertyName="color"></Color3LineComponent>
                    <TextInputLineComponent globalState={this.props.globalState} label="Comments" propertyName="comments" target={this.props.frame}/>
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