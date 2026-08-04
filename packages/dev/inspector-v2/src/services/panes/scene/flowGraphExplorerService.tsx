import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../../sceneContext";
import { type IWatcherService, WatcherServiceIdentity } from "../../watcherService";
import { type ISceneExplorerService, SceneExplorerServiceIdentity } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { EditRegular, FlowchartRegular } from "@fluentui/react-icons";

import { FlowGraph } from "core/FlowGraph/flowGraph";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Observable } from "core/Misc/observable";
import { EditFlowGraph } from "../../../misc/flowGraphEditor";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";

export const FlowGraphExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Flow Graph Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        // Flow graphs are not stored directly on the scene: they live on FlowGraphCoordinator
        // instances registered per scene. Flatten every graph across the scene's coordinators.
        const getFlowGraphs = () => FlowGraphCoordinator.SceneCoordinators.get(scene)?.flatMap((coordinator) => coordinator.flowGraphs) ?? [];

        const sectionRegistration = sceneExplorerService.addSection<FlowGraph>({
            displayName: "Flow Graphs",
            order: DefaultSectionsOrder.FlowGraphs,
            getRootEntities: () => getFlowGraphs(),
            getEntityDisplayInfo: (flowGraph) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(flowGraph, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return flowGraph.name || "Unnamed Flow Graph";
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <FlowchartRegular color={tokens.colorPaletteGreenForeground2} />,
            getEntityAddedObservables: () => [FlowGraphCoordinator.OnFlowGraphAddedObservable],
            getEntityRemovedObservables: () => [FlowGraphCoordinator.OnFlowGraphRemovedObservable],
        });

        const editFlowGraphCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown) => entity instanceof FlowGraph,
            order: DefaultCommandsOrder.EditFlowGraph,
            getCommand: (flowGraph) => {
                return {
                    type: "action",
                    displayName: "Edit Graph",
                    icon: () => <EditRegular />,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    execute: async () => {
                        await EditFlowGraph(flowGraph);
                    },
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                editFlowGraphCommandRegistration.dispose();
            },
        };
    },
};
