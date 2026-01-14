import type { FunctionComponent, ReactNode } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
    row: { display: "flex", alignItems: "center", gap: "4px" },
});

type QuickCreateSectionProps = {
    children: ReactNode;
};

/**
 * Container component for quick create sections that provides consistent column layout with spacing
 * @param props - Component props
 * @returns React component
 */
export const QuickCreateSection: FunctionComponent<QuickCreateSectionProps> = ({ children }) => {
    const classes = useStyles();
    return <div className={classes.section}>{children}</div>;
};

type QuickCreateRowProps = {
    children: ReactNode;
};

/**
 * Container component for quick create rows that provides consistent row layout for button + settings popover
 * @param props - Component props
 * @returns React component
 */
export const QuickCreateRow: FunctionComponent<QuickCreateRowProps> = ({ children }) => {
    const classes = useStyles();
    return <div className={classes.row}>{children}</div>;
};
