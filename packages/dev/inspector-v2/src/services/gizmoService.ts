import type { Camera, Gizmo, IDisposable, Light, Node, Scene } from "core/index";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";

import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { CameraGizmo } from "core/Gizmos/cameraGizmo";
import { LightGizmo } from "core/Gizmos/lightGizmo";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";

type Reference<T> = {
    value: T;
} & IDisposable;

export const GizmoServiceIdentity = Symbol("GizmoService");

export interface IGizmoService extends IService<typeof GizmoServiceIdentity> {
    getUtilityLayer(scene: Scene, layer?: string): Reference<UtilityLayerRenderer>;
    getCameraGizmo(camera: Camera): Reference<CameraGizmo>;
    getLightGizmo(light: Light): Reference<LightGizmo>;
    getCameraGizmos(scene: Scene): readonly CameraGizmo[];
    getLightGizmos(scene: Scene): readonly LightGizmo[];
}

export const GizmoServiceDefinition: ServiceDefinition<[IGizmoService], []> = {
    friendlyName: "Gizmo Service",
    produces: [GizmoServiceIdentity],
    factory: () => {
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

        return {
            getUtilityLayer,
            getCameraGizmo,
            getLightGizmo,
            getCameraGizmos: (scene) => scene.cameras.map((camera) => cameraGizmos.get(camera)?.gizmo).filter(Boolean) as readonly CameraGizmo[],
            getLightGizmos: (scene) => scene.lights.map((light) => lightGizmos.get(light)?.gizmo).filter(Boolean) as readonly LightGizmo[],
        };
    },
};
