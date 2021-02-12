import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { AnimationCurveEditorContext } from "./animationCurveEditorContext";

interface IAnimationCurveEditorBottomBarComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorBottomBarComponentState {
}

export class AnimationCurveEditorBottomBarComponent extends React.Component<
IAnimationCurveEditorBottomBarComponentProps,
IAnimationCurveEditorBottomBarComponentState
> {

    constructor(props: IAnimationCurveEditorBottomBarComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="bottom-bar">
            </div>
        );
    }
}