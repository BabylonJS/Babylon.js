import type { Nullable } from "core/types";
import type { IDisposable, Scene } from "core/scene";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";
import type { DynamicAccordionSection, DynamicAccordionSectionContent } from "../../components/extensibleAccordion";
import { WrenchRegular } from "@fluentui/react-icons";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../hooks/observableHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { ShellServiceIdentity } from "../shellService";
import { ToolsPane } from "../../components/tools/toolsPane";
import { SceneContextIdentity } from "../sceneContext";
import type { ISceneContext } from "../sceneContext";

export const ToolsServiceIdentity = Symbol("ToolsService");

/**
 * A service that provides tools for the user to generate artifacts or perform actions on entities.
 */
export interface IToolsService extends IService<typeof ToolsServiceIdentity> {
    /**
     * Adds a new section (e.g. "Export", "Capture", etc.).
     * @param section A description of the section to add.
     */
    addSection(section: DynamicAccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent(content: DynamicAccordionSectionContent<Scene>): IDisposable;
}

/**
 * A collection of usually optional, dynamic extensions.
 * Common examples includes importing/exporting, or other general creation tools.
 */
export const ToolsServiceDefinition: ServiceDefinition<[IToolsService], [IShellService, ISceneContext]> = {
    friendlyName: "Tools Editor",
    produces: [ToolsServiceIdentity],
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<DynamicAccordionSection>();
        const sectionContentCollection = new ObservableCollection<DynamicAccordionSectionContent<Scene>>();

        // Only show the Tools pane if some tool content has been added.
        let toolsPaneRegistration: Nullable<IDisposable> = null;
        sectionContentCollection.observable.add(() => {
            if (sectionContentCollection.items.length === 0) {
                toolsPaneRegistration?.dispose();
                toolsPaneRegistration = null;
            } else if (!toolsPaneRegistration) {
                toolsPaneRegistration = shellService.addSidePane({
                    key: "Tools",
                    title: "Tools",
                    icon: WrenchRegular,
                    horizontalLocation: "right",
                    verticalLocation: "top",
                    order: 400,
                    suppressTeachingMoment: true,
                    content: () => {
                        const sections = useOrderedObservableCollection(sectionsCollection);
                        const sectionContent = useObservableCollection(sectionContentCollection);
                        const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                        return scene && <ToolsPane sections={sections} sectionContent={sectionContent} context={scene} />;
                    },
                });
            }
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content),
            dispose: () => toolsPaneRegistration?.dispose(),
        };
    },
};
