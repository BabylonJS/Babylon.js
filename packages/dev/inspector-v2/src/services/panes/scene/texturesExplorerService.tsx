// eslint-disable-next-line import/no-internal-modules
import type { Observer } from "core/index";

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
            watch: (scene, onAdded, onRemoved) => {
                const observers: Observer<any>[] = [];

                observers.push(
                    scene.onNewTextureAddedObservable.add((texture) => {
                        onAdded(texture);
                    })
                );

                observers.push(
                    scene.onTextureRemovedObservable.add((texture) => {
                        onRemoved(texture);
                    })
                );

                return {
                    dispose: () => {
                        for (const observer of observers) {
                            scene.onNewTextureAddedObservable.remove(observer);
                        }
                    },
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
