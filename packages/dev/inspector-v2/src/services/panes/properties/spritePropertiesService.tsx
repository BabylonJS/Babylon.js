import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { Sprite } from "core/Sprites";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { SpriteAnimationProperties } from "../../../components/properties/sprites/spriteAnimationProperties";
import { SpriteGeneralProperties } from "../../../components/properties/sprites/spriteGeneralProperties";
import { SpriteTransformProperties } from "../../../components/properties/sprites/spriteTransformProperties";
import { SpriteOtherProperties } from "../../../components/properties/sprites/spriteOtherProperties";
import { SettingsContextIdentity, type ISettingsContext } from "../../../services/settingsContext";

export const SpritePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService, ISettingsContext]> = {
    friendlyName: "Sprite Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, selectionService, settingsContent) => {
        const generalSectionContentRegistration = propertiesService.addSectionContent({
            key: "Sprite Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SpriteGeneralProperties sprite={context} selectionService={selectionService} />,
                },
            ],
        });

        const transformSectionContentRegistration = propertiesService.addSectionContent({
            key: "Sprite Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <SpriteTransformProperties sprite={context} settings={settingsContent} />,
                },
            ],
        });

        const animationSectionContentRegistration = propertiesService.addSectionContent({
            key: "Sprite Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                {
                    section: "Animation",
                    component: ({ context }) => <SpriteAnimationProperties sprite={context} />,
                },
            ],
        });

        const otherSectionContentRegistration = propertiesService.addSectionContent({
            key: "Sprite Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                {
                    section: "Other",
                    component: ({ context }) => <SpriteOtherProperties sprite={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                generalSectionContentRegistration.dispose();
                transformSectionContentRegistration.dispose();
                otherSectionContentRegistration.dispose();
                animationSectionContentRegistration.dispose();
            },
        };
    },
};
