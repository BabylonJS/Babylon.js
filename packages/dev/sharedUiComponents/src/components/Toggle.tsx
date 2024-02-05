import styles from "./Toggle.modules.scss";
import { ClassNames } from "./classNames";

import toggleOnIcon30px from "../imgs/toggleOnIcon_30px.svg";
import toggleMixedIcon30px from "../imgs/toggleMixedIcon_30px.svg";
import toggleOffIcon30px from "../imgs/toggleOffIcon_30px.svg";
import { Icon } from "./Icon";

const Icons = {
    on: toggleOnIcon30px,
    mixed: toggleMixedIcon30px,
    off: toggleOffIcon30px,
};

export type ToggleProps = {
    toggled: "on" | "mixed" | "off";
    onToggle?: () => void;
    padded?: boolean;
    color?: "dark" | "light";
};

export const Toggle: React.FC<ToggleProps> = ({ color = "dark", toggled = "off", padded = false, onToggle = () => {} }) => {
    return (
        <label className={ClassNames({ toggle: true, padded }, styles)}>
            <input type="checkbox" style={{ display: "none" }} checked={toggled === "on"} onChange={() => onToggle()} />
            <Icon icon={Icons[toggled]} color={color} />
        </label>
    );
};
