import type { PropsWithChildren, ReactElement } from "react";
import { forwardRef, useState } from "react";
import { Popover as FluentPopover, PopoverTrigger, PopoverSurface, makeStyles, tokens } from "@fluentui/react-components";
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
};

type PopoverWithTriggerProps = {
    icon?: never;
    trigger: ReactElement;
};

type PopoverProps = PopoverWithIconProps | PopoverWithTriggerProps;

export const Popover = forwardRef<HTMLButtonElement, PropsWithChildren<PopoverProps>>((props, ref) => {
    const { children } = props;
    const [popoverOpen, setPopoverOpen] = useState(false);
    const classes = useStyles();

    return (
        <FluentPopover
            open={popoverOpen}
            onOpenChange={(_, data) => setPopoverOpen(data.open)}
            positioning={{
                align: "start",
                overflowBoundary: document.body,
                autoSize: true,
            }}
            trapFocus
        >
            <PopoverTrigger disableButtonEnhancement>{props.trigger ?? <Button ref={ref} icon={props.icon} onClick={() => setPopoverOpen(true)} />}</PopoverTrigger>
            <PopoverSurface className={classes.surface}>
                <div className={classes.content}>{children}</div>
            </PopoverSurface>
        </FluentPopover>
    );
});
