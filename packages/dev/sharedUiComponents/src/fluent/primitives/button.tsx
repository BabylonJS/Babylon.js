import { Button as FluentButton } from "@fluentui/react-components";
import { forwardRef, useContext } from "react";
import type { FluentIcon } from "@fluentui/react-icons";
import type { BasePrimitiveProps } from "./primitive";
import { ToolContext } from "../hoc/fluentToolWrapper";

export type ButtonProps = BasePrimitiveProps & {
    onClick?: () => void;
    icon?: FluentIcon;
    appearance?: "subtle" | "transparent" | "primary";
    label?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { size } = useContext(ToolContext);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { icon: Icon, label, ...buttonProps } = props;
    return (
        <FluentButton ref={ref} iconPosition="after" {...buttonProps} size={size} icon={Icon && <Icon />}>
            {label && props.label}
        </FluentButton>
    );
});

Button.displayName = "Button";
