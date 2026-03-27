import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { SceneContext } from "../../sceneContext";
import { LogEntry } from "../log/logComponent";
import { LoadSnippet } from "@tools/snippet-loader";
import type { IPlaygroundSnippetResult } from "@tools/snippet-loader";

import "./scenePreview.scss";

interface IScenePreviewComponentProps {
    globalState: GlobalState;
}

interface IScenePreviewComponentState {
    snippetId: string;
    isLoading: boolean;
    error: string;
    sceneObjectCount: number;
}

/**
 * Component that provides a Playground snippet loader and a live scene preview.
 * Loading a snippet executes its createScene(), renders the result in a canvas,
 * and populates a SceneContext that catalogues every object in the scene for use
 * as references in flow graph blocks.
 */
export class ScenePreviewComponent extends React.Component<IScenePreviewComponentProps, IScenePreviewComponentState> {
    private _canvasRef: React.RefObject<HTMLCanvasElement>;
    private _onContextRefreshedObserver: Nullable<Observer<SceneContext>> = null;
    private _onSceneContextChangedObserver: Nullable<Observer<SceneContext>> = null;
    private _onSnippetIdChangedObserver: Nullable<Observer<string>> = null;
    private _onReloadSnippetRequestedObserver: Nullable<Observer<void>> = null;

    /** @internal */
    constructor(props: IScenePreviewComponentProps) {
        super(props);
        this._canvasRef = React.createRef();

        this.state = {
            snippetId: "",
            isLoading: false,
            error: "",
            sceneObjectCount: props.globalState.sceneContext?.entries.length ?? 0,
        };
    }

    /** @internal */
    override componentDidMount() {
        // Watch for external context changes
        if (this.props.globalState.sceneContext) {
            this._watchContext(this.props.globalState.sceneContext);
        }
        this._onSceneContextChangedObserver = this.props.globalState.onSceneContextChanged.add((ctx) => {
            if (ctx) {
                this._watchContext(ctx);
                this.setState({ sceneObjectCount: ctx.entries.length });
            }
        });

        // When a graph is loaded from JSON with a stored snippet ID, auto-load the scene
        this._onSnippetIdChangedObserver = this.props.globalState.onSnippetIdChanged.add((snippetId) => {
            if (snippetId) {
                this.setState({ snippetId }, () => {
                    void this.loadSnippetAsync();
                });
            }
        });

        // When a reload is requested (e.g. from the Reset button), re-run the current snippet
        this._onReloadSnippetRequestedObserver = this.props.globalState.onReloadSnippetRequested.add(() => {
            if (this.state.snippetId) {
                void this.loadSnippetAsync();
            }
        });
    }

    /** @internal */
    override componentWillUnmount() {
        this._unwatchContext();
        this._onSceneContextChangedObserver?.remove();
        this._onSnippetIdChangedObserver?.remove();
        this._onReloadSnippetRequestedObserver?.remove();
    }

    private _watchContext(ctx: SceneContext) {
        this._unwatchContext();
        this._onContextRefreshedObserver = ctx.onContextRefreshed.add(() => {
            this.setState({ sceneObjectCount: ctx.entries.length });
        });
    }

    private _unwatchContext() {
        if (this._onContextRefreshedObserver) {
            this.props.globalState.sceneContext?.onContextRefreshed.remove(this._onContextRefreshedObserver);
            this._onContextRefreshedObserver = null;
        }
    }

    /**
     * Extract a snippet ID from user input that may be a full playground URL.
     * The snippet loader accepts "ID" and "ID#version" directly, so we only
     * need to strip the URL prefix when present.
     * @param input - the raw user input string
     * @returns the cleaned snippet ID (e.g. "ABC123#4")
     */
    private _extractSnippetId(input: string): string {
        let cleaned = input.trim();

        // Full URL: https://playground.babylonjs.com/#ABC123#4
        if (cleaned.includes("playground.babylonjs.com")) {
            const hashIndex = cleaned.indexOf("#");
            if (hashIndex !== -1) {
                cleaned = cleaned.substring(hashIndex + 1);
            }
        }

        // Remove leading # if present
        if (cleaned.startsWith("#")) {
            cleaned = cleaned.substring(1);
        }

        return cleaned;
    }

    /**
     * Load a playground snippet, execute it, and populate the scene context.
     */
    async loadSnippetAsync() {
        const { snippetId } = this.state;
        if (!snippetId) {
            return;
        }

        this.setState({ isLoading: true, error: "" });

        try {
            const cleanId = this._extractSnippetId(snippetId);
            const result = await LoadSnippet(cleanId, { moduleFormat: "script", assetBaseUrl: "https://playground.babylonjs.com/" });

            if (result.type !== "playground") {
                throw new Error(`Only playground snippets are supported (got "${result.type}")`);
            }

            const pgResult = result as IPlaygroundSnippetResult;

            // Dispose old preview context if any
            const oldCtx = this.props.globalState.sceneContext;
            if (oldCtx) {
                oldCtx.engine.stopRenderLoop();
                oldCtx.scene.dispose();
                oldCtx.engine.dispose();
                oldCtx.dispose();
            }

            const canvas = this._canvasRef.current;
            if (!canvas) {
                throw new Error("Preview canvas not available");
            }

            // Initialize runtime dependencies (Havok, Ammo, Recast) if the snippet uses them
            await pgResult.initializeRuntimeAsync({ loadScripts: true });

            // Create engine and scene using the snippet loader's ready-to-call functions
            const engine = await pgResult.createEngine(canvas, {
                engineOptions: { preserveDrawingBuffer: true, stencil: true },
            });

            const scene = await pgResult.createScene(engine, canvas);

            if (!scene || !scene.render) {
                throw new Error("createScene() did not return a valid Scene");
            }

            // Catch unhandled promise rejections from async operations started
            // by the snippet (e.g. SceneLoader.Append that fires after
            // createScene returns).  Mirror the Playground's approach of
            // surfacing these errors in the log rather than crashing.
            const rejectionHandler = (e: PromiseRejectionEvent) => {
                e.preventDefault();
                const msg = e.reason?.message || String(e.reason);
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Snippet error: ${msg}`, true));
            };
            window.addEventListener("unhandledrejection", rejectionHandler);

            // Start the render loop (guard for snippets that set up the
            // camera asynchronously, e.g. delayCreateScene / delayLoadScene).
            engine.runRenderLoop(() => {
                if (scene.activeCamera || (scene.activeCameras && scene.activeCameras.length > 0)) {
                    scene.render();
                }
            });

            engine.resize();

            // Handle window resize and canvas container resize
            const resizeHandler = () => engine.resize();
            window.addEventListener("resize", resizeHandler);

            let resizeObserver: ResizeObserver | null = null;
            if (canvas.parentElement) {
                resizeObserver = new ResizeObserver(resizeHandler);
                resizeObserver.observe(canvas.parentElement);
            }

            scene.onDisposeObservable.addOnce(() => {
                window.removeEventListener("unhandledrejection", rejectionHandler);
                window.removeEventListener("resize", resizeHandler);
                resizeObserver?.disconnect();
            });

            // Wait for the scene to finish loading all pending data (e.g.
            // async SceneLoader.Append / ImportMesh calls inside the snippet)
            // and for render targets to be ready (needed for pointer picking)
            // before cataloguing objects and wiring the flow graph.
            await scene.whenReadyAsync(true);

            // Build the scene context
            const sceneContext = new SceneContext(scene);
            this.props.globalState.sceneContext = sceneContext;
            this.props.globalState.snippetId = this.state.snippetId;
            this.props.globalState.onSceneContextChanged.notifyObservers(sceneContext);

            this.setState({
                isLoading: false,
                sceneObjectCount: sceneContext.entries.length,
            });

            const langTag = pgResult.language === "TS" ? " [TypeScript]" : "";
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Loaded snippet${langTag} with ${sceneContext.entries.length} scene objects`, false));
        } catch (err: any) {
            this.setState({
                isLoading: false,
                error: err.message || "Failed to load snippet",
            });

            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Failed to load snippet: ${err.message}`, true));

            // Notify listeners that the reload failed so waiting promises (e.g. _onResetAsync) don't hang
            this.props.globalState.onSceneContextChanged.notifyObservers(null);
        }
    }

    private _handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            void this.loadSnippetAsync();
        }
    };

    /** @internal */
    override render() {
        const { snippetId, isLoading, error, sceneObjectCount } = this.state;
        const ctx = this.props.globalState.sceneContext;

        return (
            <div className="scene-preview-container">
                <div className="snippet-loader">
                    <div className="snippet-header">SCENE CONTEXT</div>
                    <div className="snippet-input-row">
                        <input
                            type="text"
                            className="snippet-input"
                            placeholder="Playground ID or URL..."
                            value={snippetId}
                            onChange={(e) => this.setState({ snippetId: e.target.value })}
                            onKeyDown={this._handleKeyDown}
                            disabled={isLoading}
                        />
                        <button className="snippet-load-btn" onClick={() => void this.loadSnippetAsync()} disabled={isLoading || !snippetId}>
                            {isLoading ? "..." : "Load"}
                        </button>
                    </div>
                    {error && <div className="snippet-error">{error}</div>}
                    {ctx && (
                        <div className="snippet-status">
                            <span className="status-count">{sceneObjectCount}</span> objects in scene context
                            <span className="status-wired" title="Flow graph execution contexts will resolve asset references from this scene">
                                &#x2713; wired to flow graph
                            </span>
                        </div>
                    )}
                </div>
                <div className="preview-canvas-container">
                    <canvas ref={this._canvasRef} className="preview-canvas" />
                    {!ctx && <div className="preview-placeholder">Load a Playground snippet to preview the scene</div>}
                </div>
                {ctx && <div className="context-summary">{this._renderCategorySummary(ctx)}</div>}
            </div>
        );
    }

    private _renderCategorySummary(ctx: SceneContext) {
        const categories = [
            { label: "Meshes", count: ctx.meshes.length },
            { label: "Lights", count: ctx.lights.length },
            { label: "Cameras", count: ctx.cameras.length },
            { label: "Materials", count: ctx.materials.length },
            { label: "Transform Nodes", count: ctx.transformNodes.length },
            { label: "Animation Groups", count: ctx.animationGroups.length },
            { label: "Skeletons", count: ctx.skeletons.length },
            { label: "Particle Systems", count: ctx.particleSystems.length },
        ].filter((c) => c.count > 0);

        return (
            <div className="category-list">
                {categories.map((c) => (
                    <div key={c.label} className="category-item">
                        <span className="category-label">{c.label}</span>
                        <span className="category-count">{c.count}</span>
                    </div>
                ))}
            </div>
        );
    }
}
