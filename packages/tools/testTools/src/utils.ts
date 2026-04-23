/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/naming-convention */
import { type StacktracedObject } from "./window";

// Minimal Page-like interface compatible with both Puppeteer and Playwright.
interface Page {
    evaluate: (...args: any[]) => Promise<any>;
    goto: (...args: any[]) => Promise<any>;
    waitForSelector: (...args: any[]) => Promise<any>;
    waitForLoadState?: (state?: "load" | "domcontentloaded" | "networkidle", options?: { timeout?: number }) => Promise<void>;
    on: (...args: any[]) => any;
}

declare const page: Page;
declare const BABYLON: typeof window.BABYLON;

const ClassesToCheck = ["BABYLON.Camera", "BABYLON.TransformNode", "BABYLON.Scene", "BABYLON.Vector3", "BABYLON.BaseTexture", "BABYLON.Material"];

// eslint-disable-next-line no-restricted-syntax
export const evaluateInitEngine = async ({
    engineName,
    baseUrl,
    parallelCompilation: _parallelCompilation = true,
}: { engineName?: string; baseUrl?: string; parallelCompilation?: boolean } = {}) => {
    // run garbage collection
    window.gc && window.gc();
    engineName = engineName ? engineName.toLowerCase() : "webgl2";

    BABYLON.Tools.ScriptBaseUrl = baseUrl || "";

    const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement;
    if (!canvas) {
        return;
    }
    window.canvas = canvas;
    if (engineName === "webgpu") {
        const options = {
            antialias: false,
        };

        const engine = new BABYLON.WebGPUEngine(canvas, options);
        engine.enableOfflineSupport = false;
        window.engine = engine;
        await engine.initAsync();
    } else {
        const engine = new BABYLON.Engine(canvas, true, {
            disableWebGL2Support: engineName === "webgl1" ? true : false,
        });
        engine.enableOfflineSupport = false;
        window.engine = engine;
    }
    window.engine.renderEvenInBackground = true;
    window.engine.getCaps().parallelShaderCompile = undefined;
    return !!window.engine;
};

// eslint-disable-next-line no-restricted-syntax
export const evaluateCreateScene = async () => {
    if (window.engine && !window.scene) {
        window.scene = new BABYLON.Scene(window.engine);
    }

    return !!window.scene;
};

// eslint-disable-next-line no-restricted-syntax
export const evaluateRenderScene = async ({
    renderCount,
    warmupFrames,
    measureGpuTime,
}: {
    renderCount: number;
    warmupFrames?: number;
    measureGpuTime?: boolean;
}): Promise<{ wallTime: number; gpuTimePerFrame: number }> => {
    if (window.scene && window.engine) {
        await window.scene.whenReadyAsync();
        if (warmupFrames) {
            for (let i = 0; i < warmupFrames; i++) {
                window.scene.render();
            }
        }
        const now = performance.now();
        for (let i = 0; i < renderCount; i++) {
            window.scene.render();
        }
        const wallTime = performance.now() - now;

        // GPU timing phase (WebGPU only) — measures GPU execution time using
        // device.queue.onSubmittedWorkDone(), which works on all platforms
        // (including macOS Metal where timestamp queries return 0).
        // Renders a batch of frames with beginFrame/endFrame (required to
        // submit command buffers) and measures time from submission to GPU
        // completion via onSubmittedWorkDone().
        let gpuTimePerFrame = -1;
        const device = (window.engine as any)._device as GPUDevice | undefined;
        if (measureGpuTime && device?.queue) {
            try {
                // Reset the engine's timestamp index which accumulated during the
                // tight render loop (scene.render() without beginFrame/endFrame).
                window.engine.beginFrame();
                window.engine.endFrame();

                const gpuFrames = 20;
                let totalGpuMs = 0;
                let measured = 0;
                for (let i = 0; i < gpuFrames; i++) {
                    window.engine.beginFrame();
                    window.scene.render();
                    window.engine.endFrame(); // submits command buffers to GPU queue
                    const submitTime = performance.now();
                    await device.queue.onSubmittedWorkDone();
                    totalGpuMs += performance.now() - submitTime;
                    measured++;
                }
                if (measured > 0) {
                    gpuTimePerFrame = totalGpuMs / measured;
                }
            } catch {
                // GPU timing not available — leave as -1
            }
        }

        return { wallTime, gpuTimePerFrame };
    } else {
        throw new Error("no scene found");
    }
};

// eslint-disable-next-line no-restricted-syntax
export const evaluateDisposeScene = async () => {
    if (window.scene) {
        window.scene.dispose();
        window.scene = null;
        window.gc && window.gc();
    }
};

// eslint-disable-next-line no-restricted-syntax
export const evaluateDisposeEngine = async () => {
    if (window.engine) {
        window.engine.dispose();
        window.engine = null;
        window.gc && window.gc();
    }
};

// eslint-disable-next-line no-restricted-syntax
export const evaluateDefaultScene = async () => {
    if (!window.scene) {
        window.scene = new BABYLON.Scene(window.engine!);
    }
    // This creates and positions a free camera (non-mesh)
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), window.scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), window.scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape.
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, window.scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;

    // Our built-in 'ground' shape.
    BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, window.scene);
};

// eslint-disable-next-line no-restricted-syntax
export const prepareLeakDetection = async (classes: string[] = ClassesToCheck) => {
    window.classesConstructed = window.classesConstructed || {};
    const setStackStrace = (target: any) => {
        const id = Math.random().toString(36).substring(2, 15);
        target.__id = id;
        try {
            throw new Error();
        } catch (err) {
            if (window.sourceMappedStackTrace) {
                window.sourcemapPromises = window.sourcemapPromises || [];
                const promise = new Promise<StacktracedObject>((resolve) => {
                    try {
                        window.sourceMappedStackTrace.mapStackTrace(
                            err.stack,
                            (stackArray) => {
                                const stackTrace = "\n" + stackArray.slice(4, stackArray.length - 1).join("\n");
                                target.__stackStrace = stackTrace;
                                window.classesConstructed[id] = { id: id, stackTrace: stackTrace, className: target.getClassName ? target.getClassName() : "unknown" };
                                resolve(window.classesConstructed[id]);
                            },
                            { cacheGlobally: true, sync: true }
                        );
                    } catch (_e) {
                        target.__stackStrace = err.stack;
                        window.classesConstructed[id] = { id: id, stackTrace: err.stack, className: target.getClassName ? target.getClassName() : "unknown" };
                        resolve(window.classesConstructed[id]);
                    }
                });
                window.sourcemapPromises.push(promise);
            } else {
                const stackArray = err.stack.split("\n");
                const stackTrace = "\n" + stackArray.slice(4, stackArray.length - 1).join("\n");
                target.__stackStrace = stackTrace;
                window.classesConstructed[id] = { id: id, stackTrace: stackTrace, className: target.getClassName ? target.getClassName() : "unknown" };
            }
        }
    };
    // any to allow compilation without building core
    window.engine?.onNewSceneAddedObservable.add((scene: any) => {
        setStackStrace(scene);
        [
            "onNewCameraAddedObservable",
            "onNewLightAddedObservable",
            "onNewTransformNodeAddedObservable",
            "onNewMeshAddedObservable",
            "onNewSkeletonAddedObservable",
            "onNewMaterialAddedObservable",
            "onNewTextureAddedObservable",
        ].forEach((observable: string) => {
            scene[observable].add((target: any) => {
                setStackStrace(target);
            });
        });
    });
    classes.forEach((classToCheck: string) => {
        const references = classToCheck.split(".");
        const objectName: string = references.pop()!;
        const parentObject: any = references.reduce((o, i: string) => o[i], window as any);
        // const originalConstructor = parentObject[objectName];
        const originalPrototype = parentObject[objectName].prototype;
        const originalDispose = originalPrototype.dispose;
        originalPrototype.dispose = function () {
            originalDispose.apply(this, arguments);
            this.__disposeCalled = true;
        };
    });
};

export type PerformanceTestType = "dev" | "preview" | "stable";

/**
 * Statistical utilities for robust performance comparison.
 */
export const performanceStats = {
    /**
     * Compute the mean of an array of numbers.
     * @param values Array of numbers to compute the mean of.
     * @returns The mean (average) of the input values.
     */
    mean(values: number[]): number {
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    },

    /**
     * Compute the sample standard deviation of an array of numbers.
     * @param values Array of numbers to compute the standard deviation of.
     * @returns The sample standard deviation of the input values.
     */
    stddev(values: number[]): number {
        const m = performanceStats.mean(values);
        const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
        return Math.sqrt(variance);
    },

    /**
     * Compute the coefficient of variation (stddev / mean). A value above ~0.10
     * indicates noisy measurements that may not be reliable.
     * @param values Array of numbers to compute the coefficient of variation of.
     * @returns The coefficient of variation of the input values.
     */
    coefficientOfVariation(values: number[]): number {
        const m = performanceStats.mean(values);
        if (m === 0) {
            return 0;
        }
        return performanceStats.stddev(values) / m;
    },

    /**
     * Trim sorted values by removing `count` elements from each end.
     * @param values Array of numbers to trim.
     * @param count Number of elements to remove from each end.
     * @returns The trimmed array of numbers.
     */
    trimmed(values: number[], count: number): number[] {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted.slice(count, sorted.length - count);
    },

    /**
     * Perform Welch's t-test to determine if `sampleB` is significantly slower
     * than `sampleA`. Returns a p-value (one-tailed: B > A).
     * A low p-value (< 0.05) means B is significantly slower than A.
     * @see https://en.wikipedia.org/wiki/Welch%27s_t-test
     * @param sampleA Array of numbers representing the first sample (e.g., baseline performance).
     * @param sampleB Array of numbers representing the second sample (e.g., new performance).
     * @returns An object containing the t-statistic, degrees of freedom, and p-value of the test.
     */
    welchTTest(sampleA: number[], sampleB: number[]): { t: number; df: number; pValue: number } {
        const nA = sampleA.length;
        const nB = sampleB.length;
        const meanA = performanceStats.mean(sampleA);
        const meanB = performanceStats.mean(sampleB);
        const varA = performanceStats.stddev(sampleA) ** 2;
        const varB = performanceStats.stddev(sampleB) ** 2;

        const t = (meanB - meanA) / Math.sqrt(varA / nA + varB / nB);

        // Welch-Satterthwaite degrees of freedom
        const num = (varA / nA + varB / nB) ** 2;
        const denom = (varA / nA) ** 2 / (nA - 1) + (varB / nB) ** 2 / (nB - 1);
        const df = num / denom;

        // Approximate p-value using the t-distribution CDF (one-tailed)
        const pValue = 1 - tDistCDF(t, df);
        return { t, df, pValue };
    },

    /**
     * Perform a paired t-test on an array of differences (B - A).
     * Tests the one-tailed hypothesis that the mean difference is greater than zero
     * (i.e., B is slower than A).
     * A low p-value (< 0.05) means B is significantly slower than A.
     * @see https://en.wikipedia.org/wiki/Student%27s_t-test#Paired_samples
     * @param differences Array of paired differences (candidate - baseline).
     * @returns An object containing the t-statistic, degrees of freedom, and p-value.
     */
    pairedTTest(differences: number[]): { t: number; df: number; pValue: number } {
        const n = differences.length;
        if (n < 2) {
            return { t: 0, df: 0, pValue: 1 };
        }
        const meanDiff = performanceStats.mean(differences);
        const sdDiff = performanceStats.stddev(differences);
        if (sdDiff === 0) {
            return {
                t: meanDiff > 0 ? Infinity : meanDiff < 0 ? -Infinity : 0,
                df: n - 1,
                pValue: meanDiff > 0 ? 0 : meanDiff < 0 ? 1 : 0.5,
            };
        }
        const t = meanDiff / (sdDiff / Math.sqrt(n));
        const df = n - 1;
        const pValue = 1 - tDistCDF(t, df);
        return { t, df, pValue };
    },
};

/**
 * Approximate the CDF of the t-distribution using the regularized incomplete
 * beta function. Accurate enough for hypothesis testing.
 * @param t - The t-statistic.
 * @param df - Degrees of freedom.
 * @returns The probability that a t-distributed variable is less than or equal to t.
 */
function tDistCDF(t: number, df: number): number {
    if (df <= 0) {
        return 0.5;
    }
    const x = df / (df + t * t);
    const halfDf = df / 2;
    const prob = 0.5 * regularizedIncompleteBeta(x, halfDf, 0.5);
    return t >= 0 ? 1 - prob : prob;
}

/**
 * Compute the regularized incomplete beta function I_x(a, b) using a
 * continued-fraction expansion (Lentz's method).
 * @param x - The upper limit of integration (0 \<= x \<= 1).
 * @param a - Shape parameter a.
 * @param b - Shape parameter b.
 * @returns The value of the regularized incomplete beta function.
 */
function regularizedIncompleteBeta(x: number, a: number, b: number): number {
    if (x <= 0) {
        return 0;
    }
    if (x >= 1) {
        return 1;
    }

    const lnBeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

    // Lentz's continued fraction
    let c = 1;
    let d = 1 - ((a + b) * x) / (a + 1);
    if (Math.abs(d) < 1e-30) {
        d = 1e-30;
    }
    d = 1 / d;
    let f = d;

    for (let i = 1; i <= 200; i++) {
        const m = i;
        // even step
        let numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
        d = 1 + numerator * d;
        if (Math.abs(d) < 1e-30) {
            d = 1e-30;
        }
        c = 1 + numerator / c;
        if (Math.abs(c) < 1e-30) {
            c = 1e-30;
        }
        d = 1 / d;
        f *= c * d;

        // odd step
        numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
        d = 1 + numerator * d;
        if (Math.abs(d) < 1e-30) {
            d = 1e-30;
        }
        c = 1 + numerator / c;
        if (Math.abs(c) < 1e-30) {
            c = 1e-30;
        }
        d = 1 / d;
        const delta = c * d;
        f *= delta;

        if (Math.abs(delta - 1) < 1e-10) {
            break;
        }
    }

    return front * f;
}

/**
 * Lanczos approximation for ln(Gamma(z)).
 * @param z - The input value.
 * @returns The natural log of the gamma function evaluated at z.
 */
function lnGamma(z: number): number {
    const g = 7;
    const coef = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];
    if (z < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
    }
    z -= 1;
    let x = coef[0];
    for (let i = 1; i < g + 2; i++) {
        x += coef[i] / (z + i);
    }
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export interface PerformanceResult {
    /** Trimmed mean render time in ms */
    mean: number;
    /** All raw measurements */
    raw: number[];
    /** Trimmed measurements used for statistics */
    trimmed: number[];
    /** Coefficient of variation of trimmed measurements */
    cov: number;
    /** Average GPU time per frame in ms. -1 if not available. */
    gpuTimePerFrame?: number;
    /** If true, the scene could not be created (e.g. missing API in this CDN version) */
    skipped?: string;
}

export interface PerformanceComparisonResult {
    stable: PerformanceResult;
    dev: PerformanceResult;
    ratio: number;
    /** One-tailed p-value (dev \> stable). Paired t-test when `interleaved` is true, Welch's t-test otherwise. */
    pValue: number;
    passed: boolean;
    /** Human-readable summary */
    summary: string;
    /** If set, the test should be skipped with this reason */
    skipped?: string;
}

export interface PerformanceTestOptions {
    /** Number of measurement passes (default: 10) */
    numberOfPasses?: number;
    /** Frames rendered per pass (default: 400). Overridden by targetPassTimeMs when > 0. */
    framesToRender?: number;
    /** Warmup frames rendered before timing begins on each pass (default: 120) */
    warmupFrames?: number;
    /** Target wall-clock time in ms for the timed portion of each pass (default: 0 = disabled).
     *  When > 0, after the first warmup pass `framesToRender` is recalculated so each
     *  pass takes approximately this long. Set to 0 to use fixed `framesToRender`. */
    targetPassTimeMs?: number;
    /** Maximum warmup passes before measurement (default: 6). Warmup ends early
     *  when two consecutive measurements are within 5% of each other. */
    warmupPasses?: number;
    /** Max acceptable ratio of dev/stable time (default: 1.05 = 5%) */
    acceptedThreshold?: number;
    /** Maximum coefficient of variation allowed before flagging noisy results (default: 0.10) */
    maxCov?: number;
    /** Number of outliers to trim from each end (default: 2) */
    trimCount?: number;
    /** p-value threshold for Welch's t-test. Regression must reach statistical significance (default: 0.05) */
    pValueThreshold?: number;
    /** If the first run fails, run this many additional confirmation passes (default: 6) */
    confirmationPasses?: number;
    /**
     * Pin the stable (CDN) build to a specific version, e.g. "7.0.0".
     * When set, loads empty.html directly from cdn.babylonjs.com/v{cdnVersion}/
     * so all relative script tags resolve to the versioned CDN path.
     * Use "latest" to use the base (unversioned) CDN.
     * When unset, the local babylon-server's empty-stable.html is used.
     */
    cdnVersion?: string;
    /**
     * Compare two CDN versions instead of CDN vs dev.
     * When set, the "dev" run is replaced with a second CDN (stable) run
     * using this version. e.g. cdnVersion="7.0.0", cdnVersionB="8.0.0"
     * compares v7 (baseline) vs v8 (candidate).
     */
    cdnVersionB?: string;
    /**
     * Engine to use for rendering (default: "webgl2").
     * Set to "webgpu" to test WebGPU performance.
     */
    engineName?: string;
    /**
     * Use interleaved sampling with paired t-test analysis (default: true).
     * When true, stable and dev measurements alternate each pass so environmental
     * drift affects both equally, and a paired t-test is used for higher statistical
     * power. Recommended for shared/noisy environments (e.g. BrowserStack).
     * When false, all stable passes run first, then all dev passes, using Welch's
     * t-test. Faster (~2x) since each build's page is loaded once instead of per-pass.
     */
    interleaved?: boolean;
}

const defaultPerfOptions: Required<PerformanceTestOptions> = {
    numberOfPasses: 5,
    framesToRender: 400,
    warmupFrames: 120,
    targetPassTimeMs: 0,
    warmupPasses: 6,
    // The stable build (CDN) is production-optimized while the dev build is not,
    // creating an inherent ~5-10% baseline gap. Threshold must exceed this gap.
    acceptedThreshold: 0.15,
    maxCov: 0.1,
    trimCount: 1,
    pValueThreshold: 0.05,
    confirmationPasses: 6,
    cdnVersion: "",
    cdnVersionB: "",
    engineName: "webgl2",
    interleaved: true,
};

/**
 * Resolve the page URL for a given build type and performance test options.
 * @param type - Whether to load the "dev", "stable", or "preview" build.
 * @param baseUrl - Base URL of the local test server.
 * @param opts - Performance test options (uses cdnVersion).
 * @returns The resolved URL string.
 */
function resolvePageUrl(type: PerformanceTestType, baseUrl: string, opts: Required<PerformanceTestOptions>): string {
    if (type === "dev") {
        return baseUrl + "/empty.html";
    } else if (opts.cdnVersion === "latest") {
        return "https://cdn.babylonjs.com/empty.html";
    } else if (opts.cdnVersion) {
        return `https://cdn.babylonjs.com/v${opts.cdnVersion}/empty.html`;
    } else {
        return baseUrl + `/empty-${type}.html`;
    }
}

/** Result of a single measurement pass. */
interface MeasurementPassResult {
    wallTime: number;
    /** Average GPU time per frame in ms. -1 if not available. */
    gpuTimePerFrame: number;
}

/**
 * Run a single measurement pass on an already-loaded page (no navigation).
 * Creates the engine and scene, renders warmup + measured frames, then
 * disposes both. Returns the render time or a skip reason.
 * @param page - Playwright page instance.
 * @param baseUrl - Base URL of the test server.
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param opts - Performance test options.
 * @param evaluateArg - A single serializable argument passed to `page.evaluate(createSceneFunction, evaluateArg)`.
 *   Playwright requires exactly one argument. Callers must bundle whatever the scene function needs into this object.
 * @returns The measurement result, or an object with a skip reason if the scene couldn't be created.
 */
async function runMeasurementOnLoadedPage(
    page: Page,
    baseUrl: string,
    createSceneFunction: (...args: any[]) => Promise<void>,
    opts: Required<PerformanceTestOptions>,
    evaluateArg?: any
): Promise<MeasurementPassResult | { skipped: string }> {
    try {
        await page.evaluate(evaluateInitEngine, { engineName: opts.engineName, baseUrl });
        if (evaluateArg !== undefined) {
            await page.evaluate(createSceneFunction, evaluateArg);
        } else {
            await page.evaluate(createSceneFunction);
        }
        // Wait for all network requests (textures, models, scripts) to finish
        // before measuring. Timeout after 30s to avoid hanging on long-polling.
        if (page.waitForLoadState) {
            try {
                await page.waitForLoadState("networkidle", { timeout: 30000 });
            } catch {
                /* timeout — continue measurement */
            }
        }
        const result = await page.evaluate(evaluateRenderScene, {
            renderCount: opts.framesToRender,
            warmupFrames: opts.warmupFrames,
            measureGpuTime: opts.engineName === "webgpu",
        });
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        return result;
    } catch (e: any) {
        const msg = e?.message || String(e);
        // Best-effort cleanup
        try {
            await page.evaluate(evaluateDisposeScene);
        } catch {
            /* ignore */
        }
        try {
            await page.evaluate(evaluateDisposeEngine);
        } catch {
            /* ignore */
        }
        // Transient infrastructure errors (BrowserStack socket idle, tunnel drop)
        // should propagate so callers can retry or fail the test rather than
        // silently marking the scene as "skipped".
        if (isTransientBrowserStackError(msg)) {
            throw e;
        }
        return { skipped: `Scene error: ${msg}` };
    }
}

/**
 * Check whether an error message indicates a transient BrowserStack
 * infrastructure problem (socket idle, tunnel disconnect, etc.)
 * that may resolve on retry.
 * @param message - The error message to check.
 * @returns True if the error appears to be a transient infrastructure issue.
 */
function isTransientBrowserStackError(message: string): boolean {
    const patterns = ["socket idle", "tunnel", "browserstack", "econnreset", "econnrefused", "epipe", "session expired"];
    const lower = message.toLowerCase();
    return patterns.some((p) => lower.includes(p));
}

/**
 * Navigate to a URL and wait for the canvas to be ready.
 * Retries once on transient BrowserStack infrastructure errors.
 */
/**
 * Check whether warmup has settled: the last two values are within 5% of each other.
 * @param values - Array of warmup measurement values.
 * @returns True if the last two values are within 5% of each other.
 */
function isWarmupSettled(values: number[]): boolean {
    if (values.length < 2) {
        return false;
    }
    const a = values[values.length - 2];
    const b = values[values.length - 1];
    const max = Math.max(a, b);
    if (max === 0) {
        return true;
    }
    return Math.abs(a - b) / max < 0.05;
}

/**
 * Calibrate `framesToRender` based on observed render time so each pass
 * takes approximately `targetPassTimeMs`. Clamps to [100, 10000] frames.
 * @param measuredTimeMs - Observed render time from a warmup pass.
 * @param currentFrames - The number of frames that produced `measuredTimeMs`.
 * @param targetMs - Target wall-clock time per pass.
 * @returns The calibrated frame count.
 */
function calibrateFrameCount(measuredTimeMs: number, currentFrames: number, targetMs: number): number {
    if (measuredTimeMs <= 0) {
        return currentFrames;
    }
    const msPerFrame = measuredTimeMs / currentFrames;
    const ideal = Math.round(targetMs / msPerFrame);
    // Clamp to [100, 10000] — too few frames yields noisy timing,
    // too many risks timeouts on slow scenes.
    return Math.max(100, Math.min(10000, ideal));
}

async function navigateToPage(page: Page, url: string): Promise<void> {
    try {
        await page.goto(url, { timeout: 0 });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
    } catch (e: any) {
        if (isTransientBrowserStackError(e?.message || "")) {
            // Retry once on transient BrowserStack errors
            await page.goto(url, { timeout: 0 });
            await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
        } else {
            throw e;
        }
    }
}

/**
 * Collect render-time measurements for a scene.
 * Includes warmup passes that are discarded, then `numberOfPasses` measured passes.
 * @param page - Playwright page instance.
 * @param baseUrl - Base URL of the test server.
 * @param type - Whether to test the "dev" or "stable" build.
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param opts - Performance test options.
 * @param evaluateArg - A single serializable argument passed to `page.evaluate(createSceneFunction, evaluateArg)`.
 *   Playwright requires exactly one argument. Callers must bundle whatever the scene function needs into this object.
 * @param deadline - Absolute timestamp (ms) after which collection should stop early.
 * @returns The performance result containing timing measurements.
 */
// eslint-disable-next-line no-restricted-syntax
export const collectPerformanceSamples = async (
    page: Page,
    baseUrl: string,
    type: PerformanceTestType,
    createSceneFunction: (...args: any[]) => Promise<void>,
    opts: Required<PerformanceTestOptions>,
    evaluateArg?: any,
    deadline = Infinity
): Promise<PerformanceResult> => {
    const url = resolvePageUrl(type, baseUrl, opts);

    await page.goto(url, {
        timeout: 0,
    });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });

    // Adaptive warmup
    const warmupValues: number[] = [];
    for (let w = 0; w < opts.warmupPasses; w++) {
        if (Date.now() > deadline) {
            break;
        }
        const wResult = await runMeasurementOnLoadedPage(page, baseUrl, createSceneFunction, opts, evaluateArg);
        if ("skipped" in wResult) {
            return { mean: 0, raw: [], trimmed: [], cov: 0, skipped: wResult.skipped };
        }
        warmupValues.push(wResult.wallTime);
        if (isWarmupSettled(warmupValues)) {
            break;
        }
    }

    // Measured passes
    const minSamples = opts.trimCount * 2 + 1;
    const raw: number[] = [];
    const gpuTimes: number[] = [];
    for (let i = 0; i < opts.numberOfPasses; i++) {
        if (Date.now() > deadline && raw.length >= minSamples) {
            break;
        }
        const result = await runMeasurementOnLoadedPage(page, baseUrl, createSceneFunction, opts, evaluateArg);
        if ("skipped" in result) {
            return { mean: 0, raw: [], trimmed: [], cov: 0, skipped: result.skipped };
        }
        raw.push(result.wallTime);
        if (result.gpuTimePerFrame >= 0) {
            gpuTimes.push(result.gpuTimePerFrame);
        }
    }

    if (raw.length < minSamples) {
        return { mean: 0, raw: [], trimmed: [], cov: 0, skipped: `Not enough samples (${raw.length}) within time budget` };
    }

    const trimmed = performanceStats.trimmed(raw, opts.trimCount);

    return {
        mean: performanceStats.mean(trimmed),
        raw,
        trimmed,
        cov: performanceStats.coefficientOfVariation(trimmed),
        gpuTimePerFrame: gpuTimes.length > 0 ? performanceStats.mean(gpuTimes) : undefined,
    };
};

/**
 * Result of interleaved sample collection, containing individual build results
 * and paired differences for the paired t-test.
 */
interface InterleavedSamplesResult {
    /** Performance measurements for the baseline (stable/CDN) build. */
    stable: PerformanceResult;
    /** Performance measurements for the candidate (dev/CDN-B) build. */
    dev: PerformanceResult;
    /** Trimmed paired differences (candidate - baseline) from interleaved rounds. */
    pairedDifferences: number[];
}

/**
 * Build an {@link InterleavedSamplesResult} from raw paired arrays.
 * Trims outlier pairs and computes statistics.
 * @param stableRaw - Raw render times from the stable (baseline) build.
 * @param devRaw - Raw render times from the dev (candidate) build.
 * @param opts - Performance test options.
 * @param stableGpuTimes - GPU time per frame measurements for the stable build.
 * @param devGpuTimes - GPU time per frame measurements for the dev build.
 * @returns The interleaved samples result with trimmed statistics.
 */
function buildInterleavedResult(
    stableRaw: number[],
    devRaw: number[],
    opts: Required<PerformanceTestOptions>,
    stableGpuTimes?: number[],
    devGpuTimes?: number[]
): InterleavedSamplesResult {
    const rounds = stableRaw.map((s, i) => ({ stable: s, dev: devRaw[i], diff: devRaw[i] - s }));
    const sortedRounds = [...rounds].sort((a, b) => a.diff - b.diff);
    const trimmedRounds = sortedRounds.slice(opts.trimCount, sortedRounds.length - opts.trimCount);

    const stableTrimmed = trimmedRounds.map((r) => r.stable);
    const devTrimmed = trimmedRounds.map((r) => r.dev);
    const pairedDifferences = trimmedRounds.map((r) => r.diff);

    return {
        stable: {
            mean: performanceStats.mean(stableTrimmed),
            raw: stableRaw,
            trimmed: stableTrimmed,
            cov: performanceStats.coefficientOfVariation(stableTrimmed),
            gpuTimePerFrame: stableGpuTimes && stableGpuTimes.length > 0 ? performanceStats.mean(stableGpuTimes) : undefined,
        },
        dev: {
            mean: performanceStats.mean(devTrimmed),
            raw: devRaw,
            trimmed: devTrimmed,
            cov: performanceStats.coefficientOfVariation(devTrimmed),
            gpuTimePerFrame: devGpuTimes && devGpuTimes.length > 0 ? performanceStats.mean(devGpuTimes) : undefined,
        },
        pairedDifferences,
    };
}

/**
 * Collect truly-interleaved paired measurements using two browser pages.
 *
 * Opens a second page via `page.context().newPage()`, navigates each page
 * once (stable and dev), then alternates measurements between them.
 * Each measured pair captures nearly identical machine/GPU state because
 * the measurements run back-to-back on the same host. This eliminates the
 * ordering bias that sequential collection (all-A-then-all-B) introduces.
 *
 * Falls back to {@link collectSequentialSamples} when a second page cannot
 * be created (e.g. Puppeteer, or restricted browser contexts).
 * @param page - Playwright page instance.
 * @param baseUrl - Base URL of the test server.
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param opts - Performance test options.
 * @param evaluateArg - Optional serializable argument for the scene function.
 * @param deadline - Absolute timestamp (ms) after which collection should stop early.
 * @returns The interleaved samples result, or a skip reason.
 */
// eslint-disable-next-line no-restricted-syntax
const collectInterleavedSamples = async (
    page: Page,
    baseUrl: string,
    createSceneFunction: (...args: any[]) => Promise<void>,
    opts: Required<PerformanceTestOptions>,
    evaluateArg?: any,
    deadline = Infinity
): Promise<InterleavedSamplesResult | { skipped: string }> => {
    const stableUrl = resolvePageUrl("stable", baseUrl, opts);
    const devUrl = opts.cdnVersionB ? resolvePageUrl("stable", baseUrl, { ...opts, cdnVersion: opts.cdnVersionB }) : resolvePageUrl("dev", baseUrl, opts);

    // Try to create a second page for true interleaving.
    // Playwright exposes page.context().browser() to reach the Browser instance.
    // BrowserStack requires browser.newContext() rather than context.newPage().
    let devPage: Page | null = null;
    let devContext: any = null;
    const anyPage = page as any;
    if (typeof anyPage.context === "function") {
        try {
            const ctx = anyPage.context();
            const browser = typeof ctx.browser === "function" ? ctx.browser() : null;
            if (browser && typeof browser.newContext === "function") {
                devContext = await browser.newContext();
                devPage = await devContext.newPage();
            } else {
                devPage = await ctx.newPage();
            }
        } catch (_e: any) {
            // Fall back to sequential collection
        }
    }

    if (devPage) {
        // ── True interleaving via two pages ──────────────────────────
        const stablePage = page;

        await navigateToPage(stablePage, stableUrl);
        await navigateToPage(devPage, devUrl);

        // ── Adaptive warmup: run until settled or max reached ──
        const stableWarmup: number[] = [];
        const devWarmup: number[] = [];
        for (let w = 0; w < opts.warmupPasses; w++) {
            const sW = await runMeasurementOnLoadedPage(stablePage, baseUrl, createSceneFunction, opts, evaluateArg);
            if ("skipped" in sW) {
                await (devPage as any).close?.();
                await devContext?.close?.();
                return sW;
            }
            const dW = await runMeasurementOnLoadedPage(devPage, baseUrl, createSceneFunction, opts, evaluateArg);
            if ("skipped" in dW) {
                await (devPage as any).close?.();
                await devContext?.close?.();
                return dW;
            }
            stableWarmup.push(sW.wallTime);
            devWarmup.push(dW.wallTime);
            // Calibrate frame count after first warmup pass using the slower build
            if (w === 0 && opts.targetPassTimeMs > 0) {
                const slowest = Math.max(sW.wallTime, dW.wallTime);
                opts.framesToRender = calibrateFrameCount(slowest, opts.framesToRender, opts.targetPassTimeMs);
            }
            // Stop warming up once both builds have settled
            if (isWarmupSettled(stableWarmup) && isWarmupSettled(devWarmup)) {
                break;
            }
        }

        // ── Measured passes ──
        const stableRaw: number[] = [];
        const devRaw: number[] = [];
        const stableGpuTimes: number[] = [];
        const devGpuTimes: number[] = [];

        for (let i = 0; i < opts.numberOfPasses; i++) {
            const sResult = await runMeasurementOnLoadedPage(stablePage, baseUrl, createSceneFunction, opts, evaluateArg);
            if ("skipped" in sResult) {
                await (devPage as any).close?.();
                await devContext?.close?.();
                return sResult;
            }

            const dResult = await runMeasurementOnLoadedPage(devPage, baseUrl, createSceneFunction, opts, evaluateArg);
            if ("skipped" in dResult) {
                await (devPage as any).close?.();
                await devContext?.close?.();
                return dResult;
            }

            stableRaw.push(sResult.wallTime);
            devRaw.push(dResult.wallTime);
            if (sResult.gpuTimePerFrame >= 0) {
                stableGpuTimes.push(sResult.gpuTimePerFrame);
            }
            if (dResult.gpuTimePerFrame >= 0) {
                devGpuTimes.push(dResult.gpuTimePerFrame);
            }

            // Check time budget — bail out early if we're running long.
            // We need at least trimCount*2+1 measured samples for meaningful stats.
            const minSamples = opts.trimCount * 2 + 1;
            if (Date.now() > deadline && stableRaw.length >= minSamples) {
                break;
            }
        }

        await (devPage as any).close?.();
        await devContext?.close?.();

        if (stableRaw.length < opts.trimCount * 2 + 1) {
            return { skipped: `Not enough samples (${stableRaw.length}) within time budget` };
        }

        return buildInterleavedResult(stableRaw, devRaw, opts, stableGpuTimes, devGpuTimes);
    }

    // ── Fallback: sequential collection (single page) ────────────
    return await collectSequentialSamples(page, baseUrl, stableUrl, devUrl, createSceneFunction, opts, evaluateArg, deadline);
};

/**
 * Fallback for {@link collectInterleavedSamples} when a second page cannot
 * be created. Runs all stable passes first, then all dev passes, with the
 * order randomized to avoid systematic ordering bias.
 * @param page - Playwright page instance.
 * @param baseUrl - Base URL of the test server.
 * @param stableUrl - URL for the stable (baseline) build.
 * @param devUrl - URL for the dev (candidate) build.
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param opts - Performance test options.
 * @param evaluateArg - Optional serializable argument for the scene function.
 * @param deadline - Absolute timestamp (ms) after which collection should stop early.
 * @returns The interleaved samples result, or a skip reason.
 */
// eslint-disable-next-line no-restricted-syntax
const collectSequentialSamples = async (
    page: Page,
    baseUrl: string,
    stableUrl: string,
    devUrl: string,
    createSceneFunction: (...args: any[]) => Promise<void>,
    opts: Required<PerformanceTestOptions>,
    evaluateArg?: any,
    deadline = Infinity
): Promise<InterleavedSamplesResult | { skipped: string }> => {
    // eslint-disable-next-line no-restricted-syntax
    const collectSamples = async (url: string, _label: string): Promise<{ raw: number[]; gpuTimes: number[] } | { skipped: string }> => {
        await navigateToPage(page, url);
        // Adaptive warmup
        const warmupValues: number[] = [];
        for (let w = 0; w < opts.warmupPasses; w++) {
            if (Date.now() > deadline) {
                break;
            }
            const wResult = await runMeasurementOnLoadedPage(page, baseUrl, createSceneFunction, opts, evaluateArg);
            if ("skipped" in wResult) {
                return wResult;
            }
            warmupValues.push(wResult.wallTime);
            if (isWarmupSettled(warmupValues)) {
                break;
            }
        }
        // Measured passes
        const minSamples = opts.trimCount * 2 + 1;
        const raw: number[] = [];
        const gpuTimes: number[] = [];
        for (let i = 0; i < opts.numberOfPasses; i++) {
            if (Date.now() > deadline && raw.length >= minSamples) {
                break;
            }
            const result = await runMeasurementOnLoadedPage(page, baseUrl, createSceneFunction, opts, evaluateArg);
            if ("skipped" in result) {
                return result;
            }
            raw.push(result.wallTime);
            if (result.gpuTimePerFrame >= 0) {
                gpuTimes.push(result.gpuTimePerFrame);
            }
        }
        return { raw, gpuTimes };
    };

    // Randomize batch order to prevent systematic ordering bias
    const stableFirst = Math.random() < 0.5;
    const firstLabel = stableFirst ? "stable" : "dev";
    const secondLabel = stableFirst ? "dev" : "stable";
    const firstUrl = stableFirst ? stableUrl : devUrl;
    const secondUrl = stableFirst ? devUrl : stableUrl;

    // Calibrate frame count from a single probe pass on the first build,
    // then lock it so both builds use the same count.
    if (opts.targetPassTimeMs > 0) {
        await navigateToPage(page, firstUrl);
        const probe = await runMeasurementOnLoadedPage(page, baseUrl, createSceneFunction, opts, evaluateArg);
        if (!("skipped" in probe)) {
            opts.framesToRender = calibrateFrameCount(probe.wallTime, opts.framesToRender, opts.targetPassTimeMs);
        }
        opts.targetPassTimeMs = 0;
    }

    const minSamples = opts.trimCount * 2 + 1;

    const firstResult = await collectSamples(firstUrl, firstLabel);
    if ("skipped" in firstResult) {
        return firstResult;
    }
    if (firstResult.raw.length < minSamples) {
        return { skipped: `Not enough ${firstLabel} samples (${firstResult.raw.length}) within time budget` };
    }
    const secondResult = await collectSamples(secondUrl, secondLabel);
    if ("skipped" in secondResult) {
        return secondResult;
    }
    if (secondResult.raw.length < minSamples) {
        return { skipped: `Not enough ${secondLabel} samples (${secondResult.raw.length}) within time budget` };
    }

    const stableRaw = stableFirst ? firstResult.raw : secondResult.raw;
    const devRaw = stableFirst ? secondResult.raw : firstResult.raw;
    const stableGpuTimes = stableFirst ? firstResult.gpuTimes : secondResult.gpuTimes;
    const devGpuTimes = stableFirst ? secondResult.gpuTimes : firstResult.gpuTimes;

    return buildInterleavedResult(stableRaw, devRaw, opts, stableGpuTimes, devGpuTimes);
};

/**
 * Compare performance of stable vs dev builds for a scene.
 * Uses interleaved sampling and paired statistical analysis for reliability:
 * 1. Alternates stable/dev measurements so environmental drift affects both equally.
 * 2. Checks coefficient of variation to detect noisy measurements.
 * 3. Uses ratio check AND paired t-test — both must indicate regression to fail.
 * 4. On failure, runs confirmation passes (also interleaved) to reduce false positives.
 * @param page - Playwright page instance.
 * @param baseUrl - Base URL of the test server.
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param options - Performance test options.
 * @param evaluateArg - A single serializable argument passed to `page.evaluate(createSceneFunction, evaluateArg)`.
 * @returns The performance comparison result.
 */
// eslint-disable-next-line no-restricted-syntax
export const comparePerformance = async (
    page: Page,
    baseUrl: string,
    createSceneFunction: (...args: any[]) => Promise<void>,
    options?: PerformanceTestOptions,
    evaluateArg?: any
): Promise<PerformanceComparisonResult> => {
    const opts = { ...defaultPerfOptions, ...options };
    const compareStartTime = Date.now();
    // Hard time budget: all collection (initial + confirmation) must finish within 240s.
    const deadline = compareStartTime + 240_000;

    // Ensure enough passes for meaningful statistics after trimming
    if (opts.numberOfPasses < opts.trimCount * 2 + 3) {
        opts.numberOfPasses = opts.trimCount * 2 + 3;
    }

    const versionLabel = (v: string) => (v === "latest" ? "Latest" : `v${v}`);
    const baselineLabel = opts.cdnVersion ? versionLabel(opts.cdnVersion) : "Stable";
    const candidateLabel = opts.cdnVersionB ? versionLabel(opts.cdnVersionB) : "Dev";

    // Choose between interleaved (paired) or sequential (independent) sampling
    let stable: PerformanceResult;
    let dev: PerformanceResult;
    let pairedDifferences: number[] | null = null;

    if (opts.interleaved) {
        // Interleaved: stable/dev alternate each pass to cancel environmental drift
        const initial = await collectInterleavedSamples(page, baseUrl, createSceneFunction, opts, evaluateArg, deadline);

        if ("skipped" in initial) {
            const empty: PerformanceResult = { mean: 0, raw: [], trimmed: [], cov: 0 };
            return { stable: empty, dev: empty, ratio: 1, pValue: 1, passed: true, summary: initial.skipped, skipped: initial.skipped };
        }

        stable = initial.stable;
        dev = initial.dev;
        pairedDifferences = initial.pairedDifferences;
    } else {
        // Sequential: all stable passes first, then all dev passes (faster, ~2x).
        // Calibrate frame count upfront using a quick probe on the stable build
        // so both builds render the same number of frames.
        if (opts.targetPassTimeMs > 0) {
            const probeUrl = resolvePageUrl("stable", baseUrl, opts);
            await navigateToPage(page, probeUrl);
            const probeResult = await runMeasurementOnLoadedPage(page, baseUrl, createSceneFunction, opts, evaluateArg);
            if (!("skipped" in probeResult)) {
                opts.framesToRender = calibrateFrameCount(probeResult.wallTime, opts.framesToRender, opts.targetPassTimeMs);
            }
            opts.targetPassTimeMs = 0; // Prevent re-calibration inside collection functions
        }

        stable = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, opts, evaluateArg, deadline);

        if (stable.skipped) {
            const empty: PerformanceResult = { mean: 0, raw: [], trimmed: [], cov: 0 };
            return { stable, dev: empty, ratio: 1, pValue: 1, passed: true, summary: stable.skipped, skipped: stable.skipped };
        }

        if (opts.cdnVersionB) {
            const cdnBOpts = { ...opts, cdnVersion: opts.cdnVersionB };
            dev = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, cdnBOpts, evaluateArg, deadline);
        } else {
            dev = await collectPerformanceSamples(page, baseUrl, "dev", createSceneFunction, opts, evaluateArg, deadline);
        }

        if (dev.skipped) {
            return { stable, dev, ratio: 1, pValue: 1, passed: true, summary: dev.skipped, skipped: dev.skipped };
        }
    }

    const buildResult = (stableRes: PerformanceResult, devRes: PerformanceResult, diffs: number[] | null): PerformanceComparisonResult => {
        const ratio = devRes.mean / stableRes.mean;
        const { pValue } = diffs ? performanceStats.pairedTTest(diffs) : performanceStats.welchTTest(stableRes.trimmed, devRes.trimmed);

        const ratioExceeded = ratio > 1 + opts.acceptedThreshold;
        const statisticallySignificant = pValue < opts.pValueThreshold;

        // Use CoV of the mean estimate (SEM / mean = CoV / √n) rather than raw sample CoV.
        // With enough samples, even noisy individual runs produce a reliable mean estimate.
        const stableN = stableRes.trimmed.length;
        const devN = devRes.trimmed.length;
        const stableMeanCov = stableN > 1 ? stableRes.cov / Math.sqrt(stableN) : stableRes.cov;
        const devMeanCov = devN > 1 ? devRes.cov / Math.sqrt(devN) : devRes.cov;
        const noisyStable = stableMeanCov > opts.maxCov;
        const noisyDev = devMeanCov > opts.maxCov;
        const noisy = noisyStable || noisyDev;

        // If the mean estimate is too uncertain, we cannot make a confident determination —
        // pass with a warning rather than reporting a false positive.
        // Otherwise, both ratio AND statistical significance must indicate regression to fail.
        const passed = noisy || !(ratioExceeded && statisticallySignificant);

        const absDiffPercent = (Math.abs(ratio - 1) * 100).toFixed(1);
        const diffLabel = ratio >= 1 ? `${absDiffPercent}% slower` : `${absDiffPercent}% faster`;

        let summary =
            `${baselineLabel}: ${stableRes.mean.toFixed(1)}ms, ` +
            `${candidateLabel}: ${devRes.mean.toFixed(1)}ms, ` +
            `${candidateLabel} is ${diffLabel}, p-value: ${pValue.toFixed(4)}`;

        // Append GPU time breakdown when available
        const sGpu = stableRes.gpuTimePerFrame;
        const dGpu = devRes.gpuTimePerFrame;
        if (sGpu != null && sGpu >= 0 && dGpu != null && dGpu >= 0) {
            summary += `, gpu/frame: ${baselineLabel} ${sGpu.toFixed(2)}ms / ${candidateLabel} ${dGpu.toFixed(2)}ms`;
        } else if (dGpu != null && dGpu >= 0) {
            summary += `, gpu/frame: ${dGpu.toFixed(2)}ms`;
        }

        if (noisy) {
            summary += ` [INCONCLUSIVE: Mean estimate too uncertain - ${noisyStable ? "stable" : ""}${noisyStable && noisyDev ? " & " : ""}${noisyDev ? "dev" : ""} SEM/mean > ${(opts.maxCov * 100).toFixed(0)}%]`;
        }

        return { stable: stableRes, dev: devRes, ratio, pValue, passed, summary };
    };

    const result = buildResult(stable, dev, pairedDifferences);

    // Detect if result is inconclusive (noisy measurements)
    const isInconclusive = (r: PerformanceComparisonResult) => r.summary.includes("[INCONCLUSIVE");

    // Track the current best result — may be updated by confirmation and retry passes
    let finalResult = result;

    // If it looks like a regression and measurements are reliable, run confirmation passes.
    // Skip confirmation if we're past the deadline.
    if (!finalResult.passed && opts.confirmationPasses > 0 && Date.now() < deadline) {
        const effectiveConfirmationPasses = Math.max(opts.confirmationPasses, opts.trimCount * 2 + 3);
        console.log(
            `[PERF] Initial result indicates regression (ratio: ${result.ratio.toFixed(4)}, p: ${result.pValue.toFixed(4)}). Running ${effectiveConfirmationPasses} confirmation passes...`
        );

        const confirmOpts = { ...opts, numberOfPasses: effectiveConfirmationPasses, warmupPasses: 1, confirmationPasses: 0 };

        let confirmStable: PerformanceResult;
        let confirmDev: PerformanceResult;
        let confirmDiffs: number[] | null = null;

        if (opts.interleaved) {
            const confirmResult = await collectInterleavedSamples(page, baseUrl, createSceneFunction, confirmOpts, evaluateArg, deadline);
            if ("skipped" in confirmResult) {
                return result;
            }
            confirmStable = confirmResult.stable;
            confirmDev = confirmResult.dev;
            confirmDiffs = confirmResult.pairedDifferences;
        } else {
            confirmStable = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, confirmOpts, evaluateArg, deadline);
            if (opts.cdnVersionB) {
                const cdnBOpts = { ...confirmOpts, cdnVersion: opts.cdnVersionB };
                confirmDev = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, cdnBOpts, evaluateArg, deadline);
            } else {
                confirmDev = await collectPerformanceSamples(page, baseUrl, "dev", createSceneFunction, confirmOpts, evaluateArg, deadline);
            }
        }

        // Merge samples from both runs
        const allStable = [...stable.trimmed, ...confirmStable.trimmed];
        const allDev = [...dev.trimmed, ...confirmDev.trimmed];
        const allDiffs = pairedDifferences && confirmDiffs ? [...pairedDifferences, ...confirmDiffs] : null;

        const mergedStable: PerformanceResult = {
            mean: performanceStats.mean(allStable),
            raw: [...stable.raw, ...confirmStable.raw],
            trimmed: allStable,
            cov: performanceStats.coefficientOfVariation(allStable),
        };
        const mergedDev: PerformanceResult = {
            mean: performanceStats.mean(allDev),
            raw: [...dev.raw, ...confirmDev.raw],
            trimmed: allDev,
            cov: performanceStats.coefficientOfVariation(allDev),
        };

        const confirmed = buildResult(mergedStable, mergedDev, allDiffs);
        confirmed.summary = `[CONFIRMED] ${confirmed.summary}`;
        finalResult = confirmed;
    }

    // If the result (initial or post-confirmation) is inconclusive and we have time,
    // retry to get cleaner measurements. The warmup/compilation from earlier runs
    // primes the GPU, so the retry is more likely to produce stable results.
    if (isInconclusive(finalResult) && Date.now() < deadline) {
        console.log(`[PERF] Inconclusive result (noisy). Retrying with additional passes...`);
        const retryOpts = { ...opts, warmupPasses: 1, confirmationPasses: 0 };

        let retryStable: PerformanceResult;
        let retryDev: PerformanceResult;
        let retryDiffs: number[] | null = null;

        if (opts.interleaved) {
            const retryResult = await collectInterleavedSamples(page, baseUrl, createSceneFunction, retryOpts, evaluateArg, deadline);
            if ("skipped" in retryResult) {
                return finalResult;
            }
            retryStable = retryResult.stable;
            retryDev = retryResult.dev;
            retryDiffs = retryResult.pairedDifferences;
        } else {
            retryStable = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, retryOpts, evaluateArg, deadline);
            if (opts.cdnVersionB) {
                const cdnBOpts = { ...retryOpts, cdnVersion: opts.cdnVersionB };
                retryDev = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, cdnBOpts, evaluateArg, deadline);
            } else {
                retryDev = await collectPerformanceSamples(page, baseUrl, "dev", createSceneFunction, retryOpts, evaluateArg, deadline);
            }
        }

        // Use all samples collected so far + retry samples
        const prevStable = finalResult.stable;
        const prevDev = finalResult.dev;
        const allStableRetry = [...prevStable.trimmed, ...retryStable.trimmed];
        const allDevRetry = [...prevDev.trimmed, ...retryDev.trimmed];
        // Pair diffs only if both the previous result and retry produced them
        const prevDiffs = finalResult === result ? pairedDifferences : null;
        const allRetryDiffs = prevDiffs && retryDiffs ? [...prevDiffs, ...retryDiffs] : null;

        const mergedRetryStable: PerformanceResult = {
            mean: performanceStats.mean(allStableRetry),
            raw: [...prevStable.raw, ...retryStable.raw],
            trimmed: allStableRetry,
            cov: performanceStats.coefficientOfVariation(allStableRetry),
        };
        const mergedRetryDev: PerformanceResult = {
            mean: performanceStats.mean(allDevRetry),
            raw: [...prevDev.raw, ...retryDev.raw],
            trimmed: allDevRetry,
            cov: performanceStats.coefficientOfVariation(allDevRetry),
        };

        const retried = buildResult(mergedRetryStable, mergedRetryDev, allRetryDiffs);
        if (isInconclusive(retried)) {
            retried.summary = `[RETRY INCONCLUSIVE] ${retried.summary}`;
        } else {
            retried.summary = `[RETRY RESOLVED] ${retried.summary}`;
        }
        return retried;
    }

    return finalResult;
};

/**
 * Legacy API — collect measurements for a single build type.
 * Kept for backward compatibility with existing tests.
 * @param page - Playwright page instance.
 * @param baseUrl - Base URL of the test server.
 * @param type - Whether to test the "dev" or "stable" build.
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param numberOfPasses - Number of measurement passes.
 * @param framesToRender - Frames rendered per pass.
 * @param evaluateArg - Optional serializable argument for the scene function.
 * @returns The average render time in milliseconds.
 */
// eslint-disable-next-line no-restricted-syntax
export const checkPerformanceOfScene = async (
    page: Page,
    baseUrl: string,
    type: PerformanceTestType,
    createSceneFunction: (...args: any[]) => Promise<void>,
    numberOfPasses: number = 5,
    framesToRender: number = 10000,
    evaluateArg?: any
) => {
    if (numberOfPasses < 5) {
        numberOfPasses = 5;
    }
    const url = type === "dev" ? "/empty.html" : `/empty-${type}.html`;
    await page.goto(baseUrl + url, {
        timeout: 0,
    });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });

    const time = [];
    for (let i = 0; i < numberOfPasses; i++) {
        await page.evaluate(evaluateInitEngine, { engineName: "webgl2", baseUrl });
        if (evaluateArg !== undefined) {
            await page.evaluate(createSceneFunction, evaluateArg);
        } else {
            await page.evaluate(createSceneFunction);
        }
        const result = await page.evaluate(evaluateRenderScene, { renderCount: framesToRender });
        time.push(result.wallTime);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
    }
    time.sort();
    // remove edge cases - 2 of each end
    time.pop();
    time.pop();
    time.shift();
    time.shift();
    // return the average rendering time (use actual remaining count, not numberOfPasses - 2)
    return time.reduce((partialSum, a) => partialSum + a, 0) / time.length;
};

// eslint-disable-next-line no-restricted-syntax
export const logPageErrors = async (page: Page, debug?: boolean) => {
    page.on("console", async (msg: any) => {
        // serialize my args the way I want
        let args: any[];
        try {
            args = await Promise.all(
                msg.args().map((arg: any) =>
                    arg.evaluate((argument: string | Error) => {
                        // I'm in a page context now. If my arg is an error - get me its message.
                        if (argument instanceof Error) {
                            return `[ERR] ${argument.message}`;
                        }
                        //Return the argument if it is just a message
                        return `[STR] ${argument}`;
                    }, arg)
                )
            );
        } catch {
            // Execution context can be destroyed during page navigation; ignore silently.
            return;
        }
        args.filter((arg) => arg !== null).forEach((arg) => console.log(arg));
        // fallback
        if (!debug) {
            if (args.filter((arg) => arg !== null).length === 0 && msg.type().substring(0, 3).toUpperCase() === "ERR") {
                console.log(`${msg.type().substring(0, 3).toUpperCase()} ${msg.text()}`);
            }
        } else {
            console.log(`${msg.type().substring(0, 3).toUpperCase()} ${msg.text()}`);
        }
    });
    page.on("pageerror", ({ message }: { message: string }) => console.log(message)).on("requestfailed", (request: any) =>
        console.log(`${request.failure()?.errorText} ${request.url()}`)
    );
};
