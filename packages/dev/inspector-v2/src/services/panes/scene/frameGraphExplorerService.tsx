import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { FrameRegular } from "@fluentui/react-icons";

import { FrameGraph } from "core/FrameGraph/frameGraph";
import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const FrameGraphExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Frame Graph Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Frame Graph",
            order: 1000,
            predicate: (entity) => entity instanceof FrameGraph,
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

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
