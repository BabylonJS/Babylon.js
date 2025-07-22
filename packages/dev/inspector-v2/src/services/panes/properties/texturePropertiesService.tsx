import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";

import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { TexturePreviewProperties } from "../../../components/properties/textures/textureProperties";
import { ThinTextureGeneralProperties } from "../../../components/properties/textures/thinTextureProperties";
import { BaseTexturePreviewProperties, BaseTextureGeneralProperties, BaseTextureCharacteristicProperties } from "../../../components/properties/textures/baseTextureProperties";

export const TexturePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Texture Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService) => {
        const baseTextureContentRegistration = propertiesService.addSectionContent({
            key: "Base Texture Properties",
            predicate: (entity: unknown) => entity instanceof BaseTexture,
            content: [
                {
                    section: "Preview",
                    component: ({ context }) => <BaseTexturePreviewProperties texture={context} />,
                },
                {
                    section: "General",
                    order: 0,
                    component: ({ context }) => <BaseTextureGeneralProperties texture={context} />,
                },
                {
                    section: "General",
                    order: 200,
                    component: ({ context }) => <BaseTextureCharacteristicProperties texture={context} />,
                },
            ],
        });

        const thinTextureProperties = propertiesService.addSectionContent({
            key: "Thin Texture Properties",
            predicate: (entity: unknown) => entity instanceof ThinTexture,
            content: [
                {
                    section: "General",
                    order: 100,
                    component: ({ context }) => <ThinTextureGeneralProperties texture={context} />,
                },
            ],
        });

        const textureContentRegistration = propertiesService.addSectionContent({
            key: "Texture Properties",
            predicate: (entity: unknown) => entity instanceof Texture,
            content: [
                {
                    section: "Preview",
                    component: ({ context }) => <TexturePreviewProperties texture={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                textureContentRegistration.dispose();
                baseTextureContentRegistration.dispose();
                thinTextureProperties.dispose();
            },
        };
    },
};
