import { getTextureMetadata } from "@babylonjs/lite";
import { createElement, type FunctionComponent } from "react";

import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type ISceneResourceIndexService, SceneResourceIndexServiceIdentity } from "../scene/sceneResourceIndexService";

const TextureMetadataProperties = MakeLazyComponent(async () => (await import("./textureMetadataProperties")).TextureMetadataProperties, {
    spinnerLabel: "Loading texture metadata",
});

function TryGetTextureMetadata(entity: unknown): entity is object {
    if (typeof entity !== "object" || entity === null) {
        return false;
    }
    try {
        return getTextureMetadata(entity) !== undefined;
    } catch {
        return false;
    }
}

export const TexturePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISceneResourceIndexService, ISelectionService]> = {
    friendlyName: "Babylon Lite Texture Properties",
    consumes: [PropertiesServiceIdentity, SceneResourceIndexServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, resourceIndexService, selectionService) => {
        const recognizedTextures = new WeakSet<object>();
        return propertiesService.addSectionContent({
            key: "Babylon Lite Texture Properties",
            predicate: (entity: unknown): entity is object => {
                if (typeof entity !== "object" || entity === null) {
                    return false;
                }
                if (TryGetTextureMetadata(entity) || resourceIndexService.getTextureRecord(entity)) {
                    recognizedTextures.add(entity);
                    return true;
                }
                return recognizedTextures.has(entity);
            },
            content: [
                {
                    section: "General",
                    component: ((props) => {
                        const { context } = props;
                        return createElement(TextureMetadataProperties, { texture: context, resourceIndexService, selectionService });
                    }) satisfies FunctionComponent<{ context: object }>,
                },
            ],
        });
    },
};
