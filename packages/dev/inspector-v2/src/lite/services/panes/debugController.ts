import {
    addToScene,
    createGridMaterial,
    createGround,
    createLineSystem,
    disposeMeshGpu,
    removeFromScene,
    setParent,
    updateLineSystem,
    type EngineContext,
    type Mesh,
    type SceneContext,
    type Vec3,
} from "@babylonjs/lite";

import { Observable } from "core/Misc/observable";

import { GetSceneContexts, InspectorBoundsHelpers } from "../../sceneEntityUtils";

const BoxEdges = [
    [0, 1],
    [1, 3],
    [3, 2],
    [2, 0],
    [4, 5],
    [5, 7],
    [7, 6],
    [6, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
] as const;

type Helpers = { grid?: Mesh; bounds: Map<Mesh, Mesh>; showBounds: boolean };

function GetBoundsLines(mesh: Mesh): Vec3[][] {
    const min = mesh.boundMin;
    const max = mesh.boundMax;
    if (!min || !max) {
        throw new Error("Mesh bounds are unavailable.");
    }
    const corners: Vec3[] = [];
    for (let index = 0; index < 8; index++) {
        const x = index & 1 ? max[0] : min[0];
        const y = index & 2 ? max[1] : min[1];
        const z = index & 4 ? max[2] : min[2];
        corners.push({ x, y, z });
    }
    return BoxEdges.map(([first, second]) => [corners[first], corners[second]]);
}

/**
 * Owns only the grid and bounding-box meshes created by one Lite Inspector.
 * @internal
 */
export class DebugController {
    /** Notifies mounted panes when helper state changes. */
    public readonly onChanged = new Observable<void>();
    /** The registered scene selected for helper controls. */
    public scene: SceneContext | undefined;
    /** The most recent helper failure, displayed by the pane. */
    public error: string | undefined;
    private readonly _helpers = new Map<SceneContext, Helpers>();
    private readonly _meshes = new Set<Mesh>();
    private _disposed = false;

    public constructor(private readonly _engine: EngineContext) {
        this.refresh();
    }

    /** Registered scene contexts on primary and auxiliary surfaces. */
    public get scenes(): readonly SceneContext[] {
        return GetSceneContexts(this._engine);
    }

    /** Whether the selected scene owns an Inspector ground grid. */
    public get gridEnabled(): boolean {
        return !!this.scene && !!this._helpers.get(this.scene)?.grid;
    }

    /** Whether the selected scene is maintaining Inspector bounding boxes. */
    public get boundsEnabled(): boolean {
        return !!this.scene && !!this._helpers.get(this.scene)?.showBounds;
    }

    /**
     * Selects a scene without changing other scenes' helper settings.
     * @param scene A registered scene context.
     */
    public selectScene(scene: SceneContext): void {
        if (!this.scenes.includes(scene)) {
            return;
        }
        this.scene = scene;
        this.error = undefined;
        this.onChanged.notifyObservers();
    }

    /**
     * Creates or releases the selected scene's non-pickable ground grid.
     * @param enabled Whether to show the grid.
     */
    public setGrid(enabled: boolean): void {
        const scene = this.scene;
        if (!scene || this._disposed) {
            return;
        }
        this.error = undefined;
        const helpers = this._getHelpers(scene);
        try {
            if (enabled && !helpers.grid) {
                const material = createGridMaterial({ opacity: 0.5, backFaceCulling: false, lineColor: [0.6, 0.6, 0.6] });
                const grid = createGround(this._engine, { width: 100, height: 100 });
                grid.name = "Inspector Ground Grid";
                grid.pickable = false;
                grid.material = material;
                this._meshes.add(grid);
                helpers.grid = grid;
                addToScene(scene, grid);
            } else if (!enabled && helpers.grid) {
                this._remove(scene, helpers.grid);
                helpers.grid = undefined;
            }
        } catch (error) {
            if (helpers.grid) {
                this._remove(scene, helpers.grid);
                helpers.grid = undefined;
            }
            this.error = `Ground grid failed: ${error instanceof Error ? error.message : String(error)}`;
        }
        this.onChanged.notifyObservers();
    }

    /**
     * Creates or releases transformed bounding-box helpers for the selected scene.
     * @param enabled Whether to maintain bounding boxes.
     */
    public setBounds(enabled: boolean): void {
        if (!this.scene || this._disposed) {
            return;
        }
        const helpers = this._getHelpers(this.scene);
        helpers.showBounds = enabled;
        this.error = undefined;
        this._refreshHelpers(this.scene, helpers);
        this.onChanged.notifyObservers();
    }

    /**
     * Captures helper membership, topology, visibility, and local bounds for watch-mode comparison.
     * @returns An ordered snapshot without references to mutable bounds arrays.
     */
    public getSnapshot(): readonly unknown[] {
        const snapshot: unknown[] = [];
        for (const scene of this.scenes) {
            snapshot.push(scene);
            const helpers = this._helpers.get(scene);
            if (!helpers || (!helpers.grid && !helpers.showBounds)) {
                continue;
            }
            const meshes = new Set(scene.meshes);
            if (helpers.grid) {
                snapshot.push(helpers.grid, meshes.has(helpers.grid));
            }
            if (!helpers.showBounds) {
                continue;
            }
            for (const box of helpers.bounds.values()) {
                snapshot.push(box, meshes.has(box));
            }
            for (const mesh of scene.meshes) {
                if (!this._meshes.has(mesh)) {
                    snapshot.push(mesh, mesh.visible, ...(mesh.boundMin ?? []), ...(mesh.boundMax ?? []));
                }
            }
        }
        return snapshot;
    }

    /** Updates bounds and releases helpers belonging to unregistered scenes. */
    public refresh(): void {
        if (this._disposed) {
            return;
        }
        const scenes = this.scenes;
        for (const [scene, helpers] of this._helpers) {
            if (!scenes.includes(scene)) {
                this._clear(scene, helpers);
                this._helpers.delete(scene);
            } else {
                this._refreshHelpers(scene, helpers);
            }
        }
        if (!this.scene || !scenes.includes(this.scene)) {
            this.scene = scenes[0];
        }
        this.onChanged.notifyObservers();
    }

    /** Releases only the meshes created by this Inspector. */
    public dispose(): void {
        this._disposed = true;
        for (const [scene, helpers] of this._helpers) {
            this._clear(scene, helpers);
        }
        this._helpers.clear();
        this.onChanged.clear();
    }

    private _getHelpers(scene: SceneContext): Helpers {
        let helpers = this._helpers.get(scene);
        if (!helpers) {
            helpers = { bounds: new Map(), showBounds: false };
            this._helpers.set(scene, helpers);
        }
        return helpers;
    }

    private _refreshHelpers(scene: SceneContext, helpers: Helpers): void {
        const meshes = new Set(scene.meshes);
        if (helpers.grid && !meshes.has(helpers.grid)) {
            this._meshes.delete(helpers.grid);
            helpers.grid = undefined;
        }
        for (const [source, box] of helpers.bounds) {
            if (!meshes.has(box)) {
                box.parent = null;
                this._meshes.delete(box);
                helpers.bounds.delete(source);
            } else if (!helpers.showBounds || !meshes.has(source) || !source.boundMin || !source.boundMax) {
                this._remove(scene, box, meshes);
                helpers.bounds.delete(source);
            }
        }
        if (!helpers.showBounds) {
            return;
        }
        try {
            // Only geometry and topology updates use the watch cadence; transforms stay live.
            for (const mesh of scene.meshes.slice()) {
                if (this._meshes.has(mesh) || !mesh.boundMin || !mesh.boundMax) {
                    continue;
                }
                const lines = GetBoundsLines(mesh);
                let box = helpers.bounds.get(mesh);
                if (!box) {
                    box = createLineSystem(this._engine, { name: `Inspector Bounds: ${mesh.name}`, lines, color: { r: 1, g: 0.7, b: 0, a: 1 } });
                    box.pickable = false;
                    InspectorBoundsHelpers.add(box);
                    this._meshes.add(box);
                    helpers.bounds.set(mesh, box);
                    // Inherit transforms without changing the application's node hierarchy.
                    box.parent = {
                        get worldMatrix() {
                            return mesh.worldMatrix;
                        },
                        get worldMatrixVersion() {
                            return mesh.worldMatrixVersion;
                        },
                    };
                    addToScene(scene, box);
                    meshes.add(box);
                } else {
                    updateLineSystem(this._engine, box, { lines });
                }
                box.visible = mesh.visible !== false;
            }
        } catch (error) {
            helpers.showBounds = false;
            for (const box of helpers.bounds.values()) {
                this._remove(scene, box, meshes);
            }
            helpers.bounds.clear();
            this.error = `Bounding boxes failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    private _remove(scene: SceneContext, mesh: Mesh, meshes?: ReadonlySet<Mesh>): void {
        // Lite removes children recursively; application-owned nodes must survive helper cleanup.
        for (const child of mesh.children.slice()) {
            setParent(child, null);
        }
        setParent(mesh, null);
        if (meshes ? meshes.has(mesh) : scene.meshes.includes(mesh)) {
            removeFromScene(scene, mesh);
        } else {
            disposeMeshGpu(mesh);
        }
        this._meshes.delete(mesh);
    }

    private _clear(scene: SceneContext, helpers: Helpers): void {
        const meshes = new Set(scene.meshes);
        if (helpers.grid) {
            this._remove(scene, helpers.grid, meshes);
        }
        for (const box of helpers.bounds.values()) {
            this._remove(scene, box, meshes);
        }
        helpers.bounds.clear();
    }
}
