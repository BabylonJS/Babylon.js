import type { IDisposable, Scene } from "core/index";

import type { AccordionSection, AccordionSectionContent } from "../../components/accordionPane";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../sceneContext";
import type { IShellService } from "../shellService";

import { BugRegular } from "@fluentui/react-icons";
import { useCallback } from "react";

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
    addSection(section: AccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent(content: AccordionSectionContent<Scene>): IDisposable;
}

export const DebugServiceDefinition: ServiceDefinition<[IDebugService], [IShellService, ISceneContext]> = {
    friendlyName: "Debug",
    produces: [DebugServiceIdentity],
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<AccordionSection>();
        const sectionContentCollection = new ObservableCollection<AccordionSectionContent<Scene>>();

        const registration = shellService.addSidePane({
            key: "Debug",
            title: "Debug",
            icon: BugRegular,
            horizontalLocation: "right",
            order: 200,
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const scene = useObservableState(
                    useCallback(() => sceneContext.currentScene, [sceneContext]),
                    sceneContext.currentSceneObservable
                );
                return <>{scene && <DebugPane sections={sections} sectionContent={sectionContent} context={scene} />}</>;
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content),
            dispose: () => registration.dispose(),
        };
    },
};
