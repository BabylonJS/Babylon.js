import { type AnimationGroup, type TargetedAnimation } from "@babylonjs/lite";

import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { MetadataProperties } from "../../../../components/properties/metadataProperties";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { GetEntityAnimationGroups, IsAnimationGroup, IsTargetedAnimation } from "../../../animationUtils";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { IsCamera, IsLight, IsSceneNode } from "../../../sceneEntityUtils";

const AnimationGroupControlProperties = MakeLazyComponent(async () => (await import("../../../components/properties/animationProperties")).AnimationGroupControlProperties);
const AnimationGroupInfoProperties = MakeLazyComponent(async () => (await import("../../../components/properties/animationProperties")).AnimationGroupInfoProperties);
const TargetedAnimationProperties = MakeLazyComponent(async () => (await import("../../../components/properties/animationProperties")).TargetedAnimationProperties);
const EntityAnimationProperties = MakeLazyComponent(async () => (await import("../../../components/properties/animationProperties")).EntityAnimationProperties);

export const AnimationPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Animation Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (propertiesService, engineContext, selectionService) => {
        const engine = engineContext.engine;
        const groupRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Animation Group Properties",
            predicate: (entity): entity is AnimationGroup => IsAnimationGroup(engine, entity),
            content: [
                {
                    section: "Control",
                    component: ({ context }) => <AnimationGroupControlProperties engine={engine} group={context} />,
                },
                {
                    section: "Info",
                    component: ({ context }) => <AnimationGroupInfoProperties group={context} />,
                },
                {
                    section: "Metadata",
                    component: ({ context }) => <MetadataProperties entity={context} />,
                },
            ],
        });
        const targetedAnimationRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Targeted Animation Properties",
            predicate: (entity): entity is TargetedAnimation => IsTargetedAnimation(engine, entity),
            content: [
                {
                    section: "General",
                    component: ({ context }) => <TargetedAnimationProperties animation={context} selectionService={selectionService} />,
                },
            ],
        });
        const entityRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Entity Animation Properties",
            predicate: (entity): entity is object =>
                IsSceneNode(entity) ||
                IsCamera(entity) ||
                IsLight(entity) ||
                (typeof entity === "object" && entity !== null && GetEntityAnimationGroups(engine, entity).length > 0),
            content: [
                {
                    section: "Animation",
                    component: ({ context }) => <EntityAnimationProperties engine={engine} entity={context} selectionService={selectionService} />,
                },
            ],
        });

        return {
            dispose: () => {
                entityRegistration.dispose();
                targetedAnimationRegistration.dispose();
                groupRegistration.dispose();
            },
        };
    },
};
