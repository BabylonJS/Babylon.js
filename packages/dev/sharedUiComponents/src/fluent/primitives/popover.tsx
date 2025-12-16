import type { FunctionComponent, PropsWithChildren, ReactElement } from "react";
import { useContext, useState } from "react";
import { Popover as FluentPopover, PopoverTrigger, PopoverSurface, makeStyles, tokens } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { OverlayContext } from "../hoc/fluentToolWrapper";

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

export const Popover: FunctionComponent<PropsWithChildren<PopoverProps>> = (props) => {
    const { children } = props;
    const [popoverOpen, setPopoverOpen] = useState(false);
    const classes = useStyles();
    const { mountNode } = useContext(OverlayContext);

    return (
        <FluentPopover
            mountNode={mountNode}
            open={popoverOpen}
            onOpenChange={(_, data) => setPopoverOpen(data.open)}
            positioning={{
                align: "start",
                overflowBoundary: document.body,
                autoSize: true,
            }}
            trapFocus
        >
            <PopoverTrigger disableButtonEnhancement>{props.trigger ?? <Button icon={props.icon} onClick={() => setPopoverOpen(true)} />}</PopoverTrigger>
            <PopoverSurface className={classes.surface}>
                <div className={classes.content}>{children}</div>
            </PopoverSurface>
        </FluentPopover>
    );
};
