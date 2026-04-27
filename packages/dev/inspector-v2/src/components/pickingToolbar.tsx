import { type MenuButtonProps, Menu, MenuItemCheckbox, MenuList, MenuPopover, MenuTrigger, SplitButton, tokens, Tooltip } from "@fluentui/react-components";
import { type FunctionComponent, useCallback, useEffect, useState } from "react";

import { type Nullable, type Scene } from "core/index";
import { type IGizmoService } from "../services/gizmoService";

import { TargetRegular } from "@fluentui/react-icons";

import { GPUPicker } from "core/Collisions/gpuPicker";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { AsyncLock } from "core/Misc/asyncLock";
import { Logger } from "core/Misc/logger";
import { useKeyListener } from "shared-ui-components/fluent/hooks/keyboardHooks";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { useResource } from "shared-ui-components/modularTool/hooks/resourceHooks";

export const PickingToolbar: FunctionComponent<{
    scene: Scene;
    selectEntity: (entity: Nullable<object>) => void;
    gizmoService: IGizmoService;
    ignoreBackfaces?: boolean;
    highlightSelectedEntity?: boolean;
    onHighlightSelectedEntityChange?: (value: boolean) => void;
}> = (props) => {
    const { scene, selectEntity, gizmoService, ignoreBackfaces, highlightSelectedEntity, onHighlightSelectedEntityChange } = props;

    // Not sure why changing the cursor on the canvas itself doesn't work, so change it on the parent.
    const sceneElement = scene.getEngine().getRenderingCanvas()?.parentElement;

    const [pickingEnabled, setPickingEnabled] = useState(false);

    // One GPUPicker per (scene, component lifetime). useResource handles disposal on unmount or when scene changes.
    // The factory must be stable (memoized) so useResource doesn't recreate the picker on every render.
    const gpuPicker = useResource(useCallback(() => new GPUPicker(), [scene]));

    // Track the meshes the picker should know about. Re-evaluate whenever meshes are added or removed.
    // Do not filter on vertex count here: meshes can be created before their geometry is populated,
    // and they still need to remain in the GPUPicker list so they become pickable once geometry arrives.
    const pickableMeshes = useObservableState(
        useCallback(() => scene.meshes.filter((mesh) => mesh.isEnabled() && mesh.isVisible), [scene]),
        scene.onNewMeshAddedObservable,
        scene.onMeshRemovedObservable
    );

    // Keep the GPUPicker's picking list in sync with the current pickable meshes (and apply the
    // backface culling preference) while picking is enabled.
    useEffect(() => {
        if (!pickingEnabled) {
            gpuPicker.clearPickingList();
            return;
        }

        if (pickableMeshes.length === 0) {
            gpuPicker.clearPickingList();
            return;
        }

        gpuPicker.setPickingList(pickableMeshes);

        // GPUPicker creates its picking ShaderMaterials lazily inside setPickingList. Apply the
        // backface culling preference now so subsequent renders use the correct setting.
        // (ShaderMaterial.backFaceCulling defaults to true, which matches ignoreBackfaces=true.)
        for (const material of gpuPicker.defaultRenderMaterials) {
            if (material) {
                material.backFaceCulling = ignoreBackfaces ?? false;
            }
        }
    }, [pickingEnabled, pickableMeshes, gpuPicker, ignoreBackfaces]);

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

            const pickingLock = new AsyncLock();

            const pointerObserver = scene.onPrePointerObservable.add(() => {
                // Capture pointer position and synchronous gizmo hover state at click time.
                // The async GPU pick may queue behind a previous pick (e.g. while picking shaders
                // compile on the very first click), and by the time the queued callback runs the
                // pointer and gizmo hover state may have changed.
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

                if (pickedEntity) {
                    selectEntity(pickedEntity);
                    return;
                }

                // Check the main scene via GPU pick. Serialize concurrent picks via the lock so
                // rapid clicks don't overlap on the GPU picker (which would otherwise no-op).
                const x = scene.unTranslatedPointer.x;
                const y = scene.unTranslatedPointer.y;
                void (async () => {
                    try {
                        await pickingLock.lockAsync(async () => {
                            const pickingInfo = await gpuPicker.pickAsync(x, y);
                            if (pickingInfo?.mesh) {
                                selectEntity(pickingInfo.mesh);
                            }
                        });
                    } catch (error) {
                        Logger.Warn(`GPU picking failed: ${error}`);
                    }
                })();
            }, PointerEventTypes.POINTERTAP);

            return () => {
                sceneElement.style.cursor = originalCursor;
                pointerObserver.remove();
            };
        }

        return () => {
            /* No-op */
        };
    }, [pickingEnabled, sceneElement, scene, gizmoService, gpuPicker, selectEntity]);

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
