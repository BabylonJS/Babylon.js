import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { PipelineRegular } from "@fluentui/react-icons";

import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

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
                        const typeName = pipeline.getClassName();
                        return `${pipeline.name} (${typeName})`;
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
