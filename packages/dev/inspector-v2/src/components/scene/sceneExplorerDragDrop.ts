import { Node } from "core/node";
import type { Nullable } from "core/index";
import { TransformNode } from "core/Meshes/transformNode";

import { tokens } from "@fluentui/react-components";
import { useCallback, useRef, useState } from "react";

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

// Global drag state - HTML5 drag/drop doesn't allow reading dataTransfer in dragover events.
let globalDraggedNode: Nullable<Node> = null;

/**
 * Options for the drag-drop hook.
 */
export type NodeReparentDragDropOptions = {
    /** Called after a successful drop with the dragged node and target (node or null for scene root). */
    onDrop?: (draggedNode: Node, targetNode: Nullable<Node>) => void;
};

/**
 * Hook that provides drag-drop re-parenting for Nodes in the scene explorer.
 * Uses vanilla HTML5 drag and drop APIs.
 * @param options Optional callbacks for drag-drop events.
 * @returns State and props factory for drag-drop functionality.
 */
export function useNodeReparentDragDrop(options?: NodeReparentDragDropOptions) {
    const [draggedNode, setDraggedNode] = useState<Nullable<Node>>(null);
    const [dropTarget, setDropTarget] = useState<Nullable<Node>>(null);
    const [dropTargetIsRoot, setDropTargetIsRoot] = useState(false);

    // Ref to track current valid drop for the onDrop handler
    const pendingDropRef = useRef<Nullable<{ target: Nullable<Node>; dragged: Node }>>(null);

    const resetState = useCallback(() => {
        setDraggedNode(null);
        setDropTarget(null);
        setDropTargetIsRoot(false);
        pendingDropRef.current = null;
    }, []);

    const createDragProps = useCallback(
        (entity: unknown, getName: () => string) => {
            // Only Nodes can be dragged
            if (!(entity instanceof Node)) {
                return NoOpDragProps;
            }

            const onDragStart = (e: React.DragEvent) => {
                globalDraggedNode = entity;
                setDraggedNode(entity);

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
                globalDraggedNode = null;
                resetState();
            };

            const onDragOver = (e: React.DragEvent) => {
                const dragged = globalDraggedNode;
                if (!dragged) return;

                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";

                // Can't drop on self or on a descendant
                if (entity === dragged || entity.isDescendantOf(dragged)) {
                    setDropTarget(null);
                    pendingDropRef.current = null;
                    return;
                }

                setDropTarget(entity);
                pendingDropRef.current = { target: entity, dragged };
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
                    // Re-parent the node
                    ReparentNode(pending.dragged, pending.target);
                    options?.onDrop?.(pending.dragged, pending.target);
                }

                globalDraggedNode = null;
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
        [resetState]
    );

    /**
     * Creates drag-drop props for a section header that accepts drops to unparent nodes.
     * @param sectionName The name of the section (only "Nodes" section accepts drops).
     */
    const createSectionDropProps = useCallback(
        (sectionName: string): SectionDropProps => {
            // Only the "Nodes" section accepts drops (to move nodes to scene root)
            if (sectionName !== "Nodes") {
                return {
                    onDragOver: () => {},
                    onDragLeave: () => {},
                    onDrop: () => {},
                };
            }

            const onDragOver = (e: React.DragEvent) => {
                const dragged = globalDraggedNode;
                if (!dragged) return;

                // Only allow drop if node has a parent (otherwise already at root)
                if (!dragged.parent) return;

                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";

                setDropTarget(null);
                setDropTargetIsRoot(true);
                pendingDropRef.current = { target: null, dragged };
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
                    // Re-parent the node to scene root (null parent)
                    ReparentNode(pending.dragged, null);
                    options?.onDrop?.(pending.dragged, null);
                }

                globalDraggedNode = null;
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
        draggedNode,
        dropTarget,
        dropTargetIsRoot,
        createDragProps,
        createSectionDropProps,
    };
}

/**
 * Re-parents a node, preserving world transform for TransformNodes.
 * @param node The node to re-parent.
 * @param newParent The new parent node, or null to move to scene root.
 */
function ReparentNode(node: Node, newParent: Nullable<Node>): void {
    if (node.parent === newParent) return;

    // Use setParent for TransformNodes to preserve world transform
    if (node instanceof TransformNode) {
        node.setParent(newParent);
    } else {
        node.parent = newParent;
    }
}
