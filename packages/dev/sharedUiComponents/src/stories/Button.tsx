import { ReactChild } from "react";
import styles from "./Button.scss";
import { ClassNames } from "./classNames";

export interface IButtonProps {
    disabled?: boolean;
    active?: boolean;
    onClick?: () => void;
    children: ReactChild;
    color: "light" | "dark";
    size: "default" | "small" | "wide";
}

export function Button(props: IButtonProps) {
    const { disabled, active, onClick, children, color, size } = props;
    return (
        <button
            className={ClassNames({ button: true, active, wide: size === "wide", small: size === "small", light: color === "light", dark: color === "dark" }, styles)}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
