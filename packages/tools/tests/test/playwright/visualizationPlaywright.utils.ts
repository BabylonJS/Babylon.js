import * as path from "path";
import * as fs from "fs";

import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { FetchSnippet, ParseSnippetResponse, CreateTypeScriptTranspiler, type IPlaygroundSnippetResult } from "@tools/snippet-loader";
import * as ts from "typescript";

// Reusable TypeScript transpiler for TS→JS conversion on the Node side
const tsTranspile = CreateTypeScriptTranspiler(ts);

/**
 * Strips ES module syntax (import/export) from code so it can be eval'd
 * in a browser context where BABYLON is available as a UMD global.
 */
function stripModuleSyntax(code: string): string {
    return (
        code
            // import ... from '...' (handles multi-line imports where { } spans multiple lines)
            .replace(/^\s*import\b[\s\S]*?\bfrom\s+['"][^'"]*['"]\s*;?\s*$/gm, "")
            // Side-effect imports: import '...'
            .replace(/^\s*import\s+['"][^'"]*['"]\s*;?\s*$/gm, "")
            // export default <identifier>;
            .replace(/^\s*export\s+default\s+\w+\s*;?\s*$/gm, "")
            // export default before function/class → keep the declaration
            .replace(/^\s*export\s+default\s+(?=(?:async\s+)?function\b|class\b)/gm, "")
            // export before declarations → keep the declaration
            .replace(/^\s*export\s+(?=const\b|let\b|var\b|(?:async\s+)?function\b|class\b)/gm, "")
            // export { ... } [from '...']
            .replace(/^\s*export\s*\{[^}]*\}(?:\s*from\s*['"][^'"]*['"])?\s*;?\s*$/gm, "")
            // export * from '...'
            .replace(/^\s*export\s*\*\s*(?:from\s*['"][^'"]*['"])?\s*;?\s*$/gm, "")
    );
}

/**
 * Detects the scene entry function call expression from code content.
 * Mirrors the snippet loader's detection logic for eval-based execution.
 */
function detectSceneCall(code: string): string {
    // Playground class pattern: class Playground { static CreateScene(...) { } }
    if (/class\s+Playground\b/.test(code) && /\bCreateScene\b/.test(code)) {
        return "Playground.CreateScene(engine, canvas)";
    }
    if (/\bdelayCreateScene\b/.test(code)) return "delayCreateScene(engine)";
    if (/\bdelayLoadScene\b/.test(code)) return "delayLoadScene(engine)";
    // Check for CreateScene (capital C) only if there's no lowercase createScene
    if (/\bCreateScene\b/.test(code) && !/\bcreateScene\b/.test(code)) return "CreateScene(engine)";
    return "createScene(engine)";
}

interface PreloadedSnippet {
    code: string;
    sceneCall: string;
}

/**
 * Pre-fetches and parses a playground snippet on the Node side using the snippet loader.
 * Returns eval-ready code with module syntax stripped, suitable for direct evaluation
 * in the browser context where BABYLON is available as a UMD global.
 *
 * @param playgroundId - The playground snippet ID (e.g. "#ABC123#1").
 * @param snippetUrl - The snippet server URL.
 * @returns The eval-ready code and the scene function call expression.
 */
async function preloadSnippetCode(playgroundId: string, snippetUrl: string): Promise<PreloadedSnippet> {
    // Normalize playground ID format
    if (playgroundId[0] !== "#" || playgroundId.indexOf("#", 1) === -1) {
        playgroundId += "#0";
    }

    const response = await FetchSnippet(playgroundId, snippetUrl);
    const result = await ParseSnippetResponse(response, playgroundId, {
        moduleFormat: "esm",
        // Only transpile TS files; pass JS through unchanged to avoid unnecessary overhead
        transpile: (source, fileName) => (/\.tsx?$/i.test(fileName) ? tsTranspile(source, fileName) : source),
    });

    if (result.type !== "playground") {
        throw new Error(`Snippet ${playgroundId} is not a playground snippet (got type: "${result.type}")`);
    }

    const pgResult = result as IPlaygroundSnippetResult;

    // Use jsFiles which contains properly transpiled JS (TS→JS done, ESM syntax preserved)
    const entryName = pgResult.manifest?.entry?.replace(/\.tsx?$/i, ".js") ?? "index.js";
    let code = pgResult.jsFiles[entryName] ?? pgResult.executedCode;

    // Strip module syntax for eval execution in the browser
    code = stripModuleSyntax(code);

    return { code, sceneCall: detectSceneCall(code) };
}

export const evaluatePlaywrightVisTests = async (
    engineType = "webgl2",
    testFileName = "config",
    debug = false,
    debugWait = false,
    logToConsole = true,
    logToFile = false,
    optionalStateChanges?: {
        beforeScene?: (page: Page) => Promise<void>;
        beforeRender?: (page: Page) => Promise<void>;
    },
    dimensions?: { width?: number; height?: number }
) => {
    debug = process.env.DEBUG === "true" || debug;

    const timeout = process.env.TIMEOUT ? +process.env.TIMEOUT : 100000;

    if (process.env.TEST_FILENAME) {
        testFileName = process.env.TEST_FILENAME;
    }

    if (process.env.LOG_TO_CONSOLE) {
        logToConsole = process.env.LOG_TO_CONSOLE === "true";
    }

    const configPath = process.env.CONFIG_PATH || path.resolve(__dirname, "../visualization", testFileName + ".json");
    // load the config
    const rawJsonData = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(rawJsonData.replace(/^\uFEFF/, ""));

    const logPath = path.resolve(__dirname, `${testFileName}_${engineType}_log.txt`);

    const excludeRegexArray = process.env.EXCLUDE_REGEX_ARRAY ? process.env.EXCLUDE_REGEX_ARRAY.split(",") : [];

    const tests: any[] = config.tests.filter((test: any) => {
        const externallyExcluded = excludeRegexArray.some((regex) => {
            const re = new RegExp(regex, "i");
            return re.test(test.title);
        });
        return !(externallyExcluded || test.excludeFromAutomaticTesting || (test.excludedEngines && test.excludedEngines.includes(engineType)));
    });

    function log(msg: any, title?: string) {
        const titleToLog = title ? `[${title}]` : "";
        if (logToConsole) {
            console.log(titleToLog, msg);
        }
        if (logToFile) {
            fs.appendFileSync(logPath, titleToLog + " " + msg + "\n", "utf8");
        }
    }

    let page: Page;

    // test.describe.configure({ mode: "serial" });

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.setViewportSize({ width: dimensions?.width || 600, height: dimensions?.height || 400 });
        await page.goto(getGlobalConfig({ root: config.root, usesDevHost: false }).baseUrl + `/empty.html`, {
            // waitUntil: "load",
            timeout: 0,
        });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });

        await page.waitForFunction(() => {
            return window.BABYLON;
        });
        page.setDefaultTimeout(0);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test.beforeEach(async () => {
        await page.evaluate(() => {
            if (window.scene && window.scene.dispose) {
                // run the dispose function here
                window.scene.dispose();
                window.scene = null;
                window.engine && window.engine.dispose();
                window.engine = null;
            }
        });
    });

    test.afterEach(async () => {
        await page.evaluate(() => {
            window.engine && window.engine.dispose();
            window.scene = null;
            window.engine = null;
        });
    });

    for (const testCase of tests) {
        if (testCase.excludeFromAutomaticTesting) {
            continue;
        }
        if (testCase.excludedEngines && testCase.excludedEngines.indexOf(engineType) !== -1) {
            continue;
        }
        test(testCase.title, async () => {
            //defensive
            const logCallback = (msg: any) => {
                log(msg, testCase.title);
            };
            page.on("console", logCallback);
            console.log("Running test: " + testCase.title, ". Meta: ", testCase.playgroundId || testCase.scriptToRun || testCase.sceneFilename);
            test.setTimeout(timeout);

            // Initialize engine with per-test options from the test case config
            const rendererData = await page.evaluate(evaluateInitEngineForVisualization, {
                engineName: engineType,
                useLargeWorldRendering: testCase.useLargeWorldRendering ?? false,
                useReverseDepthBuffer: testCase.useReverseDepthBuffer ?? "false",
                useNonCompatibilityMode: testCase.useNonCompatibilityMode ?? "false",
                baseUrl: getGlobalConfig({ root: config.root, usesDevHost: false }).baseUrl,
            });
            log(rendererData.renderer);

            if (optionalStateChanges?.beforeScene) {
                await optionalStateChanges.beforeScene(page);
            }

            // Pre-load snippet code on the Node side using the snippet loader
            let snippetCode: string | undefined;
            let snippetSceneCall: string | undefined;
            if (testCase.playgroundId) {
                const globalCfg = getGlobalConfig({ root: config.root, usesDevHost: false });
                try {
                    const preloaded = await preloadSnippetCode(testCase.playgroundId, globalCfg.snippetUrl);
                    snippetCode = preloaded.code;
                    snippetSceneCall = preloaded.sceneCall;
                } catch (e) {
                    // If pre-loading fails, the browser-side fallback will handle it
                    console.warn(`Failed to preload snippet ${testCase.playgroundId}, falling back to browser fetch:`, e);
                }
            }

            await page.evaluate(evaluatePrepareScene, {
                sceneMetadata: { ...testCase, snippetCode, snippetSceneCall },
                globalConfig: getGlobalConfig({ root: config.root, usesDevHost: false }),
            });
            if (optionalStateChanges?.beforeRender) {
                await optionalStateChanges.beforeRender(page);
            }
            const renderCount = testCase.renderCount || 1;
            const renderResult = await page.evaluate(evaluateRenderSceneForVisualization, { renderCount, continueRenderingOnDone: !!testCase.continueRenderingOnDone });
            expect(renderResult).toBeTruthy();
            if (engineType.startsWith("webgl")) {
                const glError = await page.evaluate(evaluateIsGLError);
                expect(glError).toBe(false);
            }
            await expect(page).toHaveScreenshot((testCase.referenceImage || testCase.title).replace(".png", "") + ".png", {
                timeout: 7000,
                // omitBackground: true,
                // 3% change in color is allowed
                threshold: process.env.SCREENSHOT_THRESHOLD ? +process.env.SCREENSHOT_THRESHOLD : 0.035,
                // default to 1% pixel changed allowed
                maxDiffPixelRatio: (testCase.errorRatio || (process.env.SCREENSHOT_MAX_PIXEL ? +process.env.SCREENSHOT_MAX_PIXEL : 1.1)) / 100,
            });
            page.off("console", logCallback);
        });
    }
};

/* eslint-disable @typescript-eslint/naming-convention */
declare const BABYLON: typeof window.BABYLON;

export const evaluateInitEngineForVisualization = async ({
    engineName,
    useLargeWorldRendering,
    useReverseDepthBuffer,
    useNonCompatibilityMode,
    baseUrl,
}: {
    engineName: string;
    useLargeWorldRendering: boolean;
    useReverseDepthBuffer: string | number;
    useNonCompatibilityMode: string | number;
    baseUrl: string;
}) => {
    engineName = engineName ? engineName.toLowerCase() : "webgl2";
    if (window.engine) {
        window.engine.dispose();
        window.engine = null;
    }
    if (engineName === "webgl") {
        engineName = "webgl2";
    }

    BABYLON.SceneLoader.ShowLoadingScreen = false;
    BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

    BABYLON.DracoDecoder.DefaultConfiguration = {
        wasmUrl: baseUrl + "/draco_wasm_wrapper_gltf.js",
        wasmBinaryUrl: baseUrl + "/draco_decoder_gltf.wasm",
        fallbackUrl: baseUrl + "/draco_decoder_gltf.js",
    };
    BABYLON.MeshoptCompression.Configuration.decoder = {
        url: baseUrl + "/meshopt_decoder.js",
    };
    (BABYLON as any).GLTFValidation.Configuration = {
        url: baseUrl + "/gltf_validator.js",
    };

    (BABYLON.KhronosTextureContainer2.URLConfig as any) = {
        jsDecoderModule: baseUrl + "/babylon.ktx2Decoder.js",
        wasmUASTCToASTC: baseUrl + "/ktx2Transcoders/1/uastc_astc.wasm",
        wasmUASTCToBC7: baseUrl + "/ktx2Transcoders/1/uastc_bc7.wasm",
        wasmUASTCToRGBA_UNORM: baseUrl + "/ktx2Transcoders/1/uastc_rgba8_unorm_v2.wasm",
        wasmUASTCToRGBA_SRGB: baseUrl + "/ktx2Transcoders/1/uastc_rgba8_srgb_v2.wasm",
        jsMSCTranscoder: baseUrl + "/ktx2Transcoders/1/msc_basis_transcoder.js",
        wasmMSCTranscoder: baseUrl + "/ktx2Transcoders/1/msc_basis_transcoder.wasm",
        wasmZSTDDecoder: baseUrl + "/zstddec.wasm",
    };

    BABYLON.BasisToolsOptions.JSModuleURL = baseUrl + "/basisTranscoder/1/basis_transcoder.js";
    BABYLON.BasisToolsOptions.WasmModuleURL = baseUrl + "/basisTranscoder/1/basis_transcoder.wasm";

    BABYLON.NodeMaterial.UseNativeShaderLanguageOfEngine = true;

    window.forceUseReverseDepthBuffer = useReverseDepthBuffer === 1 || useReverseDepthBuffer === "true";
    window.forceUseNonCompatibilityMode = useNonCompatibilityMode === 1 || useNonCompatibilityMode === "true";

    window.canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement;
    if (engineName === "webgpu") {
        const glslangOptions = {
            jsPath: baseUrl + "/glslang/glslang.js",
            wasmPath: baseUrl + "/glslang/glslang.wasm",
        };

        const twgslOptions = {
            jsPath: baseUrl + "/twgsl/twgsl.js",
            wasmPath: baseUrl + "/twgsl/twgsl.wasm",
        };

        const options: BABYLON.WebGPUEngineOptions = {
            enableAllFeatures: true,
            setMaximumLimits: true,
            antialias: false,
            enableGPUDebugMarkers: false,
            useLargeWorldRendering: useLargeWorldRendering,
        };

        const engine = new BABYLON.WebGPUEngine(window.canvas, options);
        engine.enableOfflineSupport = false;
        engine.useReverseDepthBuffer = window.forceUseReverseDepthBuffer;
        engine.compatibilityMode = !window.forceUseNonCompatibilityMode;
        window.engine = engine;

        await engine.initAsync(glslangOptions, twgslOptions);
    } else {
        const engine = new BABYLON.Engine(window.canvas, false, {
            useHighPrecisionFloats: true,
            disableWebGL2Support: engineName === "webgl1" ? true : false,
            forceSRGBBufferSupportState: true,
            failIfMajorPerformanceCaveat: true,
            powerPreference: "high-performance",
            useLargeWorldRendering: useLargeWorldRendering,
        });
        engine.enableOfflineSupport = false;
        engine.setDitheringState(false);
        engine.useReverseDepthBuffer = window.forceUseReverseDepthBuffer;
        engine.compatibilityMode = !window.forceUseNonCompatibilityMode;
        window.engine = engine;
    }
    window.engine!.renderEvenInBackground = true;
    window.engine!.getCaps().parallelShaderCompile = undefined;

    const win = window as any;
    if (typeof win.HavokPhysics === "function" && typeof win.HK === "undefined") {
        win.HK = await win.HavokPhysics();
    }

    return {
        forceUseReverseDepthBuffer: window.forceUseReverseDepthBuffer,
        forceUseNonCompatibilityMode: window.forceUseNonCompatibilityMode,
        engineName,
        renderer: (window.engine as any)._glRenderer,
    };
};

export const evaluatePrepareScene = async ({
    sceneMetadata,
    globalConfig,
}: {
    sceneMetadata: {
        sceneFolder?: string;
        sceneFilename?: string;
        scriptToRun?: string;
        specificRoot?: string;
        replaceUrl?: string;
        rootPath?: string;
        functionToCall?: string;
        replace?: string;
        playgroundId?: string;
        snippetCode?: string;
        snippetSceneCall?: string;
    };
    globalConfig: { root: string; snippetUrl: any; pgRoot: string };
}) => {
    window.seed = 1;
    window.Math.random = function () {
        const x = Math.sin(window.seed++) * 10000;
        return x - Math.floor(x);
    };
    BABYLON.SceneLoader.OnPluginActivatedObservable.clear();
    BABYLON.SceneLoader.ShowLoadingScreen = false;
    BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;
    if (sceneMetadata.sceneFolder) {
        window.scene = await BABYLON.SceneLoader.LoadAsync(globalConfig.root + sceneMetadata.sceneFolder, sceneMetadata.sceneFilename, window.engine);
    } else if (sceneMetadata.playgroundId) {
        if (sceneMetadata.playgroundId[0] !== "#" || sceneMetadata.playgroundId.indexOf("#", 1) === -1) {
            sceneMetadata.playgroundId += "#0";
        }

        const retryTime = 500;
        const maxRetry = 5;
        let retry = 0;

        const runSnippet = async function () {
            let code: string;

            if (sceneMetadata.snippetCode) {
                // Use pre-parsed code from the snippet loader (parsed on the Node side)
                code = sceneMetadata.snippetCode;
            } else {
                // Fallback: fetch and parse in the browser (when pre-loading was not available)
                const data = await fetch(globalConfig.snippetUrl + sceneMetadata.playgroundId!.replace(/#/g, "/"));
                const snippet = await data.json();
                const payload = JSON.parse(snippet.jsonPayload);
                if (Object.prototype.hasOwnProperty.call(payload, "version")) {
                    const v2Manifest = JSON.parse(payload.code);
                    code = v2Manifest.files[v2Manifest.entry];
                    // Strip module syntax — imports are not needed (BABYLON is a UMD global)
                    code = code
                        .replace(/^\s*import\b[\s\S]*?\bfrom\s+['"][^'"]*['"]\s*;?\s*$/gm, "")
                        .replace(/^\s*import\s+['"][^'"]*['"]\s*;?\s*$/gm, "")
                        .replace(/^\s*export\s+default\s+\w+\s*;?\s*$/gm, "")
                        .replace(/^\s*export\s+default\s+(?=(?:async\s+)?function\b|class\b)/gm, "")
                        .replace(/^\s*export\s+(?=const\b|let\b|var\b|(?:async\s+)?function\b|class\b)/gm, "")
                        .replace(/^\s*export\s*\{[^}]*\}(?:\s*from\s*['"][^'"]*['"])?\s*;?\s*$/gm, "")
                        .replace(/^\s*export\s*\*\s*(?:from\s*['"][^'"]*['"])?\s*;?\s*$/gm, "");
                } else {
                    code = payload.code.toString();
                }
            }

            // Apply playground URL replacements
            code = code
                .replace(/("|')\/textures\//g, "$1" + globalConfig.pgRoot + "/textures/")
                .replace(/("|')textures\//g, "$1" + globalConfig.pgRoot + "/textures/")
                .replace(/\/scenes\//g, globalConfig.pgRoot + "/scenes/")
                .replace(/("|')scenes\//g, "$1" + globalConfig.pgRoot + "/scenes/")
                .replace(/("|')\.\.\/\.\.https/g, "$1" + "https")
                .replace("http://", "https://");

            if (sceneMetadata.replace) {
                const split = sceneMetadata.replace.split(",");
                for (let i = 0; i < split.length; i += 2) {
                    const source = split[i].trim();
                    const destination = split[i + 1].trim();
                    code = code.replace(source, destination);
                }
            }

            // Detect which scene function to call.
            // Pre-loaded snippets provide sceneCall from the snippet loader;
            // for browser-fetched code, detect from the code content.
            let sceneCall = sceneMetadata.snippetSceneCall;
            if (!sceneCall) {
                if (/class\s+Playground\b/.test(code) && /\bCreateScene\b/.test(code)) {
                    sceneCall = "Playground.CreateScene(engine, canvas)";
                } else if (/\bdelayCreateScene\b/.test(code)) {
                    sceneCall = "delayCreateScene(engine)";
                } else if (/\bdelayLoadScene\b/.test(code)) {
                    sceneCall = "delayLoadScene(engine)";
                } else if (/\bCreateScene\b/.test(code) && !/\bcreateScene\b/.test(code)) {
                    sceneCall = "CreateScene(engine)";
                } else {
                    sceneCall = "createScene(engine)";
                }
            }

            const loadedScene = eval(code + "\n" + sceneCall);

            if (loadedScene.then) {
                // Handle if createScene returns a promise
                window.scene = await loadedScene;
            } else {
                window.scene = loadedScene;
            }
        };

        const run = async () => {
            try {
                await runSnippet();
            } catch (e) {
                if (retry < maxRetry) {
                    retry++;
                    // wait for retryTime
                    await new Promise((resolve) => setTimeout(resolve, retryTime));
                    await run();
                } else {
                    console.error(e);
                    throw e;
                }
            }
        };
        await run();
    } else if (sceneMetadata.scriptToRun) {
        if (sceneMetadata.specificRoot) {
            BABYLON.Tools.BaseUrl = globalConfig.root + sceneMetadata.specificRoot;
        }

        const scriptContent = await (await fetch(globalConfig.root + sceneMetadata.scriptToRun)).text();
        let scriptToRun = scriptContent.replace(/..\/..\/assets\//g, globalConfig.root + "/Assets/");
        scriptToRun = scriptToRun.replace(/..\/..\/Assets\//g, globalConfig.root + "/Assets/");
        scriptToRun = scriptToRun.replace(/\/assets\//g, globalConfig.root + "/Assets/");

        if (sceneMetadata.replace) {
            const split = sceneMetadata.replace.split(",");
            for (let i = 0; i < split.length; i += 2) {
                const source = split[i].trim();
                const destination = split[i + 1].trim();
                scriptToRun = scriptToRun.replace(source, destination);
            }
        }

        if (sceneMetadata.replaceUrl) {
            const split = sceneMetadata.replaceUrl.split(",");
            for (let i = 0; i < split.length; i++) {
                const source = split[i].trim();
                const regex = new RegExp(source, "g");
                scriptToRun = scriptToRun.replace(regex, globalConfig.root + sceneMetadata.rootPath + source);
            }
        }

        window.scene = eval(scriptToRun + "\n" + sceneMetadata.functionToCall + "(engine)");
    }
    return true;
};

export const evaluateRenderSceneForVisualization = async ({ renderCount, continueRenderingOnDone }: { renderCount: number; continueRenderingOnDone: boolean }) => {
    return new Promise((resolve) => {
        if (!window.scene || !window.engine) {
            return resolve(false);
        }
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        window.scene.useConstantAnimationDeltaTime = true;

        window.scene.executeWhenReady(function () {
            if (!window.scene || !window.engine) {
                return resolve(false);
            }
            if (window.scene.activeCamera && (window.scene.activeCamera as any).useAutoRotationBehavior) {
                (window.scene.activeCamera as any).useAutoRotationBehavior = false;
            }
            const sceneAdts: any[] = window.scene!.textures.filter((t: any) => t.getClassName() === "AdvancedDynamicTexture");
            const adtsAreReady = () => {
                return sceneAdts.every((adt: any) => adt.guiIsReady());
            };
            let renderAfterGuiIsReadyCount = 1;
            window.engine.runRenderLoop(function () {
                try {
                    if (renderCount <= 0 && renderAfterGuiIsReadyCount <= 0) {
                        if (window.scene!.isReady()) {
                            if (continueRenderingOnDone) {
                                window.scene && window.scene.render();
                            } else {
                                window.engine && window.engine.stopRenderLoop();
                            }
                            return resolve(true);
                        } else {
                            console.error("Scene is not ready after rendering is done");
                            return resolve(false);
                        }
                    } else {
                        (window as any).onRenderCallback && (window as any).onRenderCallback();
                        window.scene && window.scene.render();
                        renderCount--;
                        if (adtsAreReady()) {
                            renderAfterGuiIsReadyCount--;
                        }
                    }
                } catch (e) {
                    window.engine && window.engine.stopRenderLoop();
                    console.error(e);
                    return resolve(false);
                }
            });
        }, true);
    });
};

export const evaluateDisposeSceneForVisualization = async (engineFlags: { forceUseReverseDepthBuffer: boolean; forceUseNonCompatibilityMode: any }) => {
    window.scene && window.scene.dispose();
    window.scene = null;
    if (window.engine) {
        window.engine.setHardwareScalingLevel(1);
        window.engine.useReverseDepthBuffer = engineFlags.forceUseReverseDepthBuffer;
        window.engine.compatibilityMode = !engineFlags.forceUseNonCompatibilityMode;
        if (engineFlags.forceUseReverseDepthBuffer) {
            window.engine.setDepthFunction(BABYLON.Constants.GEQUAL);
        } else {
            window.engine.setDepthFunction(BABYLON.Constants.LEQUAL);
        }

        window.engine.applyStates();
    }

    // engine._deltaTime = 0;
    // engine._fps = 60;
    // engine._performanceMonitor = new BABYLON.PerformanceMonitor();

    BABYLON.UnregisterAllMaterialPlugins();
    return true;
};

export const evaluateIsGLError = async () => {
    try {
        const gl = window.engine!._gl,
            glError = gl ? gl.getError() : 0;
        if (gl && glError !== 0) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return true;
    }
};
