// eslint-disable-next-line import/no-internal-modules
import type { IReadonlyObservable, Node, Scene } from "core/index";

import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { BoxRegular, BranchRegular, CameraRegular, EyeRegular, LightbulbRegular } from "@fluentui/react-icons";

import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const NodeHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Node Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Nodes",
            order: 0,
            getRootEntities: (scene) => scene.rootNodes,
            getEntityChildren: (node) => node.getChildren(),
            getEntityDisplayName: (node) => node.name,
            entityIcon: ({ entity: node }) =>
                node instanceof AbstractMesh ? (
                    <BoxRegular />
                ) : node instanceof TransformNode ? (
                    <BranchRegular />
                ) : node instanceof Camera ? (
                    <CameraRegular />
                ) : node instanceof Light ? (
                    <LightbulbRegular />
                ) : (
                    <></>
                ),
            watch: (scene, onAdded, onRemoved) => {
                const observers = [
                    ...(
                        [
                            scene.onNewMeshAddedObservable,
                            scene.onNewTransformNodeAddedObservable,
                            scene.onNewCameraAddedObservable,
                            scene.onNewLightAddedObservable,
                        ] as IReadonlyObservable<Node>[]
                    ).map((observable) => observable.add((node) => onAdded(node))),
                    ...(
                        [
                            scene.onMeshRemovedObservable,
                            scene.onTransformNodeRemovedObservable,
                            scene.onCameraRemovedObservable,
                            scene.onLightRemovedObservable,
                        ] as IReadonlyObservable<Node>[]
                    ).map((observable) => observable.add((node) => onRemoved(node))),
                ] as const;

                return {
                    dispose: () => {
                        for (const observer of observers) {
                            observer.remove();
                        }
                    },
                };
            },
        });

        const visibilityCommandRegistration = sceneExplorerService.addCommand({
            order: 0,
            predicate: (entity: unknown) => entity instanceof AbstractMesh,
            execute: (scene: Scene, mesh: AbstractMesh) => {
                // TODO
            },
            displayName: "Show/Hide Mesh",
            icon: () => <EyeRegular />,
        });

        return {
            dispose: () => {
                visibilityCommandRegistration.dispose();
                sectionRegistration.dispose();
            },
        };
    },
};
