import { tokens } from "@fluentui/react-components";
import { ImageRegular } from "@fluentui/react-icons";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { type ILiteSceneResourceIndexService, LiteSceneResourceIndexServiceIdentity } from "./sceneResourceIndexService";
import { type ILiteTextureResourceRecord } from "./sceneResources";

function GetTextureDisplayName(record: ILiteTextureResourceRecord): string {
    if (record.inspection.kind === "cube") {
        return `Texture ${record.ordinal} (Cube)`;
    }

    const texture = record.entity as { width?: unknown; height?: unknown };
    return typeof texture.width === "number" && typeof texture.height === "number"
        ? `Texture ${record.ordinal} (${texture.width} x ${texture.height})`
        : `Texture ${record.ordinal}`;
}

export const TextureExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, ILiteSceneResourceIndexService]> = {
    friendlyName: "Babylon Lite Texture Explorer",
    consumes: [EngineExplorerServiceIdentity, LiteSceneResourceIndexServiceIdentity],
    factory: (engineExplorerService, resourceIndexService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 200,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                const records = resourceIndexService.index.getSceneSnapshot(scene).textures;
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
            getSnapshot: (scene) => resourceIndexService.index.getSceneSnapshot(scene).textures.map((record) => record.entity),
            onChanged: resourceIndexService.onChanged,
        }),
};
