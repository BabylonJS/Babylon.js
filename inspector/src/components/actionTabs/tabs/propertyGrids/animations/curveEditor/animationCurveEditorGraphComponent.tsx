import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { AnimationCurveEditorContext } from "./animationCurveEditorContext";

interface IAnimationCurveEditorGraphComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorGraphComponentState {
}

export class AnimationCurveEditorGraphComponent extends React.Component<
IAnimationCurveEditorGraphComponentProps,
IAnimationCurveEditorGraphComponentState
> {

    constructor(props: IAnimationCurveEditorGraphComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="canvas-zone">
            </div>
        );
    }
}