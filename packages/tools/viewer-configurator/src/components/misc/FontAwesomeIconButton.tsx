import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

const ClassName = "faIconButton";

export type IFontAwesomeIconButtonProps = FontAwesomeIconProps & {
    onClick: () => void;
    disabled?: boolean;
};

export function FontAwesomeIconButton(props: IFontAwesomeIconButtonProps): JSX.Element {
    const { onClick, ...iconProps } = props;
    iconProps.className = `${props.className ?? ""} ${ClassName} ${props.disabled ? "disabled" : ""}`;

    return (
        <div style={{ display: "contents", cursor: "pointer" }} onClick={onClick}>
            <FontAwesomeIcon {...iconProps} />
        </div>
    );
}
