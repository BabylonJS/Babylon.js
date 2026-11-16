import { type ShadowGenerator } from "@babylonjs/lite";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { EngineContextIdentity, type IEngineContext } from "../../../engineContext";
import { GetSceneContexts, GetShadowGeneratorDisplayName } from "../../../sceneEntityUtils";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";

export const ShadowGeneratorPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Shadow Generator Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Shadow Generator Properties",
            predicate: (entity: unknown): entity is ShadowGenerator =>
                typeof entity === "object" && entity !== null && GetSceneContexts(engineContext.engine).some((scene) => scene.shadowGenerators.includes(entity)),
            content: [
                {
                    section: "General",
                    component: ({ context }) => {
                        const scene = GetSceneContexts(engineContext.engine).find((candidate) => candidate.shadowGenerators.includes(context));
                        return <TextPropertyLine label="Identity" value={scene ? GetShadowGeneratorDisplayName(scene, context) : "Shadow Generator"} />;
                    },
                },
            ],
        }),
};
