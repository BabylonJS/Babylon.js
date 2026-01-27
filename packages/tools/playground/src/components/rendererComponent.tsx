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
import type { IDisposable, Nullable, Scene, ThinEngine } from "@dev/core";

import "../scss/rendering.scss";

type InspectorV2Module = typeof import("inspector-v2/legacy/legacy") & typeof import("inspector-v2/index");

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
    private _inspectorV2Token: Nullable<IDisposable> = null;

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

            this.setState({
                preferInspector: true,
            });

            // Inspector v2 should not be disposed during a React render, so just wait one JS frame.
            await Promise.resolve();

            if (this._inspectorV2Token) {
                this._inspectorV2Token.dispose();
                this._inspectorV2Token = null;
            } else if (this._scene.debugLayer.openedPanes !== 0) {
                this._scene.debugLayer.hide();
            } else {
                await this._showInspectorAsync();
            }
        });

        this.props.globalState.onFullcreenRequiredObservable.add(() => {
            this._engine?.switchFullscreen(false);
        });

        this.props.globalState.onThemeChangedObservable.add(() => {
            if (this._inspectorV2Token) {
                this._inspectorV2Token.dispose();
                this._showInspectorAsync();
            }
        });

        window.addEventListener("resize", () => {
            if (!this._engine) {
                return;
            }

            this._engine.resize();
        });

        window.addEventListener("error", this._saveError);
    }

    private async _showInspectorAsync() {
        if (this._scene) {
            const inspectorV2Module: InspectorV2Module | undefined = (globalThis as any).INSPECTOR;
            if (inspectorV2Module?.ShowInspector) {
                const options = {
                    ...inspectorV2Module.ConvertOptions({
                        embedMode: true,
                    }),
                    showThemeSelector: false,
                    themeMode: Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light",
                } as const;
                this._inspectorV2Token = inspectorV2Module.ShowInspector(this._scene, options);
            } else {
                await this._scene.debugLayer.show({
                    embedMode: true,
                });
            }
        }
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

        const displayInspector = this._inspectorV2Token || this._scene?.debugLayer.isVisible();

        const webgpuPromise = WebGPUEngine ? WebGPUEngine.IsSupportedAsync : Promise.resolve(false);
        const webGPUSupported = await webgpuPromise;

        this._inspectorV2Token?.dispose();
        this._inspectorV2Token = null;

        let useWebGPU = location.search.indexOf("webgpu") !== -1 && webGPUSupported;
        let forceWebGL1 = false;
        const configuredEngine = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);

        switch (configuredEngine) {
            case "WebGPU":
                useWebGPU = webGPUSupported;
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
                this.props.globalState.onInspectorRequiredObservable.notifyObservers();
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
