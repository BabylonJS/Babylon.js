import type { DragEvent } from "react";

import type { Nullable } from "core/index";

import { tokens } from "@fluentui/react-components";
import { useCallback, useRef, useState } from "react";

import type { SceneExplorerDragDropConfig } from "./sceneExplorer";

/**
 * Props for drop-only event handlers on a section header.
 */
export type DropProps = {
    onDragOver: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
};

/**
 * Props for drag-drop event handlers on a tree item.
 */
export type DragDropProps = {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
    onDragEnd: (e: DragEvent) => void;
} & DropProps;

const NoOpSectionDropProps: DropProps = {
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
};

const NoOpDragProps: DragDropProps = Object.assign(
    {
        draggable: false,
        onDragStart: () => {},
        onDragEnd: () => {},
    },
    NoOpSectionDropProps
);

/**
 * Options for the drag-drop hook.
 */
export type SceneExplorerDragDropOptions = {
    /** Called after a successful drop with the dragged entity and target (entity or null for section root). */
    onDrop?: (draggedEntity: unknown, targetEntity: unknown | null) => void;
};

/**
 * Hook that provides drag-drop functionality for the scene explorer.
 * Uses vanilla HTML5 drag and drop APIs.
 * @param options Optional callbacks for drag-drop events.
 * @returns State and props factory for drag-drop functionality.
 */
export function useSceneExplorerDragDrop(options?: SceneExplorerDragDropOptions) {
    // Global drag state - HTML5 drag/drop doesn't allow reading dataTransfer in dragover events.
    const activeDragState = useRef<{
        entity: unknown;
        config: SceneExplorerDragDropConfig<unknown>;
    } | null>(null);

    const [draggedEntity, setDraggedEntity] = useState<unknown>();
    const [dropTarget, setDropTarget] = useState<unknown>();
    const [dropTargetIsRoot, setDropTargetIsRoot] = useState(false);

    // Ref to track current valid drop for the onDrop handler
    const pendingDropRef = useRef<Nullable<{ target: unknown | null; dragged: unknown; config: SceneExplorerDragDropConfig<unknown> }>>(null);

    const resetState = useCallback(() => {
        setDraggedEntity(undefined);
        setDropTarget(undefined);
        setDropTargetIsRoot(false);
        pendingDropRef.current = null;
    }, []);

    const createDragProps = useCallback(
        (entity: unknown, getName: () => string, dragDropConfig?: SceneExplorerDragDropConfig<unknown>): DragDropProps => {
            // No drag-drop if section doesn't support it
            if (!dragDropConfig) {
                return NoOpDragProps;
            }

            // Check if entity can be dragged
            if (!dragDropConfig.canDrag(entity)) {
                return NoOpDragProps;
            }

            const onDragStart = (e: DragEvent) => {
                activeDragState.current = { entity, config: dragDropConfig };
                setDraggedEntity(entity);

                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", getName());

                // Create custom drag image (required for Safari preview)
                const element = e.currentTarget as HTMLElement;
                const computedStyle = getComputedStyle(element);
                const dragImage = document.createElement("div");
                dragImage.textContent = getName();
                Object.assign(dragImage.style, {
                    position: "absolute",
                    top: "-1000px",
                    background: tokens.colorNeutralBackground1,
                    borderRadius: tokens.borderRadiusMedium,
                    font: computedStyle.font,
                    color: computedStyle.color,
                    boxShadow: tokens.shadow8,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                });
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, -16, 0);
                setTimeout(() => document.body.removeChild(dragImage), 0);
            };

            const onDragEnd = () => {
                activeDragState.current = null;
                resetState();
            };

            const onDragOver = (e: DragEvent) => {
                if (!activeDragState.current) {
                    return;
                }

                const { entity: dragged, config } = activeDragState.current;

                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";

                // Check if this is a valid drop target
                if (!config.canDrop(dragged, entity)) {
                    setDropTarget(undefined);
                    pendingDropRef.current = null;
                    return;
                }

                setDropTarget(entity);
                pendingDropRef.current = { target: entity, dragged, config };
            };

            const onDragLeave = (e: DragEvent) => {
                // Ignore if leaving to a child element (still within the same drop target)
                const relatedTarget = e.relatedTarget as Node | null;
                if (relatedTarget && e.currentTarget instanceof Node && e.currentTarget.contains(relatedTarget)) {
                    return;
                }
                if (pendingDropRef.current?.target === entity) {
                    setDropTarget(undefined);
                }
            };

            const onDropHandler = (e: DragEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const pending = pendingDropRef.current;
                if (pending) {
                    pending.config.onDrop(pending.dragged, pending.target);
                    options?.onDrop?.(pending.dragged, pending.target);
                }

                activeDragState.current = null;
                resetState();
            };

            return {
                draggable: true,
                onDragStart,
                onDragEnd,
                onDragOver,
                onDragLeave,
                onDrop: onDropHandler,
            };
        },
        [resetState, options]
    );

    /**
     * Creates drag-drop props for a section header that accepts drops to move entities to section root.
     * @param dragDropConfig The drag-drop configuration for the section.
     */
    const createSectionDropProps = useCallback(
        (dragDropConfig: SceneExplorerDragDropConfig<unknown> | undefined): DropProps => {
            // No drop handling if section doesn't support drag-drop
            if (!dragDropConfig) {
                return NoOpSectionDropProps;
            }

            const onDragOver = (e: DragEvent) => {
                if (!activeDragState.current) {
                    return;
                }

                const { entity: dragged, config } = activeDragState.current;

                // Only accept drops from the same section's drag-drop config
                if (config !== dragDropConfig) {
                    return;
                }

                // Check if drop to section root is allowed
                if (!config.canDrop(dragged, null)) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";

                setDropTarget(undefined);
                setDropTargetIsRoot(true);
                pendingDropRef.current = { target: null, dragged, config };
            };

            const onDragLeave = (e: DragEvent) => {
                // Ignore if leaving to a child element (still within the same drop target)
                const relatedTarget = e.relatedTarget as Node | null;
                if (relatedTarget && e.currentTarget instanceof Node && e.currentTarget.contains(relatedTarget)) {
                    return;
                }
                if (pendingDropRef.current?.target === null) {
                    setDropTargetIsRoot(false);
                }
            };

            const onDropHandler = (e: DragEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const pending = pendingDropRef.current;
                if (pending && pending.target === null) {
                    pending.config.onDrop(pending.dragged, null);
                    options?.onDrop?.(pending.dragged, null);
                }

                activeDragState.current = null;
                resetState();
            };

            return {
                onDragOver,
                onDragLeave,
                onDrop: onDropHandler,
            };
        },
        [resetState, options]
    );

    return {
        draggedEntity,
        dropTarget,
        dropTargetIsRoot,
        createDragProps,
        createSectionDropProps,
    };
}
