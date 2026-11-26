import { getTextureMetadata, type CubeTexture, type Texture2D } from "@babylonjs/lite";
import { createElement, type FunctionComponent } from "react";

import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type ISceneResourceIndexService, SceneResourceIndexServiceIdentity } from "../scene/sceneResourceIndexService";
import { type ITextureEditorService, TextureEditorServiceIdentity } from "../../../../services/textureEditor/textureEditorService";

const TextureMetadataProperties = MakeLazyComponent(async () => (await import("./textureMetadataProperties")).TextureMetadataProperties, {
    spinnerLabel: "Loading texture metadata",
});
const TexturePreviewProperties = MakeLazyComponent(async () => (await import("./texturePreviewProperties")).TexturePreviewProperties, {
    spinnerLabel: "Loading texture preview",
});

function TryGetTextureMetadata(entity: unknown): entity is Texture2D | CubeTexture {
    if (typeof entity !== "object" || entity === null) {
        return false;
    }
    try {
        return getTextureMetadata(entity) !== undefined;
    } catch {
        return false;
    }
}

export const TexturePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISceneResourceIndexService, ISelectionService, IEngineContext, ITextureEditorService]> =
    {
        friendlyName: "Babylon Lite Texture Properties",
        consumes: [PropertiesServiceIdentity, SceneResourceIndexServiceIdentity, SelectionServiceIdentity, EngineContextIdentity, TextureEditorServiceIdentity],
        factory: (propertiesService, resourceIndexService, selectionService, engineContext, textureEditorService) => {
            const recognizedTextures = new WeakSet<object>();
            return propertiesService.addSectionContent({
                key: "Babylon Lite Texture Properties",
                predicate: (entity: unknown): entity is Texture2D | CubeTexture => {
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
                        section: "Preview",
                        component: ((props) => {
                            const { context } = props;
                            return createElement(TexturePreviewProperties, {
                                texture: context,
                                engine: engineContext.engine,
                                resourceIndexService,
                                textureEditor: textureEditorService.component,
                            });
                        }) satisfies FunctionComponent<{ context: Texture2D | CubeTexture }>,
                    },
                    {
                        section: "General",
                        component: ((props) => {
                            const { context } = props;
                            return createElement(TextureMetadataProperties, { texture: context, resourceIndexService, selectionService });
                        }) satisfies FunctionComponent<{ context: Texture2D | CubeTexture }>,
                    },
                ],
            });
        },
    };
