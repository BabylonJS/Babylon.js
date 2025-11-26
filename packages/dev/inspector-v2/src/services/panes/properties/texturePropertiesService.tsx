import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISettingsContext } from "../../settingsContext";
import type { IPropertiesService } from "./propertiesService";

import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { MultiRenderTarget } from "core/Materials/Textures/multiRenderTarget";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Texture } from "core/Materials/Textures/texture";
import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { AdvancedDynamicTextureGeneralProperties } from "../../../components/properties/textures/advancedDynamicTextureProperties";
import {
    BaseTextureCharacteristicProperties,
    BaseTextureGeneralProperties,
    BaseTexturePreviewProperties,
    BaseTextureTransformProperties,
} from "../../../components/properties/textures/baseTextureProperties";
import { CubeTextureTransformProperties } from "../../../components/properties/textures/cubeTextureProperties";
import { MultiRenderTargetGeneralProperties } from "../../../components/properties/textures/multiRenderTargetProperties";
import { RenderTargetTextureGeneralProperties } from "../../../components/properties/textures/renderTargetTextureProperties";
import { TextureGeneralProperties, TexturePreviewProperties, TextureTransformProperties } from "../../../components/properties/textures/textureProperties";
import { ThinTextureGeneralProperties, ThinTextureSamplingProperties } from "../../../components/properties/textures/thinTextureProperties";
import { SettingsContextIdentity } from "../../settingsContext";
import { PropertiesServiceIdentity } from "./propertiesService";

// Don't use instanceof in this case as we don't want to bring in the gui package just to check if the entity is an AdvancedDynamicTexture.
function IsAdvancedDynamicTexture(entity: unknown): entity is AdvancedDynamicTexture {
    return (entity as AdvancedDynamicTexture)?.getClassName?.() === "AdvancedDynamicTexture";
}

export const TexturePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Texture Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContext) => {
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
                {
                    section: "Transform",
                    component: ({ context }) => <BaseTextureTransformProperties texture={context} />,
                },
            ],
        });

        const thinTextureContentRegistration = propertiesService.addSectionContent({
            key: "Thin Texture Properties",
            predicate: (entity: unknown) => entity instanceof ThinTexture,
            content: [
                {
                    section: "General",
                    order: 100,
                    component: ({ context }) => <ThinTextureGeneralProperties texture={context} />,
                },
                {
                    section: "General",
                    order: 200,
                    component: ({ context }) => <ThinTextureSamplingProperties texture={context} />,
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
                {
                    section: "General",
                    order: 300,
                    component: ({ context }) => <TextureGeneralProperties texture={context} />,
                },
            ],
        });

        const textureExcludingCubeContentRegistration = propertiesService.addSectionContent({
            key: "Texture Transform Properties",
            predicate: (entity: unknown): entity is Texture => entity instanceof Texture && !entity.isCube,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <TextureTransformProperties texture={context} settings={settingsContext} />,
                },
            ],
        });

        const cubeTextureContentRegistration = propertiesService.addSectionContent({
            key: "Cube Texture Properties",
            predicate: (entity: unknown) => entity instanceof CubeTexture,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <CubeTextureTransformProperties texture={context} settings={settingsContext} />,
                },
            ],
        });

        const renderTargetTextureContentRegistration = propertiesService.addSectionContent({
            key: "Render Target Texture Properties",
            predicate: (entity: unknown) => entity instanceof RenderTargetTexture,
            content: [
                {
                    section: "Render Target",
                    component: ({ context }) => <RenderTargetTextureGeneralProperties texture={context} />,
                },
            ],
        });

        const multiRenderTargetContentRegistration = propertiesService.addSectionContent({
            key: "Multi Render Target Properties",
            predicate: (entity: unknown) => entity instanceof MultiRenderTarget,
            content: [
                {
                    section: "Render Target",
                    order: 100,
                    component: ({ context }) => <MultiRenderTargetGeneralProperties texture={context} />,
                },
            ],
        });

        const advancedDynamicTextureContentRegistration = propertiesService.addSectionContent({
            key: "Advanced Dynamic Texture Properties",
            predicate: (entity: unknown) => IsAdvancedDynamicTexture(entity),
            content: [
                {
                    section: "Advanced Dynamic Texture",
                    order: 100,
                    component: ({ context }) => <AdvancedDynamicTextureGeneralProperties texture={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                advancedDynamicTextureContentRegistration.dispose();
                multiRenderTargetContentRegistration.dispose();
                renderTargetTextureContentRegistration.dispose();
                cubeTextureContentRegistration.dispose();
                textureExcludingCubeContentRegistration.dispose();
                textureContentRegistration.dispose();
                baseTextureContentRegistration.dispose();
                thinTextureContentRegistration.dispose();
            },
        };
    },
};
