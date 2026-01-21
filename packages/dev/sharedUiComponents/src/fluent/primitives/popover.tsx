import type { PropsWithChildren, ReactElement } from "react";
import { forwardRef, useState } from "react";
import { Popover as FluentPopover, PopoverTrigger, PopoverSurface, makeStyles, tokens } from "@fluentui/react-components";
import type { PositioningShorthand } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";
import { Button } from "shared-ui-components/fluent/primitives/button";

const useStyles = makeStyles({
    surface: {
        maxWidth: "400px",
    },
    content: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
        padding: tokens.spacingHorizontalL,
        minWidth: "300px",
    },
});

type PopoverWithIconProps = {
    icon: FluentIcon;
    trigger?: never;
    positioningTarget?: never;
};

type PopoverWithTriggerProps = {
    icon?: never;
    trigger: ReactElement;
    positioningTarget?: never;
};

type PopoverWithPositioningTargetProps = {
    icon?: never;
    trigger?: never;
    /** External element to position the popover relative to (no trigger rendered) */
    positioningTarget: HTMLElement | null;
};

type PopoverBaseProps = {
    /** Controlled open state */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Positioning of the popover */
    positioning?: PositioningShorthand;
    /** Custom class for the surface */
    surfaceClassName?: string;
};

type PopoverProps = PopoverBaseProps & (PopoverWithIconProps | PopoverWithTriggerProps | PopoverWithPositioningTargetProps);

export const Popover = forwardRef<HTMLButtonElement, PropsWithChildren<PopoverProps>>((props, ref) => {
    const { children, open: controlledOpen, onOpenChange, positioning, surfaceClassName } = props;
    const [internalOpen, setInternalOpen] = useState(false);
    const classes = useStyles();

    const isControlled = controlledOpen !== undefined;
    const popoverOpen = isControlled ? controlledOpen : internalOpen;

    const handleOpenChange = (_: unknown, data: { open: boolean }) => {
        if (!isControlled) {
            setInternalOpen(data.open);
        }
        onOpenChange?.(data.open);
    };

    // When using positioningTarget, render without a trigger
    if (props.positioningTarget !== undefined) {
        const positioningConfig = positioning && typeof positioning === "object" ? positioning : {};
        return (
            <FluentPopover
                open={popoverOpen}
                onOpenChange={handleOpenChange}
                positioning={{
                    target: props.positioningTarget ?? undefined,
                    position: "after",
                    ...positioningConfig,
                }}
                trapFocus
            >
                <PopoverSurface className={surfaceClassName ?? classes.surface}>
                    <div className={classes.content}>{children}</div>
                </PopoverSurface>
            </FluentPopover>
        );
    }

    return (
        <FluentPopover
            open={popoverOpen}
            onOpenChange={handleOpenChange}
            positioning={
                positioning ?? {
                    align: "start",
                    overflowBoundary: document.body,
                    autoSize: true,
                }
            }
            trapFocus
        >
            <PopoverTrigger disableButtonEnhancement>
                {props.trigger ?? <Button ref={ref} icon={props.icon} onClick={() => handleOpenChange(null, { open: true })} />}
            </PopoverTrigger>
            <PopoverSurface className={surfaceClassName ?? classes.surface}>
                <div className={classes.content}>{children}</div>
            </PopoverSurface>
        </FluentPopover>
    );
});

Popover.displayName = "Popover";
