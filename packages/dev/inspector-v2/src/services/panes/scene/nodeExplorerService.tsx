import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { BoxRegular, BranchRegular, CameraRegular, EyeOffRegular, EyeRegular, LightbulbRegular } from "@fluentui/react-icons";

import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Observable } from "core/Misc";
import { Node } from "core/node";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const NodeExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Node Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const nodeMovedObservable = new Observable<Node>();

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Nodes",
            order: DefaultSectionsOrder.Nodes,
            predicate: (entity) => entity instanceof Node,
            getRootEntities: () => scene.rootNodes,
            getEntityChildren: (node) => node.getChildren(),
            getEntityParent: (node) => node.parent,
            getEntityDisplayInfo: (node) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(node, "name", {
                    afterSet: () => onChangeObservable.notifyObservers(),
                });

                const parentHookToken = InterceptProperty(node, "parent", {
                    afterSet: () => {
                        nodeMovedObservable.notifyObservers(node);
                    },
                });

                return {
                    get name() {
                        return node.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        parentHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
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
            getEntityAddedObservables: () => [
                scene.onNewMeshAddedObservable,
                scene.onNewTransformNodeAddedObservable,
                scene.onNewCameraAddedObservable,
                scene.onNewLightAddedObservable,
            ],
            getEntityRemovedObservables: () => [
                scene.onMeshRemovedObservable,
                scene.onTransformNodeRemovedObservable,
                scene.onCameraRemovedObservable,
                scene.onLightRemovedObservable,
            ],
            getEntityMovedObservables: () => [nodeMovedObservable],
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
