import { getMaterialFamily, type Material } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { MaterialIcon } from "shared-ui-components/fluent/icons";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateWatchedNameDisplayInfo } from "../../../explorerDisplayInfo";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { type ILiteSceneResourceIndexService, LiteSceneResourceIndexServiceIdentity } from "./sceneResourceIndexService";

function GetMaterialDisplayName(material: Material): string {
    const family = getMaterialFamily(material);
    return material.name ?? (family ? `${family.charAt(0).toUpperCase()}${family.slice(1)} Material` : "Material");
}

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IWatcherService, ILiteSceneResourceIndexService]> = {
    friendlyName: "Babylon Lite Material Explorer",
    consumes: [EngineExplorerServiceIdentity, WatcherServiceIdentity, LiteSceneResourceIndexServiceIdentity],
    factory: (engineExplorerService, watcherService, resourceIndexService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 100,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                resourceIndexService.index.refresh();
                return [
                    CreateSceneExplorerSectionNode(
                        "materials",
                        "Materials",
                        resourceIndexService.index.getSceneSnapshot(scene).materials.map((record) => record.source),
                        (material) => CreateWatchedNameDisplayInfo(watcherService, material, () => GetMaterialDisplayName(material)),
                        () => <MaterialIcon color={tokens.colorPaletteMarigoldForeground2} />
                    ),
                ];
            },
            getSnapshot: (scene) => {
                resourceIndexService.index.refresh();
                return resourceIndexService.index.getSceneSnapshot(scene).materials.map((record) => record.source);
            },
        }),
};
