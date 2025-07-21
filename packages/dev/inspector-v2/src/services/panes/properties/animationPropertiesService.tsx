import type { IAnimatable } from "core/index";

import type { IAnimatableContainer, IAnimationRangeContainer } from "../../../components/properties/animation/animationsProperties";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";
import type { ISceneContext } from "../../../services/sceneContext";

import { AnimationsProperties } from "../../../components/properties/animation/animationsProperties";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SceneContextIdentity } from "../../../services/sceneContext";

function IsAnimatable(entity: unknown): entity is IAnimatable {
    return (entity as IAnimatable).animations !== undefined;
}

function IsAnimationRangeContainer(entity: unknown): entity is IAnimationRangeContainer {
    return (entity as IAnimationRangeContainer).getAnimationRanges !== undefined;
}

function IsAnimatableContainer(entity: unknown): entity is IAnimatableContainer {
    return (entity as IAnimatableContainer).getAnimatables !== undefined;
}

export const AnimationPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService, ISceneContext]> = {
    friendlyName: "Animation Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity, SceneContextIdentity],
    factory: (propertiesService, selectionService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const animationContentRegistration = propertiesService.addSectionContent({
            key: "Animation Properties",
            predicate: (entity: unknown) => IsAnimatable(entity) || IsAnimationRangeContainer(entity) || IsAnimatableContainer(entity),
            content: [
                {
                    section: "Animation",
                    component: ({ context }) => <AnimationsProperties scene={scene} entity={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                animationContentRegistration.dispose();
            },
        };
    },
};
