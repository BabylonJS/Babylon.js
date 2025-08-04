import type { ComponentType, PropsWithChildren } from "react";

import type { AccordionSectionProps } from "shared-ui-components/fluent/primitives/accordion";

import { makeStyles } from "@fluentui/react-components";
import { Children, isValidElement, useMemo, useState } from "react";

import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";

function AsReadonlyArray<T>(array: T[]): readonly T[] {
    return array;
}

export type DynamicAccordionSection = Readonly<{
    /**
     * A unique identity for the section, which can be referenced by section content.
     */
    identity: string;

    /**
     * An optional order for the section, relative to other sections.
     * Defaults to 0.
     */
    order?: number;

    /**
     * An optional flag indicating whether the section should be collapsed by default.
     * Defaults to false.
     */
    collapseByDefault?: boolean;
}>;

export type DynamicAccordionSectionContent<ContextT> = Readonly<{
    /**
     * A unique key for the the content.
     */
    key: string;

    /**
     * The section this content belongs to.
     */
    section: string;

    /**
     * An optional order for the content within the section.
     * Defaults to 0.
     */
    order?: number;

    /**
     * The React component that will be rendered for this content.
     */
    component: ComponentType<{ context: ContextT }>;
}>;

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
});

export function ExtensibleAccordion<ContextT = unknown>(
    props: PropsWithChildren<{
        sections: readonly DynamicAccordionSection[];
        sectionContent: readonly DynamicAccordionSectionContent<ContextT>[];
        context: ContextT;
    }>
) {
    const classes = useStyles();

    const { children, sections, sectionContent, context } = props;

    const defaultSections = useMemo(() => {
        const defaultSections: DynamicAccordionSection[] = [];
        if (children) {
            Children.forEach(children, (child) => {
                if (isValidElement(child)) {
                    const childProps = child.props as AccordionSectionProps;
                    defaultSections.push({
                        identity: childProps.title,
                        collapseByDefault: childProps.collapseByDefault,
                    });
                }
            });
        }
        return AsReadonlyArray(defaultSections);
    }, [children]);

    const defaultSectionContent = useMemo(() => {
        const defaultSectionContent: DynamicAccordionSectionContent<ContextT>[] = [];
        if (children) {
            Children.forEach(children, (child, index) => {
                if (isValidElement(child)) {
                    const childProps = child.props as AccordionSectionProps;
                    defaultSectionContent.push({
                        key: child.key ?? childProps.title,
                        section: defaultSections[index].identity,
                        component: () => child,
                    });
                }
            });
        }
        return AsReadonlyArray(defaultSectionContent);
    }, [children, defaultSections]);

    const mergedSectionContent = useMemo(() => {
        return AsReadonlyArray(
            [...defaultSectionContent, ...sectionContent].map((content, index) => {
                return {
                    ...content,
                    key: `${content.key}-${index}`,
                    order: content.order ?? index,
                } as const;
            })
        );
    }, [defaultSectionContent, sectionContent]);

    const mergedSections = useMemo(() => {
        const mergedSections = [...defaultSections, ...sections];

        // Check for implicit sections (e.g. sections that were not explicitly defined, but referenced by content).
        const implicitSections: DynamicAccordionSection[] = [];
        for (const sectionContent of mergedSectionContent) {
            if (!mergedSections.some((s) => s.identity === sectionContent.section) && !implicitSections.some((s) => s.identity === sectionContent.section)) {
                implicitSections.push({ identity: sectionContent.section });
            }
        }

        return AsReadonlyArray(
            [...implicitSections, ...mergedSections].map((section, index) => {
                return {
                    ...section,
                    order: section.order ?? index,
                    collapseByDefault: section.collapseByDefault ?? false,
                } as const;
            })
        );
    }, [defaultSections, sections, mergedSectionContent]);

    const [version, setVersion] = useState(0);

    const visibleSections = useMemo(() => {
        // When any of this state changes, we should re-render the Accordion so the defaultOpenItems are re-evaluated.
        setVersion((prev) => prev + 1);

        if (!context) {
            return [];
        }

        const sortedSections = [...mergedSections].sort((a, b) => a.order - b.order);

        return sortedSections
            .map((section) => {
                // Get a flat list of the section content, preserving the key so it can be used when each component for each section is rendered.
                const contentForSection = mergedSectionContent.filter((content) => content.section === section.identity);

                // If there is no content for this section, we skip it.
                if (contentForSection.length === 0) {
                    return null; // No content for this section
                }

                // Sort the content for this section by order, defaulting to 0 if not specified.
                contentForSection.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                // Return the section with its identity, collapseByDefault flag, and the content components to render.
                return {
                    identity: section.identity,
                    collapseByDefault: section.collapseByDefault ?? false,
                    components: contentForSection.map((content) => <content.component key={content.key} context={context} />),
                };
            })
            .filter((section) => section !== null);
    }, [mergedSections, mergedSectionContent, context]);

    return (
        <div className={classes.rootDiv}>
            {visibleSections.length > -1 && (
                <Accordion key={version}>
                    {...visibleSections.map((section) => {
                        return (
                            <AccordionSection key={section.identity} title={section.identity} collapseByDefault={section.collapseByDefault}>
                                {section.components}
                            </AccordionSection>
                        );
                    })}
                </Accordion>
            )}
        </div>
    );
}
