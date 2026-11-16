import { getFrameGraph, getRenderingContextKind, type EngineContext, type FrameGraph, type FrameGraphContext } from "@babylonjs/lite";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { FrameGraphTaskProperties } from "../../../components/properties/frameGraphProperties";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { GetInspectableRenderingContexts } from "../../../sceneEntityUtils";
import { IsSceneContext } from "../scene/sceneExplorerSection";

function IsInspectableFrameGraph(engine: EngineContext, entity: unknown): entity is FrameGraph {
    return (
        typeof entity === "object" &&
        entity !== null &&
        engine.surfaces.some((surface) =>
            GetInspectableRenderingContexts(surface).some((context) =>
                IsSceneContext(context)
                    ? getFrameGraph(context) === entity
                    : getRenderingContextKind(context) === "frame-graph-context" && (context as FrameGraphContext).frameGraph === entity
            )
        )
    );
}

export const FrameGraphPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Frame Graph Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) => {
        const registration = propertiesService.addSectionContent({
            key: "Frame Graph Properties",
            predicate: (entity: unknown): entity is FrameGraph => IsInspectableFrameGraph(engineContext.engine, entity),
            content: [
                {
                    section: "Tasks",
                    component: ({ context }) => <FrameGraphTaskProperties frameGraph={context} />,
                },
            ],
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
