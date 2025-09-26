import { makeStyles } from "@fluentui/react-components";
import { Collapse as FluentCollapse } from "@fluentui/react-motion-components-preview";
import type { FunctionComponent, PropsWithChildren } from "react";

type CollapseProps = {
    visible: boolean;
    orientation?: "horizontal" | "vertical";
};

const useCollapseStyles = makeStyles({
    collapseContent: {
        overflow: "hidden",
        display: "flex",
    },
    horizontal: {
        flexDirection: "row",
    },
    vertical: {
        flexDirection: "column",
    },
});

/**
 * Wraps the passed in children with a fluent collapse component, handling smooth animation when visible prop changes
 * NOTE: When passing in children, prefer react fragment over empty div to avoid bloating the react tree with an unnecessary div
 * @param props
 * @returns
 */
export const Collapse: FunctionComponent<PropsWithChildren<CollapseProps>> = (props) => {
    Collapse.displayName = "Collapse";
    const classes = useCollapseStyles();
    return (
        <FluentCollapse visible={props.visible} orientation={props.orientation}>
            <div className={`${classes.collapseContent} ${props.orientation === "horizontal" ? classes.horizontal : classes.vertical}`}>{props.children}</div>
        </FluentCollapse>
    );
};
