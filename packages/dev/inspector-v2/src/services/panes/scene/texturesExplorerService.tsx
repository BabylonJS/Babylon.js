import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { ImageRegular } from "@fluentui/react-icons";

import { Texture } from "core/Materials/Textures/texture";
import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const TextureHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Texture Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Textures",
            order: 3,
            predicate: (entity) => entity instanceof Texture,
            getRootEntities: (scene) => scene.textures,
            getEntityDisplayInfo: (texture) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(texture, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                return {
                    get name() {
                        return texture.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
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
