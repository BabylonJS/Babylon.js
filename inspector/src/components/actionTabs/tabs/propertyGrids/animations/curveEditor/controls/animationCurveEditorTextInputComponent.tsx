import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";

interface IAnimationCurveEditorTextInputComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
    id?: string;
    className?: string;
    tooltip?: string;
    value: string
}

interface IAnimationCurveEditorTextInputComponentState {
    value: string;
}

export class AnimationCurveEditorTextInputComponent extends React.Component<
IAnimationCurveEditorTextInputComponentProps,
IAnimationCurveEditorTextInputComponentState
> {

    constructor(props: IAnimationCurveEditorTextInputComponentProps) {
        super(props);

        this.state = { value: this.props.value};
    }

    public render() {
        return (
            <input 
                type="text"
                title={this.props.tooltip}
                className={"text-input" + (this.props.className ? " " + this.props.className : "")} 
                value={this.props.value || ""}
                id={this.props.id}>
            </input>
        );
    }
}