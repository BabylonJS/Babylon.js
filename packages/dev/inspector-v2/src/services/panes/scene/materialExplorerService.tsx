import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { EditRegular } from "@fluentui/react-icons";

import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { Observable } from "core/Misc/observable";
import { MaterialIcon } from "shared-ui-components/fluent/icons";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { EditNodeMaterial } from "../../../misc/nodeMaterialEditor";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Material Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Materials",
            order: DefaultSectionsOrder.Materials,
            getRootEntities: () => [...scene.materials, ...scene.multiMaterials],
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
            entityIcon: () => <MaterialIcon />,
            getEntityAddedObservables: () => [scene.onNewMaterialAddedObservable],
            getEntityRemovedObservables: () => [scene.onMaterialRemovedObservable],
        });

        const editNodeMaterialCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity) => entity instanceof NodeMaterial,
            order: DefaultCommandsOrder.EditNodeMaterial,
            getCommand: (nodeMaterial) => {
                return {
                    type: "action",
                    displayName: "Edit in Node Material Editor",
                    icon: () => <EditRegular />,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    execute: async () => await EditNodeMaterial(nodeMaterial),
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                editNodeMaterialCommandRegistration.dispose();
            },
        };
    },
};
