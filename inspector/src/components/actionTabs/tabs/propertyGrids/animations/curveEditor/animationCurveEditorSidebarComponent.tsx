import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { AnimationCurveEditorContext } from "./animationCurveEditorContext";

interface IAnimationCurveEditorSidebarComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorSidebarComponentState {
}

export class AnimationCurveEditorSidebarComponent extends React.Component<
IAnimationCurveEditorSidebarComponentProps,
IAnimationCurveEditorSidebarComponentState
> {

    constructor(props: IAnimationCurveEditorSidebarComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="sidebar">
            </div>
        );
    }
}