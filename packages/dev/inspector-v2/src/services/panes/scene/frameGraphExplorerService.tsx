import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { EditRegular, FrameRegular, PlayFilled, PlayRegular } from "@fluentui/react-icons";

import { FrameGraph } from "core/FrameGraph/frameGraph";
import { Observable } from "core/Misc/observable";
import { EditNodeRenderGraph } from "../../../misc/nodeRenderGraphEditor";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const FrameGraphExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Frame Graph Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Frame Graphs",
            order: DefaultSectionsOrder.FrameGraphs,
            getRootEntities: () => scene.frameGraphs,
            getEntityDisplayInfo: (frameGraph) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(frameGraph, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return frameGraph.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <FrameRegular />,
            getEntityAddedObservables: () => [scene.onNewFrameGraphAddedObservable],
            getEntityRemovedObservables: () => [scene.onFrameGraphRemovedObservable],
        });

        const activeFrameGraphCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown) => entity instanceof FrameGraph,
            order: DefaultCommandsOrder.FrameGraphPlay,
            getCommand: (frameGraph) => {
                const onChangeObservable = new Observable<void>();
                const frameGraphHook = watcherService.watchProperty(scene, "frameGraph", () => onChangeObservable.notifyObservers());

                return {
                    type: "toggle",
                    displayName: "Make Active",
                    icon: () => (scene.frameGraph === frameGraph ? <PlayFilled /> : <PlayRegular />),
                    get isEnabled() {
                        return scene.frameGraph === frameGraph;
                    },
                    set isEnabled(enabled: boolean) {
                        if (enabled && scene.frameGraph !== frameGraph) {
                            scene.frameGraph = frameGraph;
                        }
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        frameGraphHook.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
        });

        const editNodeRenderGraphCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity: unknown): entity is FrameGraph => entity instanceof FrameGraph && !!entity.getLinkedNodeRenderGraph(),
            order: DefaultCommandsOrder.EditNodeRenderGraph,
            getCommand: (frameGraph) => {
                const renderGraph = frameGraph.getLinkedNodeRenderGraph();

                return {
                    type: "action",
                    displayName: "Edit Graph",
                    icon: () => <EditRegular />,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    execute: async () => {
                        if (renderGraph) {
                            await EditNodeRenderGraph(renderGraph);
                        }
                    },
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                activeFrameGraphCommandRegistration.dispose();
                editNodeRenderGraphCommandRegistration.dispose();
            },
        };
    },
};
