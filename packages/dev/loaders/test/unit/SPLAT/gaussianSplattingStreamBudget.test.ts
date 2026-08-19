import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { Viewport } from "core/Maths/math.viewport";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingStream, type ISOGLODMetadata } from "loaders/SPLAT/gaussianSplattingStream";
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
});
