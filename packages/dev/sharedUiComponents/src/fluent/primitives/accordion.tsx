import type { FunctionComponent, PropsWithChildren } from "react";

import { Children, isValidElement } from "react";

import { Accordion as FluentAccordion, AccordionItem, AccordionHeader, AccordionPanel, Subtitle1, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    accordion: {
        overflowY: "auto",
        paddingBottom: tokens.spacingVerticalM,
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
});

export type AccordionSectionProps = {
    title: string;
};

export const AccordionSection: FunctionComponent<PropsWithChildren<AccordionSectionProps>> = (props) => {
    const classes = useStyles();

    return <div className={classes.panelDiv}>{props.children}</div>;
};

export const Accordion: FunctionComponent<PropsWithChildren> = (props) => {
    const classes = useStyles();

    const { children, ...rest } = props;

    return (
        <FluentAccordion className={classes.accordion} collapsible multiple defaultOpenItems={Array.from({ length: Children.count(children) }, (_, index) => index)} {...rest}>
            {Children.map(children, (child, index) => {
                if (isValidElement(child)) {
                    return (
                        <AccordionItem key={child.props.title} value={index}>
                            <AccordionHeader expandIconPosition="end">
                                <Subtitle1>{child.props.title}</Subtitle1>
                            </AccordionHeader>
                            <AccordionPanel>
                                <div className={classes.panelDiv}>{child}</div>
                            </AccordionPanel>
                        </AccordionItem>
                    );
                }
                return null;
            })}
        </FluentAccordion>
    );
};
