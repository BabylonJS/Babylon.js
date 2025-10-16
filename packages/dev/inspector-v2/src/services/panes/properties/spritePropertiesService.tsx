import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISettingsContext } from "../../../services/settingsContext";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Sprite } from "core/Sprites/sprite";
import { SpriteManager } from "core/Sprites/spriteManager";
import { SpriteManagerCellProperties, SpriteManagerGeneralProperties, SpriteManagerOtherProperties } from "../../../components/properties/sprites/spriteManagerProperties";
import {
    SpriteAnimationProperties,
    SpriteCellProperties,
    SpriteGeneralProperties,
    SpriteOtherProperties,
    SpriteTransformProperties,
} from "../../../components/properties/sprites/spriteProperties";
import { SettingsContextIdentity } from "../../../services/settingsContext";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";

export const SpritePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService, ISettingsContext]> = {
    friendlyName: "Sprite Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, selectionService, settingsContent) => {
        const spriteManagerSectionContentRegistration = propertiesService.addSectionContent({
            key: "Sprite Manager Properties",
            predicate: (entity: unknown) => entity instanceof SpriteManager,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SpriteManagerGeneralProperties spriteManager={context} selectionService={selectionService} />,
                },
                {
                    section: "Cells",
                    component: ({ context }) => <SpriteManagerCellProperties spriteManager={context} />,
                },
                {
                    section: "Other",
                    component: ({ context }) => <SpriteManagerOtherProperties spriteManager={context} />,
                },
            ],
        });

        const spriteSectionContentRegistration = propertiesService.addSectionContent({
            key: "Sprite Properties",
            predicate: (entity: unknown) => entity instanceof Sprite,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SpriteGeneralProperties sprite={context} selectionService={selectionService} />,
                },
                {
                    section: "Transform",
                    component: ({ context }) => <SpriteTransformProperties sprite={context} settings={settingsContent} />,
                },
                {
                    section: "Cell",
                    component: ({ context }) => <SpriteCellProperties sprite={context} />,
                },
                {
                    section: "Animation",
                    component: ({ context }) => <SpriteAnimationProperties sprite={context} />,
                },
                {
                    section: "Other",
                    component: ({ context }) => <SpriteOtherProperties sprite={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                spriteManagerSectionContentRegistration.dispose();
                spriteSectionContentRegistration.dispose();
            },
        };
    },
};
