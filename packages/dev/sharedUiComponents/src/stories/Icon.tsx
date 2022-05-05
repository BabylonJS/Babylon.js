import "./Icon.css";
export interface IIconProps {
    color?: "dark" | "light";
    icon: string;
}

export function Icon({color = "dark", icon} : IIconProps) {
    return <img src={icon} style={{width: "30px", height: "30px"}} className={color}/>
}