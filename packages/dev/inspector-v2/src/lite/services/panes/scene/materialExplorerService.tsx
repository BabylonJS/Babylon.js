import { getMaterialFamily, type Material } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { MaterialIcon } from "shared-ui-components/fluent/icons";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateWatchedNameDisplayInfo } from "../../../explorerDisplayInfo";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { type ISceneResourceIndexService, SceneResourceIndexServiceIdentity } from "./sceneResourceIndexService";

function GetMaterialDisplayName(material: Material): string {
    const family = getMaterialFamily(material);
    return material.name ?? (family ? `${family.charAt(0).toUpperCase()}${family.slice(1)} Material` : "Material");
}

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IWatcherService, ISceneResourceIndexService]> = {
    friendlyName: "Babylon Lite Material Explorer",
    consumes: [EngineExplorerServiceIdentity, WatcherServiceIdentity, SceneResourceIndexServiceIdentity],
    factory: (engineExplorerService, watcherService, resourceIndexService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 100,
            predicate: IsSceneContext,
            getNodes: (scene) => {
                return [
                    CreateSceneExplorerSectionNode(
                        "materials",
                        "Materials",
                        resourceIndexService.getSceneSnapshot(scene).materials.map((record) => record.source),
                        (material) => CreateWatchedNameDisplayInfo(watcherService, material, () => GetMaterialDisplayName(material)),
                        () => <MaterialIcon color={tokens.colorPaletteMarigoldForeground2} />
                    ),
                ];
            },
            getSnapshot: (scene) => resourceIndexService.getSceneSnapshot(scene).materials.map((record) => record.source),
            onChanged: resourceIndexService.onChanged,
        }),
};
