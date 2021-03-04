import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";

interface IActionButtonComponentProps {
    globalState: GlobalState;
    context: Context;
    icon: string;
    id?: string;
    className?: string;
    isActive?: boolean;
    onClick:()=> void;
    tooltip?: string;
}

interface IActionButtonComponentState {
}

export class ActionButtonComponent extends React.Component<
IActionButtonComponentProps,
IActionButtonComponentState
> {

    constructor(props: IActionButtonComponentProps) {
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