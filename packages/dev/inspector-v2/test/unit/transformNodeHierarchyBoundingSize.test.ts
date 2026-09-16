import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import {
    FormatHierarchyBoundingSizeValue,
    FormatTransformNodeHierarchyBoundingSize,
    GetTransformNodeHierarchyBoundingSize,
    ObserveTransformNodeHierarchyBoundingSize,
} from "../../src/components/properties/nodes/transformNodeHierarchyBoundingSize";

function expectSize(size: { x: number; y: number; z: number } | null, x: number, y: number, z: number): void {
    expect(size).not.toBeNull();
    expect(size!.x).toBeCloseTo(x);
    expect(size!.y).toBeCloseTo(y);
    expect(size!.z).toBeCloseTo(z);
}

function getActiveObserverCount(observable: { observers: { _willBeUnregistered: boolean }[] }): number {
    return observable.observers.filter((observer) => !observer._willBeUnregistered).length;
}

describe("transform node hierarchy bounding size", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("continues to measure a mesh with geometry in world space", () => {
        expect.hasAssertions();
        const box = CreateBox("box", { width: 2, height: 4, depth: 6 }, scene);
        box.scaling.set(2, 0.5, 3);

        expectSize(GetTransformNodeHierarchyBoundingSize(box), 4, 2, 18);
    });

    it("measures child meshes below a mesh", () => {
        expect.hasAssertions();
        const parent = CreateBox("parent", { size: 2 }, scene);
        const child = CreateBox("child", { size: 2 }, scene);
        child.parent = parent;
        child.position.x = 4;

        expectSize(GetTransformNodeHierarchyBoundingSize(parent), 6, 2, 2);
    });

    it("measures multiple meshes below nested transform nodes", () => {
        expect.hasAssertions();
        const root = new TransformNode("root", scene);
        const group = new TransformNode("group", scene);
        group.parent = root;
        group.position.x = 3;

        const rightBox = CreateBox("right", { size: 2 }, scene);
        rightBox.parent = group;

        const leftBox = CreateBox("left", { size: 2 }, scene);
        leftBox.parent = group;
        leftBox.position.x = -6;

        expectSize(GetTransformNodeHierarchyBoundingSize(root), 8, 2, 2);
    });

    it("measures a transform node hierarchy with rotation and negative scaling in world space", () => {
        expect.hasAssertions();
        const root = new TransformNode("root", scene);
        root.rotation.y = Math.PI;
        root.scaling.z = -1;

        const box = CreateBox("box", { width: 2, height: 4, depth: 6 }, scene);
        box.position.set(3, 1, 2);
        box.parent = root;

        expectSize(GetTransformNodeHierarchyBoundingSize(root), 2, 4, 6);
    });

    it("reports the world-axis-aligned size after rotation", () => {
        expect.hasAssertions();
        const root = new TransformNode("root", scene);
        const box = CreateBox("box", { width: 2, height: 4, depth: 6 }, scene);
        box.parent = root;
        root.rotation.y = Math.PI / 2;

        expectSize(GetTransformNodeHierarchyBoundingSize(root), 6, 4, 2);
    });

    it("returns null when a transform node hierarchy has no measurable geometry", () => {
        const root = new TransformNode("root", scene);
        const emptyChild = new TransformNode("emptyChild", scene);
        emptyChild.parent = root;

        expect(GetTransformNodeHierarchyBoundingSize(root)).toBeNull();
        expect(FormatTransformNodeHierarchyBoundingSize(null)).toBe("N/A");
    });

    it("tracks an existing mesh reparented into and out of the observed hierarchy", () => {
        let now = 0;
        vi.spyOn(Date, "now").mockImplementation(() => now);

        const root = new TransformNode("root", scene);
        const child = CreateBox("child", { size: 2 }, scene);
        const onSizeChanged = vi.fn();
        const observer = ObserveTransformNodeHierarchyBoundingSize(root, onSizeChanged);
        expect(onSizeChanged).toHaveBeenCalledTimes(1);
        expect(onSizeChanged).toHaveBeenLastCalledWith(null);

        child.parent = root;
        now = 99;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(1);

        now = 100;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(2);
        expectSize(onSizeChanged.mock.calls[1][0], 2, 2, 2);

        child.scaling.x = 2;
        child.computeWorldMatrix(true);
        now = 200;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(3);
        expectSize(onSizeChanged.mock.calls[2][0], 4, 2, 2);

        child.parent = null;
        now = 300;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(4);
        expect(onSizeChanged).toHaveBeenLastCalledWith(null);

        observer.dispose();
    });

    it("resynchronizes observers when an existing transform node subtree is reparented", () => {
        let now = 0;
        vi.spyOn(Date, "now").mockImplementation(() => now);

        const root = new TransformNode("root", scene);
        const group = new TransformNode("group", scene);
        const child = CreateBox("child", { size: 2 }, scene);
        child.parent = group;

        const groupObserverCount = getActiveObserverCount(group.onAfterWorldMatrixUpdateObservable);
        const childObserverCount = getActiveObserverCount(child.onAfterWorldMatrixUpdateObservable);
        const onSizeChanged = vi.fn();
        const observer = ObserveTransformNodeHierarchyBoundingSize(root, onSizeChanged);

        expect(onSizeChanged).toHaveBeenLastCalledWith(null);
        expect(getActiveObserverCount(group.onAfterWorldMatrixUpdateObservable)).toBe(groupObserverCount);
        expect(getActiveObserverCount(child.onAfterWorldMatrixUpdateObservable)).toBe(childObserverCount);

        group.parent = root;
        now = 100;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(2);
        expectSize(onSizeChanged.mock.calls[1][0], 2, 2, 2);
        expect(getActiveObserverCount(group.onAfterWorldMatrixUpdateObservable)).toBe(groupObserverCount + 1);
        expect(getActiveObserverCount(child.onAfterWorldMatrixUpdateObservable)).toBe(childObserverCount + 1);

        group.parent = null;
        now = 200;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(3);
        expect(onSizeChanged).toHaveBeenLastCalledWith(null);
        expect(getActiveObserverCount(group.onAfterWorldMatrixUpdateObservable)).toBe(groupObserverCount);
        expect(getActiveObserverCount(child.onAfterWorldMatrixUpdateObservable)).toBe(childObserverCount);

        observer.dispose();
    });

    it("coalesces hierarchy updates after matrices settle and skips unchanged sizes", () => {
        let now = 0;
        vi.spyOn(Date, "now").mockImplementation(() => now);

        const root = new TransformNode("root", scene);
        const child = CreateBox("child", { size: 2 }, scene);
        child.parent = root;

        const onSizeChanged = vi.fn();
        const observer = ObserveTransformNodeHierarchyBoundingSize(root, onSizeChanged);
        expect(onSizeChanged).toHaveBeenCalledTimes(1);
        expectSize(onSizeChanged.mock.calls[0][0], 2, 2, 2);

        child.scaling.x = 2;
        child.computeWorldMatrix(true);
        child.scaling.x = 3;
        child.computeWorldMatrix(true);

        now = 99;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(1);

        now = 100;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(2);
        expectSize(onSizeChanged.mock.calls[1][0], 6, 2, 2);

        root.position.x = 10;
        root.computeWorldMatrix(true);
        now = 200;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(2);

        root.scaling.y = 2;
        root.computeWorldMatrix(true);
        now = 300;
        scene.onAfterRenderObservable.notifyObservers(scene);
        expect(onSizeChanged).toHaveBeenCalledTimes(3);
        expectSize(onSizeChanged.mock.calls[2][0], 6, 4, 2);

        observer.dispose();
    });

    it("removes hierarchy and scene observers before a mesh is selected", () => {
        const first = new TransformNode("first", scene);
        const firstChild = CreateBox("firstChild", { size: 1 }, scene);
        firstChild.parent = first;
        const second = new Mesh("second", scene);

        const firstObserverCount = getActiveObserverCount(first.onAfterWorldMatrixUpdateObservable);
        const firstChildObserverCount = getActiveObserverCount(firstChild.onAfterWorldMatrixUpdateObservable);
        const secondObserverCount = getActiveObserverCount(second.onAfterWorldMatrixUpdateObservable);
        const afterRenderObserverCount = getActiveObserverCount(scene.onAfterRenderObservable);
        const firstRegistration = ObserveTransformNodeHierarchyBoundingSize(first, vi.fn());

        expect(getActiveObserverCount(first.onAfterWorldMatrixUpdateObservable)).toBe(firstObserverCount + 1);
        expect(getActiveObserverCount(firstChild.onAfterWorldMatrixUpdateObservable)).toBe(firstChildObserverCount + 1);
        expect(getActiveObserverCount(scene.onAfterRenderObservable)).toBe(afterRenderObserverCount + 1);

        firstRegistration.dispose();
        const secondRegistration = ObserveTransformNodeHierarchyBoundingSize(second, vi.fn());

        expect(getActiveObserverCount(first.onAfterWorldMatrixUpdateObservable)).toBe(firstObserverCount);
        expect(getActiveObserverCount(firstChild.onAfterWorldMatrixUpdateObservable)).toBe(firstChildObserverCount);
        expect(getActiveObserverCount(second.onAfterWorldMatrixUpdateObservable)).toBe(secondObserverCount + 1);
        expect(getActiveObserverCount(scene.onAfterRenderObservable)).toBe(afterRenderObserverCount + 1);

        secondRegistration.dispose();
        expect(getActiveObserverCount(second.onAfterWorldMatrixUpdateObservable)).toBe(secondObserverCount);
        expect(getActiveObserverCount(scene.onAfterRenderObservable)).toBe(afterRenderObserverCount);
    });
});

describe("transform node hierarchy bounding size formatting", () => {
    it.each([
        [0, "0"],
        [-0, "0"],
        [1.23456, "1.2346"],
        [0.001, "0.001"],
        [0.00000012, "1.2e-7"],
        [123456, "1.2346e5"],
    ])("formats %s as %s", (value, expected) => {
        expect(FormatHierarchyBoundingSizeValue(value)).toBe(expected);
    });

    it("formats all three dimensions", () => {
        expect(FormatTransformNodeHierarchyBoundingSize(new Vector3(1.23456, 0.001, 0))).toBe("[1.2346, 0.001, 0]");
    });
});
