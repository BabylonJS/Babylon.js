import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { BoxRegular, BranchRegular, CameraRegular, EyeOffRegular, EyeRegular, LightbulbRegular } from "@fluentui/react-icons";

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
            getEntityParent: (node) => node.parent,
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
            getEntityAddedObservables: (scene) => [
                scene.onNewMeshAddedObservable,
                scene.onNewTransformNodeAddedObservable,
                scene.onNewCameraAddedObservable,
                scene.onNewLightAddedObservable,
            ],
            getEntityRemovedObservables: (scene) => [
                scene.onMeshRemovedObservable,
                scene.onTransformNodeRemovedObservable,
                scene.onCameraRemovedObservable,
                scene.onLightRemovedObservable,
            ],
        });

        const visibilityCommandRegistration = sceneExplorerService.addCommand({
            type: "toggle",
            order: 0,
            predicate: (entity: unknown): entity is AbstractMesh => entity instanceof AbstractMesh && entity.getTotalVertices() > 0,
            isEnabled: (scene, mesh) => {
                return mesh.isVisible;
            },
            setEnabled: (scene, mesh, enabled) => {
                mesh.isVisible = enabled;
            },
            displayName: "Show/Hide Mesh",
            icon: () => <EyeRegular />,
            disabledIcon: () => <EyeOffRegular />,
        });

        return {
            dispose: () => {
                visibilityCommandRegistration.dispose();
                sectionRegistration.dispose();
            },
        };
    },
};
