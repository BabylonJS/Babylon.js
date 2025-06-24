// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IShellService } from "../../shellService";
import type { AccordionSection, AccordionSectionContent } from "../../../components/accordionPane";

import { DocumentTextRegular } from "@fluentui/react-icons";

import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { ObservableCollection } from "../../../misc/observableCollection";
import { SelectionServiceIdentity } from "../../selectionService";
import { ShellServiceIdentity } from "../../shellService";
import { PropertiesPane } from "../../../components/properties/propertiesPane";

export const PropertiesServiceIdentity = Symbol("PropertiesService");

type PropertiesSectionContent<EntityT> = {
    /**
     * A predicate function to determine if the content applies to the given entity.
     */
    predicate: (entity: unknown) => entity is EntityT;
} & AccordionSectionContent<EntityT>;

/**
 * Allows new sections or content to be added to the properties pane.
 */
export interface IPropertiesService extends IService<typeof PropertiesServiceIdentity> {
    /**
     * Adds a new section (e.g. "General", "Transforms", etc.).
     * @param section A description of the section to add.
     */
    addSection(section: AccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent<EntityT>(content: PropertiesSectionContent<EntityT>): IDisposable;
}

/**
 * Provides a properties pane that enables displaying and editing properties of an entity such as a mesh or a texture.
 */
export const PropertiesServiceDefinition: ServiceDefinition<[IPropertiesService], [IShellService, ISelectionService]> = {
    friendlyName: "Properties Editor",
    produces: [PropertiesServiceIdentity],
    consumes: [ShellServiceIdentity, SelectionServiceIdentity],
    factory: (shellService, selectionService) => {
        const sectionsCollection = new ObservableCollection<AccordionSection>();
        const sectionContentCollection = new ObservableCollection<PropertiesSectionContent<unknown>>();

        const registration = shellService.addSidePane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const entity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);
                const applicableContent = entity ? sectionContent.filter((content) => content.predicate(entity)) : [];

                return <PropertiesPane sections={sections} sectionContent={applicableContent} context={entity} />;
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as PropertiesSectionContent<unknown>),
            dispose: () => registration.dispose(),
        };
    },
};
