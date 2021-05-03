import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { Context } from "./context";
import { ActionButtonComponent } from "./controls/actionButtonComponent";
import { TextInputComponent } from "./controls/textInputComponent";

require("./scss/topBar.scss");

const logoIcon = require("./assets/babylonLogo.svg");
const frameIcon = require("./assets/frameIcon.svg");
const newKeyIcon = require("./assets/newKeyIcon.svg");
const flatTangentIcon = require("./assets/flatTangentIcon.svg");
const linearTangentIcon = require("./assets/linearTangentIcon.svg");
const breakTangentIcon = require("./assets/breakTangentIcon.svg");
const unifyTangentIcon = require("./assets/unifyTangentIcon.svg");

interface ITopBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ITopBarComponentState {
    keyFrameValue: string;
    keyValue: string;
    editControlsVisible: boolean;
}

export class TopBarComponent extends React.Component<
ITopBarComponentProps,
ITopBarComponentState
> {
    private _onFrameSetObserver: Nullable<Observer<number>>;
    private _onValueSetObserver: Nullable<Observer<number>>;
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;
    private onActiveKeyPointChanged: Nullable<Observer<void>>;

    constructor(props: ITopBarComponentProps) {
        super(props);

        this.state = {keyFrameValue: "", keyValue: "", editControlsVisible: false };

        this._onFrameSetObserver = this.props.context.onFrameSet.add(newFrameValue => {
            this.setState({keyFrameValue: newFrameValue.toFixed(0)});
        });

        this._onValueSetObserver = this.props.context.onValueSet.add(newValue => {
            this.setState({keyValue: newValue.toFixed(2)});
        });

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
            this.setState({keyFrameValue: "", keyValue: ""});
        });

        this.onActiveKeyPointChanged = this.props.context.onActiveKeyPointChanged.add(() => {
            this.setState({keyFrameValue: "", keyValue: "", editControlsVisible: this.props.context.activeKeyPoints?.length === 1});
        })
    }

    componentWillUnmount() {
        if (this._onFrameSetObserver) {
            this.props.context.onFrameSet.remove(this._onFrameSetObserver);
        }
        if (this._onValueSetObserver) {
            this.props.context.onValueSet.remove(this._onValueSetObserver);
        }
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
        if (this.onActiveKeyPointChanged) {
            this.props.context.onActiveKeyPointChanged.remove(this.onActiveKeyPointChanged);
        }
    }

    public render() {
        return (
            <div id="top-bar">
                <img id="logo" src={logoIcon}/>
                <div id="parent-name">
                    {this.props.context.title}
                </div>
                {
                    this.props.context.activeAnimation && this.state.editControlsVisible && 
                    <>
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
                    </>  
                }  
                {
                    this.props.context.activeAnimation &&
                    <ActionButtonComponent 
                    tooltip="New key"
                    id="new-key" globalState={this.props.globalState} context={this.props.context} 
                    icon={newKeyIcon} onClick={() => this.props.context.onNewKeyPointRequired.notifyObservers()}/>                
                }
                <ActionButtonComponent 
                    tooltip="Frame canvas"
                    id="frame-canvas" globalState={this.props.globalState} context={this.props.context} 
                    icon={frameIcon} onClick={() => this.props.context.onFrameRequired.notifyObservers()}/>
                {
                    this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 0 &&
                    <>
                        <ActionButtonComponent 
                            tooltip="Flatten tangent"
                            id="flatten-tangent" globalState={this.props.globalState} context={this.props.context} 
                            icon={flatTangentIcon} onClick={() => this.props.context.onFlattenTangentRequired.notifyObservers()}/>
                        <ActionButtonComponent 
                            tooltip="Linear tangent"
                            id="linear-tangent" globalState={this.props.globalState} context={this.props.context} 
                            icon={linearTangentIcon} onClick={() => this.props.context.onLinearTangentRequired.notifyObservers()}/>
                        <ActionButtonComponent 
                            tooltip="Break tangent"
                            id="break-tangent" globalState={this.props.globalState} context={this.props.context} 
                            icon={breakTangentIcon} onClick={() => this.props.context.onBreakTangentRequired.notifyObservers()}/>
                        <ActionButtonComponent 
                            tooltip="Unify tangent"
                            id="unify-tangent" globalState={this.props.globalState} context={this.props.context} 
                            icon={unifyTangentIcon} onClick={() => this.props.context.onUnifyTangentRequired.notifyObservers()}/>                            
                    </>
                }
            </div>
        );
    }
}