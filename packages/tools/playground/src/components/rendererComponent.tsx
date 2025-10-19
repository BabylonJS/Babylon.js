/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable github/no-then */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import type { GlobalState } from "../globalState";
import { RuntimeMode } from "../globalState";
import { Utilities } from "../tools/utilities";
import { DownloadManager } from "../tools/downloadManager";
import { AddFileRevision } from "../tools/localSession";

import { Engine, EngineStore, WebGPUEngine, LastCreatedAudioEngine, Logger } from "@dev/core";
import type { Nullable, Scene, ThinEngine } from "@dev/core";

import "../scss/rendering.scss";

let InspectorV2ModulePromise: Promise<typeof import("inspector-v2/inspector")> | null = null;
// eslint-disable-next-line @typescript-eslint/promise-function-async
function ImportInspectorV2() {
    if (!InspectorV2ModulePromise) {
        InspectorV2ModulePromise = import("inspector-v2/inspector");
    }
    return InspectorV2ModulePromise;
}

interface IRenderingComponentProps {
    globalState: GlobalState;
}

interface IRenderingComponentState {
    preferInspector: boolean;
}

/**
 *
 */
export class RenderingComponent extends React.Component<IRenderingComponentProps, IRenderingComponentState> {
    /** Engine instance for current run */
    private _engine!: Nullable<Engine>;
    /** Active scene */
    private _scene!: Nullable<Scene>;
    private _canvasRef: React.RefObject<HTMLCanvasElement>;
    private _downloadManager: DownloadManager;
    private _inspectorFallback: boolean = false;

    /**
     * Create the rendering component.
     * @param props Props
     */
    public constructor(props: IRenderingComponentProps) {
        super(props);
        this._canvasRef = React.createRef();
        this.state = {
            preferInspector: false,
        };

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
            this._downloadManager.downloadAsync();
        });

        this.props.globalState.onInspectorRequiredObservable.add(async (action) => {
            if (!this._scene) {
                return;
            }

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

            const isInspectorV1Enabled = this._scene.debugLayer.openedPanes !== 0;
            const isInspectorV2Enabled = InspectorV2ModulePromise && (await InspectorV2ModulePromise).IsInspectorVisible();
            const isInspectorEnabled = isInspectorV1Enabled || isInspectorV2Enabled;

            const searchParams = new URLSearchParams(window.location.search);
            let isInspectorV2ModeEnabled = searchParams.has("inspectorv2") && searchParams.get("inspectorv2") !== "false";

            if (action === "refresh") {
                action = isInspectorEnabled ? "enable" : "disable";
            } else if (action === "toggle") {
                action = isInspectorEnabled ? "disable" : "enable";
            }

            // Disallow Inspector v2 on specific/older versions. For now, only support the latest as both core and inspector are evolving in tandem.
            // Once we have an Inspector v2 UMD package, we can make this work the same as Inspector v1.)
            if (action === "enable" && isInspectorV2ModeEnabled && props.globalState.version) {
                isInspectorV2ModeEnabled = false;
                alert("Inspector v2 is only supported with the latest version of Babylon.js at this time. Falling back to Inspector V1.");
            }

            this.setState({
                preferInspector: action === "enable",
            });

            if (isInspectorV1Enabled && (isInspectorV2ModeEnabled || action === "disable")) {
                this._scene.debugLayer.hide();
            }

            if (isInspectorV2Enabled && (!isInspectorV2ModeEnabled || action === "disable")) {
                (await ImportInspectorV2()).HideInspector();
            }

            if (!isInspectorV1Enabled && !isInspectorV2ModeEnabled && action === "enable") {
                this._scene.debugLayer.show({
                    embedMode: true,
                });
            }

            if (!isInspectorV2Enabled && isInspectorV2ModeEnabled && action === "enable") {
                (await ImportInspectorV2()).ShowInspector(this._scene, {
                    embedMode: true,
                    showThemeSelector: false,
                    themeMode: Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light",
                });
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

    private _notifyError(message: string) {
        this.props.globalState.onErrorObservable.notifyObservers({
            message: message,
        });
        this.props.globalState.onDisplayWaitRingObservable.notifyObservers(false);
    }

    private _preventReentrancy = false;

    private _lastEngineKind: "webgpu" | "webgl2" | "webgl" | null = null;

    private _hardResetCanvas = () => {
        const old = this._canvasRef.current!;
        const parent = old.parentElement!;
        const fresh = old.cloneNode(false) as HTMLCanvasElement;
        fresh.id = old.id;
        fresh.className = old.className;
        fresh.width = old.width;
        fresh.height = old.height;
        parent.replaceChild(fresh, old);
        (this._canvasRef as any).current = fresh;
        (window as any).canvas = fresh;
    };

    private async _compileAndRunAsync() {
        if (this._preventReentrancy) {
            return;
        }
        this._preventReentrancy = true;

        this.props.globalState.onErrorObservable.notifyObservers(null);

        const displayInspector = (InspectorV2ModulePromise && (await InspectorV2ModulePromise).IsInspectorVisible()) || this._scene?.debugLayer.isVisible();

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
            const desiredKind: "webgpu" | "webgl2" | "webgl" = useWebGPU ? "webgpu" : forceWebGL1 ? "webgl" : "webgl2";

            if (this._lastEngineKind && this._lastEngineKind !== desiredKind) {
                this._hardResetCanvas();
            }
            this._lastEngineKind = desiredKind;
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
            // The architecture for runnables changed from text block source code in PG_V1 to a full module in PG_V2.
            let runner;
            try {
                runner = await this.props.globalState.getRunnable!();
                if (runner) {
                    // Local file revision storage for #{snippetId}#local support
                    AddFileRevision(this.props.globalState, runner!.getPackSnapshot().manifest);
                }
            } catch (e) {
                (window as any).handleException(e as Error);
                this._preventReentrancy = false;
                this.props.globalState.onDisplayWaitRingObservable.notifyObservers(false);
                return;
            }

            (window as any).engine = this._engine;

            const createEngineAsync = async () => {
                const desiredKind: "webgpu" | "webgl2" | "webgl" = useWebGPU ? "webgpu" : forceWebGL1 ? "webgl" : "webgl2";

                if (this._lastEngineKind && this._lastEngineKind !== desiredKind) {
                    this._hardResetCanvas();
                }
                this._lastEngineKind = desiredKind;
                let engine: Engine | null = null;
                if (useWebGPU) {
                    try {
                        const wgpu = new WebGPUEngine(this._canvasRef.current!, { enableAllFeatures: true, setMaximumLimits: true, enableGPUDebugMarkers: true });
                        await wgpu.initAsync();
                        engine = wgpu as any;
                    } catch {
                        Logger.Warn("WebGPU not supported. Falling back to WebGL.");
                    }
                }
                if (!engine) {
                    engine = new Engine(this._canvasRef.current, true, {
                        disableWebGL2Support: forceWebGL1,
                        preserveDrawingBuffer: true,
                        stencil: true,
                    });
                }
                return engine;
            };
            (window as any).canvas = canvas;

            let sceneResult: Scene | null = null;
            let createdEngine: ThinEngine | null = null;
            try {
                [sceneResult, createdEngine] = await runner.run(createEngineAsync, canvas);
                this._engine = createdEngine as Engine;
            } catch (err) {
                (window as any).handleException(err as Error);
                this._preventReentrancy = false;
                this.props.globalState.onDisplayWaitRingObservable.notifyObservers(false);
                return;
            }
            if (!sceneResult) {
                this._preventReentrancy = false;
                return this._notifyError("createScene export not found or returned null.");
            }

            this._scene = sceneResult as Scene;
            (window as any).scene = this._scene;
            (window as any).startRenderLoop(this._engine, canvas);

            this._engine!.scenes[0]?.executeWhenReady(() => {
                this.props.globalState.onRunExecutedObservable.notifyObservers();
            });

            this._preventReentrancy = false;
            this.props.globalState.onDisplayWaitRingObservable.notifyObservers(false);

            // Rehydrate inspector
            if (this.state.preferInspector && displayInspector) {
                this.props.globalState.onInspectorRequiredObservable.notifyObservers("enable");
            }
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
