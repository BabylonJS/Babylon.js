import { type Engine, NullEngine } from "core/Engines";
import { type FlowGraph, type FlowGraphContext, type FlowGraphSignalConnection, FlowGraphCoordinator, ParseFlowGraphAsync } from "core/FlowGraph";
import { FlowGraphMeshIntersectionEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphMeshIntersectionEventBlock";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("FlowGraphMeshIntersectionEventBlock", () => {
    let engine: Engine;
    let scene: Scene;
    let coordinator: FlowGraphCoordinator;
    let graph: FlowGraph;
    let context: FlowGraphContext;
    let source: Mesh;
    let targetA: Mesh;
    let targetB: Mesh;

    // Simulates a frame: rendering advances the render id, which invalidates cached world matrices.
    function tick() {
        scene.incrementRenderId();
        scene.onBeforeRenderObservable.notifyObservers(scene);
    }

    // Geometry-less unit boxes keep the scene ready without materials or shaders.
    function createUnitBox(name: string) {
        const mesh = new Mesh(name, scene);
        mesh.setBoundingInfo(new BoundingInfo(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)));
        return mesh;
    }

    let transitions: string[];

    function recordTransitions(block: FlowGraphMeshIntersectionEventBlock) {
        const record = (signal: FlowGraphSignalConnection, label: string) => {
            const original = signal._activateSignal;
            vi.spyOn(signal, "_activateSignal").mockImplementation((ctx: FlowGraphContext) => {
                const other = block.otherMesh.getValue(ctx);
                transitions.push(`${label} ${label === "out" ? block.isIntersecting.getValue(ctx) : other?.name}`);
                original.call(signal, ctx);
            });
        };
        record(block.onEnter, "enter");
        record(block.onExit, "exit");
        record(block.out, "out");
    }

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        Logger.Log = vi.fn();
        transitions = [];
        scene = new Scene(engine);
        coordinator = new FlowGraphCoordinator({ scene });
        graph = coordinator.createGraph();
        context = graph.createContext();

        source = createUnitBox("source");
        targetA = createUnitBox("targetA");
        targetB = createUnitBox("targetB");
        targetA.position.x = 5;
        targetB.position.x = -5;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function createBlock(targets: Mesh | Mesh[] = [targetA, targetB]) {
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        block.sourceMesh.setValue(source, context);
        block.targetMeshes.setValue(targets, context);
        recordTransitions(block);
        return block;
    }

    function getLogMessages(): string[] {
        return transitions;
    }

    it("does not fire while nothing intersects", () => {
        createBlock();
        graph.start();
        tick();
        tick();
        expect(transitions).toEqual([]);
    });

    it("fires onEnter once when a target starts intersecting and onExit once when it stops", () => {
        createBlock();
        graph.start();
        tick();

        targetA.position.x = 0.5;
        tick();
        tick();
        expect(getLogMessages()).toEqual(["enter targetA", "out true"]);

        targetA.position.x = 5;
        tick();
        tick();
        expect(getLogMessages()).toEqual(["enter targetA", "out true", "exit targetA", "out false"]);
    });

    it("tracks multiple targets independently", () => {
        createBlock();
        graph.start();

        targetA.position.x = 0.5;
        targetB.position.x = -0.5;
        tick();
        expect(getLogMessages().filter((m) => m.startsWith("enter"))).toEqual(["enter targetA", "enter targetB"]);

        targetB.position.x = -5;
        tick();
        expect(getLogMessages().filter((m) => m.startsWith("exit"))).toEqual(["exit targetB"]);
    });

    it("accepts a single target mesh", () => {
        createBlock(targetA);
        graph.start();
        targetA.position.x = 0.5;
        tick();
        expect(getLogMessages()).toContain("enter targetA");
    });

    it("ignores the source mesh in the target list", () => {
        createBlock([source, targetA]);
        graph.start();
        tick();
        expect(transitions).toEqual([]);
    });

    it("treats disabled targets as not intersecting", () => {
        createBlock();
        graph.start();
        targetA.position.x = 0.5;
        tick();
        targetA.setEnabled(false);
        tick();
        expect(getLogMessages()).toEqual(["enter targetA", "out true", "exit targetA", "out false"]);
    });

    it("uses oriented bounding boxes when precise intersection is requested", () => {
        const block = createBlock(targetA);
        block.usePreciseIntersection.setValue(true, context);
        // Rotated thin boxes whose axis-aligned bounds overlap but whose oriented bounds do not.
        source.scaling.set(4, 0.1, 0.1);
        source.rotation.z = Math.PI / 4;
        targetA.scaling.set(4, 0.1, 0.1);
        targetA.rotation.z = Math.PI / 4;
        targetA.position.set(0.6, -0.6, 0);
        graph.start();
        tick();
        expect(transitions).toEqual([]);

        block.usePreciseIntersection.setValue(false, context);
        tick();
        expect(getLogMessages()).toContain("enter targetA");
    });

    it("resets the intersection state when the graph restarts", () => {
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        // Default values survive a stop, which discards the execution contexts.
        (block.sourceMesh as any)._defaultValue = source;
        (block.targetMeshes as any)._defaultValue = [targetA];
        recordTransitions(block);
        graph.start();
        targetA.position.x = 0.5;
        tick();
        graph.stop();
        graph.start();
        tick();
        expect(getLogMessages().filter((m) => m.startsWith("enter"))).toEqual(["enter targetA", "enter targetA"]);
    });

    it("detects in-place transform changes made before the frame's render id advances", () => {
        createBlock(targetA);
        graph.start();
        // Mimic Scene.render: the matrices were computed during the previous frame with the current render id,
        // and before-render observers run before the render id advances.
        targetA.computeWorldMatrix(true);
        source.computeWorldMatrix(true);
        targetA.position.x = 0.5;
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(transitions).toEqual(["enter targetA", "out true"]);
    });

    it("starts a new execution frame for each check so cached input values are refreshed", () => {
        createBlock();
        graph.start();
        const before = context.executionId;
        tick();
        tick();
        expect(context.executionId).toBeGreaterThanOrEqual(before + 2);
    });

    it("handles large overlapping target lists with duplicates without repeated transitions", () => {
        const targets: Mesh[] = [];
        for (let i = 0; i < 500; i++) {
            targets.push(createUnitBox(`overlap${i}`));
        }
        // Every target appears twice.
        createBlock([...targets, ...targets]);
        const intersectsSpy = vi.spyOn(source, "intersectsMesh");
        graph.start();

        tick();
        expect(transitions.filter((t) => t.startsWith("enter"))).toHaveLength(500);
        expect(intersectsSpy).toHaveBeenCalledTimes(500);

        transitions.length = 0;
        intersectsSpy.mockClear();
        tick();
        expect(transitions).toEqual([]);
        expect(intersectsSpy).toHaveBeenCalledTimes(500);

        targets[10].position.x = 5;
        tick();
        expect(transitions).toEqual(["exit overlap10", "out false"]);
    });

    it("serializes and parses the target mesh list", async () => {
        const block = new FlowGraphMeshIntersectionEventBlock();
        graph.addEventBlock(block);
        (block.sourceMesh as any)._defaultValue = source;
        (block.targetMeshes as any)._defaultValue = [targetA, targetB];

        const serialized: any = {};
        graph.serialize(serialized);
        const serializedBlock = serialized.allBlocks.find((b: any) => b.className === "FlowGraphMeshIntersectionEventBlock");
        const serializedTargets = serializedBlock.dataInputs.find((i: any) => i.name === "targetMeshes").defaultValue;
        expect(serializedTargets).toEqual([
            { id: targetA.id, name: "targetA", className: "Mesh", uniqueId: targetA.uniqueId },
            { id: targetB.id, name: "targetB", className: "Mesh", uniqueId: targetB.uniqueId },
        ]);

        const parsedCoordinator = new FlowGraphCoordinator({ scene });
        const parsed = await ParseFlowGraphAsync(serialized, { coordinator: parsedCoordinator });
        const parsedBlock = parsed.getAllBlocks?.().find((b) => b instanceof FlowGraphMeshIntersectionEventBlock) as FlowGraphMeshIntersectionEventBlock;
        const parsedContext = parsed.getContext(0);
        expect(parsedBlock.sourceMesh.getValue(parsedContext)).toBe(source);
        expect(parsedBlock.targetMeshes.getValue(parsedContext)).toEqual([targetA, targetB]);
    });
});
