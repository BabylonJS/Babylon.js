import type { IDisposable } from "core/scene";
import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IShellService } from "../../shellService";
import type { AccordionSection, AccordionSectionContent } from "../../../components/accordionPane";
import { WrenchRegular } from "@fluentui/react-icons";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { ObservableCollection } from "../../../misc/observableCollection";
import { SelectionServiceIdentity } from "../../selectionService";
import { ShellServiceIdentity } from "../../shellService";
import { ToolsPane } from "../../../components/tools/toolsPane";

export const ToolsServiceIdentity = Symbol("ToolsService");

type ToolsSectionContent<EntityT> = {
    /**
     * A predicate function to determine if the content applies to the given entity.
     */
    predicate: (entity: unknown) => entity is EntityT;
} & AccordionSectionContent<EntityT>;

/**
 * A service that provides tools for the user to generate artifacts or perform actions on entities.
 */
export interface IToolsService extends IService<typeof ToolsServiceIdentity> {
    /**
     * Adds a new section (e.g. "Export", "Capture", etc.).
     * @param section A description of the section to add.
     */
    addSection(section: AccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent<EntityT>(content: ToolsSectionContent<EntityT>): IDisposable;
}

/**
 * A collection of usually optional, dynamic extensions.
 * Common examples includes importing/exporting, or other general creation tools.
 */
export const ToolsServiceDefinition: ServiceDefinition<[IToolsService], [IShellService, ISelectionService]> = {
    friendlyName: "Tools Editor",
    produces: [ToolsServiceIdentity],
    consumes: [ShellServiceIdentity, SelectionServiceIdentity],
    factory: (shellService, selectionService) => {
        const sectionsCollection = new ObservableCollection<AccordionSection>();
        const sectionContentCollection = new ObservableCollection<ToolsSectionContent<unknown>>();

        const toolsPaneRegistration = shellService.addSidePane({
            key: "Tools",
            title: "Tools",
            icon: WrenchRegular,
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const entity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);
                const applicableContent = entity ? sectionContent.filter((content) => content.predicate(entity)) : [];

                return <ToolsPane sections={sections} sectionContent={applicableContent} context={entity} />;
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as ToolsSectionContent<unknown>),
            dispose: () => toolsPaneRegistration.dispose(),
        };
    },
};
