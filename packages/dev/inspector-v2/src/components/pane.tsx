import type { ComponentProps } from "react";

import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { forwardRef } from "react";

const useStyles = makeStyles({
    paneRootDiv: {
        display: "flex",
        flex: 1,
        flexDirection: "column",
        padding: `0 ${tokens.spacingHorizontalM}`,
    },
});

/**
 * Used to apply common styles to panes.
 */
export const SidePaneContainer = forwardRef<HTMLDivElement, ComponentProps<"div">>((props, ref) => {
    const { className, ...rest } = props;
    const classes = useStyles();

    return (
        <div className={mergeClasses(classes.paneRootDiv, className)} ref={ref} {...rest}>
            {props.children}
        </div>
    );
});
