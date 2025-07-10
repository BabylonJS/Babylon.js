import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { PipelineRegular } from "@fluentui/react-icons";

import { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

import "core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

export const RenderingPipelineHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Rendering Pipeline Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection<PostProcessRenderPipeline>({
            displayName: "Rendering Pipelines",
            order: 4,
            predicate: (entity) => entity instanceof PostProcessRenderPipeline,
            getRootEntities: (scene) => scene.postProcessRenderPipelineManager.supportedPipelines ?? [],
            getEntityDisplayInfo: (pipeline) => {
                return {
                    get name() {
                        const typeName = pipeline.constructor.name || pipeline.getClassName();
                        return `${pipeline.name} (${typeName})`;
                    },
                };
            },
            entityIcon: () => <PipelineRegular />,
            getEntityAddedObservables: (scene) => [scene.postProcessRenderPipelineManager.onNewPipelineAddedObservable],
            getEntityRemovedObservables: (scene) => [scene.postProcessRenderPipelineManager.onPipelineRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration?.dispose();
            },
        };
    },
};
