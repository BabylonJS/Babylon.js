import type { IDisposable, Node, Nullable } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IGizmoService } from "../../gizmoService";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import {
    BorderNoneRegular,
    BorderOutsideRegular,
    CameraRegular,
    EyeOffRegular,
    EyeRegular,
    FlashlightOffRegular,
    FlashlightRegular,
    LightbulbRegular,
    MyLocationRegular,
    VideoFilled,
    VideoRegular,
} from "@fluentui/react-icons";

import { Camera } from "core/Cameras/camera";
import { Light } from "core/Lights/light";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Observable } from "core/Misc/observable";
import { MeshIcon } from "shared-ui-components/fluent/icons";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { GizmoServiceIdentity } from "../../gizmoService";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

import "core/Rendering/boundingBoxRenderer";

export const NodeExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IGizmoService]> = {
    friendlyName: "Node Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, GizmoServiceIdentity],
    factory: (sceneExplorerService, sceneContext, gizmoService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const nodeMovedObservable = new Observable<Node>();

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Nodes",
            order: DefaultSectionsOrder.Nodes,
            getRootEntities: () => scene.rootNodes,
            getEntityChildren: (node) => node.getChildren(),
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
                    <MeshIcon />
                ) : node instanceof TransformNode ? (
                    <MyLocationRegular />
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

        const abstractMeshBoundingBoxCommandRegistration = sceneExplorerService.addCommand({
            predicate: (entity: unknown): entity is AbstractMesh => entity instanceof AbstractMesh && entity.getTotalVertices() > 0,
            order: DefaultCommandsOrder.MeshBoundingBox,
            getCommand: (mesh) => {
                const onChangeObservable = new Observable<void>();
                const showBoundingBoxHook = InterceptProperty(mesh, "showBoundingBox", {
                    afterSet: () => onChangeObservable.notifyObservers(),
                });

                return {
                    type: "toggle",
                    get displayName() {
                        return `${mesh.showBoundingBox ? "Hide" : "Show"} Bounding Box`;
                    },
                    icon: () => (mesh.showBoundingBox ? <BorderOutsideRegular /> : <BorderNoneRegular />),
                    get isEnabled() {
                        return mesh.showBoundingBox;
                    },
                    set isEnabled(enabled: boolean) {
                        mesh.showBoundingBox = enabled;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        showBoundingBoxHook.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
        });

        const abstractMeshVisibilityCommandRegistration = sceneExplorerService.addCommand({
            predicate: (entity: unknown): entity is AbstractMesh => entity instanceof AbstractMesh && entity.getTotalVertices() > 0,
            order: DefaultCommandsOrder.MeshVisibility,
            getCommand: (mesh) => {
                const onChangeObservable = new Observable<void>();
                const isVisibleHook = InterceptProperty(mesh, "isVisible", {
                    afterSet: () => onChangeObservable.notifyObservers(),
                });

                return {
                    type: "toggle",
                    get displayName() {
                        return `${mesh.isVisible ? "Hide" : "Show"} Mesh`;
                    },
                    icon: () => (mesh.isVisible ? <EyeRegular /> : <EyeOffRegular />),
                    get isEnabled() {
                        return !mesh.isVisible;
                    },
                    set isEnabled(enabled: boolean) {
                        mesh.isVisible = !enabled;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        isVisibleHook.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
        });

        const activeCameraCommandRegistration = sceneExplorerService.addCommand({
            predicate: (entity: unknown) => entity instanceof Camera,
            order: DefaultCommandsOrder.CameraActive,
            getCommand: (camera) => {
                const scene = camera.getScene();
                const onChangeObservable = new Observable<void>();
                const activeCameraChangedObserver = scene.onActiveCameraChanged.add(() => {
                    onChangeObservable.notifyObservers();
                });

                return {
                    type: "toggle",
                    displayName: "Activate and Attach Controls",
                    icon: () => (scene.activeCamera === camera ? <VideoFilled /> : <VideoRegular />),
                    get isEnabled() {
                        return scene.activeCamera === camera;
                    },
                    set isEnabled(enabled: boolean) {
                        if (enabled && scene.activeCamera !== camera) {
                            scene.activeCamera?.detachControl();
                            scene.activeCamera = camera;
                            camera.attachControl(true);
                        }
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        activeCameraChangedObserver.remove();
                        onChangeObservable.clear();
                    },
                };
            },
        });

        function addGizmoCommand<NodeT extends Node>(nodeClass: abstract new (...args: any[]) => NodeT, getGizmoRef: (node: NodeT) => IDisposable) {
            return sceneExplorerService.addCommand({
                predicate: (entity: unknown): entity is NodeT => entity instanceof nodeClass,
                order: DefaultCommandsOrder.GizmoActive,
                getCommand: (node) => {
                    const onChangeObservable = new Observable<void>();

                    let gizmoRef: Nullable<IDisposable> = null;

                    return {
                        type: "toggle",
                        get displayName() {
                            return `Turn ${gizmoRef ? "Off" : "On"} Gizmo`;
                        },
                        icon: () => (gizmoRef ? <EyeRegular /> : <EyeOffRegular />),
                        get isEnabled() {
                            return !!gizmoRef;
                        },
                        set isEnabled(enabled: boolean) {
                            if (enabled) {
                                if (!gizmoRef) {
                                    gizmoRef = getGizmoRef(node);
                                    onChangeObservable.notifyObservers();
                                }
                            } else {
                                if (gizmoRef) {
                                    gizmoRef.dispose();
                                    gizmoRef = null;
                                    onChangeObservable.notifyObservers();
                                }
                            }
                        },
                        onChange: onChangeObservable,
                        dispose: () => {
                            onChangeObservable.clear();
                        },
                    };
                },
            });
        }

        const cameraGizmoCommandRegistration = addGizmoCommand(Camera, gizmoService.getCameraGizmo.bind(gizmoService));

        const lightEnabledCommandRegistration = sceneExplorerService.addCommand({
            predicate: (entity: unknown): entity is Light => entity instanceof Light,
            order: DefaultCommandsOrder.LightActive,
            getCommand: (light) => {
                return {
                    type: "toggle",
                    get displayName() {
                        return `Turn Light ${light.isEnabled() ? "Off" : "On"}`;
                    },
                    icon: () => (light.isEnabled() ? <FlashlightRegular /> : <FlashlightOffRegular />),
                    get isEnabled() {
                        return !light.isEnabled();
                    },
                    set isEnabled(enabled: boolean) {
                        light.setEnabled(!enabled);
                    },
                    onChange: light.onEnabledStateChangedObservable,
                };
            },
        });

        const lightGizmoCommandRegistration = addGizmoCommand(Light, gizmoService.getLightGizmo.bind(gizmoService));

        return {
            dispose: () => {
                sectionRegistration.dispose();
                abstractMeshBoundingBoxCommandRegistration.dispose();
                abstractMeshVisibilityCommandRegistration.dispose();
                activeCameraCommandRegistration.dispose();
                cameraGizmoCommandRegistration.dispose();
                lightEnabledCommandRegistration.dispose();
                lightGizmoCommandRegistration.dispose();
            },
        };
    },
};
