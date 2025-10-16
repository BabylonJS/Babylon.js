import type { AccordionToggleData, AccordionToggleEvent } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";

import { Children, isValidElement, useCallback, useEffect, useMemo, useState } from "react";

import { AccordionHeader, AccordionItem, AccordionPanel, Divider, Accordion as FluentAccordion, Subtitle2Stronger, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    accordion: {
        overflowX: "hidden",
        overflowY: "auto",
        paddingBottom: tokens.spacingVerticalM, // bottom padding since there is no divider at the bottom
        display: "flex",
        flexDirection: "column",
        height: "100%",
    },
    divider: {
        paddingTop: "10px",
        paddingBottom: "10px",
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
});

export type AccordionSectionProps = {
    title: string;
    collapseByDefault?: boolean;
};

export const AccordionSection: FunctionComponent<PropsWithChildren<AccordionSectionProps>> = (props) => {
    AccordionSection.displayName = "AccordionSection";
    const classes = useStyles();

    return <div className={classes.panelDiv}>{props.children}</div>;
};

export const Accordion: FunctionComponent<PropsWithChildren> = (props) => {
    Accordion.displayName = "Accordion";
    const classes = useStyles();

    const { children, ...rest } = props;
    const validChildren = useMemo(() => {
        return (
            Children.map(children, (child) => {
                if (isValidElement(child)) {
                    const childProps = child.props as Partial<AccordionSectionProps>;
                    if (childProps.title) {
                        return {
                            title: childProps.title,
                            collapseByDefault: childProps.collapseByDefault,
                            content: child,
                        };
                    }
                }
                return null;
            })?.filter(Boolean) ?? []
        );
    }, [children]);

    // Tracks open items, and used to tell the Accordion which sections should be expanded.
    const [openItems, setOpenItems] = useState(validChildren.filter((child) => !child.collapseByDefault).map((child) => child.title));

    // Tracks closed items, which is needed so that when the children change, we only update the open/closed state
    // (depending on the collapseByDefault prop) for items that have not been explicitly opened or closed.
    const [closedItems, setClosedItems] = useState(validChildren.filter((child) => child.collapseByDefault).map((child) => child.title));

    useEffect(() => {
        for (const defaultOpenItem of validChildren.filter((child) => !child.collapseByDefault).map((child) => child.title)) {
            // If a child is not marked as collapseByDefault, then it should be opened by default, and
            // it is only "default" if it hasn't already been explicitly added to the opened or closed list.
            if (!closedItems.includes(defaultOpenItem) && !openItems.includes(defaultOpenItem)) {
                setOpenItems((prev) => [...prev, defaultOpenItem]);
            }
        }
    }, [validChildren]);

    const onToggle = useCallback((event: AccordionToggleEvent, data: AccordionToggleData<string>) => {
        if (data.openItems.includes(data.value)) {
            setOpenItems((prev) => [...prev, data.value]);
            setClosedItems((prev) => prev.filter((item) => item !== data.value));
        } else {
            setClosedItems((prev) => [...prev, data.value]);
            setOpenItems((prev) => prev.filter((item) => item !== data.value));
        }
    }, []);

    return (
        <FluentAccordion className={classes.accordion} collapsible multiple onToggle={onToggle} openItems={openItems} {...rest}>
            {validChildren.map((child, index) => {
                return (
                    <AccordionItem key={child.content.key} value={child.title}>
                        <AccordionHeader>
                            <Subtitle2Stronger>{child.title}</Subtitle2Stronger>
                        </AccordionHeader>
                        <AccordionPanel>
                            <div className={classes.panelDiv}>{child.content}</div>
                        </AccordionPanel>
                        {index < validChildren.length - 1 && <Divider inset={true} className={classes.divider} />}
                    </AccordionItem>
                );
            })}
        </FluentAccordion>
    );
};
