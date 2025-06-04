// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IShellService } from "../../shellService";

import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Body1Strong, makeStyles, Subtitle1, tokens } from "@fluentui/react-components";
import { DocumentTextRegular } from "@fluentui/react-icons";
import { useMemo, useState, type ComponentType } from "react";

import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { ObservableCollection } from "../../../misc/observableCollection";
import { SelectionServiceIdentity } from "../../selectionService";
import { ShellServiceIdentity } from "../../shellService";

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

export const PropertiesServiceIdentity = Symbol("PropertiesService");

/**
 * Provides a properties pane that enables displaying and editing properties of an entity such as a mesh or a texture.
 */
export interface IPropertiesService extends IService<typeof PropertiesServiceIdentity> {
    /**
     * Adds a new section (e.g. "General", "Transforms", etc.).
     * @param section A description of the section to add.
     */
    addSection(section: PropertiesServiceSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent<EntityT>(content: PropertiesServiceSectionContent<EntityT>): IDisposable;
}

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

export const PropertiesServiceDefinition: ServiceDefinition<[IPropertiesService], [IShellService, ISelectionService]> = {
    friendlyName: "Properties Editor",
    produces: [PropertiesServiceIdentity],
    consumes: [ShellServiceIdentity, SelectionServiceIdentity],
    factory: (shellService, selectionService) => {
        const sectionsCollection = new ObservableCollection<PropertiesServiceSection>();
        const sectionContentCollection = new ObservableCollection<PropertiesServiceSectionContent<unknown>>();

        const registration = shellService.addSidePane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            content: () => {
                const classes = useStyles();

                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const boundEntity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);
                const [version, setVersion] = useState(0);

                const visibleSections = useMemo(() => {
                    // When any of this state changes, we should re-render the Accordion so the defaultOpenItems are re-evaluated.
                    setVersion((prev) => prev + 1);

                    if (!boundEntity) {
                        return [];
                    }

                    const applicableContent = sectionContent.filter((content) => content.predicate(boundEntity));
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
                }, [sections, sectionContent, boundEntity]);

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
                                                        return <component.component key={component.key} entity={boundEntity} />;
                                                    })}
                                                </div>
                                            </AccordionPanel>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        ) : (
                            <div className={classes.placeholderDiv}>
                                <Body1Strong italic>
                                    {boundEntity ? `Can't show properties for the selected entity type (${boundEntity.toString()})` : "No entity selected."}
                                </Body1Strong>
                            </div>
                        )}
                    </div>
                );
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as PropertiesServiceSectionContent<unknown>),
            dispose: () => registration.dispose(),
        };
    },
};
