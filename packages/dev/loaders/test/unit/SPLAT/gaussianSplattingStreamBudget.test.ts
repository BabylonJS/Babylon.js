import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { Viewport } from "core/Maths/math.viewport";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingCompoundMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh";
import { AddGaussianSplattingStreamPart, GaussianSplattingStream, type ISOGLODMetadata } from "loaders/SPLAT/gaussianSplattingStream";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Budget-driven LOD selection is pure logic over the leaf nodes + camera, but the stream constructor kicks off
// _streamAllAsync (network). Stub its metadata pre-pass so it stalls offline; then inject synthetic leaves and drive
// evaluateOptimalLods + _computeTargetLevels directly.
type TestNode = {
    bound: { min: number[]; max: number[] };
    lods: Record<string, { file: number; offset: number; count: number }>;
    availableLevels: number[];
    baseLod: number;
    inFrustum: boolean;
    optimalLod?: number;
    pixelSize?: number;
    targetLevel?: number;
};

const makeNode = (min: number[], max: number[], counts: Record<number, number>): TestNode => {
    const levels = Object.keys(counts)
        .map(Number)
        .sort((a, b) => a - b);
    const lods: TestNode["lods"] = {};
    for (const l of levels) {
        lods[String(l)] = { file: 0, offset: 0, count: counts[l] };
    }
    return { bound: { min, max }, lods, availableLevels: levels, baseLod: levels[levels.length - 1], inFrustum: true };
};

const METADATA: ISOGLODMetadata = { lodLevels: 3, filenames: [], tree: { bound: { min: [0, 0, 0], max: [1, 1, 1] } } };

describe("GaussianSplattingStream budget-driven LOD", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    let gatherSpy: ReturnType<typeof vi.spyOn>;

    beforeAll(() => {
        // Keep the constructor's _streamAllAsync offline: never resolve the metadata pre-pass.
        gatherSpy = vi.spyOn(GaussianSplattingStream.prototype as any, "_gatherCountsAsync").mockImplementation(() => new Promise(() => {}));
    });

    afterAll(() => {
        gatherSpy.mockRestore();
    });

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        camera = new FreeCamera("cam", new Vector3(0, 0, 0), scene);
        camera.setTarget(new Vector3(1, 0, 0)); // look down +X
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // Builds a standalone stream with an identity transform (local == world) and the given leaves injected.
    const makeStream = (splatBudget: number | "auto" | undefined, nodes: TestNode[]): any => {
        const s = new GaussianSplattingStream("s", METADATA, "", scene, { splatBudget }) as any;
        s.scaling.set(1, 1, 1);
        s.rotation.set(0, 0, 0);
        s.computeWorldMatrix(true);
        s._baseLayerReady = true;
        s._leafNodes.length = 0;
        s._leafNodes.push(...nodes);
        return s;
    };

    const totalRendered = (s: any, nodes: TestNode[]): number => nodes.reduce((sum, n) => sum + s._countAtLevel(n, n.targetLevel), 0);

    it("is identical to distance LOD when the budget is disabled (no pixelSize, target == distance-optimal)", () => {
        const node = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 }); // center (3,0,0) => optimal 0
        const s = makeStream(undefined, [node]);
        s.evaluateOptimalLods(camera);
        s._computeTargetLevels();
        expect(node.pixelSize).toBeUndefined(); // pixel-size path not entered when the budget is off
        expect(node.targetLevel).toBe(node.optimalLod);
        expect(node.optimalLod).toBe(0);
    });

    it("caps the total and concentrates detail on the larger (more pixels) node at equal distance", () => {
        const big = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 }); // center (3,0,0), radius ~1.7
        const small = makeNode([2.9, -0.1, -0.1], [3.1, 0.1, 0.1], { 0: 1000, 1: 100, 2: 10 }); // same center, radius ~0.17
        const s = makeStream(1100, [big, small]);
        s.evaluateOptimalLods(camera);
        s._computeTargetLevels();
        expect(totalRendered(s, [big, small])).toBeLessThanOrEqual(1100);
        expect(big.targetLevel).toBeLessThan(small.targetLevel!); // bigger node keeps finer (lower index) detail
    });

    it("aggregates across active cameras: finest level and largest projected size any camera demands", () => {
        const node = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 }); // center (3,0,0)
        const s = makeStream(2000, [node]);
        const camB = new FreeCamera("camB", new Vector3(2000, 0, 0), scene);
        camB.setTarget(new Vector3(1999, 0, 0)); // far along +X, looking back toward the node
        camB.getViewMatrix(); // populate globalPosition (no render happens in the test)

        // camB alone: the node is ~2000 away => coarsest level, tiny projected size.
        s.evaluateOptimalLods(camB);
        expect(node.optimalLod).toBe(2);
        const pixelSizeB = node.pixelSize as number;

        // camA (origin) alone: the node is close => finest level, large projected size.
        s.evaluateOptimalLods(camera);
        expect(node.optimalLod).toBe(0);
        const pixelSizeA = node.pixelSize as number;

        // Both active: finest level (min = A's 0) and largest projected size (max = A's, the closer camera).
        scene.activeCameras = [camera, camB];
        s.evaluateOptimalLods();
        expect(node.optimalLod).toBe(0);
        expect(node.pixelSize).toBeCloseTo(pixelSizeA, 5);
        expect(node.pixelSize!).toBeGreaterThan(pixelSizeB);
    });

    it("scales projected size by each camera's viewport height (split-view panes)", () => {
        const node = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const s = makeStream(2000, [node]);

        camera.viewport = new Viewport(0, 0, 1, 1); // full canvas
        s.evaluateOptimalLods(camera);
        const full = node.pixelSize as number;

        camera.viewport = new Viewport(0, 0, 1, 0.5); // half-height pane => half the vertical pixels
        s.evaluateOptimalLods(camera);
        expect(node.pixelSize).toBeCloseTo(full * 0.5, 4);
    });

    it("is view-direction-independent: two cameras at one position match a single camera there (no foveation)", () => {
        const node = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const s = makeStream(2000, [node]);

        s.evaluateOptimalLods(camera); // single camera at origin looking +X
        const singleLod = node.optimalLod;
        const singlePixel = node.pixelSize as number;

        // A second camera at the SAME position but looking a different direction must not change the result.
        const camRot = new FreeCamera("camRot", new Vector3(0, 0, 0), scene);
        camRot.setTarget(new Vector3(0, 0, 1)); // look +Z
        scene.activeCameras = [camera, camRot];
        s.evaluateOptimalLods();
        expect(node.optimalLod).toBe(singleLod);
        expect(node.pixelSize).toBeCloseTo(singlePixel, 5);
    });

    it("union frustum: a node visible to any active camera is in-frustum", () => {
        const s = makeStream(undefined, []);
        const node: any = makeNode([-11, -1, -1], [-9, 1, 1], { 0: 100, 1: 10 }); // center (-10,0,0)
        node.cullBounds = new BoundingInfo(Vector3.FromArray(node.bound.min), Vector3.FromArray(node.bound.max));
        node.inFrustum = true;
        s._leafNodes.length = 0;
        s._leafNodes.push(node);

        const camB = new FreeCamera("camB", new Vector3(0, 0, 0), scene);
        camB.setTarget(new Vector3(-1, 0, 0)); // look -X, toward the node

        // camA (looks +X) alone: the node is behind it => out of frustum.
        scene.activeCameras = [camera];
        s._updateNodeFrustum();
        expect(node.inFrustum).toBe(false);

        // Union with camB (which sees it): in frustum.
        scene.activeCameras = [camera, camB];
        s._updateNodeFrustum();
        expect(node.inFrustum).toBe(true);
    });

    it("applies a runtime budget change immediately (forces re-eval; lower coarsens, higher refines)", () => {
        const a = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const b = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const s = makeStream(undefined, [a, b]);

        s._forceLodUpdate = false;
        s.splatBudget = 300; // runtime setter
        expect(s._forceLodUpdate).toBe(true);
        expect(s.splatBudget).toBe(300);
        s.evaluateOptimalLods(camera);
        s._computeTargetLevels();
        const tight = totalRendered(s, [a, b]);
        expect(tight).toBeLessThanOrEqual(300);

        s.splatBudget = 5000; // generous => back to full detail
        s.evaluateOptimalLods(camera);
        s._computeTargetLevels();
        expect(totalRendered(s, [a, b])).toBeGreaterThan(tight);
    });

    it("never exceeds the budget (guaranteed cap), coarsening as needed", () => {
        const nodes = [0, 1, 2, 3].map(() => makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 }));
        const s = makeStream(250, nodes); // 4 x 1000 at full detail => must coarsen well below the cap
        s.evaluateOptimalLods(camera);
        s._computeTargetLevels();
        expect(totalRendered(s, nodes)).toBeLessThanOrEqual(250);
    });

    it("falls back to minimum detail (all coarsest) when the budget is below the pinned coarsest total", () => {
        const a = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const b = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const s = makeStream(5, [a, b]); // 5 < coarsest sum (10 + 10 = 20): unsatisfiable
        s.evaluateOptimalLods(camera);
        s._computeTargetLevels();
        expect(a.targetLevel).toBe(2); // coarsest available (baseLod)
        expect(b.targetLevel).toBe(2);
        expect(totalRendered(s, [a, b])).toBe(20); // the minimum achievable — cannot go lower
    });

    it("counts the always-rendered environment in demand and reserves it from the budget", () => {
        const node = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const s = makeStream(1100, [node]);
        s._environmentRange = { offset: 0, count: 500 };
        s.evaluateOptimalLods(camera);
        // Demand = env (500) + full-detail leaf (1000).
        expect(s.getBudgetDemand()).toBe(1500);
        s._computeTargetLevels();
        // env (fixed 500) + leaves must stay within the 1100 budget, so the leaf coarsens below its ceiling.
        expect(500 + totalRendered(s, [node])).toBeLessThanOrEqual(1100);
        expect(node.targetLevel).toBeGreaterThan(0);
    });

    it("normalizes string metadata counts to numbers at ingestion (no string concatenation in budget math)", () => {
        const s = makeStream(1000, []);
        const node: any = {
            bound: { min: [0, 0, 0], max: [1, 1, 1] },
            // Untrusted metadata may provide digit strings for counts.
            lods: { "0": { file: 0, offset: 0, count: "500" }, "1": { file: 0, offset: 0, count: "50" } },
        };
        s._leafNodes.length = 0;
        s._collectLodEntries(node);
        expect(s._leafNodes).toContain(node);
        expect(node.lods["0"].count).toBe(500); // number, not "500"
        expect(typeof node.lods["1"].count).toBe("number");
        expect(s._countAtLevel(node, 0)).toBe(500);
    });

    it("drops malformed coarser-but-larger LOD levels at ingestion (enforces monotonic counts)", () => {
        const s = makeStream(undefined, []);
        // Level 2 (1000) is more expensive than the finer level 1 (10) — malformed; it must be dropped so the base
        // is the true cheapest level and the budget cap can't be defeated.
        const node: any = {
            bound: { min: [0, 0, 0], max: [1, 1, 1] },
            lods: { "0": { file: 0, offset: 0, count: 1000 }, "1": { file: 1, offset: 0, count: 10 }, "2": { file: 2, offset: 0, count: 1000 } },
        };
        s._leafNodes.length = 0;
        s._collectLodEntries(node);
        expect(node.availableLevels).toEqual([0, 1]);
        expect(node.baseLod).toBe(1);
    });

    it("skips nodes with non-finite bounds at ingestion", () => {
        const s = makeStream(undefined, []);
        const node: any = { bound: { min: [0, 0, 0], max: [Infinity, 1, 1] }, lods: { "0": { file: 0, offset: 0, count: 100 } } };
        s._leafNodes.length = 0;
        s._collectLodEntries(node);
        expect(s._leafNodes).not.toContain(node);
    });

    it("skips nodes whose finite bounds still produce a non-finite or zero span at ingestion", () => {
        const s = makeStream(undefined, []);
        // Coordinates are individually finite, but the span overflows to Infinity: an infinite radius/pixel size makes
        // the budget's terminal threshold infinite and defeats the cap.
        const huge: any = { bound: { min: [-1e308, -1e308, -1e308], max: [1e308, 1e308, 1e308] }, lods: { "0": { file: 0, offset: 0, count: 100 } } };
        // Degenerate zero-extent AABB: projects to zero pixels and would never coarsen.
        const degenerate: any = { bound: { min: [1, 1, 1], max: [1, 1, 1] }, lods: { "0": { file: 0, offset: 0, count: 100 } } };
        s._leafNodes.length = 0;
        s._collectLodEntries(huge);
        s._collectLodEntries(degenerate);
        expect(s._leafNodes).not.toContain(huge);
        expect(s._leafNodes).not.toContain(degenerate);
    });

    it("rejects non-canonical and out-of-range LOD keys at ingestion (METADATA.lodLevels = 3 => 0..2)", () => {
        const s = makeStream(undefined, []);
        const node: any = {
            bound: { min: [0, 0, 0], max: [1, 1, 1] },
            lods: {
                "0": { file: 0, offset: 0, count: 1000 },
                "01": { file: 1, offset: 0, count: 500 }, // non-canonical: String(Number("01")) === "1" !== "01"
                "1": { file: 2, offset: 0, count: 100 },
                "5": { file: 3, offset: 0, count: 10 }, // out of the declared range (> 2)
            },
        };
        s._leafNodes.length = 0;
        s._collectLodEntries(node);
        expect(node.availableLevels).toEqual([0, 1]); // "01" and "5" dropped
        // Every kept level must resolve through String(level) — no crash in later lookups.
        for (const lvl of node.availableLevels) {
            expect(node.lods[String(lvl)]).toBeDefined();
        }
    });

    it("preserves adjacent LOD levels with equal counts (only rejects a coarser level that costs more)", () => {
        const s = makeStream(undefined, []);
        const node: any = {
            bound: { min: [0, 0, 0], max: [1, 1, 1] },
            lods: {
                "0": { file: 0, offset: 0, count: 100 },
                "1": { file: 1, offset: 0, count: 100 }, // equal count — different geometry, must be kept
                "2": { file: 2, offset: 0, count: 50 },
            },
        };
        s._leafNodes.length = 0;
        s._collectLodEntries(node);
        expect(node.availableLevels).toEqual([0, 1, 2]);
        expect(node.baseLod).toBe(2);
    });

    it("re-evaluates on any allocation change, up or down (a stationary camera would otherwise never re-eval)", () => {
        const s = makeStream(undefined, [makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 })]);
        s.setBudgetAllocation(1000); // first coordination
        s._forceLodUpdate = false;
        s.setBudgetAllocation(990); // small decrease => force (the active count may now exceed the smaller cap)
        expect(s._forceLodUpdate).toBe(true);
        s._forceLodUpdate = false;
        s.setBudgetAllocation(991); // small increase => force (may unlock a finer level; the camera never moves)
        expect(s._forceLodUpdate).toBe(true);
        s._forceLodUpdate = false;
        s.setBudgetAllocation(991); // no change => no force
        expect(s._forceLodUpdate).toBe(false);
    });

    it("enforces the cap immediately: an over-budget node coarsens past its cooldown to the resident target", () => {
        const node: any = {
            bound: { min: [2, -1, -1], max: [4, 1, 1] },
            lods: { "0": { file: 0, offset: 0, count: 1000 }, "1": { file: 1, offset: 0, count: 100 }, "2": { file: 2, offset: 0, count: 10 } },
            availableLevels: [0, 1, 2],
            baseLod: 2,
            inFrustum: true,
            activeLod: 0, // currently rendering the FINEST level
            activeFile: 0,
            targetLevel: 2, // budget wants the coarsest
            lodCooldown: 5, // in cooldown — must NOT block the cap coarsening
        };
        const s = makeStream(500, [node]); // budget enabled: only then does the cap bypass the cooldown
        s._decodedFiles.add(2); // the target (base) level is resident
        const dirty = s._applyDesiredLods();
        expect(dirty).toBe(true);
        expect(node.activeLod).toBe(2); // coarsened immediately despite the cooldown
    });

    it("does NOT bypass the cooldown when no budget is enabled (ordinary coarsening keeps its cooldown)", () => {
        const node: any = {
            bound: { min: [2, -1, -1], max: [4, 1, 1] },
            lods: { "0": { file: 0, offset: 0, count: 1000 }, "1": { file: 1, offset: 0, count: 100 }, "2": { file: 2, offset: 0, count: 10 } },
            availableLevels: [0, 1, 2],
            baseLod: 2,
            inFrustum: true,
            activeLod: 0,
            activeFile: 0,
            targetLevel: 2,
            lodCooldown: 5, // in cooldown
        };
        const s = makeStream(undefined, [node]); // budget disabled => pre-budget behavior: cooldown blocks the switch
        s._decodedFiles.add(2);
        const dirty = s._applyDesiredLods();
        expect(dirty).toBe(false);
        expect(node.activeLod).toBe(0); // untouched — the cooldown was respected
    });

    it("enforces the cap even before the exact target downloads: falls back to the resident base", () => {
        const node: any = {
            bound: { min: [2, -1, -1], max: [4, 1, 1] },
            lods: { "0": { file: 0, offset: 0, count: 1000 }, "1": { file: 1, offset: 0, count: 100 }, "2": { file: 2, offset: 0, count: 10 } },
            availableLevels: [0, 1, 2],
            baseLod: 2,
            inFrustum: true,
            activeLod: 0,
            activeFile: 0,
            targetLevel: 1, // wants level 1, but it isn't decoded yet
            lodCooldown: 0,
        };
        const s = makeStream(500, [node]);
        s._decodedFiles.add(2); // only the base (level 2) is resident
        s._applyDesiredLods();
        expect(node.activeLod).toBe(2); // over-budget node coarsened to the resident base (<= the target's cap)
    });

    it("keeps the current visible file when no coarser level is resident (evicted base): never renders a hole", () => {
        const node: any = {
            bound: { min: [2, -1, -1], max: [4, 1, 1] },
            lods: { "0": { file: 0, offset: 0, count: 1000 }, "1": { file: 1, offset: 0, count: 100 }, "2": { file: 2, offset: 0, count: 10 } },
            availableLevels: [0, 1, 2],
            baseLod: 2,
            inFrustum: true,
            activeLod: 0, // rendering the finest (and only resident) file
            activeFile: 0,
            targetLevel: 2, // budget wants the coarsest, but neither level 1 nor the base is resident anymore
            lodCooldown: 0,
        };
        const s = makeStream(500, [node]);
        s._decodedFiles.add(0); // ONLY the fine file is resident; eviction freed levels 1 and 2 (the base)
        s._applyDesiredLods();
        expect(node.activeLod).toBe(0); // stays on the visible fine file — not switched to a non-resident base
        expect(node.pendingFile).toBe(2); // and the coarse target download is queued
    });

    it("hosted stream: the compound apportions its budget to the stream and releases it on unregister", () => {
        const compound = new GaussianSplattingCompoundMesh("compound", null, scene) as any;
        const node = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        const s = makeStream(undefined, [node]); // own budget disabled; only the host's applies
        s.evaluateOptimalLods(camera); // node wants the finest level (demand ~1000)

        compound.registerLodBudgetParticipant(s);
        compound.splatBudget = 500; // installs the per-frame apportion observer
        scene.onBeforeRenderObservable.notifyObservers(scene); // fire it (stands in for a rendered frame)

        // Host override precedence: the stream's effective budget is the compound's apportioned slice.
        expect(s._hostBudgetAllocation).toBe(500);
        expect(s._effectiveSplatBudget()).toBe(500);
        // ...and it drives the active selection: with the budget now enabled, re-eval computes pixel sizes and the
        // rendered total stays within the allocation.
        s.evaluateOptimalLods();
        s._computeTargetLevels();
        expect(totalRendered(s, [node])).toBeLessThanOrEqual(500);

        // Unregister releases coordination: the stream reverts to its own (disabled) budget.
        compound.unregisterLodBudgetParticipant(s);
        expect(s._hostBudgetAllocation).toBeNull();
        expect(s._effectiveSplatBudget()).toBe(0);
    });

    it("hosted lifecycle via AddGaussianSplattingStreamPart: construction, apportionment, budget-off release, disposal unregister", () => {
        const compound = new GaussianSplattingCompoundMesh("compound", null, scene) as any;
        // The real hosted entry point binds the controller to the compound. The network pre-pass is stubbed offline,
        // so the atlas region isn't reserved here (that needs a live render loop) — registration is driven manually to
        // mirror exactly what _streamAllAsync does once the region is reserved.
        const s = AddGaussianSplattingStreamPart(compound, "part", METADATA, "", {}) as any;
        expect(s._hostCompound).toBe(compound);

        const node = makeNode([2, -1, -1], [4, 1, 1], { 0: 1000, 1: 100, 2: 10 });
        s._baseLayerReady = true;
        s._leafNodes.length = 0;
        s._leafNodes.push(node);
        s.computeWorldMatrix(true);
        s.evaluateOptimalLods(camera);

        compound.registerLodBudgetParticipant(s);
        expect(compound._lodBudgetParticipants).toContain(s);

        // The per-frame observer apportions the compound's cap to the stream.
        compound.splatBudget = 500;
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(s._hostBudgetAllocation).toBe(500);

        // Disabling the compound budget tears coordination down and releases every participant's allocation to null.
        compound.splatBudget = 0;
        expect(s._hostBudgetAllocation).toBeNull();
        expect(s._effectiveSplatBudget()).toBe(0);

        // Disposing the hosted controller unregisters it (dispose() covers the hosted path), so the compound stops
        // apportioning to a dead stream.
        compound.splatBudget = 500;
        scene.onBeforeRenderObservable.notifyObservers(scene);
        expect(compound._lodBudgetParticipants).toContain(s);
        s.dispose();
        expect(compound._lodBudgetParticipants).not.toContain(s);
    });
});
