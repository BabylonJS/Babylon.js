import { getMaterialFamily, type Material } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { MaterialIcon } from "shared-ui-components/fluent/icons";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { CreateSceneExplorerSectionNode, CreateWatchedNameDisplayInfo, IsSceneContext } from "./sceneExplorerSection";
import { GetSceneMaterials } from "./sceneResources";

function GetMaterialDisplayName(material: Material): string {
    const family = getMaterialFamily(material);
    return material.name ?? (family ? `${family.charAt(0).toUpperCase()}${family.slice(1)} Material` : "Material");
}

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IWatcherService]> = {
    friendlyName: "Babylon Lite Material Explorer",
    consumes: [EngineExplorerServiceIdentity, WatcherServiceIdentity],
    factory: (engineExplorerService, watcherService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 100,
            predicate: IsSceneContext,
            getNodes: (scene) => [
                CreateSceneExplorerSectionNode(
                    "materials",
                    "Materials",
                    GetSceneMaterials(scene),
                    (material) => CreateWatchedNameDisplayInfo(watcherService, material, () => GetMaterialDisplayName(material)),
                    () => <MaterialIcon color={tokens.colorPaletteMarigoldForeground2} />
                ),
            ],
            getSnapshot: GetSceneMaterials,
        }),
};
