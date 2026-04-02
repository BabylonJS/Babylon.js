import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { type Engine } from "core/Engines/engine";
import { SceneContext } from "../../sceneContext";
import { LogEntry } from "../log/logComponent";
import { LoadSnippet, type IPlaygroundSnippetResult } from "@tools/snippet-loader";

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

        // Create a default scene so the editor is usable without a snippet
        if (!this.props.globalState.sceneContext && !this.props.globalState.snippetId) {
            void this._createDefaultSceneAsync();
        }
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
     * Dispose the previous preview engine/scene/context so a new one can be created.
     * Also clears the sceneContext reference on globalState to avoid stale pointers.
     */
    private _disposeCurrentScene() {
        const oldCtx = this.props.globalState.sceneContext;
        if (oldCtx) {
            oldCtx.engine.stopRenderLoop();
            oldCtx.scene.dispose();
            oldCtx.engine.dispose();
            oldCtx.dispose();
            this.props.globalState.sceneContext = null;
        }
    }

    /**
     * Start the render loop on the given engine and wire up resize handling.
     * @param scene - the Babylon.js scene to render
     * @param engine - the engine to run the render loop on
     */
    private _setupEngineRenderLoop(scene: Scene, engine: { runRenderLoop: Engine["runRenderLoop"]; resize: Engine["resize"] }) {
        engine.runRenderLoop(() => {
            if (scene.activeCamera || (scene.activeCameras && scene.activeCameras.length > 0)) {
                scene.render();
            }
        });

        engine.resize();

        const canvas = this._canvasRef.current;
        const resizeHandler = () => engine.resize();
        window.addEventListener("resize", resizeHandler);

        let resizeObserver: ResizeObserver | null = null;
        if (canvas?.parentElement) {
            resizeObserver = new ResizeObserver(resizeHandler);
            resizeObserver.observe(canvas.parentElement);
        }

        scene.onDisposeObservable.addOnce(() => {
            window.removeEventListener("resize", resizeHandler);
            resizeObserver?.disconnect();
        });
    }

    /**
     * Build a SceneContext and publish it to the editor.
     * @param scene - the scene to wrap in a SceneContext
     * @returns the newly created SceneContext
     */
    private _publishSceneContext(scene: Scene) {
        const sceneContext = new SceneContext(scene);
        this.props.globalState.sceneContext = sceneContext;
        this.props.globalState.onSceneContextChanged.notifyObservers(sceneContext);
        this.setState({ sceneObjectCount: sceneContext.entries.length });
        return sceneContext;
    }

    /**
     * Create a minimal default scene so users can start building flow graphs immediately.
     */
    private async _createDefaultSceneAsync() {
        const canvas = this._canvasRef.current;
        if (!canvas) {
            return;
        }

        try {
            // Dynamic imports — these resolve to the BABYLON global via webpack externals
            const { Engine } = await import("core/Engines/engine");
            const { Scene } = await import("core/scene");
            const { ArcRotateCamera } = await import("core/Cameras/arcRotateCamera");
            const { HemisphericLight } = await import("core/Lights/hemisphericLight");
            const { Vector3 } = await import("core/Maths/math.vector");
            const { Color3 } = await import("core/Maths/math.color");
            const { CreateBox } = await import("core/Meshes/Builders/boxBuilder");
            const { CreateSphere } = await import("core/Meshes/Builders/sphereBuilder");
            const { CreateGround } = await import("core/Meshes/Builders/groundBuilder");
            const { CreateCylinder } = await import("core/Meshes/Builders/cylinderBuilder");
            const { StandardMaterial } = await import("core/Materials/standardMaterial");

            this._disposeCurrentScene();

            const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
            const scene = new Scene(engine);

            // Camera
            const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 3, 10, Vector3.Zero(), scene);
            camera.attachControl(canvas, true);
            camera.lowerRadiusLimit = 2;

            // Light
            const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
            light.intensity = 0.8;

            // Ground
            const ground = CreateGround("ground", { width: 8, height: 8 }, scene);
            const groundMat = new StandardMaterial("groundMat", scene);
            groundMat.diffuseColor = new Color3(0.3, 0.3, 0.3);
            groundMat.specularColor = new Color3(0, 0, 0);
            ground.material = groundMat;
            ground.receiveShadows = true;

            // Box
            const box = CreateBox("box", { size: 1 }, scene);
            box.position = new Vector3(-1.5, 0.5, 0);
            const boxMat = new StandardMaterial("boxMat", scene);
            boxMat.diffuseColor = new Color3(0.2, 0.5, 0.8);
            box.material = boxMat;

            // Sphere
            const sphere = CreateSphere("sphere", { diameter: 1, segments: 16 }, scene);
            sphere.position = new Vector3(0, 0.5, 0);
            const sphereMat = new StandardMaterial("sphereMat", scene);
            sphereMat.diffuseColor = new Color3(0.8, 0.3, 0.2);
            sphere.material = sphereMat;

            // Cylinder
            const cylinder = CreateCylinder("cylinder", { diameter: 0.8, height: 1 }, scene);
            cylinder.position = new Vector3(1.5, 0.5, 0);
            const cylMat = new StandardMaterial("cylinderMat", scene);
            cylMat.diffuseColor = new Color3(0.3, 0.7, 0.3);
            cylinder.material = cylMat;

            this._setupEngineRenderLoop(scene, engine);

            const sceneContext = this._publishSceneContext(scene);
            this.props.globalState.onLogRequiredObservable.notifyObservers(
                new LogEntry(
                    `Default scene created with ${sceneContext.entries.length} objects. Drop a .glb/.gltf/.babylon file or load a Playground snippet to replace it.`,
                    false
                )
            );
        } catch (err: any) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Failed to create default scene: ${err.message}`, true));
        }
    }

    /**
     * Load a scene from a dropped file (glb, gltf, or babylon).
     * @param file - the main scene file
     * @param companionFiles - additional files dropped alongside (bin, textures)
     */
    private async _loadFileAsync(file: File, companionFiles?: File[]) {
        if (this.state.isLoading) {
            return; // Prevent concurrent loads
        }
        this.setState({ isLoading: true, error: "" });

        const registeredFiles: string[] = [];
        try {
            const { Engine } = await import("core/Engines/engine");
            const { SceneLoader } = await import("core/Loading/sceneLoader");
            const { FilesInputStore } = await import("core/Misc/filesInputStore");

            const canvas = this._canvasRef.current;
            if (!canvas) {
                throw new Error("Preview canvas not available");
            }

            this._disposeCurrentScene();

            const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

            // Register the main file and any companion files in Babylon's virtual file system
            const mainKey = file.name.toLowerCase();
            FilesInputStore.FilesToLoad[mainKey] = file;
            registeredFiles.push(mainKey);
            if (companionFiles) {
                for (const companion of companionFiles) {
                    const key = companion.name.toLowerCase();
                    FilesInputStore.FilesToLoad[key] = companion;
                    registeredFiles.push(key);
                }
            }

            const scene = await SceneLoader.LoadAsync("file:", file.name, engine);

            if (!scene || !scene.render) {
                throw new Error("Failed to load scene from file");
            }

            // If the loaded scene has no camera, create a default one
            if (!scene.activeCamera && scene.cameras.length === 0) {
                const { ArcRotateCamera } = await import("core/Cameras/arcRotateCamera");
                const { Vector3 } = await import("core/Maths/math.vector");
                const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 3, 10, Vector3.Zero(), scene);
                camera.attachControl(canvas, true);
            }

            this._setupEngineRenderLoop(scene, engine);

            await scene.whenReadyAsync(true);

            const sceneContext = this._publishSceneContext(scene);
            this.props.globalState.snippetId = "";

            this.setState({ isLoading: false, snippetId: "" });
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Loaded "${file.name}" with ${sceneContext.entries.length} scene objects`, false));
        } catch (err: any) {
            // Clean up registered files on failure
            try {
                const { FilesInputStore } = await import("core/Misc/filesInputStore");
                for (const key of registeredFiles) {
                    delete FilesInputStore.FilesToLoad[key];
                }
            } catch {
                // FilesInputStore import may itself fail — nothing to clean up
            }
            this.setState({
                isLoading: false,
                error: err.message || "Failed to load file",
            });
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Failed to load file: ${err.message}`, true));
            this.props.globalState.onSceneContextChanged.notifyObservers(null);
        }
    }

    private _handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    private _handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.state.isLoading) {
            return; // Don't start a new load while one is in progress
        }

        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) {
            return;
        }

        // Find the first supported 3D file
        const supportedExtensions = [".glb", ".gltf", ".babylon"];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const name = file.name.toLowerCase();
            if (supportedExtensions.some((ext) => name.endsWith(ext))) {
                // Collect companion files (bin, textures) to register in the virtual FS
                const companions: File[] = [];
                for (let j = 0; j < files.length; j++) {
                    if (j !== i) {
                        companions.push(files[j]);
                    }
                }
                void this._loadFileAsync(file, companions);
                return;
            }
        }

        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Unsupported file format. Drop a .glb, .gltf, or .babylon file.", true));
    };

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
            this._disposeCurrentScene();

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

            // Start the render loop with resize handling
            this._setupEngineRenderLoop(scene, engine);

            scene.onDisposeObservable.addOnce(() => {
                window.removeEventListener("unhandledrejection", rejectionHandler);
            });

            // Wait for the scene to finish loading all pending data (e.g.
            // async SceneLoader.Append / ImportMesh calls inside the snippet)
            // and for render targets to be ready (needed for pointer picking)
            // before cataloguing objects and wiring the flow graph.
            await scene.whenReadyAsync(true);

            // Build the scene context
            const sceneContext = this._publishSceneContext(scene);
            this.props.globalState.snippetId = this.state.snippetId;

            this.setState({ isLoading: false });

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
                <div className="preview-canvas-container" onDragOver={this._handleDragOver} onDrop={this._handleDrop}>
                    <canvas ref={this._canvasRef} className="preview-canvas" />
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
