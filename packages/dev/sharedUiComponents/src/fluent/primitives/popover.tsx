import type { FunctionComponent, PropsWithChildren } from "react";
import { useState } from "react";
import { Popover as FluentPopover, PopoverTrigger, PopoverSurface, makeStyles, tokens } from "@fluentui/react-components";
import { Settings20Regular } from "@fluentui/react-icons";
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

export const Popover: FunctionComponent<PropsWithChildren<{ icon: FluentIcon }>> = (props) => {
    const { children } = props;
    const [popoverOpen, setPopoverOpen] = useState(false);
    const classes = useStyles();

    return (
        <FluentPopover open={popoverOpen} onOpenChange={(_, data) => setPopoverOpen(data.open)} positioning="below-start" trapFocus>
            <PopoverTrigger disableButtonEnhancement>
                <Button icon={Settings20Regular} onClick={() => setPopoverOpen(true)} />
            </PopoverTrigger>
            <PopoverSurface className={classes.surface}>
                <div className={classes.content}>{children}</div>
            </PopoverSurface>
        </FluentPopover>
    );
};
