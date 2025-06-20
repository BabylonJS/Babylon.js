// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Scene } from "core/index";

import type { AccordionSection, AccordionSectionContent } from "../../components/accordionPane";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../sceneContext";
import type { IShellService } from "../shellService";

import { DataBarHorizontalRegular } from "@fluentui/react-icons";

import { CountStats } from "../../components/stats/countStats";
import { FrameStepsStats } from "../../components/stats/frameStepStats";
import { StatsPane } from "../../components/stats/statsPane";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../hooks/observableHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { SceneContextIdentity } from "../sceneContext";
import { ShellServiceIdentity } from "../shellService";

export const StatsServiceIdentity = Symbol("StatsService");
export const StatsPerformanceSectionIdentity = Symbol("Performance");
export const StatsCountSectionIdentity = Symbol("Count");
export const StatsFrameStepsSectionIdentity = Symbol("Frame Steps Duration");
export const StatsSystemInfoSectionIdentity = Symbol("System Info");

/**
 * Allows new sections or content to be added to the stats pane.
 */
export interface IStatsService extends IService<typeof StatsServiceIdentity> {
    /**
     * Adds a new section (e.g. "Count", "Frame Steps Duration", etc.).
     * @param section A description of the section to add.
     */
    addSection(section: AccordionSection): IDisposable;

    /**
     * Adds content to one or more sections.
     * @param content A description of the content to add.
     */
    addSectionContent(content: AccordionSectionContent<Scene>): IDisposable;
}

/**
 * Provides a scene stats pane.
 */
export const StatsServiceDefinition: ServiceDefinition<[IStatsService], [IShellService, ISceneContext]> = {
    friendlyName: "Stats",
    produces: [StatsServiceIdentity],
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const sectionsCollection = new ObservableCollection<AccordionSection>();
        const sectionContentCollection = new ObservableCollection<AccordionSectionContent<Scene>>();

        const registration = shellService.addSidePane({
            key: "Stats",
            title: "Stats",
            icon: DataBarHorizontalRegular,
            horizontalLocation: "right",
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const sectionContent = useObservableCollection(sectionContentCollection);
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                return <>{scene && <StatsPane sections={sections} sectionContent={sectionContent} context={scene} />}</>;
            },
        });

        // Default/built-in sections.
        sectionsCollection.add({
            identity: StatsPerformanceSectionIdentity,
            order: 0,
        });

        sectionsCollection.add({
            identity: StatsCountSectionIdentity,
            order: 1,
        });

        sectionsCollection.add({
            identity: StatsFrameStepsSectionIdentity,
            order: 2,
        });

        sectionsCollection.add({
            identity: StatsSystemInfoSectionIdentity,
            order: 3,
        });

        // Default/built-in content.
        sectionContentCollection.add({
            key: "DefaultStats",
            content: [
                {
                    section: StatsCountSectionIdentity,
                    order: 0,
                    component: CountStats,
                },
                {
                    section: StatsFrameStepsSectionIdentity,
                    order: 0,
                    component: FrameStepsStats,
                },
            ],
        });

        return {
            addSection: (section) => sectionsCollection.add(section),
            addSectionContent: (content) => sectionContentCollection.add(content as AccordionSectionContent<Scene>),
            dispose: () => registration.dispose(),
        };
    },
};
