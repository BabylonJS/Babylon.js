import type { IDisposable, Scene } from "core/index";

import type { DynamicAccordionSection, DynamicAccordionSectionContent } from "../../components/extensibleAccordion";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../sceneContext";
import type { IShellService } from "../shellService";

import { DataBarHorizontalRegular } from "@fluentui/react-icons";

import { CountStats } from "../../components/stats/countStats";
import { FrameStepsStats } from "../../components/stats/frameStepStats";
import { PerformanceStats } from "../../components/stats/performanceStats";
import { StatsPane } from "../../components/stats/statsPane";
import { SystemStats } from "../../components/stats/systemStats";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../hooks/observableHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { SceneContextIdentity } from "../sceneContext";
import { ShellServiceIdentity } from "../shellService";

export const StatsServiceIdentity = Symbol("StatsService");

/**
 * Allows new sections or content to be added to the stats pane.
 */
export interface IStatsService extends IService<typeof StatsServiceIdentity> {
    /**
     * Adds a new section (e.g. "Count", "Frame Steps Duration", etc.).
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
 * Provides a scene stats pane.
 */
export const StatsServiceDefinition: ServiceDefinition<[IStatsService], [IShellService, ISceneContext]> = {
    friendlyName: "Stats",
    produces: [StatsServiceIdentity],
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<DynamicAccordionSection>();
        const sectionContentCollection = new ObservableCollection<DynamicAccordionSectionContent<Scene>>();

        const registration = shellService.addSidePane({
            key: "Statistics",
            title: "Statistics",
            icon: DataBarHorizontalRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 300,
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                return (
                    <>
                        {scene && (
                            <StatsPane
                                uniqueId="Statistics"
                                sections={sections}
                                sectionContent={sectionContent}
                                context={scene}
                                enablePinnedItems
                                enableHiddenItems
                                enableSearchItems
                            />
                        )}
                    </>
                );
            },
        });

        // Default/built-in sections.
        sectionsCollection.add({
            identity: "Performance",
            order: 0,
        });

        sectionsCollection.add({
            identity: "Count",
            order: 1,
        });

        sectionsCollection.add({
            identity: "Frame Steps Duration",
            order: 2,
        });

        sectionsCollection.add({
            identity: "System Info",
            order: 3,
        });

        // Default/built-in content.
        sectionContentCollection.add({
            key: "DefaultPerfStats",
            section: "Performance",
            order: 0,
            component: PerformanceStats,
        });

        sectionContentCollection.add({
            key: "DefaultCountStats",
            section: "Count",
            order: 1,
            component: CountStats,
        });

        sectionContentCollection.add({
            key: "DefaultFrameStats",
            section: "Frame Steps Duration",
            order: 2,
            component: FrameStepsStats,
        });

        sectionContentCollection.add({
            key: "DefaultSystemStats",
            section: "System Info",
            order: 3,
            component: SystemStats,
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as DynamicAccordionSectionContent<Scene>),
            dispose: () => registration.dispose(),
        };
    },
};
