import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { TransformNode } from "core/Meshes/transformNode";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { FBXConstraintBehavior, FBXConstraintSolver } from "loaders/FBX/fbxConstraintBehavior";
import { type FBXConstraintData, type FBXConstraintType } from "loaders/FBX/interpreter/constraints";

describe("FBXConstraintBehavior", () => {
    let engine: NullEngine;
    let scene: Scene;
    let root: TransformNode;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        root = new TransformNode("root", scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function node(name: string, x: number, parent: TransformNode = root): TransformNode {
        const n = new TransformNode(name, scene);
        n.parent = parent;
        n.position.x = x;
        return n;
    }

    function constrain(
        target: TransformNode,
        sources: TransformNode[],
        type: FBXConstraintType,
        weight: number,
        overrides: Partial<FBXConstraintData> = {}
    ): FBXConstraintBehavior {
        const behavior = new FBXConstraintBehavior(createConstraintData(type, weight, overrides), {
            root,
            targets: sources.map((source) => ({ node: source, weight: 1, offset: Matrix.Identity() })),
            upNode: null,
            sceneUp: new Vector3(0, 1, 0),
        });
        target.addBehavior(behavior);
        return behavior;
    }

    it("keeps a partial weight a fixed blend of the unconstrained transform", () => {
        const constrained = node("constrained", 0);
        const target = node("target", 10);
        constrain(constrained, [target], "position", 0.5);
        const solver = FBXConstraintSolver.Get(scene)!;

        expect(constrained.position.x).toBeCloseTo(5, 6);
        for (let i = 0; i < 10; i++) {
            solver.solve();
        }
        // Not damping towards the target: still 50% between the static value and the target.
        expect(constrained.position.x).toBeCloseTo(5, 6);

        // Animation writes a new unconstrained value; the blend starts from it.
        constrained.position.x = 2;
        solver.solve();
        expect(constrained.position.x).toBeCloseTo(6, 6);
    });

    it("solves a constraint after the constraint that drives its target, whatever the attach order", () => {
        const a = node("a", 0);
        const b = node("b", 0);
        const c = node("c", 10);
        constrain(a, [b], "position", 1);
        constrain(b, [c], "position", 1);
        const solver = FBXConstraintSolver.Get(scene)!;

        expect(solver.constraints.map((behavior) => behavior.attachedNode?.name)).toEqual(["b", "a"]);
        expect(solver.cyclicConstraints).toHaveLength(0);

        c.position.x = 20;
        solver.solve();
        expect(b.position.x).toBeCloseTo(20, 6);
        // a reads b's value from this solve, not from the previous frame.
        expect(a.position.x).toBeCloseTo(20, 6);
    });

    it("orders a constraint after the constraint driving its parent", () => {
        const parent = node("parent", 0);
        const child = node("child", 0, parent);
        const target = node("target", 10);
        constrain(child, [target], "position", 1);
        constrain(parent, [target], "position", 1);
        const solver = FBXConstraintSolver.Get(scene)!;

        expect(solver.constraints.map((behavior) => behavior.attachedNode?.name)).toEqual(["parent", "child"]);
        solver.solve();
        // child sits on target in world space: parent moved to 10, so the child's local x is 0.
        expect(parent.position.x).toBeCloseTo(10, 6);
        expect(child.position.x).toBeCloseTo(0, 6);
    });

    it("reports dependency cycles and still solves them", () => {
        const a = node("a", 0);
        const b = node("b", 10);
        constrain(a, [b], "position", 1);
        constrain(b, [a], "position", 1);
        const solver = FBXConstraintSolver.Get(scene)!;

        expect(solver.cyclicConstraints.map((behavior) => behavior.attachedNode?.name)).toEqual(["a", "b"]);
        expect(() => solver.solve()).not.toThrow();
        expect(Number.isFinite(a.position.x) && Number.isFinite(b.position.x)).toBe(true);
    });

    it("runs from one before-render observer and removes it with the last behavior", async () => {
        const observersBefore = scene.onBeforeRenderObservable.observers.length;
        const constrained = node("constrained", 0);
        const other = node("other", 0);
        const target = node("target", 10);
        const first = constrain(constrained, [target], "position", 1);
        const second = constrain(other, [target], "position", 1);

        expect(scene.onBeforeRenderObservable.observers.length).toBe(observersBefore + 1);
        target.position.x = 30;
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(constrained.position.x).toBeCloseTo(30, 6);
        expect(other.position.x).toBeCloseTo(30, 6);

        constrained.removeBehavior(first);
        expect(FBXConstraintSolver.Get(scene)).toBeDefined();
        other.removeBehavior(second);
        expect(FBXConstraintSolver.Get(scene)).toBeUndefined();
        // Observable unregisters on the next tick.
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(scene.onBeforeRenderObservable.observers.length).toBe(observersBefore);
        expect(first.attachedNode).toBeNull();
    });

    it("aims without producing NaN when the target sits on the node", () => {
        const constrained = node("constrained", 0);
        const target = node("target", 0);
        constrain(constrained, [target], "aim", 1);
        const solver = FBXConstraintSolver.Get(scene)!;

        solver.solve();
        const q = constrained.rotationQuaternion!;
        expect([q.x, q.y, q.z, q.w].every((v) => Number.isFinite(v))).toBe(true);
        expect(q.w).toBeCloseTo(1, 6);

        // Once the target moves, the aim vector (+X) points at it.
        target.position.set(0, 0, 5);
        solver.solve();
        const aim = Vector3.TransformNormal(new Vector3(1, 0, 0), constrained.computeWorldMatrix(true)).normalize();
        expect(aim.z).toBeCloseTo(1, 4);
    });

    it("blends several targets by weight", () => {
        const constrained = node("constrained", 0);
        const near = node("near", 10);
        const far = node("far", 30);
        const behavior = new FBXConstraintBehavior(createConstraintData("position", 1), {
            root,
            targets: [
                { node: near, weight: 3, offset: Matrix.Identity() },
                { node: far, weight: 1, offset: Matrix.Identity() },
            ],
            upNode: null,
            sceneUp: new Vector3(0, 1, 0),
        });
        constrained.addBehavior(behavior);

        expect(constrained.position.x).toBeCloseTo(15, 6);
    });
});

function createConstraintData(type: FBXConstraintType, weight: number, overrides: Partial<FBXConstraintData> = {}): FBXConstraintData {
    return {
        id: 1,
        name: "test",
        type,
        typeName: type,
        targets: [],
        weight,
        active: true,
        affectTranslation: [true, true, true],
        affectRotation: [true, true, true],
        affectScale: [true, true, true],
        offsetTranslation: [0, 0, 0],
        offsetRotation: [0, 0, 0],
        offsetScale: [1, 1, 1],
        aimVector: [1, 0, 0],
        upVector: [0, 1, 0],
        worldUpVector: [0, 1, 0],
        worldUpType: 0,
        ikPoleVector: [0, 0, 0],
        ...overrides,
    };
}
