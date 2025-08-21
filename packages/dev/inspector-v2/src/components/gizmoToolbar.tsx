import type { FunctionComponent } from "react";

import type { IDisposable, Nullable, Scene, TransformNode } from "core/index";
import type { IGizmoService } from "../services/gizmoService";

import { ToggleButton, Tooltip } from "@fluentui/react-components";
import { ArrowExpandRegular, ArrowMoveRegular, ArrowRotateClockwiseRegular, SelectObjectRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";

import { Bone } from "core/Bones/bone";
import { Camera } from "core/Cameras/camera";
import { GizmoManager } from "core/Gizmos/gizmoManager";
import { Light } from "core/Lights/light";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { Node } from "core/node";
import { useResource } from "../hooks/resourceHooks";

type GizmoMode = "translate" | "rotate" | "scale" | "boundingBox";

export const GizmoToolbar: FunctionComponent<{ scene: Scene; entity: unknown; gizmoService: IGizmoService }> = (props) => {
    const { scene, entity, gizmoService } = props;

    const gizmoManager = useResource(
        useCallback(() => {
            const utilityLayerRef = gizmoService.getUtilityLayer(scene);
            const keepDepthUtilityLayerRef = gizmoService.getUtilityLayer(scene, "keepDepth");
            const gizmoManager = new GizmoManager(scene, undefined, utilityLayerRef.value, keepDepthUtilityLayerRef.value);

            const disposeGizmoManager = gizmoManager.dispose.bind(gizmoManager);
            gizmoManager.dispose = () => {
                disposeGizmoManager();
                utilityLayerRef.dispose();
                keepDepthUtilityLayerRef.dispose();
            };

            return gizmoManager;
        }, [scene])
    );

    const [gizmoMode, setGizmoMode] = useState<GizmoMode>();

    useEffect(() => {
        let visualizationGizmoRef: Nullable<IDisposable> = null;
        let resolvedEntity = entity;
        if (gizmoMode) {
            if (entity instanceof Camera) {
                const cameraGizmoRef = gizmoService.getCameraGizmo(entity);
                visualizationGizmoRef = cameraGizmoRef;
                resolvedEntity = cameraGizmoRef.value.attachedNode;
            } else if (entity instanceof Light) {
                const lightGizmoRef = gizmoService.getLightGizmo(entity);
                visualizationGizmoRef = lightGizmoRef;
                resolvedEntity = lightGizmoRef.value.attachedNode;
            } else if (entity instanceof Bone) {
                resolvedEntity = entity.getTransformNode() ?? entity;
            }
        }

        let resolvedGizmoMode = gizmoMode;
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

        gizmoManager.positionGizmoEnabled = resolvedGizmoMode === "translate";
        gizmoManager.rotationGizmoEnabled = resolvedGizmoMode === "rotate";
        gizmoManager.scaleGizmoEnabled = resolvedGizmoMode === "scale";
        gizmoManager.boundingBoxGizmoEnabled = resolvedGizmoMode === "boundingBox";

        if (gizmoManager.gizmos.boundingBoxGizmo) {
            gizmoManager.gizmos.boundingBoxGizmo.fixedDragMeshScreenSize = true;
        }

        if (!resolvedGizmoMode) {
            gizmoManager.attachToNode(null);
        } else {
            if (resolvedEntity instanceof AbstractMesh) {
                gizmoManager.attachToMesh(resolvedEntity);
            } else if (resolvedEntity instanceof Node) {
                gizmoManager.attachToNode(resolvedEntity);
            }
        }

        return () => {
            gizmoManager.attachToNode(null);
            visualizationGizmoRef?.dispose();
        };
    }, [gizmoManager, gizmoMode, entity]);

    const updateGizmoMode = useCallback((mode: GizmoMode) => {
        setGizmoMode((currentMode) => (currentMode === mode ? undefined : mode));
    }, []);

    return (
        <>
            <Tooltip content="Translate" relationship="label">
                <ToggleButton appearance="subtle" icon={<ArrowMoveRegular />} checked={gizmoMode === "translate"} onClick={() => updateGizmoMode("translate")} />
            </Tooltip>
            <Tooltip content="Rotate" relationship="label">
                <ToggleButton appearance="subtle" icon={<ArrowRotateClockwiseRegular />} checked={gizmoMode === "rotate"} onClick={() => updateGizmoMode("rotate")} />
            </Tooltip>
            <Tooltip content="Scale" relationship="label">
                <ToggleButton appearance="subtle" icon={<ArrowExpandRegular />} checked={gizmoMode === "scale"} onClick={() => updateGizmoMode("scale")} />
            </Tooltip>
            <Tooltip content="Bounding Box" relationship="label">
                <ToggleButton appearance="subtle" icon={<SelectObjectRegular />} checked={gizmoMode === "boundingBox"} onClick={() => updateGizmoMode("boundingBox")} />
            </Tooltip>
        </>
    );
};
