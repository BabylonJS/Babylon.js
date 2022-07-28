import * as React from "react";

interface ICommandButtonComponentProps {
    tooltip: string;
    shortcut?: string;
    icon: string;
    iconLabel?: string;
    isActive: boolean;
    copyDeleteDisabled?: boolean;
    pasteDisabled?: boolean;
    onClick: () => void;
    altStyle?: boolean;
    disabled?: boolean;
}

export class CommandButtonComponent extends React.Component<ICommandButtonComponentProps> {
    public constructor(props: ICommandButtonComponentProps) {
        super(props);
    }

    public render() {
        let divClassName = this.props.altStyle ? `command-button-alt${this.props.disabled ? "-disabled" : ""}${this.props.isActive ? "-" : ""}` : `command-button`;

        let iconClassName = `command-button-icon `;

        if (this.props.isActive) {
            divClassName += " active";
            iconClassName += " active";
        }
        if (this.props.disabled) {
            divClassName += " disabled";
        } else if (this.props.copyDeleteDisabled) {
            divClassName += " copyAndDeleteDisabled";
        } else if (this.props.pasteDisabled) {
            divClassName += " pasteDisabled";
        }
        return (
            <div className={divClassName} onClick={this.props.onClick} title={`${this.props.tooltip} ${this.props.shortcut ? " (" + this.props.shortcut + ")" : ""}`}>
                <div className={iconClassName}>
                    <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className={this.props.isActive ? "active" : ""} draggable={false} />
                </div>
                <div className="command-label">{this.props.tooltip}</div>
                <div className="command-label">{this.props.tooltip}</div>
            </div>
        );
    }
}
