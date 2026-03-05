import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { SceneContext } from "../../sceneContext";
import { LogEntry } from "../log/logComponent";

import "./scenePreview.scss";

const SnippetUrl = "https://snippet.babylonjs.com";

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
        this.props.globalState.onSceneContextChanged.add((ctx) => {
            if (ctx) {
                this._watchContext(ctx);
                this.setState({ sceneObjectCount: ctx.entries.length });
            }
        });

        // When a graph is loaded from JSON with a stored snippet ID, auto-load the scene
        this.props.globalState.onSnippetIdChanged.add((snippetId) => {
            if (snippetId) {
                this.setState({ snippetId }, () => {
                    void this.loadSnippetAsync();
                });
            }
        });
    }

    /** @internal */
    override componentWillUnmount() {
        this._unwatchContext();
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
     * Parse a snippet identifier from various input formats.
     * Accepts: raw ID, "ID#version", full PG URL, or hash fragment.
     * @param input - the raw user input string
     * @returns the cleaned snippet path (e.g. "ABC123/4")
     */
    private _parseSnippetId(input: string): string {
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

        // Replace # separator between ID and version with /
        return cleaned.replace("#", "/");
    }

    /**
     * Fetch snippet code from the snippet server.
     * Handles both legacy snippets (flat code string) and v2 manifest format
     * (JSON with files/entry fields).
     * @param snippetPath - the snippet path (e.g. "ABC123/4")
     * @returns the playground code string ready for eval
     */
    private async _fetchSnippetCodeAsync(snippetPath: string): Promise<string> {
        const response = await fetch(`${SnippetUrl}/${snippetPath}`);
        if (!response.ok) {
            throw new Error(`Snippet not found (${response.status})`);
        }
        const data = await response.json();
        const payloadStr = data.jsonPayload || data.payload;
        if (!payloadStr) {
            throw new Error("Snippet has no code payload");
        }
        const payload = JSON.parse(payloadStr);
        let code: string = typeof payload.code === "string" ? payload.code : typeof payload === "string" ? payload : JSON.stringify(payload);

        // Check if code is a v2 manifest (JSON with files/entry)
        code = this._extractCodeFromManifest(code);

        // Strip ES module export keywords so eval() works (eval runs in script context)
        code = code.replace(/^\s*export\s+(default\s+)?/gm, "");

        return code;
    }

    /**
     * If the code string is a JSON v2 manifest, extract the entry file's source.
     * Otherwise return the code as-is.
     * @param code - raw code string that might be a v2 manifest JSON
     * @returns the extracted source code
     */
    private _extractCodeFromManifest(code: string): string {
        try {
            const manifest = JSON.parse(code);
            if (manifest && manifest.files && typeof manifest.files === "object") {
                const entry = manifest.entry || (manifest.language === "JS" ? "index.js" : "index.ts");
                const entryCode = manifest.files[entry];
                if (!entryCode) {
                    throw new Error(`Manifest entry "${entry}" not found in snippet files`);
                }
                if (/\.tsx?$/.test(entry)) {
                    throw new Error("TypeScript snippets are not yet supported — please use a JavaScript snippet");
                }
                return entryCode;
            }
        } catch (err: any) {
            // If it's our own error (TS not supported, entry not found), rethrow
            if (err.message && !err.message.includes("JSON")) {
                throw err;
            }
            // Otherwise it wasn't valid JSON — treat as raw code
        }
        return code;
    }

    /**
     * Execute playground code with the given engine and canvas set as globals.
     * The code is expected to define a `createScene` function.
     * @param code - the playground JS source code
     * @param previewEngine - the engine instance to expose as a global
     * @param previewCanvas - the canvas element to expose as a global
     * @returns the scene produced by executing the code
     */
    private async _executePlaygroundCodeAsync(code: string, previewEngine: any, previewCanvas: HTMLCanvasElement): Promise<any> {
        // Playground snippets expect `engine` and `canvas` to exist as globals.
        const win = window as any;
        const prevEngine = win.engine;
        const prevCanvas = win.canvas;
        win.engine = previewEngine;
        win.canvas = previewCanvas;

        try {
            // Playground code typically defines `var createScene = function() { ... }`
            // We eval the code then call createScene.
            const createSceneFn = eval(code + "; typeof createScene !== 'undefined' ? createScene : null");
            if (!createSceneFn) {
                throw new Error("Snippet does not define a 'createScene' function");
            }

            const sceneOrPromise = createSceneFn();
            let scene;
            try {
                scene = await Promise.resolve(sceneOrPromise);
            } catch {
                scene = sceneOrPromise;
            }

            if (!scene || !scene.render) {
                throw new Error("createScene() did not return a valid Scene");
            }

            return scene;
        } finally {
            // Restore previous globals
            win.engine = prevEngine;
            win.canvas = prevCanvas;
        }
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
            const snippetPath = this._parseSnippetId(snippetId);
            const code = await this._fetchSnippetCodeAsync(snippetPath);

            // Dispose old preview context if any
            const oldCtx = this.props.globalState.sceneContext;
            if (oldCtx) {
                oldCtx.engine.stopRenderLoop();
                oldCtx.scene.dispose();
                oldCtx.engine.dispose();
                oldCtx.dispose();
            }

            // Create the preview engine targeting our canvas
            const canvas = this._canvasRef.current;
            if (!canvas) {
                throw new Error("Preview canvas not available");
            }

            // Use BABYLON from global (loaded via CDN in standalone, or available in embedded mode)
            const babylonGlobal = (window as any).BABYLON;
            if (!babylonGlobal || !babylonGlobal.Engine) {
                throw new Error("BABYLON engine not available");
            }

            const engine = new babylonGlobal.Engine(canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true,
            });

            const scene = await this._executePlaygroundCodeAsync(code, engine, canvas);

            // Start the render loop
            engine.runRenderLoop(() => {
                scene.render();
            });

            // Handle window resize
            const resizeHandler = () => engine.resize();
            window.addEventListener("resize", resizeHandler);
            scene.onDisposeObservable.addOnce(() => {
                window.removeEventListener("resize", resizeHandler);
            });

            // Build the scene context
            const sceneContext = new SceneContext(scene);
            this.props.globalState.sceneContext = sceneContext;
            this.props.globalState.snippetId = this.state.snippetId;
            this.props.globalState.onSceneContextChanged.notifyObservers(sceneContext);

            this.setState({
                isLoading: false,
                sceneObjectCount: sceneContext.entries.length,
            });

            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Loaded snippet with ${sceneContext.entries.length} scene objects`, false));
        } catch (err: any) {
            this.setState({
                isLoading: false,
                error: err.message || "Failed to load snippet",
            });

            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Failed to load snippet: ${err.message}`, true));
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
