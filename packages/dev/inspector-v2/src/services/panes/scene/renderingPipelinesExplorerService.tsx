import { type ServiceDefinition } from "../../../modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../../sceneContext";
import { type ISceneExplorerService, SceneExplorerServiceIdentity } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { PipelineRegular } from "@fluentui/react-icons";

import { DefaultSectionsOrder } from "./defaultSectionsMetadata";

import "core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

export const RenderingPipelineExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Rendering Pipeline Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Rendering Pipelines",
            order: DefaultSectionsOrder.RenderingPipelines,
            getRootEntities: () => scene.postProcessRenderPipelineManager.supportedPipelines ?? [],
            getEntityDisplayInfo: (pipeline) => {
                return {
                    get name() {
                        return `${pipeline.name || "Unnamed"} [${pipeline.getClassName()}]`;
                    },
                };
            },
            entityIcon: () => <PipelineRegular color={tokens.colorPaletteRedForeground2} />,
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
