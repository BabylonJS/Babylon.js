/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable github/no-then */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import type { GlobalState } from "../globalState";
import { RuntimeMode } from "../globalState";
import { Utilities } from "../tools/utilities";
import { DownloadManager } from "../tools/downloadManager";
import { Engine, EngineStore, WebGPUEngine, LastCreatedAudioEngine } from "@dev/core";

import type { Nullable, Scene } from "@dev/core";

import "../scss/rendering.scss";

// If the "inspectorv2" query parameter is present, preload (asynchronously) the new inspector v2 module.
const InspectorV2ModulePromise = new URLSearchParams(window.location.search).has("inspectorv2") ? import("inspector-v2/inspector") : null;

interface IRenderingComponentProps {
    globalState: GlobalState;
}

declare const Ammo: any;
declare const Recast: any;
declare const HavokPhysics: any;
declare const HK: any;

/**
 *
 */
export class RenderingComponent extends React.Component<IRenderingComponentProps> {
    /** Engine instance for current run */
    private _engine: Nullable<Engine>;
    /** Active scene */
    private _scene: Nullable<Scene>;
    private _canvasRef: React.RefObject<HTMLCanvasElement>;
    private _downloadManager: DownloadManager;
    private _babylonToolkitWasLoaded = false;
    private _inspectorFallback: boolean = false;

    /**
     * Create the rendering component.
     * @param props Props
     */
    public constructor(props: IRenderingComponentProps) {
        super(props);

        this._canvasRef = React.createRef();

        // Create the global handleException
        (window as any).handleException = (e: Error) => {
            // eslint-disable-next-line no-console
            console.error(e);
            this.props.globalState.onErrorObservable.notifyObservers(e);
        };

        this.props.globalState.onRunRequiredObservable.add(() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._compileAndRunAsync();
        });

        this._downloadManager = new DownloadManager(this.props.globalState);
        this.props.globalState.onDownloadRequiredObservable.add(() => {
            if (!this._engine) {
                return;
            }
            this._downloadManager.download(this._engine);
        });

        this.props.globalState.onInspectorRequiredObservable.add(async () => {
            if (!this._scene) {
                return;
            }

            if (InspectorV2ModulePromise) {
                const inspectorV2Module = await InspectorV2ModulePromise;
                if (inspectorV2Module.IsInspectorVisible()) {
                    inspectorV2Module.HideInspector();
                } else {
                    inspectorV2Module.ShowInspector(this._scene, {
                        embedMode: true,
                    });
                }
            } else {
                // support for older versions
                // openedPanes was not available until 7.44.0, so we need to fallback to the inspector's _OpenedPane property
                if (this._scene.debugLayer.openedPanes === undefined) {
                    this._inspectorFallback = true;
                }

                // fallback?
                if (this._inspectorFallback) {
                    const debugLayer: any = this._scene.debugLayer;
                    debugLayer.openedPanes = debugLayer.BJSINSPECTOR?.Inspector?._OpenedPane || 0;
                }

                if (this._scene.debugLayer.openedPanes === 0) {
                    this._scene.debugLayer.show({
                        embedMode: true,
                    });
                } else {
                    this._scene.debugLayer.hide();
                }
            }
        });

        this.props.globalState.onFullcreenRequiredObservable.add(() => {
            this._engine?.switchFullscreen(false);
        });

        window.addEventListener("resize", () => {
            if (!this._engine) {
                return;
            }

            this._engine.resize();
        });

        window.addEventListener("error", this._saveError);
    }

    private _saveError = (_err: ErrorEvent) => {
        // no-op placeholder retained for backward compatibility
    };

    private async _loadScriptAsync(url: string): Promise<void> {
        return await new Promise((resolve) => {
            const script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", url);
            script.onload = () => {
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    private _notifyError(message: string) {
        this.props.globalState.onErrorObservable.notifyObservers({
            message: message,
        });
        this.props.globalState.onDisplayWaitRingObservable.notifyObservers(false);
    }

    private _preventReentrancy = false;
    private _sanitizeCode(code: string): string {
        let result = code.normalize("NFKC");

        const hiddenCharsRegex = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
        // eslint-disable-next-line no-control-regex
        const controlCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

        // Visualizer markers for hidden characters
        const markers: Record<string, string> = {
            "\u200B": "⟦ZWSP⟧",
            "\u200C": "⟦ZWNJ⟧",
            "\u200D": "⟦ZWJ⟧",
            "\u200E": "⟦LRM⟧",
            "\u200F": "⟦RLM⟧",
            "\u202A": "⟦LRE⟧",
            "\u202B": "⟦RLE⟧",
            "\u202C": "⟦PDF⟧",
            "\u202D": "⟦LRO⟧",
            "\u202E": "⟦RLO⟧",
            "\u2060": "⟦WJ⟧",
            "\u2066": "⟦LRI⟧",
            "\u2067": "⟦RLI⟧",
            "\u2068": "⟦FSI⟧",
            "\u2069": "⟦PDI⟧",
            "\uFEFF": "⟦BOM⟧",
        };

        result = result.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, (ch) => markers[ch] || `⟦U+${ch.charCodeAt(0).toString(16).toUpperCase()}⟧`);

        result = result.replace(hiddenCharsRegex, "").replace(controlCharsRegex, "");

        return result;
    }

    private async _compileAndRunAsync() {
        if (this._preventReentrancy) {
            return;
        }
        this._preventReentrancy = true;

        this.props.globalState.onErrorObservable.notifyObservers(null);

        //  const displayInspector = InspectorV2ModulePromise ? (await InspectorV2ModulePromise).IsInspectorVisible() : this._scene?.debugLayer.isVisible();

        const webgpuPromise = WebGPUEngine ? WebGPUEngine.IsSupportedAsync : Promise.resolve(false);
        const webGPUSupported = await webgpuPromise;

        let useWebGPU = location.search.indexOf("webgpu") !== -1 && webGPUSupported;
        let forceWebGL1 = false;
        const configuredEngine = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);

        switch (configuredEngine) {
            case "WebGPU":
                useWebGPU = true && webGPUSupported;
                break;
            case "WebGL":
                forceWebGL1 = true;
                break;
        }

        try {
            while (EngineStore.Instances.length) {
                EngineStore.Instances[0].dispose();
            }
            let audioEngine;
            while ((audioEngine = LastCreatedAudioEngine())) {
                audioEngine.dispose();
            }
        } catch {
            // just ignore
        }

        this._engine = null;

        try {
            // Set up the global object ("window" and "this" for user code).
            // Delete (or rewrite) previous-run globals to avoid confusion.
            const globalObject = window as any;
            delete globalObject.engine;
            delete globalObject.scene;
            delete globalObject.initFunction;

            const canvas = this._canvasRef.current!;
            globalObject.canvas = canvas;

            // Define startRenderLoop once (PG_V2 + legacy) before any bootstrap uses it
            globalObject.startRenderLoop = (engine: Engine, canvasEl: HTMLCanvasElement) => {
                engine.runRenderLoop(() => {
                    if (!this._scene || !this._engine) {
                        return;
                    }

                    if (this.props.globalState.runtimeMode === RuntimeMode.Editor && window.innerWidth > this.props.globalState.MobileSizeTrigger) {
                        if (canvasEl.width !== canvasEl.clientWidth || canvasEl.height !== canvasEl.clientHeight) {
                            this._engine.resize();
                        }
                    }

                    if (this._scene.activeCamera || this._scene.frameGraph || (this._scene.activeCameras && this._scene.activeCameras.length > 0)) {
                        this._scene.render();
                    }

                    // Update FPS if camera is not a webxr camera
                    if (!(this._scene.activeCamera && this._scene.activeCamera.getClassName && this._scene.activeCamera.getClassName() === "WebXRCamera")) {
                        if (this.props.globalState.runtimeMode !== RuntimeMode.Full) {
                            this.props.globalState.fpsElement.innerHTML = this._engine.getFps().toFixed() + " fps";
                        }
                    }
                });
            };

            if (useWebGPU) {
                globalObject.createDefaultEngine = async function () {
                    try {
                        const engine = new WebGPUEngine(canvas, {
                            enableAllFeatures: true,
                            setMaximumLimits: true,
                            enableGPUDebugMarkers: true,
                        });
                        await engine.initAsync();
                        return engine;
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error("The Playground could not create a WebGPU engine instance. Make sure WebGPU is supported by your browser.");
                        // eslint-disable-next-line no-console
                        console.error(e);
                        return null;
                    }
                };
            } else {
                globalObject.createDefaultEngine = function () {
                    return new Engine(canvas, true, {
                        disableWebGL2Support: forceWebGL1,
                        preserveDrawingBuffer: true,
                        stencil: true,
                    });
                };
            }

            // Build the runnable (always V2)
            let runner;
            try {
                runner = await this.props.globalState.getRunnable!();
            } catch (e) {
                (window as any).handleException(e as Error);
                this._preventReentrancy = false;
                return;
            }

            // Create engine (same as your existing engine selection logic)
            let engine: Engine | null = null;
            if (useWebGPU) {
                try {
                    const wgpu = new WebGPUEngine(this._canvasRef.current!, { enableAllFeatures: true, setMaximumLimits: true, enableGPUDebugMarkers: true });
                    await wgpu.initAsync();
                    engine = wgpu as any;
                } catch (e) {
                    // console.error("WebGPU creation failed; falling back to WebGL.", e);
                }
            }
            if (!engine) {
                engine = new Engine(canvas, true, {
                    disableWebGL2Support: forceWebGL1,
                    preserveDrawingBuffer: true,
                    stencil: true,
                });
            }

            this._engine = engine as Engine;
            (window as any).engine = this._engine; // optional, if other parts rely on it
            (window as any).canvas = canvas;

            // Start render loop exactly like before
            (window as any).startRenderLoop(this._engine, canvas);

            // Run the scene via the runnable
            let sceneResult: any = null;
            try {
                sceneResult = await runner.run(this._engine, canvas);
            } catch (err) {
                (window as any).handleException(err as Error);
                this._preventReentrancy = false;
                return;
            }
            if (!sceneResult) {
                this._preventReentrancy = false;
                return this._notifyError("createScene export not found or returned null.");
            }

            this._scene = sceneResult as Scene;
            (window as any).scene = this._scene;

            this._engine!.scenes[0]?.executeWhenReady(() => {
                this.props.globalState.onRunExecutedObservable.notifyObservers();
            });

            this._preventReentrancy = false;
            this.props.globalState.onDisplayWaitRingObservable.notifyObservers(false);
            return;
        } catch (e) {
            (window as any).handleException(e as Error);
            this._preventReentrancy = false;
        }
    }

    /**
     * Render canvas element
     * @returns Canvas element
     */
    public override render() {
        return <canvas id="renderCanvas" ref={this._canvasRef} className={this.props.globalState.runtimeMode === RuntimeMode.Full ? "fullscreen" : ""}></canvas>;
    }
}
