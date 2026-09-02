import { getMaterialFamily, type Material } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { MaterialIcon } from "shared-ui-components/fluent/icons";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { GetSceneMaterials } from "./sceneResources";

function GetMaterialDisplayName(material: Material): string {
    const family = getMaterialFamily(material);
    return material.name ?? (family ? `${family.charAt(0).toUpperCase()}${family.slice(1)} Material` : "Material");
}

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService]> = {
    friendlyName: "Babylon Lite Material Explorer",
    consumes: [EngineExplorerServiceIdentity],
    factory: (engineExplorerService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 100,
            predicate: IsSceneContext,
            getNodes: (scene) => [
                CreateSceneExplorerSectionNode("materials", "Materials", GetSceneMaterials(scene), GetMaterialDisplayName, () => (
                    <MaterialIcon color={tokens.colorPaletteMarigoldForeground2} />
                )),
            ],
            getSnapshot: GetSceneMaterials,
        }),
};
