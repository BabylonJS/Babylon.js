import { inspectTexture } from "@babylonjs/lite";
import { createElement, type FunctionComponent } from "react";

import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type ILiteSceneResourceIndexService, LiteSceneResourceIndexServiceIdentity } from "../scene/sceneResourceIndexService";

const LiteTextureMetadataAdapter = MakeLazyComponent(async () => (await import("./liteTextureMetadataAdapter")).LiteTextureMetadataAdapter, {
    spinnerLabel: "Loading texture metadata",
});

function TryInspectTexture(entity: unknown): entity is object {
    if (typeof entity !== "object" || entity === null) {
        return false;
    }
    try {
        return inspectTexture(entity) !== undefined;
    } catch {
        return false;
    }
}

export const TexturePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ILiteSceneResourceIndexService, ISelectionService]> = {
    friendlyName: "Babylon Lite Texture Properties",
    consumes: [PropertiesServiceIdentity, LiteSceneResourceIndexServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, resourceIndexService, selectionService) => {
        const recognizedTextures = new WeakSet<object>();
        return propertiesService.addSectionContent({
            key: "Babylon Lite Texture Properties",
            predicate: (entity: unknown): entity is object => {
                if (typeof entity !== "object" || entity === null) {
                    return false;
                }
                if (TryInspectTexture(entity) || resourceIndexService.index.getTextureRecord(entity)) {
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
                        return createElement(LiteTextureMetadataAdapter, { texture: context, resourceIndexService, selectionService });
                    }) satisfies FunctionComponent<{ context: object }>,
                },
            ],
        });
    },
};
