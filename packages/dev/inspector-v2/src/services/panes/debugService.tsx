import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IShellService } from "../shellService";

import { BugRegular } from "@fluentui/react-icons";

import { ShellServiceIdentity } from "../shellService";
import { DebugPane } from "../../components/debug/debugPane";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../hooks/observableHooks";
import { SceneContextIdentity, type ISceneContext } from "../sceneContext";
import { ObservableCollection } from "../../misc/observableCollection";
import { type AccordionSection, type AccordionSectionContent } from "../../components/accordionPane";
import type { Scene } from "core/scene";

export const HelpersServiceIdentity = Symbol("Helpers");
export const CoreTextureSectionIdentity = Symbol("CoreTextureChannels");

export const DebugServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext]> = {
    friendlyName: "Debug",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<AccordionSection>();
        const sectionContentCollection = new ObservableCollection<AccordionSectionContent<Scene>>();

        const registration = shellService.addSidePane({
            key: "Debug",
            title: "Debug",
            icon: BugRegular,
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                return <>{scene && <DebugPane sections={sections} sectionContent={sectionContent} context={scene} />}</>;
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
