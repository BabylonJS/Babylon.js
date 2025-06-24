// eslint-disable-next-line import/no-internal-modules

import type { ComponentType } from "react";

import { makeStyles } from "@fluentui/react-components";
import { useMemo, useState } from "react";

import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";

export type AccordionSection = Readonly<{
    /**
     * A unique identity for the section, which can be referenced by section content.
     */
    identity: symbol;

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

export type AccordionSectionContent<ContextT> = Readonly<{
    /**
     * A unique key for the the content.
     */
    key: string;

    /**
     * The content that is added to individual sections.
     */
    content: readonly Readonly<{
        /**
         * The section this content belongs to.
         */
        section: symbol;

        /**
         * An optional order for the content within the section.
         * Defaults to 0.
         */
        order?: number;

        /**
         * The React component that will be rendered for this content.
         */
        component: ComponentType<{ context: ContextT }>;
    }>[];
}>;

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
});

export function AccordionPane<ContextT = unknown>(props: {
    sections: readonly AccordionSection[];
    sectionContent: readonly AccordionSectionContent<ContextT>[];
    context: ContextT;
}) {
    const classes = useStyles();

    const { sections, sectionContent, context } = props;

    const [version, setVersion] = useState(0);

    const visibleSections = useMemo(() => {
        // When any of this state changes, we should re-render the Accordion so the defaultOpenItems are re-evaluated.
        setVersion((prev) => prev + 1);

        if (!context) {
            return [];
        }

        return sections
            .map((section) => {
                // Get a flat list of the section content, preserving the key so it can be used when each component for each section is rendered.
                const contentForSection = sectionContent
                    .flatMap((entry) => entry.content.map((content) => ({ key: entry.key, ...content })))
                    .filter((content) => content.section === section.identity);

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
                    components: contentForSection.map((content) => ({ key: content.key, component: content.component })),
                };
            })
            .filter((section) => section !== null);
    }, [sections, sectionContent, context]);

    return (
        <div className={classes.rootDiv}>
            {visibleSections.length > 0 && (
                <Accordion key={version}>
                    {visibleSections.map((section) => {
                        return (
                            <AccordionSection key={section.identity.description} title={section.identity.description!}>
                                {section.components.map((component) => {
                                    return <component.component key={component.key} context={context} />;
                                })}
                            </AccordionSection>
                        );
                    })}
                </Accordion>
            )}
        </div>
    );
}
