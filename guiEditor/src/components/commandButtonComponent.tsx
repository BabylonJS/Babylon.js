import * as React from "react";

interface ICommandButtonComponentProps {
    tooltip: string;
    shortcut?: string;
    icon: string;
    iconLabel?: string;
    isActive: boolean;
    onClick: () => void;
    altStyle? : boolean;
}

export class CommandButtonComponent extends React.Component<ICommandButtonComponentProps> {
    public constructor(props: ICommandButtonComponentProps) {
        super(props);
    }

    public render() {

        const divClassName = this.props.altStyle ? 
        `command-button-alt ${this.props.isActive ? "active" : ""}` :
        `command-button ${this.props.isActive ? "active" : ""}`

        const iconClassName =
        `command-button-icon ${this.props.isActive ? "active" : ""}`;

        return (
            <div className={divClassName} onClick={this.props.onClick} title={`${this.props.tooltip} ${this.props.shortcut ? " (" + this.props.shortcut + ")" : ""}`}>
                <div className={iconClassName}>
                    <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="white" className={this.props.isActive ? "active" : ""}/>
                </div>
                <div className="command-label">
                    {this.props.tooltip}
                </div>
                <div className="command-label">{this.props.tooltip}</div>
            </div>
        );
    }
}
