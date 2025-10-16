import { Button as FluentButton } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import type { FluentIcon } from "@fluentui/react-icons";
import type { BasePrimitiveProps } from "./primitive";

export type ButtonProps = BasePrimitiveProps & {
    onClick: () => void;
    icon?: FluentIcon;
    appearance?: "subtle" | "transparent";
    label?: string;
};

export const Button: FunctionComponent<ButtonProps> = (props) => {
    Button.displayName = "Button";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { icon: Icon, label, ...buttonProps } = props;
    return (
        <FluentButton iconPosition="after" {...buttonProps} icon={Icon && <Icon />}>
            {label && props.label}
        </FluentButton>
    );
};
