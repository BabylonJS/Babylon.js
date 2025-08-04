import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { AnimationGroup } from "core/Animations/animationGroup";
import { TargetedAnimation } from "core/Animations/animationGroup";
import { PropertiesServiceIdentity } from "./propertiesService";
import { TargetedAnimationGeneralProperties } from "../../../components/properties/animation/targetedAnimationProperties";
import { AnimationGroupControlProperties, AnimationGroupInfoProperties } from "../../../components/properties/animation/animationGroupProperties";

export const AnimationGroupPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Animation Group Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const animationGroupContentRegistration = propertiesService.addSectionContent({
            key: "Animation Group Properties",
            predicate: (entity: unknown) => entity instanceof AnimationGroup,
            content: [
                {
                    section: "Control",
                    component: ({ context }) => <AnimationGroupControlProperties animationGroup={context} />,
                },
                {
                    section: "Info",
                    component: ({ context }) => <AnimationGroupInfoProperties animationGroup={context} />,
                },
            ],
        });

        const targetedAnimationContentRegistration = propertiesService.addSectionContent({
            key: "Targeted Animation Properties",
            predicate: (entity: unknown) => entity instanceof TargetedAnimation,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <TargetedAnimationGeneralProperties targetedAnimation={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                animationGroupContentRegistration.dispose();
                targetedAnimationContentRegistration.dispose();
            },
        };
    },
};
