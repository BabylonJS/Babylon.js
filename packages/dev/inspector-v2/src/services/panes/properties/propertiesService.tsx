import type { IDisposable, IReadonlyObservable } from "core/index";
import type { DynamicAccordionSection, DynamicAccordionSectionContent, SectionsImperativeRef } from "../../../components/extensibleAccordion";
import type { PropertyChangeInfo } from "../../../contexts/propertyContext";
import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IShellService } from "../../shellService";

import { DocumentTextRegular } from "@fluentui/react-icons";
import { useEffect, useMemo, useRef } from "react";

import { Observable } from "core/Misc/observable";
import { useImpulse } from "shared-ui-components/fluent/hooks/transientStateHooks";
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
     * Highlights the specified sections temporarily to draw the user's attention to them.
     * @remarks All other sections are collapsed (but can be expanded by the user) until a different entity is selected.
     * @param sectionIds The identities of the sections to highlight.
     */
    highlightSections(sectionIds: readonly string[]): void;

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
        const onHighlightSectionsRequested = new Observable<readonly string[]>(undefined, true);

        const registration = shellService.addSidePane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 100,
            teachingMoment: false,
            keepMounted: true,
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

                const sectionsRef = useRef<SectionsImperativeRef>(null);

                // The selected entity may be set at the same time as a highlight is requested.
                // To account for this, we need to wait for one React render to complete before
                // requesting the section highlight.
                const [pendingHighlight, pulsePendingHighlightSections] = useImpulse<readonly string[]>();

                useEffect(() => {
                    const observer = onHighlightSectionsRequested.add((sectionIds) => {
                        // Now this UI component is observing, so we don't need to cache pending requests anymore.
                        onHighlightSectionsRequested.notifyIfTriggered = false;
                        onHighlightSectionsRequested.cleanLastNotifiedState();
                        pulsePendingHighlightSections(sectionIds);
                    });

                    return () => {
                        observer.remove();
                        // Now this UI component is no longer observing, so we need to cache pending requests again.
                        onHighlightSectionsRequested.notifyIfTriggered = true;
                    };
                }, []);

                useEffect(() => {
                    if (pendingHighlight && sectionsRef.current) {
                        sectionsRef.current.highlightSections(pendingHighlight);
                    }
                }, [pendingHighlight]);

                return (
                    <PropertyContext.Provider value={{ onPropertyChanged }}>
                        <PropertiesPane
                            uniqueId="Properties"
                            sections={sections}
                            sectionContent={applicableContent}
                            context={entity}
                            sectionsRef={sectionsRef}
                            enablePinnedItems
                            enableHiddenItems
                            enableSearchItems
                        />
                    </PropertyContext.Provider>
                );
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as PropertiesSectionContent<unknown>),
            onPropertyChanged,
            highlightSections: (sectionIds: readonly string[]) => onHighlightSectionsRequested.notifyObservers(sectionIds),
            dispose: () => registration.dispose(),
        };
    },
};
