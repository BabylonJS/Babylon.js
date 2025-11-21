import type { AccordionToggleData, AccordionToggleEvent, AccordionProps as FluentAccordionProps } from "@fluentui/react-components";
import type { ForwardRefExoticComponent, FunctionComponent, PropsWithChildren, RefAttributes } from "react";

import { Children, forwardRef, isValidElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { AccordionHeader, AccordionItem, AccordionPanel, Divider, Accordion as FluentAccordion, Subtitle2Stronger, makeStyles, tokens } from "@fluentui/react-components";
import { CustomTokens } from "./utils";
import { ToolContext } from "../hoc/fluentToolWrapper";

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
        paddingTop: CustomTokens.dividerGap,
        paddingBottom: CustomTokens.dividerGap,
    },
    dividerSmall: {
        paddingTop: CustomTokens.dividerGapSmall,
        paddingBottom: CustomTokens.dividerGapSmall,
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    highlightDiv: {
        borderRadius: tokens.borderRadiusLarge,
        animationDuration: "1s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "5",
        animationFillMode: "forwards",
        animationName: {
            from: {
                boxShadow: `inset 0 0 4px ${tokens.colorTransparentBackground}`,
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "50%": {
                boxShadow: `inset 0 0 12px ${tokens.colorBrandBackground}`,
            },
            to: {
                boxShadow: `inset 0 0 4px ${tokens.colorTransparentBackground}`,
            },
        },
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

export type AccordionProps = {
    highlightSections?: readonly string[];
};

const StringAccordion = FluentAccordion as ForwardRefExoticComponent<FluentAccordionProps<string> & RefAttributes<HTMLDivElement>>;

export const Accordion = forwardRef<HTMLDivElement, PropsWithChildren<AccordionProps>>((props, ref) => {
    Accordion.displayName = "Accordion";
    const classes = useStyles();
    const { size } = useContext(ToolContext);
    const { children, highlightSections, ...rest } = props;
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

    const internalOpenItemsRef = useRef<string[] | undefined>(openItems);

    // When highlight sections is requested, we temporarily override the open items, but if highlight sections is cleared,
    // then we revert back to the normal open items tracking.
    useLayoutEffect(() => {
        if (highlightSections) {
            internalOpenItemsRef.current = [...openItems];
            setOpenItems([...highlightSections]);
        } else {
            setOpenItems([...(internalOpenItemsRef.current ?? [])]);
            internalOpenItemsRef.current = undefined;
        }
    }, [highlightSections]);

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
        <StringAccordion ref={ref} className={classes.accordion} collapsible multiple onToggle={onToggle} openItems={openItems} {...rest}>
            {validChildren.map((child, index) => {
                const isHighlighted = highlightSections?.includes(child.title);
                return (
                    <AccordionItem key={child.content.key} value={child.title}>
                        <div className={isHighlighted ? classes.highlightDiv : undefined}>
                            <AccordionHeader size={size}>
                                <Subtitle2Stronger>{child.title}</Subtitle2Stronger>
                            </AccordionHeader>
                            <AccordionPanel>
                                <div className={classes.panelDiv}>{child.content}</div>
                            </AccordionPanel>
                        </div>
                        {index < validChildren.length - 1 && <Divider inset={true} className={size === "small" ? classes.dividerSmall : classes.divider} />}
                    </AccordionItem>
                );
            })}
        </StringAccordion>
    );
});
