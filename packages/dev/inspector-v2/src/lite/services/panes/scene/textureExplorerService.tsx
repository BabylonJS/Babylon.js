import { tokens } from "@fluentui/react-components";
import { ImageRegular } from "@fluentui/react-icons";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { type ISceneResourceIndexService, SceneResourceIndexServiceIdentity } from "./sceneResourceIndexService";
import { type ITextureResourceRecord } from "./sceneResources";

function GetTextureDisplayName(record: ITextureResourceRecord): string {
    if (record.metadata.kind === "cube") {
        return `Texture ${record.ordinal} (Cube)`;
    }

    return typeof record.metadata.width === "number" && typeof record.metadata.height === "number"
        ? `Texture ${record.ordinal} (${record.metadata.width} x ${record.metadata.height})`
        : `Texture ${record.ordinal}`;
}

export const TextureExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, ISceneResourceIndexService]> = {
    friendlyName: "Babylon Lite Texture Explorer",
    consumes: [EngineExplorerServiceIdentity, SceneResourceIndexServiceIdentity],
    factory: (engineExplorerService, resourceIndexService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 200,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                const records = resourceIndexService.getSceneSnapshot(scene).textures;
                const recordsByEntity = new Map(records.map((record) => [record.entity, record]));
                return [
                    CreateSceneExplorerSectionNode(
                        "textures",
                        "Textures",
                        records.map((record) => record.entity),
                        (texture) => ({ name: GetTextureDisplayName(recordsByEntity.get(texture)!) }),
                        () => <ImageRegular color={tokens.colorPaletteGrapeForeground2} />
                    ),
                ];
            },
            getSnapshot: (scene) => resourceIndexService.getSceneSnapshot(scene).textures.map((record) => record.entity),
            onChanged: resourceIndexService.onChanged,
        }),
};
