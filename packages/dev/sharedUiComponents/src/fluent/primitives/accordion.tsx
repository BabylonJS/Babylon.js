import type { FunctionComponent, PropsWithChildren } from "react";

import { Children, isValidElement, useMemo } from "react";

import { Accordion as FluentAccordion, AccordionItem, AccordionHeader, AccordionPanel, Subtitle1, makeStyles, tokens } from "@fluentui/react-components";

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

    return (
        <FluentAccordion
            className={classes.accordion}
            collapsible
            multiple
            defaultOpenItems={validChildren.filter((child) => !child.collapseByDefault).map((child) => child.title)}
            {...rest}
        >
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
