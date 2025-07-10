import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { PipelineRegular } from "@fluentui/react-icons";

import { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

import "core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

export const RenderingPipelineHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Rendering Pipeline Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection<PostProcessRenderPipeline>({
            displayName: "Rendering Pipelines",
            order: 500,
            predicate: (entity) => entity instanceof PostProcessRenderPipeline,
            getRootEntities: () => scene.postProcessRenderPipelineManager.supportedPipelines ?? [],
            getEntityDisplayInfo: (pipeline) => {
                return {
                    get name() {
                        const typeName = pipeline.constructor.name || pipeline.getClassName();
                        return `${pipeline.name} (${typeName})`;
                    },
                };
            },
            entityIcon: () => <PipelineRegular />,
            getEntityAddedObservables: () => [scene.postProcessRenderPipelineManager.onNewPipelineAddedObservable],
            getEntityRemovedObservables: () => [scene.postProcessRenderPipelineManager.onPipelineRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
