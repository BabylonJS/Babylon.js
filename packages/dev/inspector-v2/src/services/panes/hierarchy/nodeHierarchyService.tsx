// eslint-disable-next-line import/no-internal-modules
//import type { Node } from "core/index";

import type { FunctionComponent } from "react";

import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { Body1, Body1Strong } from "@fluentui/react-components";
import { BoxRegular, BranchRegular, CameraRegular, LightbulbRegular } from "@fluentui/react-icons";

import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";
import { Node } from "core/node";
import { Scene } from "core/scene";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const NodeHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Node Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const nodesGroup = {
            uniqueId: UniqueIdGenerator.UniqueId,
        } as const;

        const groupRegistration = sceneExplorerService.addChildEnumerator<Scene, typeof nodesGroup>({
            order: 0,
            predicate: (entity: unknown) => {
                return entity instanceof Scene;
            },
            getChildren: () => {
                return [nodesGroup];
            },
            component: () => {
                return (
                    <Body1Strong wrap={false} truncate>
                        Nodes
                    </Body1Strong>
                );
            },
        });

        const nodeComponent: FunctionComponent<{ entity: Node }> = ({ entity: node }) => {
            return (
                <Body1 wrap={false} truncate>
                    {node.name}
                </Body1>
            );
        };

        const nodeIcon: FunctionComponent<{ entity: Node }> = ({ entity: node }) => {
            return node instanceof AbstractMesh ? (
                <BoxRegular />
            ) : node instanceof TransformNode ? (
                <BranchRegular />
            ) : node instanceof Camera ? (
                <CameraRegular />
            ) : node instanceof Light ? (
                <LightbulbRegular />
            ) : (
                <></>
            );
        };

        const rootNodesRegistration = sceneExplorerService.addChildEnumerator<typeof nodesGroup, Node>({
            order: 0,
            predicate: (entity: unknown): entity is typeof nodesGroup => {
                return entity === nodesGroup;
            },
            getChildren: (scene: Scene) => {
                return scene.rootNodes;
            },
            component: nodeComponent,
            icon: nodeIcon,
            isSelectable: true,
        });

        const descendentNodesRegistration = sceneExplorerService.addChildEnumerator<Node, Node>({
            order: 1,
            predicate: (entity: unknown) => {
                return entity instanceof Node;
            },
            getChildren: (scene: Scene, node: Node) => {
                return node.getChildren();
            },
            component: nodeComponent,
            icon: nodeIcon,
            isSelectable: true,
        });

        const transformNodeObservableRegistration = sceneExplorerService.addEntityObservableProvider((scene) => {
            return {
                entityAddedObservable: scene.onNewTransformNodeAddedObservable,
                entityRemovedObservable: scene.onTransformNodeRemovedObservable,
            };
        });

        const meshObservableRegistration = sceneExplorerService.addEntityObservableProvider((scene) => {
            return {
                entityAddedObservable: scene.onNewMeshAddedObservable,
                entityRemovedObservable: scene.onMeshRemovedObservable,
            };
        });

        const cameraObservableRegistration = sceneExplorerService.addEntityObservableProvider((scene) => {
            return {
                entityAddedObservable: scene.onNewCameraAddedObservable,
                entityRemovedObservable: scene.onCameraRemovedObservable,
            };
        });

        const lightObservableRegistration = sceneExplorerService.addEntityObservableProvider((scene) => {
            return {
                entityAddedObservable: scene.onNewLightAddedObservable,
                entityRemovedObservable: scene.onLightRemovedObservable,
            };
        });

        return {
            dispose: () => {
                transformNodeObservableRegistration.dispose();
                meshObservableRegistration.dispose();
                cameraObservableRegistration.dispose();
                lightObservableRegistration.dispose();
                descendentNodesRegistration.dispose();
                rootNodesRegistration.dispose();
                groupRegistration.dispose();
            },
        };
    },
};
