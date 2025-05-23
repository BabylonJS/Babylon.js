// eslint-disable-next-line import/no-internal-modules
import type { Material } from "core/index";

import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { Body1, Body1Strong } from "@fluentui/react-components";
import { PaintBrushRegular } from "@fluentui/react-icons";

import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";
import { Scene } from "core/scene";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const MaterialHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Material Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const materialsGroup = {
            uniqueId: UniqueIdGenerator.UniqueId,
        } as const;

        const groupRegistration = sceneExplorerService.addChildEnumerator<Scene, typeof materialsGroup>({
            order: 1,
            predicate: (entity: unknown) => {
                return entity instanceof Scene;
            },
            getChildren: () => {
                return [materialsGroup];
            },
            component: () => {
                return (
                    <Body1Strong wrap={false} truncate>
                        Materials
                    </Body1Strong>
                );
            },
        });

        const materialsRegistration = sceneExplorerService.addChildEnumerator<typeof materialsGroup, Material>({
            order: 0,
            predicate: (entity: unknown): entity is typeof materialsGroup => {
                return entity === materialsGroup;
            },
            getChildren: (scene: Scene) => {
                return scene.materials;
            },
            component: ({ entity: material }) => {
                return (
                    <Body1 wrap={false} truncate>
                        {material.name}
                    </Body1>
                );
            },
            icon: () => <PaintBrushRegular />,
            isSelectable: true,
        });

        const observableRegistration = sceneExplorerService.addEntityObservableProvider((scene) => {
            return {
                entityAddedObservable: scene.onNewMaterialAddedObservable,
                entityRemovedObservable: scene.onMaterialRemovedObservable,
            };
        });

        return {
            dispose: () => {
                observableRegistration.dispose();
                materialsRegistration.dispose();
                groupRegistration.dispose();
            },
        };
    },
};
