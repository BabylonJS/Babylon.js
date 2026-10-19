import { getRenderingContexts, type SceneContext, type ShadowGenerator } from "@babylonjs/lite";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { EngineContextIdentity, type IEngineContext } from "../../../engineContext";
import { GetShadowGeneratorDisplayName } from "../../../sceneEntityUtils";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { IsSceneContext } from "../scene/sceneExplorerSection";

function GetScenes(engineContext: IEngineContext): readonly SceneContext[] {
    return engineContext.engine.surfaces.flatMap((surface) => getRenderingContexts(surface).filter(IsSceneContext));
}

export const ShadowGeneratorPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Shadow Generator Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Shadow Generator Properties",
            predicate: (entity: unknown): entity is ShadowGenerator =>
                typeof entity === "object" && entity !== null && GetScenes(engineContext).some((scene) => scene.shadowGenerators.includes(entity)),
            content: [
                {
                    section: "General",
                    component: ({ context }) => {
                        const scene = GetScenes(engineContext).find((candidate) => candidate.shadowGenerators.includes(context));
                        return <TextPropertyLine label="Identity" value={scene ? GetShadowGeneratorDisplayName(scene, context) : "Shadow Generator"} />;
                    },
                },
            ],
        }),
};
