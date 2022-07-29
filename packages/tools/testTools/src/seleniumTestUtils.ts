import type { ThenableWebDriver, WebElement } from "selenium-webdriver";
import { Builder, By } from "selenium-webdriver";
import "selenium-webdriver/safari";

export class SeleniumEnvironment {
    protected _driver: ThenableWebDriver;
    private _initEngine: string = `
        const evaluateInitEngineForVisualization = async function (engineName, useReverseDepthBuffer, useNonCompatibilityMode, baseUrl) {
            engineName = engineName ? engineName.toLowerCase() : "webgl2";
            if (window.engine) {
                window.engine.dispose();
                window.engine = null;
            }
            if (engineName === "webgl") {
                engineName = "webgl1";
            }
            BABYLON.SceneLoader.ShowLoadingScreen = false;
            BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;
            BABYLON.DracoCompression.Configuration.decoder = {
                wasmUrl: baseUrl + "/draco_wasm_wrapper_gltf.js",
                wasmBinaryUrl: baseUrl + "/draco_decoder_gltf.wasm",
                fallbackUrl: baseUrl + "/draco_decoder_gltf.js",
            };
            BABYLON.MeshoptCompression.Configuration.decoder = {
                url: baseUrl + "/meshopt_decoder.js",
            };
            BABYLON.GLTFValidation.Configuration = {
                url: baseUrl + "/gltf_validator.js",
            };
            BABYLON.KhronosTextureContainer2.URLConfig = {
                jsDecoderModule: baseUrl + "/babylon.ktx2Decoder.js",
                wasmUASTCToASTC: baseUrl + "/ktx2Transcoders/uastc_astc.wasm",
                wasmUASTCToBC7: baseUrl + "/ktx2Transcoders/uastc_bc7.wasm",
                wasmUASTCToRGBA_UNORM: baseUrl + "/ktx2Transcoders/uastc_rgba32_unorm.wasm",
                wasmUASTCToRGBA_SRGB: baseUrl + "/ktx2Transcoders/uastc_rgba32_srgb.wasm",
                jsMSCTranscoder: baseUrl + "/ktx2Transcoders/msc_basis_transcoder.js",
                wasmMSCTranscoder: baseUrl + "/ktx2Transcoders/msc_basis_transcoder.wasm",
                wasmZSTDDecoder: baseUrl + "/zstddec.wasm",
            };
            BABYLON.BasisToolsOptions.JSModuleURL = baseUrl + "/basisTranscoder/1/basis_transcoder.js";
            BABYLON.BasisToolsOptions.WasmModuleURL = baseUrl + "/basisTranscoder/1/basis_transcoder.wasm";
            window.forceUseReverseDepthBuffer = useReverseDepthBuffer === 1 || useReverseDepthBuffer === "true";
            window.forceUseNonCompatibilityMode = useNonCompatibilityMode === 1 || useNonCompatibilityMode === "true";
            window.canvas = document.getElementById("babylon-canvas");
            if (engineName === "webgpu") {
                const glslangOptions = {
                    jsPath: baseUrl + "/glslang/glslang.js",
                    wasmPath: baseUrl + "/glslang/glslang.wasm",
                };
                const twgslOptions = {
                    jsPath: baseUrl + "/twgsl/twgsl.js",
                    wasmPath: baseUrl + "/twgsl/twgsl.wasm",
                };
                const options = {
                    deviceDescriptor: {
                        requiredFeatures: [
                            "depth-clip-control",
                            "depth24unorm-stencil8",
                            "depth32float-stencil8",
                            "texture-compression-bc",
                            "texture-compression-etc2",
                            "texture-compression-astc",
                            "timestamp-query",
                            "indirect-first-instance",
                        ],
                    },
                    antialiasing: false,
                };
                const engine = new BABYLON.WebGPUEngine(window.canvas, options);
                engine.enableOfflineSupport = false;
                engine.useReverseDepthBuffer = window.forceUseReverseDepthBuffer;
                engine.compatibilityMode = !window.forceUseNonCompatibilityMode;
                window.engine = engine;
                await engine.initAsync(glslangOptions, twgslOptions);
            }
            else {
                const engine = new BABYLON.Engine(window.canvas, false, {
                    useHighPrecisionFloats: true,
                    disableWebGL2Support: engineName === "webgl1" ? true : false,
                    forceSRGBBufferSupportState: true,
                });
                engine.enableOfflineSupport = false;
                engine.setDitheringState(false);
                engine.useReverseDepthBuffer = window.forceUseReverseDepthBuffer;
                engine.compatibilityMode = !window.forceUseNonCompatibilityMode;
                window.engine = engine;
            }
            window.engine.renderEvenInBackground = true;
            return {
                forceUseReverseDepthBuffer: window.forceUseReverseDepthBuffer,
                forceUseNonCompatibilityMode: window.forceUseNonCompatibilityMode,
                engineName,
                renderer: window.engine._glRenderer,
            };
        };
    `;

    private _prepareScene: string = `
        const evaluatePrepareScene = async (sceneMetadata, globalConfig) => {
            window.seed = 1;
            window.Math.random = function () {
                const x = Math.sin(window.seed++) * 10000;
                return x - Math.floor(x);
            };
            BABYLON.SceneLoader.OnPluginActivatedObservable.clear();
            window.engine.beginFrame();
            BABYLON.SceneLoader.ShowLoadingScreen = false;
            BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

            if (sceneMetadata.playgroundId) {
                if (sceneMetadata.playgroundId[0] !== "#" || sceneMetadata.playgroundId.indexOf("#", 1) === -1) {
                    sceneMetadata.playgroundId += "#0";
                }
            }
            const retryTime = 500;
            const maxRetry = 5;
            let retry = 0;
            const runSnippet = async function () {
                const url = globalConfig.snippetUrl + sceneMetadata.playgroundId.replace(/#/g, "/");
                const data = await fetch(url);
                const snippet = await data.json();
                let code = JSON.parse(snippet.jsonPayload).code.toString();
                code = code
                .replace(/"\\/textures\\//g, '"' + globalConfig.pgRoot + "/textures/")
                .replace(/"textures\\//g, '"' + globalConfig.pgRoot + "/textures/")
                .replace(/\\/scenes\\//g, globalConfig.pgRoot + "/scenes/")
                .replace(/"scenes\\//g, '"' + globalConfig.pgRoot + "/scenes/")
                .replace(/"\\.\\.\\/\\.\\.https/g, '"' + "https")
                .replace("http://", "https://");
                if (sceneMetadata.replace) {
                    const split = sceneMetadata.replace.split(",");
                    for (let i = 0; i < split.length; i += 2) {
                        const source = split[i].trim();
                        const destination = split[i + 1].trim();
                        code = code.replace(source, destination);
                    }
                }
                const loadedScene = eval(code + "\\r\\ncreateScene(engine)");
                if (loadedScene.then) {
                    // Handle if createScene returns a promise
                    window.scene = await loadedScene;
                }
                else {
                    window.scene = loadedScene;
                }

                return url;
            };
            const run = async () => {
                try {
                    await runSnippet();
                }
                catch (e) {
                    if (retry < maxRetry) {
                        retry++;
                        // wait for retryTime
                        await new Promise((resolve) => setTimeout(resolve, retryTime));
                        await run();
                    }
                    else {
                        console.error(e);
                        throw e;
                    }
                }
            };
            return await runSnippet();
        }
    `;

    private _renderScene: string = `
        const evaluateRenderSceneForVisualization = async (renderCount) => {
            return new Promise((resolve) => {
                if (!window.scene || !window.engine) {
                    return resolve(false);
                }
                BABYLON.SceneLoader.ShowLoadingScreen = false;
                window.scene.useConstantAnimationDeltaTime = true;
                window.engine.endFrame();
                window.scene.executeWhenReady(function () {
                    if (!window.scene || !window.engine) {
                        return resolve(false);
                    }
                    if (window.scene.activeCamera && window.scene.activeCamera.useAutoRotationBehavior) {
                        window.scene.activeCamera.useAutoRotationBehavior = false;
                    }
                    window.engine.runRenderLoop(function () {
                        try {
                            window.scene && window.scene.render();
                            renderCount--;
                            if ((renderCount <= 0 && window.scene.isReady()) || globalThis.testSuccessful) {
                                window.engine && window.engine.stopRenderLoop();
                                return resolve(true);
                            }
                        }
                        catch (e) {
                            window.engine && window.engine.stopRenderLoop();
                            console.error(e);
                            return resolve(false);
                        }
                    });
                }, true);
            });
        };
    `;

    public async get(url: string): Promise<void> {
        await this._driver.get(url);
    }

    public getDriver() {
        return this._driver;
    }

    public async findElementById(id: string): Promise<WebElement> {
        return this._driver.findElement(By.id(id));
    }

    public async findElementByClassName(className: string): Promise<WebElement> {
        return this._driver.findElement(By.className(className));
    }

    public async loadPG(pgId: string, globalConfig: { root: string; baseUrl: string; snippetUrl: string; pgRoot: string }, framesToRender: number = 500): Promise<void> {
        await this._driver
            .executeScript(
                `
                var _globalConfig = {
                    'root': '${globalConfig.root}',
                    'baseUrl': '${globalConfig.baseUrl}',
                    'snippetUrl': '${globalConfig.snippetUrl}',
                    'pgRoot': '${globalConfig.pgRoot}}',
                };

                ${this._initEngine}
                ${this._prepareScene}
                ${this._renderScene}
                await evaluateInitEngineForVisualization("webgl1", false, false, "${globalConfig.baseUrl}");
                const code = await evaluatePrepareScene({playgroundId: "${pgId}"}, _globalConfig);
                evaluateRenderSceneForVisualization(${framesToRender});

                return code;
            `
            )
            .then((val) => {
                console.log(val);
            });
    }

    public async checkTestSuccessStatus(): Promise<boolean> {
        let passStatus = false;

        await this._driver.executeScript(`return globalThis.testSuccessful;`).then((val) => {
            if (val) {
                passStatus = val as boolean;
            }
        });

        return passStatus;
    }

    public async quit(): Promise<void> {
        await this._driver.quit();
    }
}

export class SafariSeleniumEnvironment extends SeleniumEnvironment {
    public constructor() {
        super();
        this._driver = new Builder().forBrowser("safari").build();
    }
}