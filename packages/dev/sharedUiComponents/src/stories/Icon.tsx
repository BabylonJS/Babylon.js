import { ClassNames } from "./classNames";
import styles from "./Icon.scss";

export interface IIconProps {
    color?: "dark" | "light";
    icon: string;
}

export function Icon({ color = "dark", icon }: IIconProps) {
    return <img src={icon} style={{ width: "30px", height: "30px" }} className={ClassNames({ light: color === "light" }, styles)} />;
}
