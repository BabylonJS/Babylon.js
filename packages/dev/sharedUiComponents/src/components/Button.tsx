import styles from "./Button.modules.scss";
import { ClassNames } from "./classNames";

export type ButtonProps = {
    disabled?: boolean;
    active?: boolean;
    onClick?: () => void;
    color: "light" | "dark";
    size: "default" | "small" | "wide";
    title?: string;
};

export const Button: React.FC<ButtonProps> = ({ disabled, active, onClick, children, color, size, title }) => {
    return (
        <button
            className={ClassNames({ button: true, active, wide: size === "wide", small: size === "small", light: color === "light", dark: color === "dark" }, styles)}
            disabled={disabled}
            onClick={onClick}
            title={title}
        >
            {children}
        </button>
    );
};
