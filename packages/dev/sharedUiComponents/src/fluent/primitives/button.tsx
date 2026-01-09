import { Button as FluentButton, Spinner } from "@fluentui/react-components";
import type { MouseEvent } from "react";
import { forwardRef, useCallback, useContext, useState } from "react";
import type { FluentIcon } from "@fluentui/react-icons";
import type { BasePrimitiveProps } from "./primitive";
import { ToolContext } from "../hoc/fluentToolWrapper";

export type ButtonProps = BasePrimitiveProps & {
    onClick?: (e?: MouseEvent<HTMLButtonElement>) => unknown | Promise<unknown>;
    icon?: FluentIcon;
    appearance?: "subtle" | "transparent" | "primary";
    label?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { size } = useContext(ToolContext);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { icon: Icon, label, onClick, disabled, ...buttonProps } = props;

    const [isOnClickBusy, setIsOnClickBusy] = useState(false);
    const handleOnClick = useCallback(
        async (e: MouseEvent<HTMLButtonElement>) => {
            const result = onClick?.();
            if (result instanceof Promise) {
                setIsOnClickBusy(true);
                try {
                    await result;
                } finally {
                    setIsOnClickBusy(false);
                }
            }
        },
        [onClick]
    );

    return (
        <FluentButton
            ref={ref}
            iconPosition="after"
            {...buttonProps}
            size={size}
            icon={isOnClickBusy ? <Spinner size="extra-tiny" /> : Icon && <Icon />}
            onClick={handleOnClick}
            disabled={disabled || isOnClickBusy}
        >
            {label && props.label}
        </FluentButton>
    );
});

Button.displayName = "Button";
