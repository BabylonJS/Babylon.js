import { makeStyles, tokens } from "@fluentui/react-components";
import { forwardRef, type PropsWithChildren } from "react";

const useStyles = makeStyles({
    paneRootDiv: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    },
});

/**
 * Used to apply common styles to panes.
 */
export const Pane = forwardRef<HTMLDivElement, PropsWithChildren>((props, ref) => {
    const classes = useStyles();

    return (
        <div className={classes.paneRootDiv} ref={ref}>
            {props.children}
        </div>
    );
});
