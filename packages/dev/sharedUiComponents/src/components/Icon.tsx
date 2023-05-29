import { ClassNames } from "./classNames";
import styles from "./Icon.modules.scss";

export type IconProps = {
    color?: "dark" | "light";
    icon: string;
};

export const Icon: React.FC<IconProps> = ({ color = "dark", icon }) => {
    return <img src={icon} style={{ width: "100%", height: "100%" }} className={ClassNames({ light: color === "light" }, styles)} />;
};
