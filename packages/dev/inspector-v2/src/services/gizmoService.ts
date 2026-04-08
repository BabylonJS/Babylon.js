import { type Camera, type Gizmo, type IDisposable, type IReadonlyObservable, type Light, type Node, type Nullable, type Scene, type TransformNode } from "core/index";
import { type IService, type ServiceDefinition } from "../modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "./sceneContext";
import { type ISelectionService, SelectionServiceIdentity } from "./selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "./watcherService";

import { Bone } from "core/Bones/bone";
import { Camera as CameraClass } from "core/Cameras/camera";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { CameraGizmo } from "core/Gizmos/cameraGizmo";
import { GizmoCoordinatesMode } from "core/Gizmos/gizmo";
import { GizmoManager } from "core/Gizmos/gizmoManager";
import { LightGizmo } from "core/Gizmos/lightGizmo";
import { Light as LightClass } from "core/Lights/light";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { Observable } from "core/Misc/observable";
import { Node as NodeClass } from "core/node";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";

type Reference<T> = {
    value: T;
} & IDisposable;

/**
 * Represents the available gizmo manipulation modes.
 */
export type GizmoMode = "translate" | "rotate" | "scale" | "boundingBox";

/**
 * The unique identity symbol for the gizmo service.
 */
export const GizmoServiceIdentity = Symbol("GizmoService");

/**
 * Manages gizmos for manipulating objects in the scene, including shared utility layers
 * and camera/light gizmo lifecycle.
 */
export interface IGizmoService extends IService<typeof GizmoServiceIdentity> {
    /**
     * Gets a ref-counted utility layer for the specified scene. The layer is shared across consumers
     * and disposed when the last reference is released.
     * @param scene The scene to get the utility layer for.
     * @param layer An optional layer name to differentiate between multiple utility layers.
     * @returns A ref-counted reference to the utility layer. Dispose to release.
     */
    getUtilityLayer(scene: Scene, layer?: string): Reference<UtilityLayerRenderer>;

    /**
     * Gets a ref-counted camera gizmo for the specified camera.
     * @param camera The camera to get the gizmo for.
     * @returns A ref-counted reference to the camera gizmo. Dispose to release.
     */
    getCameraGizmo(camera: Camera): Reference<CameraGizmo>;

    /**
     * Gets a ref-counted light gizmo for the specified light.
     * @param light The light to get the gizmo for.
     * @returns A ref-counted reference to the light gizmo. Dispose to release.
     */
    getLightGizmo(light: Light): Reference<LightGizmo>;

    /**
     * Gets all camera gizmos currently active for the specified scene.
     * @param scene The scene to get camera gizmos for.
     * @returns A readonly array of camera gizmos.
     */
    getCameraGizmos(scene: Scene): readonly CameraGizmo[];

    /**
     * Gets all light gizmos currently active for the specified scene.
     * @param scene The scene to get light gizmos for.
     * @returns A readonly array of light gizmos.
     */
    getLightGizmos(scene: Scene): readonly LightGizmo[];

    /**
     * Gets or sets the current gizmo mode (translate, rotate, scale, or boundingBox), or undefined if no gizmo mode is active.
     */
    gizmoMode: GizmoMode | undefined;

    /**
     * An observable that notifies when the gizmo mode changes.
     */
    readonly onGizmoModeChanged: IReadonlyObservable<void>;

    /**
     * Gets or sets the coordinates mode for gizmos (local or world).
     */
    coordinatesMode: GizmoCoordinatesMode;

    /**
     * An observable that notifies when the coordinates mode changes.
     */
    readonly onCoordinatesModeChanged: IReadonlyObservable<void>;

    /**
     * Gets or sets the camera used by gizmos, or null to use the default scene camera.
     */
    gizmoCamera: Camera | null;

    /**
     * An observable that notifies when the gizmo camera changes.
     */
    readonly onCameraGizmoChanged: IReadonlyObservable<void>;
}

export const GizmoServiceDefinition: ServiceDefinition<[IGizmoService], [ISceneContext, ISelectionService, IWatcherService]> = {
    friendlyName: "Gizmo Service",
    produces: [GizmoServiceIdentity],
    consumes: [SceneContextIdentity, SelectionServiceIdentity, WatcherServiceIdentity],
    factory: (sceneContext, selectionService, watcherService) => {
        // Ref-counted utility layers, shared across consumers.
        const utilityLayers = new WeakMap<Scene, Map<string, { utilityLayer: UtilityLayerRenderer; refCount: number }>>();
        const getUtilityLayer = (scene: Scene, layer = "default") => {
            let utilityLayerInfoForScene = utilityLayers.get(scene);
            if (!utilityLayerInfoForScene) {
                utilityLayerInfoForScene = new Map();
                utilityLayers.set(scene, utilityLayerInfoForScene);
            }
            let utilityLayerInfo = utilityLayerInfoForScene.get(layer);
            if (!utilityLayerInfo) {
                const utilityLayer = scene.frameGraph ? FrameGraphUtils.CreateUtilityLayerRenderer(scene.frameGraph) : new UtilityLayerRenderer(scene);
                utilityLayerInfo = { utilityLayer, refCount: 0 };
                utilityLayerInfoForScene.set(layer, utilityLayerInfo);
            }

            utilityLayerInfo.refCount++;

            let disposed = false;
            return {
                value: utilityLayerInfo.utilityLayer,
                dispose: () => {
                    if (!disposed) {
                        disposed = true;
                        utilityLayerInfo.refCount--;
                        if (utilityLayerInfo.refCount === 0) {
                            utilityLayerInfo.utilityLayer.dispose();
                            utilityLayerInfoForScene.delete(layer);
                            if (utilityLayerInfoForScene.size === 0) {
                                utilityLayers.delete(scene);
                            }
                        }
                    }
                },
            } satisfies Reference<UtilityLayerRenderer>;
        };

        // Ref-counted camera/light visualization gizmos.
        function getGizmo<NodeT extends Node, GizmoT extends Gizmo>(
            node: NodeT,
            scene: Scene,
            gizmoClass: new (...args: ConstructorParameters<typeof Gizmo>) => GizmoT,
            gizmoMap: WeakMap<NodeT, { gizmo: GizmoT; refCount: number }>,
            onGizmoCreated: (node: NodeT, gizmo: GizmoT) => void
        ) {
            let refCountedGizmo = gizmoMap.get(node);

            if (!refCountedGizmo) {
                const utilityLayerRef = getUtilityLayer(scene);
                const gizmo = new gizmoClass(utilityLayerRef.value);
                onGizmoCreated(node, gizmo);
                const nodeDisposedObserver = node.onDisposeObservable.addOnce(() => gizmo.dispose());
                const disposeGizmo = gizmo.dispose.bind(gizmo);
                gizmo.dispose = () => {
                    nodeDisposedObserver.remove();
                    disposeGizmo();
                    utilityLayerRef.dispose();
                };
                refCountedGizmo = { gizmo, refCount: 0 };
                gizmoMap.set(node, refCountedGizmo);
                onGizmoCreated(node, gizmo);
            }

            refCountedGizmo.refCount++;

            let disposed = false;
            return {
                value: refCountedGizmo.gizmo,
                dispose: () => {
                    if (!disposed) {
                        disposed = true;
                        refCountedGizmo.refCount--;
                        if (refCountedGizmo.refCount === 0) {
                            refCountedGizmo.gizmo.dispose();
                            gizmoMap.delete(node);
                        }
                    }
                },
            } satisfies Reference<GizmoT>;
        }

        const cameraGizmos = new WeakMap<Camera, { gizmo: CameraGizmo; refCount: number }>();
        const getCameraGizmo = (camera: Camera) => getGizmo(camera, camera.getScene(), CameraGizmo, cameraGizmos, (camera, gizmo) => (gizmo.camera = camera));

        const lightGizmos = new WeakMap<Light, { gizmo: LightGizmo; refCount: number }>();
        const getLightGizmo = (light: Light) => getGizmo(light, light.getScene(), LightGizmo, lightGizmos, (light, gizmo) => (gizmo.light = light));

        // Gizmo mode/coordinates state and GizmoManager lifecycle.
        let gizmoModeState: GizmoMode | undefined = undefined;
        const gizmoModeObservable = new Observable<void>();

        let coordinatesModeState: GizmoCoordinatesMode = GizmoCoordinatesMode.Local;
        const coordinatesModeObservable = new Observable<void>();

        let cameraGizmoState: Camera | null = null;
        const cameraGizmoObservable = new Observable<void>();

        let currentGizmoManager: Nullable<GizmoManager> = null;
        let currentUtilityLayerRef: Nullable<Reference<UtilityLayerRenderer>> = null;
        let currentKeepDepthUtilityLayerRef: Nullable<Reference<UtilityLayerRenderer>> = null;
        let coordinatesModeInterceptToken: Nullable<IDisposable> = null;
        let currentVisualizationGizmoRef: Nullable<IDisposable> = null;

        function createGizmoManager(scene: Scene) {
            destroyGizmoManager();

            currentUtilityLayerRef = getUtilityLayer(scene);
            currentKeepDepthUtilityLayerRef = getUtilityLayer(scene, "keepDepth");
            const gm = new GizmoManager(scene, undefined, currentUtilityLayerRef.value, currentKeepDepthUtilityLayerRef.value);
            gm.usePointerToAttachGizmos = false;

            const originalDispose = gm.dispose.bind(gm);
            gm.dispose = () => {
                originalDispose();
                currentUtilityLayerRef?.dispose();
                currentKeepDepthUtilityLayerRef?.dispose();
                currentUtilityLayerRef = null;
                currentKeepDepthUtilityLayerRef = null;
            };

            gm.coordinatesMode = coordinatesModeState;

            coordinatesModeInterceptToken = watcherService.watchProperty(gm, "coordinatesMode", (value: GizmoCoordinatesMode) => {
                if (value !== coordinatesModeState) {
                    coordinatesModeState = value;
                    coordinatesModeObservable.notifyObservers();
                }
            });

            currentGizmoManager = gm;
        }

        function destroyGizmoManager() {
            currentVisualizationGizmoRef?.dispose();
            currentVisualizationGizmoRef = null;
            coordinatesModeInterceptToken?.dispose();
            coordinatesModeInterceptToken = null;
            if (currentGizmoManager) {
                currentGizmoManager.attachToNode(null);
                currentGizmoManager.dispose();
                currentGizmoManager = null;
            }
        }

        function syncGizmoManager() {
            currentVisualizationGizmoRef?.dispose();
            currentVisualizationGizmoRef = null;

            if (!currentGizmoManager) {
                return;
            }

            const entity = selectionService.selectedEntity;
            let resolvedEntity = entity;

            if (gizmoModeState) {
                if (entity instanceof CameraClass) {
                    const cameraGizmoRef = getCameraGizmo(entity);
                    currentVisualizationGizmoRef = cameraGizmoRef;
                    resolvedEntity = cameraGizmoRef.value.attachedNode;
                } else if (entity instanceof LightClass) {
                    const lightGizmoRef = getLightGizmo(entity);
                    currentVisualizationGizmoRef = lightGizmoRef;
                    resolvedEntity = lightGizmoRef.value.attachedNode;
                } else if (entity instanceof Bone) {
                    resolvedEntity = entity.getTransformNode() ?? entity;
                }
            }

            let resolvedGizmoMode = gizmoModeState;
            if (!resolvedEntity) {
                resolvedGizmoMode = undefined;
            } else {
                if (resolvedGizmoMode === "translate") {
                    if (!(resolvedEntity as TransformNode).position) {
                        resolvedGizmoMode = undefined;
                    }
                } else if (resolvedGizmoMode === "rotate") {
                    if (!(resolvedEntity as TransformNode).rotation) {
                        resolvedGizmoMode = undefined;
                    }
                } else if (resolvedGizmoMode === "scale") {
                    if (!(resolvedEntity as TransformNode).scaling) {
                        resolvedGizmoMode = undefined;
                    }
                } else {
                    if (!(resolvedEntity instanceof AbstractMesh)) {
                        resolvedGizmoMode = undefined;
                    }
                }
            }

            currentGizmoManager.positionGizmoEnabled = resolvedGizmoMode === "translate";
            currentGizmoManager.rotationGizmoEnabled = resolvedGizmoMode === "rotate";
            currentGizmoManager.scaleGizmoEnabled = resolvedGizmoMode === "scale";
            currentGizmoManager.boundingBoxGizmoEnabled = resolvedGizmoMode === "boundingBox";

            if (currentGizmoManager.gizmos.boundingBoxGizmo) {
                currentGizmoManager.gizmos.boundingBoxGizmo.fixedDragMeshScreenSize = true;
            }

            if (!resolvedGizmoMode) {
                currentGizmoManager.attachToNode(null);
            } else {
                if (resolvedEntity instanceof AbstractMesh) {
                    currentGizmoManager.attachToMesh(resolvedEntity);
                } else if (resolvedEntity instanceof NodeClass) {
                    currentGizmoManager.attachToNode(resolvedEntity);
                }
            }
        }

        // Recreate the GizmoManager when the active scene changes.
        const sceneObserver = sceneContext.currentSceneObservable.add((scene) => {
            destroyGizmoManager();
            if (scene) {
                createGizmoManager(scene);
                syncGizmoManager();
            }
        });

        // Re-attach gizmos when the selected entity changes.
        const selectionObserver = selectionService.onSelectedEntityChanged.add(() => {
            syncGizmoManager();
        });

        // If a scene is already active, initialize immediately.
        if (sceneContext.currentScene) {
            createGizmoManager(sceneContext.currentScene);
            syncGizmoManager();
        }

        return {
            getUtilityLayer,
            getCameraGizmo,
            getLightGizmo,
            getCameraGizmos: (scene) => scene.cameras.map((camera) => cameraGizmos.get(camera)?.gizmo).filter(Boolean) as readonly CameraGizmo[],
            getLightGizmos: (scene) => scene.lights.map((light) => lightGizmos.get(light)?.gizmo).filter(Boolean) as readonly LightGizmo[],

            get gizmoMode() {
                return gizmoModeState;
            },
            set gizmoMode(mode: GizmoMode | undefined) {
                if (mode !== gizmoModeState) {
                    gizmoModeState = mode;
                    gizmoModeObservable.notifyObservers();
                    syncGizmoManager();
                }
            },
            onGizmoModeChanged: gizmoModeObservable as IReadonlyObservable<void>,

            get coordinatesMode() {
                return coordinatesModeState;
            },
            set coordinatesMode(mode: GizmoCoordinatesMode) {
                if (mode !== coordinatesModeState) {
                    coordinatesModeState = mode;
                    if (currentGizmoManager) {
                        currentGizmoManager.coordinatesMode = mode;
                    }
                    coordinatesModeObservable.notifyObservers();
                }
            },
            onCoordinatesModeChanged: coordinatesModeObservable as IReadonlyObservable<void>,

            get gizmoCamera() {
                return cameraGizmoState;
            },
            set gizmoCamera(camera: Camera | null) {
                const currentScene = sceneContext.currentScene;
                if (!currentScene || camera === cameraGizmoState) {
                    return;
                }

                cameraGizmoState = camera;

                const utilityLayerRef = getUtilityLayer(currentScene);
                const keepDepthUtilityLayerRef = getUtilityLayer(currentScene, "keepDepth");

                utilityLayerRef.value.setRenderCamera(camera);
                keepDepthUtilityLayerRef.value.setRenderCamera(camera);

                cameraGizmoObservable.notifyObservers();
            },
            onCameraGizmoChanged: cameraGizmoObservable as IReadonlyObservable<void>,

            dispose: () => {
                sceneObserver.remove();
                selectionObserver.remove();
                destroyGizmoManager();
                gizmoModeObservable.clear();
                coordinatesModeObservable.clear();
                cameraGizmoObservable.clear();
            },
        };
    },
};
