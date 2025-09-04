import type { AccordionToggleData, AccordionToggleEvent } from "@fluentui/react-components";
import type { FunctionComponent, PropsWithChildren } from "react";

import { Children, isValidElement, useCallback, useEffect, useMemo, useState } from "react";

import { AccordionHeader, AccordionItem, AccordionPanel, Accordion as FluentAccordion, Subtitle1, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    accordion: {
        overflowX: "hidden",
        overflowY: "auto",
        paddingBottom: tokens.spacingVerticalM,
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
        height: "100%",
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
    const classes = useStyles();

    return <div className={classes.panelDiv}>{props.children}</div>;
};

export const Accordion: FunctionComponent<PropsWithChildren> = (props) => {
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
            {validChildren.map((child) => {
                return (
                    <AccordionItem key={child.title} value={child.title}>
                        <AccordionHeader expandIconPosition="end">
                            <Subtitle1>{child.title}</Subtitle1>
                        </AccordionHeader>
                        <AccordionPanel>
                            <div className={classes.panelDiv}>{child.content}</div>
                        </AccordionPanel>
                    </AccordionItem>
                );
            })}
        </FluentAccordion>
    );
};
