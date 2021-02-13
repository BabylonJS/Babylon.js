import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { AnimationCurveEditorAnimationEntryComponent } from "./animationCurveEditorAnimationEntryComponent";

interface IAnimationCurveEditorListComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorListComponentState {
}

export class AnimationCurveEditorListComponent extends React.Component<
IAnimationCurveEditorListComponentProps,
IAnimationCurveEditorListComponentState
> {

    constructor(props: IAnimationCurveEditorListComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="animation-list">
                {
                    this.props.context.animations?.map((a, i) => {
                        return (
                            <AnimationCurveEditorAnimationEntryComponent key={i} globalState={this.props.globalState} context={this.props.context} animation={a}/>
                        );
                    })
                }
            </div>
        );
    }
}