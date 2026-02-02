import type { Nullable } from "core/index";

import { tokens } from "@fluentui/react-components";
import { useCallback, useRef, useState } from "react";

import type { SceneExplorerDragDropConfig } from "./sceneExplorer";

/**
 * Props for drag-drop event handlers on a tree item.
 */
export type DragDropProps = {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
};

/**
 * Props for drop-only event handlers on a section header.
 */
export type SectionDropProps = {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
};

const NoOpDragProps: DragDropProps = {
    draggable: false,
    onDragStart: () => {},
    onDragEnd: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
};

const NoOpSectionDropProps: SectionDropProps = {
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
};

// Global drag state - HTML5 drag/drop doesn't allow reading dataTransfer in dragover events.
let globalDragState: {
    entity: unknown;
    config: SceneExplorerDragDropConfig<unknown>;
} | null = null;

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
    const [draggedEntity, setDraggedEntity] = useState<unknown>(null);
    const [dropTarget, setDropTarget] = useState<unknown>(null);
    const [dropTargetIsRoot, setDropTargetIsRoot] = useState(false);

    // Ref to track current valid drop for the onDrop handler
    const pendingDropRef = useRef<Nullable<{ target: unknown | null; dragged: unknown; config: SceneExplorerDragDropConfig<unknown> }>>(null);

    const resetState = useCallback(() => {
        setDraggedEntity(null);
        setDropTarget(null);
        setDropTargetIsRoot(false);
        pendingDropRef.current = null;
    }, []);

    const createDragProps = useCallback(
        (entity: unknown, getName: () => string, dragDropConfig: SceneExplorerDragDropConfig<unknown> | undefined): DragDropProps => {
            // No drag-drop if section doesn't support it
            if (!dragDropConfig) {
                return NoOpDragProps;
            }

            // Check if entity can be dragged
            if (!dragDropConfig.canDrag(entity)) {
                return NoOpDragProps;
            }

            const onDragStart = (e: React.DragEvent) => {
                globalDragState = { entity, config: dragDropConfig };
                setDraggedEntity(entity);

                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", getName());

                // Create custom drag image (required for Safari preview)
                const dragImage = document.createElement("div");
                dragImage.textContent = getName();
                Object.assign(dragImage.style, {
                    position: "absolute",
                    top: "-1000px",
                    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
                    background: tokens.colorNeutralBackground1,
                    borderRadius: tokens.borderRadiusMedium,
                    fontFamily: tokens.fontFamilyBase,
                    fontSize: tokens.fontSizeBase300,
                    boxShadow: tokens.shadow8,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                });
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 0, 0);
                setTimeout(() => document.body.removeChild(dragImage), 0);
            };

            const onDragEnd = () => {
                globalDragState = null;
                resetState();
            };

            const onDragOver = (e: React.DragEvent) => {
                if (!globalDragState) return;
                const { entity: dragged, config } = globalDragState;

                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";

                // Check if this is a valid drop target
                if (!config.canDrop(dragged, entity)) {
                    setDropTarget(null);
                    pendingDropRef.current = null;
                    return;
                }

                setDropTarget(entity);
                pendingDropRef.current = { target: entity, dragged, config };
            };

            const onDragLeave = () => {
                if (pendingDropRef.current?.target === entity) {
                    setDropTarget(null);
                }
            };

            const onDropHandler = (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const pending = pendingDropRef.current;
                if (pending) {
                    pending.config.onDrop(pending.dragged, pending.target);
                    options?.onDrop?.(pending.dragged, pending.target);
                }

                globalDragState = null;
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
        (dragDropConfig: SceneExplorerDragDropConfig<unknown> | undefined): SectionDropProps => {
            // No drop handling if section doesn't support drag-drop
            if (!dragDropConfig) {
                return NoOpSectionDropProps;
            }

            const onDragOver = (e: React.DragEvent) => {
                if (!globalDragState) return;
                const { entity: dragged, config } = globalDragState;

                // Only accept drops from the same section's drag-drop config
                if (config !== dragDropConfig) return;

                // Check if drop to section root is allowed
                if (!config.canDrop(dragged, null)) return;

                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";

                setDropTarget(null);
                setDropTargetIsRoot(true);
                pendingDropRef.current = { target: null, dragged, config };
            };

            const onDragLeave = () => {
                if (pendingDropRef.current?.target === null) {
                    setDropTargetIsRoot(false);
                }
            };

            const onDropHandler = (e: React.DragEvent) => {
                e.preventDefault();
                e.stopPropagation();

                const pending = pendingDropRef.current;
                if (pending && pending.target === null) {
                    pending.config.onDrop(pending.dragged, null);
                    options?.onDrop?.(pending.dragged, null);
                }

                globalDragState = null;
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
