import type { IDisposable, IReadonlyObservable } from "core/index";
import type { DynamicAccordionSection, DynamicAccordionSectionContent } from "../../../components/extensibleAccordion";
import type { PropertyChangeInfo } from "../../../contexts/propertyContext";
import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IShellService } from "../../shellService";

import { DocumentTextRegular } from "@fluentui/react-icons";
import { useMemo } from "react";

import { Observable } from "core/Misc/observable";
import { PropertiesPane } from "../../../components/properties/propertiesPane";
import { PropertyContext } from "../../../contexts/propertyContext";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { ObservableCollection } from "../../../misc/observableCollection";
import { SelectionServiceIdentity } from "../../selectionService";
import { ShellServiceIdentity } from "../../shellService";

export const PropertiesServiceIdentity = Symbol("PropertiesService");

type PropertiesSectionContent<EntityT> = {
    /**
     * A unique key for the the content.
     */
    key: string;

    /**
     * A predicate function to determine if the content applies to the given entity.
     */
    predicate: (entity: unknown) => entity is EntityT;
} & {
    content: readonly Omit<DynamicAccordionSectionContent<EntityT>, "key">[];
};

/**
 * Allows new sections or content to be added to the properties pane.
 */
export interface IPropertiesService extends IService<typeof PropertiesServiceIdentity> {
    /**
     * Adds a new section (e.g. "General", "Transforms", etc.).
     * @param section A description of the section to add.
     */
    addSection(section: DynamicAccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent<EntityT>(content: PropertiesSectionContent<EntityT>): IDisposable;

    /**
     * An observable that notifies when a property has been changed by the user.
     * @remarks This observable only fires for changes made through the properties pane.
     */
    readonly onPropertyChanged: IReadonlyObservable<PropertyChangeInfo>;
}

/**
 * Provides a properties pane that enables displaying and editing properties of an entity such as a mesh or a texture.
 */
export const PropertiesServiceDefinition: ServiceDefinition<[IPropertiesService], [IShellService, ISelectionService]> = {
    friendlyName: "Properties Editor",
    produces: [PropertiesServiceIdentity],
    consumes: [ShellServiceIdentity, SelectionServiceIdentity],
    factory: (shellService, selectionService) => {
        const sectionsCollection = new ObservableCollection<DynamicAccordionSection>();
        const sectionContentCollection = new ObservableCollection<PropertiesSectionContent<unknown>>();
        const onPropertyChanged = new Observable<PropertyChangeInfo>();

        const registration = shellService.addSidePane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 100,
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const entity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);
                const applicableContent = useMemo(
                    () =>
                        entity
                            ? sectionContent
                                  .filter((section) => section.predicate(entity))
                                  .flatMap((section) => {
                                      return section.content.map((content) => {
                                          return {
                                              key: section.key,
                                              section: content.section,
                                              order: content.order,
                                              component: content.component,
                                          };
                                      });
                                  })
                            : [],
                    [sectionContent, entity]
                );

                return (
                    <PropertyContext.Provider value={{ onPropertyChanged }}>
                        <PropertiesPane sections={sections} sectionContent={applicableContent} context={entity} />
                    </PropertyContext.Provider>
                );
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as PropertiesSectionContent<unknown>),
            onPropertyChanged,
            dispose: () => registration.dispose(),
        };
    },
};
