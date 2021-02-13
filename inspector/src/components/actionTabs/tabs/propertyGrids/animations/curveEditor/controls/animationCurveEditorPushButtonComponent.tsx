import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";

interface IAnimationCurveEditorPushButtonComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
    icon: string;
    id?: string;
    className?: string;
    isPushed?: boolean;
    onClick:(state: boolean)=> void;
    tooltip?: string;
}

interface IAnimationCurveEditorPushButtonComponentState {
    isPushed: boolean;
}

export class AnimationCurveEditorPushButtonComponent extends React.Component<
IAnimationCurveEditorPushButtonComponentProps,
IAnimationCurveEditorPushButtonComponentState
> {

    constructor(props: IAnimationCurveEditorPushButtonComponentProps) {
        super(props);

        this.state = { isPushed: !!this.props.isPushed};
    }

    public render() {
        return (
            <div 
                title={this.props.tooltip}
                className={"push-button" + (this.state.isPushed ? " active" : "") + (this.props.className ? " " + this.props.className : "")} 
                id={this.props.id} 
                onClick={() => {
                    this.props.onClick(!this.state.isPushed)
                    this.setState({isPushed: !this.state.isPushed});
                }}>
                <img className="push-button-image" src={this.props.icon} />
            </div>
        );
    }
}