/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/naming-convention */
import { type StacktracedObject } from "./window";

// Minimal Page-like interface compatible with both Puppeteer and Playwright.
interface Page {
    evaluate: (...args: any[]) => Promise<any>;
    goto: (...args: any[]) => Promise<any>;
    waitForSelector: (...args: any[]) => Promise<any>;
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
export const evaluateRenderScene = async (renderCount = 1) => {
    if (window.scene && window.engine) {
        const now = performance.now();
        for (let i = 0; i < renderCount; i++) {
            window.scene.render();
        }
        return performance.now() - now;
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
    /** Frames rendered per pass (default: 2500) */
    framesToRender?: number;
    /** Number of warmup passes before measurement (default: 2) */
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
    numberOfPasses: 10,
    framesToRender: 2500,
    warmupPasses: 2,
    // The stable build (CDN) is production-optimized while the dev build is not,
    // creating an inherent ~5-10% baseline gap. Threshold must exceed this gap.
    acceptedThreshold: 0.15,
    maxCov: 0.1,
    trimCount: 2,
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

/**
 * Run a single measurement pass: navigate to the URL, init engine, create scene,
 * render frames, dispose, and return the render time.
 * @param page - Playwright page instance.
 * @param url - The page URL to navigate to.
 * @param baseUrl - Base URL of the test server (passed to engine init).
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param opts - Performance test options.
 * @param evaluateArg - Optional serializable argument for the scene function.
 * @returns The render time in ms, or `{ skipped: string }` if the API is incompatible.
 */
async function runSinglePass(
    page: Page,
    url: string,
    baseUrl: string,
    createSceneFunction: (...args: any[]) => Promise<void>,
    opts: Required<PerformanceTestOptions>,
    evaluateArg?: any
): Promise<number | { skipped: string }> {
    await page.goto(url, { timeout: 0 });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
    await page.evaluate(evaluateInitEngine, { engineName: opts.engineName, baseUrl });
    try {
        if (evaluateArg !== undefined) {
            await page.evaluate(createSceneFunction, evaluateArg);
        } else {
            await page.evaluate(createSceneFunction);
        }
    } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg.includes("is not a constructor") || msg.includes("is not defined") || msg.includes("is not a function") || msg.includes("Cannot read properties of undefined")) {
            await page.evaluate(evaluateDisposeScene);
            await page.evaluate(evaluateDisposeEngine);
            return { skipped: `Incompatible API: ${msg}` };
        }
        throw e;
    }
    const time = await page.evaluate(evaluateRenderScene, opts.framesToRender);
    await page.evaluate(evaluateDisposeScene);
    await page.evaluate(evaluateDisposeEngine);
    return time;
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
 * @returns The performance result containing timing measurements.
 */
// eslint-disable-next-line no-restricted-syntax
export const collectPerformanceSamples = async (
    page: Page,
    baseUrl: string,
    type: PerformanceTestType,
    createSceneFunction: (...args: any[]) => Promise<void>,
    opts: Required<PerformanceTestOptions>,
    evaluateArg?: any
): Promise<PerformanceResult> => {
    const url = resolvePageUrl(type, baseUrl, opts);

    await page.goto(url, {
        timeout: 0,
    });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });

    const raw: number[] = [];
    const totalPasses = opts.warmupPasses + opts.numberOfPasses;

    for (let i = 0; i < totalPasses; i++) {
        await page.evaluate(evaluateInitEngine, { engineName: opts.engineName, baseUrl });
        try {
            if (evaluateArg !== undefined) {
                await page.evaluate(createSceneFunction, evaluateArg);
            } else {
                await page.evaluate(createSceneFunction);
            }
        } catch (e: any) {
            const msg = e?.message || String(e);
            // Detect errors caused by APIs missing in this CDN version
            if (
                msg.includes("is not a constructor") ||
                msg.includes("is not defined") ||
                msg.includes("is not a function") ||
                msg.includes("Cannot read properties of undefined")
            ) {
                await page.evaluate(evaluateDisposeScene);
                await page.evaluate(evaluateDisposeEngine);
                return {
                    mean: 0,
                    raw: [],
                    trimmed: [],
                    cov: 0,
                    skipped: `Incompatible API: ${msg}`,
                };
            }
            throw e;
        }
        const time = await page.evaluate(evaluateRenderScene, opts.framesToRender);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);

        // Discard warmup passes
        if (i >= opts.warmupPasses) {
            raw.push(time);
        }
    }

    const trimmed = performanceStats.trimmed(raw, opts.trimCount);

    return {
        mean: performanceStats.mean(trimmed),
        raw,
        trimmed,
        cov: performanceStats.coefficientOfVariation(trimmed),
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
 * Collect interleaved render-time measurements for two builds.
 * Alternates between stable and dev on each pass so that environmental drift
 * (thermal throttling, noisy neighbors, GC pressure) affects both equally.
 * Even-numbered passes run stable first; odd-numbered passes run dev first
 * to cancel any ordering bias within a pair.
 * @param page - Playwright page instance.
 * @param baseUrl - Base URL of the test server.
 * @param createSceneFunction - Function evaluated in the page to create the scene.
 * @param opts - Performance test options.
 * @param evaluateArg - Optional serializable argument for the scene function.
 * @returns Interleaved results with paired differences, or `{ skipped }` if an API is incompatible.
 */
// eslint-disable-next-line no-restricted-syntax
const collectInterleavedSamples = async (
    page: Page,
    baseUrl: string,
    createSceneFunction: (...args: any[]) => Promise<void>,
    opts: Required<PerformanceTestOptions>,
    evaluateArg?: any
): Promise<InterleavedSamplesResult | { skipped: string }> => {
    const stableUrl = resolvePageUrl("stable", baseUrl, opts);
    const devUrl = opts.cdnVersionB ? resolvePageUrl("stable", baseUrl, { ...opts, cdnVersion: opts.cdnVersionB }) : resolvePageUrl("dev", baseUrl, opts);

    const rounds: { stable: number; dev: number; diff: number }[] = [];
    const totalPasses = opts.warmupPasses + opts.numberOfPasses;

    for (let i = 0; i < totalPasses; i++) {
        const isWarmup = i < opts.warmupPasses;
        // Alternate which build runs first to cancel ordering bias
        const stableFirst = i % 2 === 0;

        let stableTime: number;
        let devTime: number;

        if (stableFirst) {
            const s = await runSinglePass(page, stableUrl, baseUrl, createSceneFunction, opts, evaluateArg);
            if (typeof s !== "number") {
                return s;
            }
            const d = await runSinglePass(page, devUrl, baseUrl, createSceneFunction, opts, evaluateArg);
            if (typeof d !== "number") {
                return d;
            }
            stableTime = s;
            devTime = d;
        } else {
            const d = await runSinglePass(page, devUrl, baseUrl, createSceneFunction, opts, evaluateArg);
            if (typeof d !== "number") {
                return d;
            }
            const s = await runSinglePass(page, stableUrl, baseUrl, createSceneFunction, opts, evaluateArg);
            if (typeof s !== "number") {
                return s;
            }
            stableTime = s;
            devTime = d;
        }

        if (!isWarmup) {
            rounds.push({ stable: stableTime, dev: devTime, diff: devTime - stableTime });
        }
    }

    // Trim at the pair level: sort rounds by diff magnitude and drop outliers
    // from both ends. This keeps stable, dev, and diff arrays aligned.
    const sortedRounds = [...rounds].sort((a, b) => a.diff - b.diff);
    const trimmedRounds = sortedRounds.slice(opts.trimCount, sortedRounds.length - opts.trimCount);

    const stableRaw = rounds.map((r) => r.stable);
    const devRaw = rounds.map((r) => r.dev);
    const stableTrimmed = trimmedRounds.map((r) => r.stable);
    const devTrimmed = trimmedRounds.map((r) => r.dev);
    const pairedDifferences = trimmedRounds.map((r) => r.diff);

    return {
        stable: {
            mean: performanceStats.mean(stableTrimmed),
            raw: stableRaw,
            trimmed: stableTrimmed,
            cov: performanceStats.coefficientOfVariation(stableTrimmed),
        },
        dev: {
            mean: performanceStats.mean(devTrimmed),
            raw: devRaw,
            trimmed: devTrimmed,
            cov: performanceStats.coefficientOfVariation(devTrimmed),
        },
        pairedDifferences,
    };
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
        const initial = await collectInterleavedSamples(page, baseUrl, createSceneFunction, opts, evaluateArg);

        if ("skipped" in initial) {
            const empty: PerformanceResult = { mean: 0, raw: [], trimmed: [], cov: 0 };
            return { stable: empty, dev: empty, ratio: 1, pValue: 1, passed: true, summary: initial.skipped, skipped: initial.skipped };
        }

        stable = initial.stable;
        dev = initial.dev;
        pairedDifferences = initial.pairedDifferences;
    } else {
        // Sequential: all stable passes first, then all dev passes (faster, ~2x)
        stable = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, opts, evaluateArg);

        if (stable.skipped) {
            const empty: PerformanceResult = { mean: 0, raw: [], trimmed: [], cov: 0 };
            return { stable, dev: empty, ratio: 1, pValue: 1, passed: true, summary: stable.skipped, skipped: stable.skipped };
        }

        if (opts.cdnVersionB) {
            const cdnBOpts = { ...opts, cdnVersion: opts.cdnVersionB };
            dev = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, cdnBOpts, evaluateArg);
        } else {
            dev = await collectPerformanceSamples(page, baseUrl, "dev", createSceneFunction, opts, evaluateArg);
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

        const noisyStable = stableRes.cov > opts.maxCov;
        const noisyDev = devRes.cov > opts.maxCov;
        const noisy = noisyStable || noisyDev;

        // If measurements are noisy, we cannot make a confident determination —
        // pass with a warning rather than reporting a false positive.
        // Otherwise, both ratio AND statistical significance must indicate regression to fail.
        const passed = noisy || !(ratioExceeded && statisticallySignificant);

        const absDiffPercent = (Math.abs(ratio - 1) * 100).toFixed(1);
        const diffLabel = ratio >= 1 ? `${absDiffPercent}% slower` : `${absDiffPercent}% faster`;

        let summary =
            `${baselineLabel}: ${stableRes.mean.toFixed(1)}ms, ` +
            `${candidateLabel}: ${devRes.mean.toFixed(1)}ms, ` +
            `${candidateLabel} is ${diffLabel}, p-value: ${pValue.toFixed(4)}`;

        if (noisy) {
            summary += ` [INCONCLUSIVE: Noisy measurements - ${noisyStable ? "stable" : ""}${noisyStable && noisyDev ? " & " : ""}${noisyDev ? "dev" : ""} CoV > ${(opts.maxCov * 100).toFixed(0)}%]`;
        }

        return { stable: stableRes, dev: devRes, ratio, pValue, passed, summary };
    };

    const result = buildResult(stable, dev, pairedDifferences);

    // If it looks like a regression and measurements are reliable, run confirmation passes
    if (!result.passed && opts.confirmationPasses > 0) {
        const effectiveConfirmationPasses = Math.max(opts.confirmationPasses, opts.trimCount * 2 + 3);
        console.log(
            `[PERF] Initial result indicates regression (ratio: ${result.ratio.toFixed(4)}, p: ${result.pValue.toFixed(4)}). Running ${effectiveConfirmationPasses} confirmation passes...`
        );

        const confirmOpts = { ...opts, numberOfPasses: effectiveConfirmationPasses, warmupPasses: 1, confirmationPasses: 0 };

        let confirmStable: PerformanceResult;
        let confirmDev: PerformanceResult;
        let confirmDiffs: number[] | null = null;

        if (opts.interleaved) {
            const confirmResult = await collectInterleavedSamples(page, baseUrl, createSceneFunction, confirmOpts, evaluateArg);
            if ("skipped" in confirmResult) {
                return result;
            }
            confirmStable = confirmResult.stable;
            confirmDev = confirmResult.dev;
            confirmDiffs = confirmResult.pairedDifferences;
        } else {
            confirmStable = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, confirmOpts, evaluateArg);
            if (opts.cdnVersionB) {
                const cdnBOpts = { ...confirmOpts, cdnVersion: opts.cdnVersionB };
                confirmDev = await collectPerformanceSamples(page, baseUrl, "stable", createSceneFunction, cdnBOpts, evaluateArg);
            } else {
                confirmDev = await collectPerformanceSamples(page, baseUrl, "dev", createSceneFunction, confirmOpts, evaluateArg);
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
        return confirmed;
    }

    return result;
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
        time.push(await page.evaluate(evaluateRenderScene, framesToRender));
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
