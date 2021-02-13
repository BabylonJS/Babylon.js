import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { AnimationCurveEditorGraphComponent } from "./animationCurveEditorGraphComponent";

require("../scss/canvas.scss");

interface IAnimationCurveEditorCanvasComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorCanvasComponentState {
}

export class AnimationCurveEditorCanvasComponent extends React.Component<
IAnimationCurveEditorCanvasComponentProps,
IAnimationCurveEditorCanvasComponentState
> {

    constructor(props: IAnimationCurveEditorCanvasComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="canvas-zone">
                <AnimationCurveEditorGraphComponent globalState={this.props.globalState} context={this.props.context}/>
            </div>
        );
    }
}