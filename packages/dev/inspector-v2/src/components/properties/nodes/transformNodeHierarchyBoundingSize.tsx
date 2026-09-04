import { type FunctionComponent, useEffect, useState } from "react";

import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { type Vector3 } from "core/Maths/math.vector";
import { type Observer } from "core/Misc/observable";
import { type IDisposable, type Scene } from "core/scene";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";

const RefreshInterval = 100;

/**
 * Calculates the world-space dimensions of a transform node and its descendants.
 * @param node The root of the hierarchy to measure.
 * @returns The hierarchy bounding box dimensions, or null when the hierarchy contains no measurable geometry.
 */
export function GetTransformNodeHierarchyBoundingSize(node: TransformNode): Vector3 | null {
    const { min, max } = node.getHierarchyBoundingVectors();

    if (
        !Number.isFinite(min.x) ||
        !Number.isFinite(min.y) ||
        !Number.isFinite(min.z) ||
        !Number.isFinite(max.x) ||
        !Number.isFinite(max.y) ||
        !Number.isFinite(max.z) ||
        max.x < min.x ||
        max.y < min.y ||
        max.z < min.z
    ) {
        return null;
    }

    return max.subtract(min);
}

/**
 * Formats a number with enough significant digits to preserve small non-zero values.
 * @param value The number to format.
 * @returns The formatted number.
 */
export function FormatHierarchyBoundingSizeValue(value: number): string {
    if (value === 0) {
        return "0";
    }

    if (!Number.isFinite(value)) {
        return value.toString();
    }

    const formattedValue = value.toPrecision(5);
    const [mantissa, exponent] = formattedValue.split("e");
    const trimmedMantissa = mantissa.replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");

    return exponent === undefined ? trimmedMantissa : `${trimmedMantissa}e${Number(exponent)}`;
}

/**
 * Formats hierarchy bounding box dimensions in X, Y, Z order.
 * @param size The dimensions to format, or null when the hierarchy contains no measurable geometry.
 * @returns The formatted dimensions.
 */
export function FormatTransformNodeHierarchyBoundingSize(size: Vector3 | null): string {
    if (!size) {
        return "N/A";
    }

    return `[${FormatHierarchyBoundingSizeValue(size.x)}, ${FormatHierarchyBoundingSizeValue(size.y)}, ${FormatHierarchyBoundingSizeValue(size.z)}]`;
}

class TransformNodeHierarchyBoundingSizeObserver implements IDisposable {
    private readonly _node: TransformNode;
    private readonly _onSizeChanged: (size: Vector3 | null) => void;
    private readonly _worldMatrixObservers = new Map<TransformNode, Observer<TransformNode>>();
    private readonly _afterRenderObserver: Observer<Scene>;
    private readonly _newMeshObserver: Observer<AbstractMesh>;
    private readonly _removedMeshObserver: Observer<AbstractMesh>;
    private readonly _newTransformNodeObserver: Observer<TransformNode>;
    private readonly _removedTransformNodeObserver: Observer<TransformNode>;
    private _size: Vector3 | null | undefined;
    private _isDirty = true;
    private _isRefreshing = false;
    private _lastRefreshTime = 0;

    public constructor(node: TransformNode, onSizeChanged: (size: Vector3 | null) => void) {
        this._node = node;
        this._onSizeChanged = onSizeChanged;

        const scene = node.getScene();
        this._afterRenderObserver = scene.onAfterRenderObservable.add(() => this._refreshIfNeeded());
        this._newMeshObserver = scene.onNewMeshAddedObservable.add(() => this._markDirty());
        this._removedMeshObserver = scene.onMeshRemovedObservable.add(() => this._markDirty());
        this._newTransformNodeObserver = scene.onNewTransformNodeAddedObservable.add(() => this._markDirty());
        this._removedTransformNodeObserver = scene.onTransformNodeRemovedObservable.add(() => this._markDirty());

        this._syncWorldMatrixObservers();
        this._refresh();
    }

    public dispose(): void {
        const scene = this._node.getScene();
        scene.onAfterRenderObservable.remove(this._afterRenderObserver);
        scene.onNewMeshAddedObservable.remove(this._newMeshObserver);
        scene.onMeshRemovedObservable.remove(this._removedMeshObserver);
        scene.onNewTransformNodeAddedObservable.remove(this._newTransformNodeObserver);
        scene.onTransformNodeRemovedObservable.remove(this._removedTransformNodeObserver);

        for (const [node, observer] of this._worldMatrixObservers) {
            node.onAfterWorldMatrixUpdateObservable.remove(observer);
        }
        this._worldMatrixObservers.clear();
    }

    private _markDirty(): void {
        if (!this._isRefreshing) {
            this._isDirty = true;
        }
    }

    private _refreshIfNeeded(): void {
        if (!this._isDirty || Date.now() - this._lastRefreshTime < RefreshInterval) {
            return;
        }

        this._refresh();
    }

    private _refresh(): void {
        if (this._node.isDisposed()) {
            return;
        }

        this._isDirty = false;
        this._isRefreshing = true;

        try {
            this._syncWorldMatrixObservers();
            const size = GetTransformNodeHierarchyBoundingSize(this._node);
            const sizeChanged = size === null ? this._size !== null : !this._size?.equals(size);
            if (sizeChanged) {
                this._size = size;
                this._onSizeChanged(size);
            }
            this._lastRefreshTime = Date.now();
        } finally {
            this._isRefreshing = false;
        }
    }

    private _syncWorldMatrixObservers(): void {
        const hierarchyNodes = new Set<TransformNode>([this._node]);
        for (const descendant of this._node.getDescendants(false)) {
            if (descendant instanceof TransformNode) {
                hierarchyNodes.add(descendant);
            }
        }

        for (const [node, observer] of this._worldMatrixObservers) {
            if (!hierarchyNodes.has(node)) {
                node.onAfterWorldMatrixUpdateObservable.remove(observer);
                this._worldMatrixObservers.delete(node);
            }
        }

        for (const node of hierarchyNodes) {
            if (!this._worldMatrixObservers.has(node)) {
                this._worldMatrixObservers.set(
                    node,
                    node.onAfterWorldMatrixUpdateObservable.add(() => this._markDirty())
                );
            }
        }
    }
}

/**
 * Observes a transform node hierarchy and reports coalesced world-space bounding box dimension changes.
 * @param node The root of the hierarchy to observe.
 * @param onSizeChanged Called when the numeric dimensions or geometry availability change.
 * @returns A disposable observer registration.
 */
export function ObserveTransformNodeHierarchyBoundingSize(node: TransformNode, onSizeChanged: (size: Vector3 | null) => void): IDisposable {
    return new TransformNodeHierarchyBoundingSizeObserver(node, onSizeChanged);
}

/**
 * Tracks the world-space bounding box dimensions of a transform node and its descendants.
 * @param node The root of the hierarchy to observe.
 * @returns The current dimensions, null for no measurable geometry, or undefined until the effect is initialized.
 */
export function useTransformNodeHierarchyBoundingSize(node: TransformNode): Vector3 | null | undefined {
    const [measurement, setMeasurement] = useState<{ node: TransformNode; size: Vector3 | null }>();

    useEffect(() => {
        const observer = ObserveTransformNodeHierarchyBoundingSize(node, (size) => setMeasurement({ node, size }));
        return () => observer.dispose();
    }, [node]);

    return measurement?.node === node ? measurement.size : undefined;
}

/**
 * Properties displaying the world-space bounding box size of a TransformNode hierarchy.
 * @returns The hierarchy bounding box size property.
 */
export const TransformNodeHierarchyBoundingSizeProperties: FunctionComponent<{ node: TransformNode }> = ({ node }) => {
    const size = useTransformNodeHierarchyBoundingSize(node);
    const value = size === undefined ? "" : FormatTransformNodeHierarchyBoundingSize(size);

    return (
        <TextPropertyLine
            label="Hierarchy Bounding Box Size"
            description="The world-space bounding box dimensions of the selected node's mesh geometry and its descendants, in X, Y, Z order."
            value={value}
            title={value}
        />
    );
};
