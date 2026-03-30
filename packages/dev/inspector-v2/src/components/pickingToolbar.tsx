import { type MenuButtonProps, Menu, MenuItemCheckbox, MenuList, MenuPopover, MenuTrigger, SplitButton, tokens, Tooltip } from "@fluentui/react-components";
import { type FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";

import { type AbstractMesh, type IMeshDataCache, type Nullable, type Scene } from "core/index";
import { type IGizmoService } from "../services/gizmoService";

import { TargetRegular } from "@fluentui/react-icons";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { TmpVectors, Vector3 } from "core/Maths/math.vector";
import { useKeyListener } from "shared-ui-components/fluent/hooks/keyboardHooks";

export const PickingToolbar: FunctionComponent<{
    scene: Scene;
    selectEntity: (entity: Nullable<object>) => void;
    gizmoService: IGizmoService;
    ignoreBackfaces?: boolean;
    highlightSelectedEntity?: boolean;
    onHighlightSelectedEntityChange?: (value: boolean) => void;
}> = (props) => {
    const { scene, selectEntity, gizmoService, ignoreBackfaces, highlightSelectedEntity, onHighlightSelectedEntityChange } = props;

    const meshDataCache = useMemo(() => new WeakMap<AbstractMesh, IMeshDataCache>(), [scene]);
    // Not sure why changing the cursor on the canvas itself doesn't work, so change it on the parent.
    const sceneElement = scene.getEngine().getRenderingCanvas()?.parentElement;

    const [pickingEnabled, setPickingEnabled] = useState(false);

    // Exit picking mode if the escape key is pressed.
    useKeyListener({
        onKeyDown: (e) => {
            if (e.key === "Escape") {
                setPickingEnabled(false);
            }
        },
    });

    useEffect(() => {
        if (pickingEnabled && sceneElement) {
            const originalCursor = getComputedStyle(sceneElement).cursor;
            sceneElement.style.cursor = "crosshair";

            const pointerObserver = scene.onPrePointerObservable.add(() => {
                let pickedEntity: Nullable<object> = null;

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
                        (p0, p1, p2, ray) => {
                            if (!ignoreBackfaces) {
                                return true;
                            }

                            const p0p1 = TmpVectors.Vector3[0];
                            const p1p2 = TmpVectors.Vector3[1];

                            p1.subtractToRef(p0, p0p1);
                            p2.subtractToRef(p1, p1p2);

                            const normal = Vector3.Cross(p0p1, p1p2);

                            return Vector3.Dot(normal, ray.direction) < 0;
                        }
                    );

                    pickedEntity = pickingInfo.pickedMesh;
                }

                // If an entity was picked, select it.
                if (pickedEntity) {
                    selectEntity(pickedEntity);
                }
            }, PointerEventTypes.POINTERTAP);

            return () => {
                sceneElement.style.cursor = originalCursor;
                pointerObserver.remove();
            };
        }

        return () => {
            /* No-op */
        };
    }, [pickingEnabled, sceneElement, ignoreBackfaces]);

    const togglePicking = useCallback(() => {
        setPickingEnabled((prev) => !prev);
    }, []);

    return (
        sceneElement && (
            <Menu
                positioning="below-end"
                checkedValues={{ selectionHighlight: highlightSelectedEntity ? ["on"] : [] }}
                onCheckedValueChange={(_e, data) => {
                    onHighlightSelectedEntityChange?.(data.checkedItems.includes("on"));
                }}
            >
                <MenuTrigger disableButtonEnhancement={true}>
                    {(triggerProps: MenuButtonProps) => (
                        <Tooltip content={`${pickingEnabled ? "Disable" : "Enable"} Picking`} relationship="label">
                            <SplitButton
                                menuButton={triggerProps}
                                primaryActionButton={{ onClick: togglePicking }}
                                size="small"
                                appearance="transparent"
                                icon={<TargetRegular color={pickingEnabled ? tokens.colorBrandForeground1 : undefined} />}
                            />
                        </Tooltip>
                    )}
                </MenuTrigger>
                <MenuPopover>
                    <MenuList>
                        <MenuItemCheckbox name="selectionHighlight" value="on">
                            Highlight Selected Entity
                        </MenuItemCheckbox>
                    </MenuList>
                </MenuPopover>
            </Menu>
        )
    );
};
