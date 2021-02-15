import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { Context } from "./context";
import { ActionButtonComponent } from "./controls/actionButtonComponent";
import { TextInputComponent } from "./controls/textInputComponent";

require("./scss/topBar.scss");

const logoIcon = require("./assets/babylonLogo.svg");
const frameIcon = require("./assets/frameIcon.svg");

interface ITopBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ITopBarComponentState {
    keyFrameValue: string;
    keyValue: string;
}

export class TopBarComponent extends React.Component<
ITopBarComponentProps,
ITopBarComponentState
> {
    constructor(props: ITopBarComponentProps) {
        super(props);

        this.state = {keyFrameValue: "", keyValue: "" };

        this.props.context.onFrameSet.add(newFrameValue => {
            this.setState({keyFrameValue: newFrameValue.toFixed(2)});
        });

        this.props.context.onValueSet.add(newValue => {
            this.setState({keyValue: newValue.toFixed(2)});
        });

        this.props.context.onActiveAnimationChanged.add(() => {
            this.setState({keyFrameValue: "", keyValue: ""});
        });

        this.props.context.onActiveKeyPointChanged.add(() => {
            this.setState({keyFrameValue: "", keyValue: ""});
        })
    }

    public render() {
        return (
            <div id="top-bar">
                <img id="logo" src={logoIcon}/>
                <div id="parent-name">
                    {this.props.context.title}
                </div>
                <TextInputComponent 
                    isNumber={true}
                    value={this.state.keyFrameValue}
                    tooltip="Frame"
                    id="key-frame"
                    onValueAsNumberChanged={newValue => this.props.context.onFrameManuallyEntered.notifyObservers(newValue)}
                    globalState={this.props.globalState} context={this.props.context} />  
                <TextInputComponent 
                    isNumber={true}
                    value={this.state.keyValue}
                    tooltip="Value"
                    id="key-value"
                    onValueAsNumberChanged={newValue => this.props.context.onValueManuallyEntered.notifyObservers(newValue)}
                    globalState={this.props.globalState} context={this.props.context} />                      
                <ActionButtonComponent 
                    tooltip="Frame canvas"
                    id="frame-canvas" globalState={this.props.globalState} context={this.props.context} 
                    icon={frameIcon} onClick={() => this.props.context.onFrameRequired.notifyObservers()}/>
            </div>
        );
    }
}