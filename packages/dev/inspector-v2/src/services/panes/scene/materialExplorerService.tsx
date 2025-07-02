import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { PaintBrushRegular } from "@fluentui/react-icons";

import { Material } from "core/Materials/material";
import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Material Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Materials",
            order: 2,
            predicate: (entity) => entity instanceof Material,
            getRootEntities: (scene) => scene.materials,
            getEntityDisplayInfo: (material) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(material, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                return {
                    get name() {
                        return material.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <PaintBrushRegular />,
            getEntityAddedObservables: (scene) => [scene.onNewMaterialAddedObservable],
            getEntityRemovedObservables: (scene) => [scene.onMaterialRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
