// eslint-disable-next-line import/no-internal-modules
import type { BaseTexture } from "core/index";

import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { Text } from "@fluentui/react-components";
import { ImageRegular } from "@fluentui/react-icons";

import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";
import { Scene } from "core/scene";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const TextureHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Texture Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const texturesGroup = {
            uniqueId: UniqueIdGenerator.UniqueId,
        } as const;

        const groupRegistration = sceneExplorerService.addChildEnumerator<Scene, typeof texturesGroup>({
            order: 2,
            predicate: (entity: unknown) => {
                return entity instanceof Scene;
            },
            getChildren: () => {
                return [texturesGroup];
            },
            component: () => {
                return (
                    <Text wrap={false} truncate weight="bold">
                        Textures
                    </Text>
                );
            },
        });

        const texturesRegistration = sceneExplorerService.addChildEnumerator<typeof texturesGroup, BaseTexture>({
            order: 0,
            predicate: (entity: unknown): entity is typeof texturesGroup => {
                return entity === texturesGroup;
            },
            getChildren: (scene: Scene) => {
                return scene.textures;
            },
            component: ({ entity: texture }) => {
                return (
                    <Text wrap={false} truncate>
                        {(texture.displayName || texture.name || `Unnamed Texture (${texture.uniqueId})`).substring(0, 100)}
                    </Text>
                );
            },
            icon: () => <ImageRegular />,
            isSelectable: true,
        });

        const observableRegistration = sceneExplorerService.addEntityObservableProvider((scene) => {
            return {
                entityAddedObservable: scene.onNewTextureAddedObservable,
                entityRemovedObservable: scene.onTextureRemovedObservable,
            };
        });

        return {
            dispose: () => {
                observableRegistration.dispose();
                texturesRegistration.dispose();
                groupRegistration.dispose();
            },
        };
    },
};
