import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { Sprite } from "core/Sprites";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { SpriteGeneralProperties } from "../../../components/properties/spriteGeneralProperties";
import { SpriteTransformProperties } from "../../../components/properties/spriteTransformProperties";
import { SpriteOtherProperties } from "../../../components/properties/spriteOtherProperties";

export const SpriteTransformsPropertiesSectionItentity = Symbol("Transforms");
export const SpriteOtherPropertiesSectionItentity = Symbol("Other");

export const SpritePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Sprite Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const generalSectionContentRegistration = propertiesService.addSectionContent({
            key: "Sprite Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <SpriteGeneralProperties sprite={context} setSelectedEntity={(entity) => (selectionService.selectedEntity = entity)} />,
                },
            ],
        });

        const transformsSectionOutlineRegistration = propertiesService.addSection({
            order: 1,
            identity: SpriteTransformsPropertiesSectionItentity,
        });

        const transformSectionContentRegistration = propertiesService.addSectionContent({
            key: "Transform Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                // "TRANSFORMS" section.
                {
                    section: SpriteTransformsPropertiesSectionItentity,
                    order: 0,
                    component: ({ context }) => <SpriteTransformProperties sprite={context} />,
                },
            ],
        });

        const othersSectionOutlineRegistration = propertiesService.addSection({
            order: 2,
            identity: SpriteOtherPropertiesSectionItentity,
        });

        const otherSectionContentRegistration = propertiesService.addSectionContent({
            key: "Transform Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                // "TRANSFORMS" section.
                {
                    section: SpriteOtherPropertiesSectionItentity,
                    order: 0,
                    component: ({ context }) => <SpriteOtherProperties sprite={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                generalSectionContentRegistration.dispose();
                transformsSectionOutlineRegistration.dispose();
                transformSectionContentRegistration.dispose();
                othersSectionOutlineRegistration.dispose();
                otherSectionContentRegistration.dispose();
            },
        };
    },
};
