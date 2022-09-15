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

export const CommandButtonComponent: React.FC<ICommandButtonComponentProps> = (props) => {
    let divClassName = props.altStyle ? `command-button-alt${props.disabled ? "-disabled" : ""}${props.isActive ? "-" : ""}` : `command-button`;

    let iconClassName = `command-button-icon `;

    if (props.isActive) {
        divClassName += " active";
        iconClassName += " active";
    }
    if (props.disabled) {
        divClassName += " disabled";
    } else if (props.copyDeleteDisabled) {
        divClassName += " copyAndDeleteDisabled";
    } else if (props.pasteDisabled) {
        divClassName += " pasteDisabled";
    }
    return (
        <div className={divClassName} onClick={props.onClick} title={`${props.tooltip} ${props.shortcut ? " (" + props.shortcut + ")" : ""}`}>
            <div className={iconClassName}>
                <img src={props.icon} title={props.iconLabel} alt={props.iconLabel} className={props.isActive ? "active" : ""} draggable={false} />
            </div>
            <div className="command-label">{props.tooltip}</div>
            <div className="command-label">{props.tooltip}</div>
        </div>
    );
};
