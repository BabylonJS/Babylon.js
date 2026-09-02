import { type Mesh } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { MeshIcon } from "shared-ui-components/fluent/icons";

import { type IEngineExplorerService, EngineExplorerServiceIdentity } from "../../../engineExplorerService";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { CreateSceneExplorerSectionNode, CreateWatchedNameDisplayInfo, IsSceneContext } from "./sceneExplorerSection";

export const MeshExplorerServiceDefinition: ServiceDefinition<[], [IEngineExplorerService, IWatcherService]> = {
    friendlyName: "Babylon Lite Mesh Explorer",
    consumes: [EngineExplorerServiceIdentity, WatcherServiceIdentity],
    factory: (engineExplorerService, watcherService) =>
        engineExplorerService.addRenderingContextNodeProvider({
            order: 0,
            predicate: IsSceneContext,
            getNodes: (scene) => [
                CreateSceneExplorerSectionNode(
                    "meshes",
                    "Meshes",
                    scene.meshes,
                    (mesh: Mesh) => CreateWatchedNameDisplayInfo(watcherService, mesh, () => mesh.name),
                    () => <MeshIcon color={tokens.colorPaletteBlueForeground2} />
                ),
            ],
            getSnapshot: (scene) => scene.meshes,
        }),
};
