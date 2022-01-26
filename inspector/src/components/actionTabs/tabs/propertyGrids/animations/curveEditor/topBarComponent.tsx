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
const stepTangentIcon = require("./assets/stepTangentIcon.svg");

interface ITopBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ITopBarComponentState {
    keyFrameValue: string;
    keyValue: string;
    frameControlEnabled: boolean;
    valueControlEnabled: boolean;
}

export class TopBarComponent extends React.Component<ITopBarComponentProps, ITopBarComponentState> {
    private _onFrameSetObserver: Nullable<Observer<number>>;
    private _onValueSetObserver: Nullable<Observer<number>>;
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;
    private onActiveKeyPointChanged: Nullable<Observer<void>>;

    constructor(props: ITopBarComponentProps) {
        super(props);

        this.state = { keyFrameValue: "", keyValue: "", frameControlEnabled: false, valueControlEnabled: false };

        this._onFrameSetObserver = this.props.context.onFrameSet.add((newFrameValue) => {
            this.setState({ keyFrameValue: newFrameValue.toFixed(0) });
        });

        this._onValueSetObserver = this.props.context.onValueSet.add((newValue) => {
            this.setState({ keyValue: newValue.toFixed(2) });
        });

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
            this.setState({ keyFrameValue: "", keyValue: "" });
        });

        this.onActiveKeyPointChanged = this.props.context.onActiveKeyPointChanged.add(() => {
            const numKeys = this.props.context.activeKeyPoints?.length || 0;
            const numAnims = new Set(this.props.context.activeKeyPoints?.map(keyPointComponent => keyPointComponent.props.curve.animation.uniqueId)).size;
            
            const frameControlEnabled = (numKeys === 1 && numAnims === 1) || (numKeys > 1 && numAnims > 1);
            const valueControlEnabled = numKeys > 0;
            
            this.setState({ keyFrameValue: "", keyValue: "", frameControlEnabled, valueControlEnabled });
        });
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
        const hasActiveAnimations = this.props.context.activeAnimations.length > 0;
        return (
            <div id="top-bar">
                <img id="top-bar-logo" src={logoIcon} />
                <div id="top-bar-parent-name">{this.props.context.title}</div>
                <TextInputComponent
                    className={hasActiveAnimations && this.state.frameControlEnabled ? "" : "disabled"}
                    isNumber={true}
                    value={this.state.keyFrameValue}
                    tooltip="Frame"
                    id="key-frame"
                    onValueAsNumberChanged={(newValue) => this.props.context.onFrameManuallyEntered.notifyObservers(newValue)}
                    globalState={this.props.globalState}
                    context={this.props.context}
                />
                <TextInputComponent
                    className={hasActiveAnimations && this.state.valueControlEnabled ? "" : "disabled"}
                    isNumber={true}
                    value={this.state.keyValue}
                    tooltip="Value"
                    id="key-value"
                    onValueAsNumberChanged={(newValue) => this.props.context.onValueManuallyEntered.notifyObservers(newValue)}
                    globalState={this.props.globalState}
                    context={this.props.context}
                />
                <ActionButtonComponent
                    className={hasActiveAnimations ? "" : "disabled"}
                    tooltip="New key"
                    id="new-key"
                    globalState={this.props.globalState}
                    context={this.props.context}
                    icon={newKeyIcon}
                    onClick={() => this.props.context.onCreateOrUpdateKeyPointRequired.notifyObservers()}
                />
                <ActionButtonComponent
                    tooltip="Frame canvas"
                    id="frame-canvas"
                    globalState={this.props.globalState}
                    context={this.props.context}
                    icon={frameIcon}
                    onClick={() => this.props.context.onFrameRequired.notifyObservers()}
                />
                <ActionButtonComponent
                    className={this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 0 ? "" : "disabled"}
                    tooltip="Flatten tangent"
                    id="flatten-tangent"
                    globalState={this.props.globalState}
                    context={this.props.context}
                    icon={flatTangentIcon}
                    onClick={() => this.props.context.onFlattenTangentRequired.notifyObservers()}
                />
                <ActionButtonComponent
                    className={this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 0 ? "" : "disabled"}
                    tooltip="Linear tangent"
                    id="linear-tangent"
                    globalState={this.props.globalState}
                    context={this.props.context}
                    icon={linearTangentIcon}
                    onClick={() => this.props.context.onLinearTangentRequired.notifyObservers()}
                />
                <ActionButtonComponent
                    className={this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 0 ? "" : "disabled"}
                    tooltip="Break tangent"
                    id="break-tangent"
                    globalState={this.props.globalState}
                    context={this.props.context}
                    icon={breakTangentIcon}
                    onClick={() => this.props.context.onBreakTangentRequired.notifyObservers()}
                />
                <ActionButtonComponent
                    className={this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 0 ? "" : "disabled"}
                    tooltip="Unify tangent"
                    id="unify-tangent"
                    globalState={this.props.globalState}
                    context={this.props.context}
                    icon={unifyTangentIcon}
                    onClick={() => this.props.context.onUnifyTangentRequired.notifyObservers()}
                />
                <ActionButtonComponent
                    className={this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 0 ? "" : "disabled"}
                    tooltip="Step tangent"
                    id="step-tangent"
                    globalState={this.props.globalState}
                    context={this.props.context}
                    icon={stepTangentIcon}
                    onClick={() => this.props.context.onStepTangentRequired.notifyObservers()}
                />
            </div>
        );
    }
}
