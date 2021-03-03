import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";

interface IControlButtonComponentProps {
    globalState: GlobalState;
    context: Context;
    icon: string;
    hoverIcon: string;
    id?: string;
    className?: string;
    onClick:()=> void;
    tooltip?: string;
}

interface IControlButtonComponentState {
}

export class ControlButtonComponent extends React.Component<
IControlButtonComponentProps,
IControlButtonComponentState
> {

    constructor(props: IControlButtonComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div 
                title={this.props.tooltip}
                className={"control-button" + (this.props.className ? " " + this.props.className : "")} 
                id={this.props.id} 
                onClick={() => this.props.onClick()}>
                <img className="control-button-image" src={this.props.icon} />
                <img className="control-button-hover-image" src={this.props.hoverIcon} />
            </div>
        );
    }
}