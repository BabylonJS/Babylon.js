import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { FrameRegular, PlayFilled, PlayRegular } from "@fluentui/react-icons";

import { FrameGraph } from "core/FrameGraph/frameGraph";
import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const FrameGraphExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Frame Graph Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Frame Graph",
            order: DefaultSectionsOrder.FrameGraphs,
            getRootEntities: () => scene.frameGraphs,
            getEntityDisplayInfo: (frameGraph) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(frameGraph, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

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

        const activeFrameGraphCommandRegistration = sceneExplorerService.addCommand({
            predicate: (entity: unknown) => entity instanceof FrameGraph,
            order: DefaultCommandsOrder.FrameGraphPlay,
            getCommand: (frameGraph) => {
                const onChangeObservable = new Observable<void>();
                const frameGraphHook = InterceptProperty(scene, "frameGraph", {
                    afterSet: () => onChangeObservable.notifyObservers(),
                });

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

        return {
            dispose: () => {
                sectionRegistration.dispose();
                activeFrameGraphCommandRegistration.dispose();
            },
        };
    },
};
