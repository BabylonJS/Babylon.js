import type { ReactChild } from "react";
import { ClassNames } from "./classNames";
import * as styles from "./Label.module.scss";

export type LabelProps = {
    text: string;
    children?: ReactChild;
    color?: "dark" | "light";
};

export const Label: React.FC<LabelProps> = ({ text, children, color }) => {
    return (
        <label className={ClassNames({ label: true, light: color === "light", dark: color === "dark" }, styles)}>
            <span>{text}</span>
            {children}
        </label>
    );
};
