import type { FunctionComponent } from "react";

import type { AbstractMesh, IMeshDataCache, Scene } from "core/index";
import type { IGizmoService } from "../services/gizmoService";

import { TargetRegular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";

export const PickingToolbar: FunctionComponent<{ scene: Scene; selectEntity: (entity: unknown) => void; gizmoService: IGizmoService }> = (props) => {
    const { scene, selectEntity, gizmoService } = props;

    const meshDataCache = useMemo(() => new WeakMap<AbstractMesh, IMeshDataCache>(), [scene]);
    // Not sure why changing the cursor on the canvas itself doesn't work, so change it on the parent.
    const sceneElement = scene.getEngine().getRenderingCanvas()?.parentElement;

    const [pickingEnabled, setPickingEnabled] = useState(false);

    useEffect(() => {
        if (pickingEnabled && sceneElement) {
            const originalCursor = getComputedStyle(sceneElement).cursor;
            sceneElement.style.cursor = "crosshair";

            const pointerObserver = scene.onPrePointerObservable.add(() => {
                let pickedEntity: unknown = null;

                // Check camera gizmos.
                if (!pickedEntity) {
                    for (const cameraGizmo of gizmoService.getCameraGizmos(scene)) {
                        if (cameraGizmo.isHovered) {
                            pickedEntity = cameraGizmo.camera;
                        }
                    }
                }

                // Check light gizmos.
                if (!pickedEntity) {
                    for (const lightGizmo of gizmoService.getLightGizmos(scene)) {
                        if (lightGizmo.isHovered) {
                            pickedEntity = lightGizmo.light;
                        }
                    }
                }

                // Check the main scene.
                if (!pickedEntity) {
                    // Refresh bounding info to ensure morph target and skeletal animations are taken into account.
                    for (const mesh of scene.meshes) {
                        let cache = meshDataCache.get(mesh);
                        if (!cache) {
                            cache = {};
                            meshDataCache.set(mesh, cache);
                        }
                        mesh.refreshBoundingInfo({ applyMorph: true, applySkeleton: true, cache });
                    }

                    const pickingInfo = scene.pick(
                        scene.unTranslatedPointer.x,
                        scene.unTranslatedPointer.y,
                        (mesh) => mesh.isEnabled() && mesh.isVisible && mesh.getTotalVertices() > 0,
                        false,
                        undefined,
                        undefined
                    );

                    pickedEntity = pickingInfo.pickedMesh;
                }

                // If an entity was picked, select it.
                if (pickedEntity) {
                    selectEntity(pickedEntity);
                }
            }, PointerEventTypes.POINTERTAP);

            // Exit picking mode if the escape key is pressed.
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    setPickingEnabled(false);
                }
            };
            document.addEventListener("keydown", handleKeyDown);

            return () => {
                sceneElement.style.cursor = originalCursor;
                pointerObserver.remove();
                document.removeEventListener("keydown", handleKeyDown);
            };
        }

        return () => {
            /* No-op */
        };
    }, [pickingEnabled, sceneElement]);

    return (
        sceneElement && (
            <ToggleButton
                title={`${pickingEnabled ? "Disable" : "Enable"} Picking`}
                enabledIcon={TargetRegular}
                value={pickingEnabled}
                onChange={() => setPickingEnabled((prev) => !prev)}
            />
        )
    );
};
