import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { ImageRegular } from "@fluentui/react-icons";

import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const TextureHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Texture Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Textures",
            order: 3,
            getRootEntities: (scene) => scene.textures,
            getEntityDisplayName: (texture) => texture.displayName || texture.name || `Unnamed Texture (${texture.uniqueId})`,
            entityIcon: () => <ImageRegular />,
            getEntityAddedObservables: (scene) => [scene.onNewTextureAddedObservable],
            getEntityRemovedObservables: (scene) => [scene.onTextureRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
