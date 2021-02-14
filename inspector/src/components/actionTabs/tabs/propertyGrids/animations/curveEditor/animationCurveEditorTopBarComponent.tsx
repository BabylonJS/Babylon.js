import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { AnimationCurveEditorContext } from "./animationCurveEditorContext";
import { AnimationCurveEditorActionButtonComponent } from "./controls/animationCurveEditorActionButtonComponent";

require("./scss/topBar.scss");

const logoIcon = require("./assets/babylonLogo.svg");
const frameIcon = require("./assets/frameIcon.svg");

interface IAnimationCurveEditorTopBarComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorTopBarComponentState {
}

export class AnimationCurveEditorTopBarComponent extends React.Component<
IAnimationCurveEditorTopBarComponentProps,
IAnimationCurveEditorTopBarComponentState
> {

    constructor(props: IAnimationCurveEditorTopBarComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="top-bar">
                <img id="logo" src={logoIcon}/>
                <div id="parent-name">
                    {this.props.context.title}
                </div>
                <AnimationCurveEditorActionButtonComponent 
                    tooltip="Frame canvas"
                    id="frame-canvas" globalState={this.props.globalState} context={this.props.context} 
                    icon={frameIcon} onClick={() => this.props.context.onFrameRequired.notifyObservers()}/>
            </div>
        );
    }
}