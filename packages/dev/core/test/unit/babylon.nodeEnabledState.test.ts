import { beforeEach, describe, expect, it } from "vitest";

import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";

describe("Node enabled state", () => {
    let subject: Engine;

    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    describe("onEnabledStateChangedObservable (own state only)", () => {
        it("should not notify a child when only its parent's enabled state changes", () => {
            const scene = new Scene(subject);
            const parent = new Mesh("Parent", scene);
            const child = new Mesh("Child", scene);
            child.parent = parent;

            const notifications: boolean[] = [];
            child.onEnabledStateChangedObservable.add((value) => notifications.push(value));

            parent.setEnabled(false);
            parent.setEnabled(true);

            // The child's own enabled flag never changed, so the legacy observable stays silent.
            expect(notifications).toEqual([]);
        });

        it("should notify the node whose enabled state is set directly", () => {
            const scene = new Scene(subject);
            const node = new Mesh("Node", scene);

            const notifications: boolean[] = [];
            node.onEnabledStateChangedObservable.add((value) => notifications.push(value));

            node.setEnabled(false);

            expect(notifications).toEqual([false]);
        });
    });

    describe("onEffectiveEnabledStateChangedObservable", () => {
        it("should notify a child when its parent's enabled state changes", () => {
            const scene = new Scene(subject);
            const parent = new Mesh("Parent", scene);
            const child = new Mesh("Child", scene);
            child.parent = parent;

            const notifications: boolean[] = [];
            child.onEffectiveEnabledStateChangedObservable.add((value) => notifications.push(value));

            expect(child.isEnabled()).toBe(true);

            parent.setEnabled(false);
            expect(child.isEnabled()).toBe(false);

            parent.setEnabled(true);
            expect(child.isEnabled()).toBe(true);

            expect(notifications).toEqual([false, true]);
        });

        it("should notify descendants across multiple levels", () => {
            const scene = new Scene(subject);
            const grandParent = new Mesh("GrandParent", scene);
            const parent = new Mesh("Parent", scene);
            const child = new Mesh("Child", scene);
            parent.parent = grandParent;
            child.parent = parent;

            const parentNotifications: boolean[] = [];
            const childNotifications: boolean[] = [];
            parent.onEffectiveEnabledStateChangedObservable.add((value) => parentNotifications.push(value));
            child.onEffectiveEnabledStateChangedObservable.add((value) => childNotifications.push(value));

            grandParent.setEnabled(false);
            expect(parent.isEnabled()).toBe(false);
            expect(child.isEnabled()).toBe(false);

            expect(parentNotifications).toEqual([false]);
            expect(childNotifications).toEqual([false]);
        });

        it("should notify the node whose enabled state is set directly exactly once", () => {
            const scene = new Scene(subject);
            const node = new Mesh("Node", scene);

            const notifications: boolean[] = [];
            node.onEffectiveEnabledStateChangedObservable.add((value) => notifications.push(value));

            node.setEnabled(false);

            expect(notifications).toEqual([false]);
        });

        it("should not notify a child whose effective enabled state does not change", () => {
            const scene = new Scene(subject);
            const parent = new Mesh("Parent", scene);
            const child = new Mesh("Child", scene);
            child.parent = parent;

            // Disable the child explicitly first.
            child.setEnabled(false);

            const notifications: boolean[] = [];
            child.onEffectiveEnabledStateChangedObservable.add((value) => notifications.push(value));

            // Toggling the parent should not change the child's effective enabled state, which stays disabled.
            parent.setEnabled(false);
            parent.setEnabled(true);

            expect(child.isEnabled()).toBe(false);
            expect(notifications).toEqual([]);
        });

        it("should notify when a node is re-parented under a disabled parent", () => {
            const scene = new Scene(subject);
            const disabledParent = new Mesh("DisabledParent", scene);
            const child = new Mesh("Child", scene);
            disabledParent.setEnabled(false);

            const notifications: boolean[] = [];
            child.onEffectiveEnabledStateChangedObservable.add((value) => notifications.push(value));

            expect(child.isEnabled()).toBe(true);
            child.parent = disabledParent;

            expect(child.isEnabled()).toBe(false);
            expect(notifications).toEqual([false]);
        });
    });
});
