import { Button as FluentButton, makeStyles, mergeClasses, Spinner } from "@fluentui/react-components";
import type { MouseEvent } from "react";
import { forwardRef, useCallback, useContext, useState } from "react";
import type { FluentIcon } from "@fluentui/react-icons";
import type { BasePrimitiveProps } from "./primitive";
import { ToolContext } from "../hoc/fluentToolWrapper";

const useButtonStyles = makeStyles({
    iconOnly: {
        minWidth: "unset",
    },
    smallIcon: {
        fontSize: "16px",
    },
    mediumIcon: {
        fontSize: "20px",
    },
});

export type ButtonProps = BasePrimitiveProps & {
    onClick?: (e?: MouseEvent<HTMLButtonElement>) => unknown | Promise<unknown>;
    icon?: FluentIcon;
    appearance?: "subtle" | "transparent" | "primary";
    label?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { size } = useContext(ToolContext);
    const classes = useButtonStyles();
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { icon: Icon, label, onClick, disabled, className, ...buttonProps } = props;

    const isIconOnly = Icon && !label;

    const [isOnClickBusy, setIsOnClickBusy] = useState(false);
    const handleOnClick = useCallback(
        async (e: MouseEvent<HTMLButtonElement>) => {
            const result = onClick?.(e);
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

    const iconClass = size === "small" ? classes.smallIcon : classes.mediumIcon;

    return (
        <FluentButton
            ref={ref}
            iconPosition="after"
            {...buttonProps}
            className={mergeClasses(isIconOnly ? classes.iconOnly : undefined, className)}
            size={size}
            icon={isOnClickBusy ? <Spinner size="extra-tiny" /> : Icon && <Icon className={iconClass} />}
            onClick={handleOnClick}
            disabled={disabled || isOnClickBusy}
        >
            {label && props.label}
        </FluentButton>
    );
});

Button.displayName = "Button";
