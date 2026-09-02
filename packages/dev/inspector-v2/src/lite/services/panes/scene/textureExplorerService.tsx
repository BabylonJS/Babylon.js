import { type Texture2D } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { ImageRegular } from "@fluentui/react-icons";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { CreateSceneExplorerSectionNode, IsSceneContext } from "./sceneExplorerSection";
import { GetSceneTextures } from "./sceneResources";

function GetTextureDisplayName(texture: Texture2D, index: number): string {
    return `Texture ${index + 1} (${texture.width} x ${texture.height})`;
}

export const TextureExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService]> = {
    friendlyName: "Babylon Lite Texture Explorer",
    consumes: [EngineExplorerServiceIdentity],
    factory: (engineExplorerService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 200,
            predicate: IsSceneContext,
            getNodes: (scene) => [
                CreateSceneExplorerSectionNode("textures", "Textures", GetSceneTextures(scene), GetTextureDisplayName, () => (
                    <ImageRegular color={tokens.colorPaletteGrapeForeground2} />
                )),
            ],
            getSnapshot: GetSceneTextures,
        }),
};
