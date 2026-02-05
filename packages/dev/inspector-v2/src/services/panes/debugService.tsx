import type { IDisposable, Scene } from "core/index";

import type { DynamicAccordionSection, DynamicAccordionSectionContent } from "../../components/extensibleAccordion";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../sceneContext";
import type { IShellService } from "../shellService";

import { BugRegular } from "@fluentui/react-icons";

import { DebugPane } from "../../components/debug/debugPane";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../hooks/observableHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { SceneContextIdentity } from "../sceneContext";
import { ShellServiceIdentity } from "../shellService";

export const DebugServiceIdentity = Symbol("DebugService");

/**
 * Allows new sections or content to be added to the debug pane.
 */
export interface IDebugService extends IService<typeof DebugServiceIdentity> {
    /**
     * Adds a new section.
     * @param section A description of the section to add.
     */
    addSection(section: DynamicAccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent(content: DynamicAccordionSectionContent<Scene>): IDisposable;
}

export const DebugServiceDefinition: ServiceDefinition<[IDebugService], [IShellService, ISceneContext]> = {
    friendlyName: "Debug",
    produces: [DebugServiceIdentity],
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<DynamicAccordionSection>();
        const sectionContentCollection = new ObservableCollection<DynamicAccordionSectionContent<Scene>>();

        const registration = shellService.addSidePane({
            key: "Debug",
            title: "Debug",
            icon: BugRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 200,
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                return (
                    <>
                        {scene && (
                            <DebugPane uniqueId="Debug" sections={sections} sectionContent={sectionContent} context={scene} enablePinnedItems enableHiddenItems enableSearchItems />
                        )}
                    </>
                );
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content),
            dispose: () => registration.dispose(),
        };
    },
};
