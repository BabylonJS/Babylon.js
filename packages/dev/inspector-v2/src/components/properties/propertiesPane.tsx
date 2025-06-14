// eslint-disable-next-line import/no-internal-modules

import type { FunctionComponent } from "react";

import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Body1Strong, makeStyles, Subtitle1, tokens } from "@fluentui/react-components";
import { useMemo, useState, type ComponentType } from "react";

export type PropertiesServiceSection = Readonly<{
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

export type PropertiesServiceSectionContent<EntityT> = Readonly<{
    /**
     * A unique key for the the content.
     */
    key: string;

    /**
     * A predicate function that determines if the content is applicable to the given entity.
     */
    predicate: (entity: unknown) => entity is EntityT;

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
        component: ComponentType<{ entity: EntityT }>;
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
    placeholderDiv: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    },
    accordion: {
        overflowY: "auto",
        paddingBottom: tokens.spacingVerticalM,
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
});

export const PropertiesPane: FunctionComponent<{
    sections: readonly PropertiesServiceSection[];
    sectionContent: readonly PropertiesServiceSectionContent<unknown>[];
    entity: unknown;
}> = (props) => {
    const classes = useStyles();

    const { sections, sectionContent, entity } = props;

    const [version, setVersion] = useState(0);

    const visibleSections = useMemo(() => {
        // When any of this state changes, we should re-render the Accordion so the defaultOpenItems are re-evaluated.
        setVersion((prev) => prev + 1);

        if (!entity) {
            return [];
        }

        const applicableContent = sectionContent.filter((content) => content.predicate(entity));
        return sections
            .map((section) => {
                // Get a flat list of the section content, preserving the key so it can be used when each component for each section is rendered.
                const contentForSection = applicableContent
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
    }, [sections, sectionContent, entity]);

    return (
        <div className={classes.rootDiv}>
            {visibleSections.length > 0 ? (
                <Accordion
                    key={version}
                    className={classes.accordion}
                    collapsible
                    multiple
                    defaultOpenItems={visibleSections.filter((section) => !section.collapseByDefault).map((section) => section.identity.description)}
                >
                    {visibleSections.map((section) => {
                        return (
                            <AccordionItem key={section.identity.description} value={section.identity.description}>
                                <AccordionHeader expandIconPosition="end">
                                    <Subtitle1>{section.identity.description}</Subtitle1>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.panelDiv}>
                                        {section.components.map((component) => {
                                            return <component.component key={component.key} entity={entity} />;
                                        })}
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            ) : (
                <div className={classes.placeholderDiv}>
                    <Body1Strong italic>{entity ? `Can't show properties for the selected entity type (${entity.toString()})` : "No entity selected."}</Body1Strong>
                </div>
            )}
        </div>
    );
};
