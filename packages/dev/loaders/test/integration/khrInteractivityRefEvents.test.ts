/* eslint-disable no-console */
// NOTE: Development-workflow integration tests — NOT part of the final PR.
//
// Focused, *variable-asserted* coverage for the KHR_interactivity ref system,
// event cancellation, and cross-GLB events:
//   - event/refs            (ref output sockets on onStart/onTick/receive)
//   - event/stopPropagation (event cancellation)
//   - InterGlb/RefEcho      (ref-typed events sent across two GLBs)
//
// Unlike the console-string batch runner, these assets report their pass/fail
// verdict ONLY through graph variables (`TestResult_HasPassed_*`), so a console
// scraper sees nothing. Each Khronos asset ships a companion
// `test-Json/<name>.json` descriptor that lists, per sub-test:
//   - successResultVarId : index of the boolean `TestResult_HasPassed_*` flag
//   - resultVarId        : index of the raw `TestResult_*` value
//   - expectedResultValue: the expected raw value
// Babylon stores interactivity variables in the FlowGraph context under the key
// `staticVariable_<index>` (see InteractivityGraphToFlowGraphParser.getVariableName),
// so we can read each flag back and assert the asset's own verdict.
//
// Requires a local glTF-Test-Assets-Interactivity checkout (override the
// location with KHR_ASSETS_BASE) and babylon-server on :1337.
import { test, expect, Page } from "@playwright/test";
import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig } from "@tools/test-tools";
import * as fs from "fs";
import * as path from "path";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

const KHRONOS_BASE = process.env.KHR_ASSETS_BASE || "E:\\Github\\glTF-Test-Assets-Interactivity\\Tests\\Interactivity";
// Generous upper bound; the poll resolves as soon as every required flag is set.
// stopPropagation gates its verdict behind a ~1s flow/setDelay, InterGlb ~3s.
const POLL_TIMEOUT_MS = process.env.KHR_RUN_MS ? parseInt(process.env.KHR_RUN_MS) : 8000;
const debug = process.env.KHR_DEBUG === "true";

interface SubTest {
    label: string;
    resultVarId: number;
    successResultVarId: number;
    resultVarType: string;
    expected: unknown;
}

// Derive the companion descriptor path from a GLB path:
//   .../event/refs/glTF-Binary/refs.glb  ->  .../event/refs/test-Json/refs.json
function loadSubTests(glbPath: string): SubTest[] {
    const assetDir = path.dirname(path.dirname(glbPath));
    const baseName = path.basename(glbPath, ".glb");
    const descriptorPath = path.join(assetDir, "test-Json", baseName + ".json");
    const descriptor = JSON.parse(fs.readFileSync(descriptorPath, "utf8"));
    const out: SubTest[] = [];
    for (const t of descriptor.tests || []) {
        for (const st of t.subTests || []) {
            out.push({
                label: String(st.name || "")
                    .replace(/\s+/g, " ")
                    .trim(),
                resultVarId: st.resultVarId,
                successResultVarId: st.successResultVarId,
                resultVarType: st.resultVarType,
                expected: Array.isArray(st.expectedResultValue) ? st.expectedResultValue[0] : st.expectedResultValue,
            });
        }
    }
    return out;
}

// Serve a local GLB via an intercepted same-origin URL (large data: URLs crash
// the renderer context — see the batch runner for details).
let _assetRouteCounter = 0;
async function routeGlb(targetPage: Page, filePath: string): Promise<string> {
    const url = `${getGlobalConfig().baseUrl}/__khr_refevt_${_assetRouteCounter++}.glb`;
    const body = fs.readFileSync(filePath);
    await targetPage.route(url, (route) => route.fulfill({ status: 200, contentType: "model/gltf-binary", body }));
    return url;
}

interface CollectResult {
    error: string | null;
    settled: boolean;
    vars: Record<string, unknown>[];
}

/**
 * Loads the given GLB(s) into a fresh scene (in order), optionally bridges public
 * custom events between exactly two coordinators (for the cross-GLB case), runs
 * the render loop, and polls each new coordinator's interactivity variables until
 * every required `successResultVarId` flag is true or the timeout elapses.
 *
 * @param glbPaths absolute paths of the GLB(s) to load, in load order.
 * @param requiredByCoord per-created-coordinator list of `successResultVarId`s that must become true.
 * @param doBridge when true (and exactly two GLBs), bridge public custom events between the two coordinators.
 * @returns one normalized `{ staticVariable_N: primitive }` map per created coordinator.
 */
async function runAndCollect(glbPaths: string[], requiredByCoord: number[][], doBridge: boolean): Promise<CollectResult> {
    await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
    await page.evaluate(evaluateInitEngine);
    await page.evaluate(evaluateCreateScene);

    const urls: string[] = [];
    for (const p of glbPaths) {
        urls.push(await routeGlb(page, p));
    }

    // --- Load (and optionally bridge) in its own evaluate, matching the batch
    // runner. Keeping the load separate from the render-loop evaluate is what
    // lets scene-ready/onStart fire correctly for delay-gated receivers. ---
    const loadResult = (await page.evaluate(
        async ({ urls, expectedCoords, doBridge }) => {
            const scene = window.scene!;
            const SceneCoordinators = (BABYLON as any).FlowGraphCoordinator.SceneCoordinators;
            const before = new Set<any>(SceneCoordinators.get(scene) || []);

            for (const url of urls) {
                await BABYLON.SceneLoader.AppendAsync("", url, scene);
            }
            const created = (SceneCoordinators.get(scene) || []).filter((c: any) => !before.has(c));
            if (created.length !== expectedCoords) {
                return { error: `expected ${expectedCoords} coordinator(s), got ${created.length}` };
            }

            // Bridge *public* custom events (id without a leading underscore) between
            // the two coordinators so ref-typed events can cross the GLB boundary.
            // Capture both originals BEFORE patching so a bridged dispatch hits the
            // unpatched method on the other side and cannot ping-pong infinitely.
            if (doBridge && created.length === 2) {
                const [coordA, coordB] = created;
                const isPublic = (id: string) => typeof id === "string" && !id.startsWith("_") && id.length > 0;
                const origA = coordA.notifyCustomEvent.bind(coordA);
                const origB = coordB.notifyCustomEvent.bind(coordB);
                const bridge = (src: any, dstOriginal: any) => {
                    const srcOriginal = src.notifyCustomEvent.bind(src);
                    src.notifyCustomEvent = function (id: string, data: any, async?: boolean) {
                        if (isPublic(id)) {
                            dstOriginal(id, data, async);
                        }
                        return srcOriginal(id, data, async);
                    };
                };
                bridge(coordA, origB);
                bridge(coordB, origA);
            }

            // Stash for the render/poll evaluate below.
            (window as any).__khrCreated = created;
            return { error: null };
        },
        { urls, expectedCoords: requiredByCoord.length, doBridge }
    )) as { error: string | null };

    if (loadResult.error) {
        for (const url of urls) {
            await page.unroute(url);
        }
        return { error: loadResult.error, settled: false, vars: [] };
    }

    // --- Run the render loop and poll the variables until every required pass
    // flag is set (or the timeout elapses). ---
    const result = (await page.evaluate(
        async ({ requiredByCoord, timeoutMs }) => {
            const scene = window.scene!;
            const engine = window.engine!;
            const created: any[] = (window as any).__khrCreated || [];

            // Unwrap FlowGraphInteger/{value}/array-wrapped values to a primitive.
            const norm = (v: any): any => {
                let x = v;
                let guard = 0;
                while (x && typeof x === "object" && "value" in x && guard++ < 5) {
                    x = x.value;
                }
                if (Array.isArray(x)) {
                    x = x[0];
                }
                return x;
            };
            const collectCoord = (coord: any): Record<string, any> => {
                const out: Record<string, any> = {};
                for (const fg of coord.flowGraphs) {
                    for (const ctx of fg._executionContexts || []) {
                        const uv = ctx.userVariables || {};
                        for (const k in uv) {
                            out[k] = norm(uv[k]);
                        }
                    }
                }
                return out;
            };
            const collect = (): Record<string, any>[] => created.map(collectCoord);
            const allSet = (varsArr: Record<string, any>[]) => requiredByCoord.every((ids, ci) => ids.every((id) => varsArr[ci]["staticVariable_" + id] === true));

            // Headless Chrome throttles requestAnimationFrame to ~0fps once the
            // evaluate awaits, so engine.runRenderLoop does not advance the scene
            // (only ~1 frame fires). Timer-driven flow nodes (flow/setDelay.done,
            // which the AdvancedTimer advances on scene.onBeforeRenderObservable)
            // therefore never fire. Manually rendering each poll iteration drives
            // onBeforeRenderObservable so delay-gated verdicts complete.
            if (!scene.activeCamera) {
                scene.createDefaultCamera(true);
            }
            const start = Date.now();
            let vars = collect();
            while (!allSet(vars) && Date.now() - start < timeoutMs) {
                await new Promise<void>((resolve) => setTimeout(resolve, 16));
                try {
                    scene.render();
                } catch {
                    // Rendering may transiently fail (e.g. asset still settling);
                    // keep polling — onBeforeRenderObservable still advanced timers.
                }
                vars = collect();
            }
            return { error: null, settled: allSet(vars), vars };
        },
        { requiredByCoord, timeoutMs: POLL_TIMEOUT_MS }
    )) as CollectResult;

    for (const url of urls) {
        await page.unroute(url);
    }
    return result;
}

// Assert every sub-test's pass flag is true and the raw result matches expected.
function assertSubTests(assetName: string, subTestsByCoord: SubTest[][], varsByCoord: Record<string, unknown>[]): void {
    for (let ci = 0; ci < subTestsByCoord.length; ci++) {
        const vars = varsByCoord[ci] || {};
        for (const st of subTestsByCoord[ci]) {
            if (debug) {
                console.log(
                    `[${assetName}] ${st.label}: HasPassed(staticVariable_${st.successResultVarId})=${JSON.stringify(
                        vars["staticVariable_" + st.successResultVarId]
                    )} result(staticVariable_${st.resultVarId})=${JSON.stringify(vars["staticVariable_" + st.resultVarId])} expected=${JSON.stringify(st.expected)}`
                );
            }
            // Primary gate: the asset's own boolean verdict.
            expect(vars["staticVariable_" + st.successResultVarId], `${assetName} » ${st.label}: TestResult_HasPassed must be true`).toBe(true);
            // Cross-check the raw result against the descriptor's expected value.
            expect(vars["staticVariable_" + st.resultVarId], `${assetName} » ${st.label}: result must equal expected`).toBe(st.expected);
        }
    }
}

let page: Page;

test.describe("KHR_Interactivity Ref & Events (variable-asserted)", () => {
    test.setTimeout(120000);

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
        await page.waitForFunction(() => window.BABYLON);
        page.setDefaultTimeout(0);
    });

    test.afterAll(async () => {
        await page.close();
    });

    // Ref system: onStart/onTick/receive each expose a non-null `event` ref, and
    // two nodes of the same lifecycle op return equal refs.
    test("event/refs — event ref output sockets", async () => {
        const glb = path.join(KHRONOS_BASE, "event", "refs", "glTF-Binary", "refs.glb");
        const subs = loadSubTests(glb);
        const result = await runAndCollect([glb], [subs.map((s) => s.successResultVarId)], false);
        expect(result.error, `load failed: ${result.error}`).toBeNull();
        try {
            assertSubTests("event/refs", [subs], result.vars);
        } finally {
            await page.evaluate(evaluateDisposeEngine).catch(() => {});
        }
    });

    // Event cancellation: Receiver A receives and stops propagation, so Receiver B
    // must NOT be triggered (counter stays 0).
    test("event/stopPropagation — event cancellation", async () => {
        const glb = path.join(KHRONOS_BASE, "event", "stopPropagation", "glTF-Binary", "stopPropagation.glb");
        const subs = loadSubTests(glb);
        const result = await runAndCollect([glb], [subs.map((s) => s.successResultVarId)], false);
        expect(result.error, `load failed: ${result.error}`).toBeNull();
        try {
            assertSubTests("event/stopPropagation", [subs], result.vars);
        } finally {
            await page.evaluate(evaluateDisposeEngine).catch(() => {});
        }
    });

    // Cross-GLB events: File A sends a ref-typed public event, File B echoes a ref
    // back, and each file asserts the round-trip via its own variables.
    test("InterGlb/RefEcho — ref-typed events across two GLBs", async () => {
        const fileA = path.join(KHRONOS_BASE, "InterGlb", "RefEcho_FileA", "glTF-Binary", "RefEcho_FileA.glb");
        const fileB = path.join(KHRONOS_BASE, "InterGlb", "RefEcho_FileB", "glTF-Binary", "RefEcho_FileB.glb");
        const subsA = loadSubTests(fileA);
        const subsB = loadSubTests(fileB);
        const result = await runAndCollect([fileA, fileB], [subsA.map((s) => s.successResultVarId), subsB.map((s) => s.successResultVarId)], true);
        expect(result.error, `load/bridge failed: ${result.error}`).toBeNull();
        try {
            assertSubTests("InterGlb/RefEcho", [subsA, subsB], result.vars);
        } finally {
            await page.evaluate(evaluateDisposeEngine).catch(() => {});
        }
    });
});
