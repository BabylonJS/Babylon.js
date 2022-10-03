import * as React from "react";
import { ClassNames } from "../classNames";

import style from "./CommandButton.modules.scss";

export interface ICommandButtonComponentProps {
    tooltip: string;
    shortcut?: string;
    icon: string;
    iconLabel?: string;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export const CommandButtonComponent: React.FC<ICommandButtonComponentProps> = (props) => {
    return (
        <div
            className={ClassNames({ commandButton: true, active: props.isActive, disabled: props.disabled }, style)}
            onClick={props.onClick}
            title={`${props.tooltip} ${props.shortcut ? " (" + props.shortcut + ")" : ""}`}
        >
            <div className={ClassNames({ commandButtonIcon: true }, style)}>
                <img src={props.icon} title={props.iconLabel} alt={props.iconLabel} draggable={false} />
            </div>
        </div>
    );
};
