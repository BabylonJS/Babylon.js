import { ReactChild } from "react";
import { ClassNames } from "./classNames";
import styles from "./Label.scss";

export interface ILabelProps {
    text: string;
    children?: ReactChild;
    color?: "dark" | "light";
}

export function Label(props: ILabelProps) {
    const { text, children, color } = props;
    return (
        <label className={ClassNames({label: true, light: color === "light", dark: color === "dark"}, styles)}>
            <span>{text}</span>
            {children}
        </label>
    );
}