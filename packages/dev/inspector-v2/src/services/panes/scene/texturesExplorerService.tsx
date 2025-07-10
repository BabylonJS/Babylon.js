import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { ImageRegular } from "@fluentui/react-icons";

import { Texture } from "core/Materials/Textures/texture";
import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const TextureHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Texture Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return void 0;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Textures",
            order: 400,
            predicate: (entity) => entity instanceof Texture,
            getRootEntities: () => scene.textures,
            getEntityDisplayInfo: (texture) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(texture, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                return {
                    get name() {
                        return texture.displayName || texture.name || `${texture.constructor?.name || "Unnamed Texture"} (${texture.uniqueId})`;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <ImageRegular />,
            getEntityAddedObservables: () => [scene.onNewTextureAddedObservable],
            getEntityRemovedObservables: () => [scene.onTextureRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
