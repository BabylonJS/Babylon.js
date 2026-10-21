import { type EngineContext } from "@babylonjs/lite";
import { type IDisposable } from "core/index";
import { DataBarHorizontalRegular } from "@fluentui/react-icons";

import { type DynamicAccordionSection, type DynamicAccordionSectionContent } from "shared-ui-components/modularTool/components/extensibleAccordion";
import { useObservableCollection, useOrderedObservableCollection } from "shared-ui-components/modularTool/hooks/observableHooks";
import { ObservableCollection } from "shared-ui-components/modularTool/misc/observableCollection";
import { type IService, type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { LiteCountStats, LiteFrameStepStats, LitePerformanceStats, LiteStatsPane, LiteSystemStats } from "../../components/stats";
import { type IEngineContext, EngineContextIdentity } from "../../engineContext";
import { LiteStatistics } from "../../statistics";

/**
 * The unique identity for the Babylon Lite statistics pane service.
 */
export const StatsServiceIdentity = Symbol("LiteStatsService");

/**
 * Allows sections and engine-context content to be added to the Lite statistics pane.
 */
export interface IStatsService extends IService<typeof StatsServiceIdentity> {
    /**
     * Adds a statistics section.
     * @param section The section definition.
     * @returns A registration that removes the section when disposed.
     */
    addSection(section: DynamicAccordionSection): IDisposable;
    /**
     * Adds content to a statistics section.
     * @param content The content definition, receiving the inspected Lite engine.
     * @returns A registration that removes the content when disposed.
     */
    addSectionContent(content: DynamicAccordionSectionContent<EngineContext>): IDisposable;
}

/** Provides runtime-isolated engine-wide statistics for Babylon Lite. @internal */
export const StatsServiceDefinition: ServiceDefinition<[IStatsService], [IShellService, IEngineContext]> = {
    friendlyName: "Babylon Lite Statistics",
    produces: [StatsServiceIdentity],
    consumes: [ShellServiceIdentity, EngineContextIdentity],
    factory: (shell, engineContext) => {
        const statistics = new LiteStatistics(engineContext.engine);
        const sections = new ObservableCollection<DynamicAccordionSection>();
        const content = new ObservableCollection<DynamicAccordionSectionContent<EngineContext>>();
        ["Performance", "Count", "Frame Steps Duration", "System Info"].forEach((identity, order) => sections.add({ identity, order }));
        content.add({ key: "LitePerformanceStats", section: "Performance", component: () => <LitePerformanceStats statistics={statistics} /> });
        content.add({ key: "LiteCountStats", section: "Count", component: LiteCountStats });
        content.add({ key: "LiteFrameStepStats", section: "Frame Steps Duration", component: () => <LiteFrameStepStats statistics={statistics} /> });
        content.add({ key: "LiteSystemStats", section: "System Info", component: LiteSystemStats });

        const pane = shell.addSidePane({
            key: "Statistics",
            title: "Statistics",
            icon: DataBarHorizontalRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            order: 300,
            teachingMoment: false,
            content: () => {
                const orderedSections = useOrderedObservableCollection(sections);
                const sectionContent = useObservableCollection(content);
                return (
                    <LiteStatsPane
                        uniqueId="LiteStatistics"
                        context={engineContext.engine}
                        sections={orderedSections}
                        sectionContent={sectionContent}
                        enablePinnedItems
                        enableHiddenItems
                        enableSearchItems
                    />
                );
            },
        });

        return {
            addSection: (section) => sections.add(section),
            addSectionContent: (sectionContent) => content.add(sectionContent),
            dispose: () => {
                pane.dispose();
                statistics.dispose();
            },
        };
    },
};
