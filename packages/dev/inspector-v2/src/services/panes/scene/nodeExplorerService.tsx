import type { Gizmo, Nullable } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import {
    BoxRegular,
    BranchRegular,
    CameraRegular,
    Cone16Filled,
    Cone16Regular,
    EyeOffRegular,
    EyeRegular,
    LightbulbRegular,
    VideoFilled,
    VideoRegular,
} from "@fluentui/react-icons";

import { Camera } from "core/Cameras/camera";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { CameraGizmo } from "core/Gizmos/cameraGizmo";
import { Light } from "core/Lights/light";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Observable } from "core/Misc";
import { Node } from "core/node";
import { UtilityLayerRenderer } from "core/Rendering";
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

        const abstractMeshVisibilityCommandRegistration = sceneExplorerService.addCommand({
            predicate: (entity: unknown): entity is AbstractMesh => entity instanceof AbstractMesh && entity.getTotalVertices() > 0,
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

        const gizmos = new Set<Gizmo>();
        let utilityLayer: Nullable<UtilityLayerRenderer> = null;
        const getOrCreateUtilityLayer = () => {
            if (!utilityLayer) {
                utilityLayer = scene.frameGraph ? FrameGraphUtils.CreateUtilityLayerRenderer(scene.frameGraph) : new UtilityLayerRenderer(scene);
            }
            return utilityLayer;
        };

        const cameraGizmoCommandRegistration = sceneExplorerService.addCommand({
            predicate: (entity: unknown) => entity instanceof Camera,
            getCommand: (camera) => {
                const onChangeObservable = new Observable<void>();

                const getGizmo = () => {
                    return camera.reservedDataStore?.cameraGizmo as Nullable<CameraGizmo>;
                };

                const createGizmo = () => {
                    const gizmo = new CameraGizmo(getOrCreateUtilityLayer());
                    gizmo.camera = camera;
                    gizmo.material.reservedDataStore = { hidden: true };

                    gizmos.add(gizmo);
                    if (!camera.reservedDataStore) {
                        camera.reservedDataStore = {};
                    }
                    camera.reservedDataStore.cameraGizmo = gizmo;

                    onChangeObservable.notifyObservers();

                    return gizmo;
                };

                const disposeGizmo = () => {
                    const gizmo = getGizmo();
                    if (gizmo) {
                        gizmos.delete(gizmo);
                        delete camera.reservedDataStore.cameraGizmo;
                        gizmo.dispose();
                    }

                    onChangeObservable.notifyObservers();
                };

                return {
                    type: "toggle",
                    get displayName() {
                        return `Turn ${getGizmo() ? "Off" : "On"} Gizmo`;
                    },
                    icon: () => (getGizmo() ? <Cone16Filled /> : <Cone16Regular />),
                    get isEnabled() {
                        return !!getGizmo();
                    },
                    set isEnabled(enabled: boolean) {
                        if (enabled) {
                            if (!getGizmo()) {
                                createGizmo();
                            }
                        } else {
                            disposeGizmo();
                        }
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        onChangeObservable.clear();
                    },
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                gizmos.forEach((gizmo) => gizmo.dispose());
                utilityLayer?.dispose();
                abstractMeshVisibilityCommandRegistration.dispose();
                activeCameraCommandRegistration.dispose();
                cameraGizmoCommandRegistration.dispose();
            },
        };
    },
};
