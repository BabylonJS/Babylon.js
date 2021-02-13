import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";

interface IAnimationCurveEditorActionButtonComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
    icon: string;
    id?: string;
    className?: string;
    isActive?: boolean;
    onClick:()=> void;
    tooltip?: string;
}

interface IAnimationCurveEditorActionButtonComponentState {
}

export class AnimationCurveEditorActionButtonComponent extends React.Component<
IAnimationCurveEditorActionButtonComponentProps,
IAnimationCurveEditorActionButtonComponentState
> {

    constructor(props: IAnimationCurveEditorActionButtonComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div 
                title={this.props.tooltip}
                className={"action-button" + (this.props.isActive ? " active" : "") + (this.props.className ? " " + this.props.className : "")} 
                id={this.props.id} 
                onClick={() => this.props.onClick()}>
                <img className="action-button-image" src={this.props.icon} />
            </div>
        );
    }
}