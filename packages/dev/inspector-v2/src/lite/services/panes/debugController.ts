import {
    addToScene,
    createGridMaterial,
    createGround,
    createLineSystem,
    disposeMeshGpu,
    removeFromScene,
    setParent,
    setSubtreeVisible,
    updateLineSystem,
    createPhysicsViewer,
    disposePhysicsViewer,
    showPhysicsBody,
    hidePhysicsBody,
    showPhysicsConstraint,
    hidePhysicsConstraint,
    getPhysicsConstraintDebug,
    getPhysicsBodyShape,
    getPhysicsShapeType,
    getPhysicsShapeChildCount,
    getPhysicsWorlds,
    getPhysicsBodies,
    getPhysicsConstraints,
    PhysicsShapeType,
    type EngineContext,
    type Mesh,
    type SceneContext,
    type Vec3,
    type PhysicsWorld,
    type PhysicsBody,
    type PhysicsConstraint,
    type PhysicsViewer,
    type PhysicsShape,
} from "@babylonjs/lite";

import { Observable } from "core/Misc/observable";

import { GetSceneContexts, InspectorBoundsHelpers, InspectorPhysicsHelpers } from "../../sceneEntityUtils";
import { GetScenePhysicsWorlds } from "../../physicsUtils";

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

// Retain shape identity only to invalidate helper geometry, never for native reads.
type BodyGeometry = { shape: PhysicsShape | null; children: number };
type BodyViewer = { viewer: PhysicsViewer; entities: Map<PhysicsBody, BodyGeometry>; meshes: Set<Mesh> };
type ConstraintViewer = { viewer: PhysicsViewer; entities: Set<PhysicsConstraint>; meshes: Set<Mesh> };
type Helpers = {
    grid?: Mesh;
    bounds: Map<Mesh, Mesh>;
    showBounds: boolean;
    physicsBodies: boolean;
    physicsConstraints: boolean;
    bodyViewers: Map<PhysicsWorld, BodyViewer>;
    constraintViewers: Map<PhysicsWorld, ConstraintViewer>;
};

function IsThinBody(body: PhysicsBody): boolean {
    return "thinInstances" in body.node && !!body.node.thinInstances;
}

function CaptureMembership<T>(values: readonly T[]) {
    const members = new Set(values);
    const indices = new Map<T, number>();
    values.forEach((value, index) => indices.set(value, index));
    // Lite's registration lists mutate in place. Check the captured slot as well:
    // a synchronous scene-change listener may release physics during viewer changes.
    // Shifted live entries are conservatively deferred until the next fresh capture.
    return { members, has: (value: T) => members.has(value) && values[indices.get(value)!] === value };
}

function GetBodyGeometry(world: PhysicsWorld, body: PhysicsBody): BodyGeometry {
    const shape = getPhysicsBodyShape(body);
    return { shape, children: shape && getPhysicsShapeType(shape) === PhysicsShapeType.CONTAINER ? getPhysicsShapeChildCount(world, shape) : 0 };
}

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
 * Owns only the grid, bounding-box and physics helpers created by one Lite Inspector.
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

    /** Whether the selected scene maintains body visualization. */
    public get physicsBodiesEnabled(): boolean {
        return !!this.scene && !!this._helpers.get(this.scene)?.physicsBodies;
    }

    /** Whether the selected scene maintains constraint visualization independently of bodies. */
    public get physicsConstraintsEnabled(): boolean {
        return !!this.scene && !!this._helpers.get(this.scene)?.physicsConstraints;
    }

    /** Whether the selected scene has any live physics worlds. */
    public get hasPhysicsWorlds(): boolean {
        return !!this.scene && GetScenePhysicsWorlds(this.scene).length > 0;
    }

    /**
     * Toggles body visualization without disturbing constraint viewers.
     * @param enabled Whether to show physics bodies.
     */
    public setPhysicsBodies(enabled: boolean): void {
        this._setPhysics("physicsBodies", enabled);
    }

    /**
     * Toggles constraint visualization without disturbing body viewers.
     * @param enabled Whether to show live constraints.
     */
    public setPhysicsConstraints(enabled: boolean): void {
        this._setPhysics("physicsConstraints", enabled);
    }

    private _setPhysics(kind: "physicsBodies" | "physicsConstraints", enabled: boolean): void {
        const scene = this.scene;
        if (!scene || this._disposed || (enabled && !this.hasPhysicsWorlds)) {
            return;
        }
        const helpers = this._getHelpers(scene);
        helpers[kind] = enabled;
        this.error = undefined;
        this._refreshPhysics(scene, helpers, kind);
        this._pruneScenePhysicsMeshes(scene, helpers);
        this.onChanged.notifyObservers();
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
            const worlds = CaptureMembership(getPhysicsWorlds(scene));
            for (const world of worlds.members) {
                if (!worlds.has(world)) {
                    continue;
                }
                const bodies = CaptureMembership(getPhysicsBodies(world));
                const constraints = getPhysicsConstraints(world).filter((constraint) => bodies.has(constraint.bodyA) && bodies.has(constraint.bodyB));
                snapshot.push(world, ...bodies.members, ...constraints);
                // Shape discovery is JS-only; a later attachment/replacement must trigger reconciliation.
                for (const body of bodies.members) {
                    snapshot.push(getPhysicsBodyShape(body), IsThinBody(body));
                    if (helpers?.physicsBodies && !IsThinBody(body) && worlds.has(world) && bodies.has(body)) {
                        try {
                            snapshot.push(GetBodyGeometry(world, body).children);
                        } catch (error) {
                            // Reconciliation reports native failures and releases the viewer.
                            snapshot.push(`Physics geometry failed: ${error instanceof Error ? error.message : String(error)}`);
                        }
                    }
                }
            }
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
                this._refreshPhysics(scene, helpers, "physicsBodies");
                this._refreshPhysics(scene, helpers, "physicsConstraints");
                this._pruneScenePhysicsMeshes(scene, helpers);
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
            helpers = { bounds: new Map(), showBounds: false, physicsBodies: false, physicsConstraints: false, bodyViewers: new Map(), constraintViewers: new Map() };
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
                if (this._meshes.has(mesh) || InspectorPhysicsHelpers.has(mesh) || !mesh.boundMin || !mesh.boundMax) {
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
                setSubtreeVisible(box, mesh.visible !== false);
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
        this._clearViewers(helpers.bodyViewers);
        this._clearViewers(helpers.constraintViewers);
        const meshes = new Set(scene.meshes);
        if (helpers.grid) {
            this._remove(scene, helpers.grid, meshes);
        }
        for (const box of helpers.bounds.values()) {
            this._remove(scene, box, meshes);
        }
        helpers.bounds.clear();
    }

    private _releaseViewer(entry: BodyViewer | ConstraintViewer): void {
        disposePhysicsViewer(entry.viewer);
        for (const mesh of entry.meshes) {
            this._meshes.delete(mesh);
            InspectorPhysicsHelpers.delete(mesh);
        }
    }

    private _clearViewers(viewers: Map<PhysicsWorld, BodyViewer> | Map<PhysicsWorld, ConstraintViewer>): void {
        for (const entry of viewers.values()) {
            this._releaseViewer(entry);
        }
        viewers.clear();
    }

    private _trackPhysicsMeshes(entry: BodyViewer | ConstraintViewer, meshes: readonly Mesh[]): void {
        for (const mesh of meshes) {
            mesh.pickable = false;
            entry.meshes.add(mesh);
            this._meshes.add(mesh);
            InspectorPhysicsHelpers.add(mesh);
        }
    }

    private _pruneScenePhysicsMeshes(scene: SceneContext, helpers: Helpers): void {
        if (!helpers.bodyViewers.size && !helpers.constraintViewers.size) {
            return;
        }
        // Share one membership lookup across both viewer kinds and every world, after reconciliation.
        const meshes = new Set(scene.meshes);
        for (const entry of helpers.bodyViewers.values()) {
            this._prunePhysicsMeshes(meshes, entry);
        }
        for (const entry of helpers.constraintViewers.values()) {
            this._prunePhysicsMeshes(meshes, entry);
        }
    }

    private _prunePhysicsMeshes(meshes: ReadonlySet<Mesh>, entry: BodyViewer | ConstraintViewer): void {
        for (const mesh of entry.meshes) {
            if (!meshes.has(mesh)) {
                entry.meshes.delete(mesh);
                this._meshes.delete(mesh);
                InspectorPhysicsHelpers.delete(mesh);
            }
        }
    }

    private _refreshPhysics(scene: SceneContext, helpers: Helpers, kind: "physicsBodies" | "physicsConstraints"): void {
        const viewers = kind === "physicsBodies" ? helpers.bodyViewers : helpers.constraintViewers;
        try {
            const worlds = CaptureMembership(getPhysicsWorlds(scene));
            // Cleanup is JS-only and remains safe after native world/body/constraint release.
            for (const [world, entry] of viewers) {
                if (!helpers[kind] || !worlds.has(world)) {
                    this._releaseViewer(entry);
                    viewers.delete(world);
                }
            }
            if (!helpers[kind]) {
                return;
            }
            for (const world of worlds.members) {
                if (!worlds.has(world)) {
                    continue;
                }
                const bodies = CaptureMembership(getPhysicsBodies(world));
                const isBodyLive = (body: PhysicsBody) => worlds.has(world) && bodies.has(body);
                if (kind === "physicsBodies") {
                    let entry = helpers.bodyViewers.get(world);
                    if (!entry) {
                        entry = { viewer: createPhysicsViewer(scene, world), entities: new Map(), meshes: new Set() };
                        helpers.bodyViewers.set(world, entry);
                    }
                    if (!entry) {
                        continue;
                    }
                    for (const [body, geometry] of entry.entities) {
                        const live = isBodyLive(body) && !IsThinBody(body);
                        const current = live ? GetBodyGeometry(world, body) : undefined;
                        if (!current || current.shape !== geometry.shape || current.children !== geometry.children) {
                            hidePhysicsBody(entry.viewer, body);
                            entry.entities.delete(body);
                        }
                    }
                    for (const body of bodies.members) {
                        if (!entry.entities.has(body) && !IsThinBody(body) && isBodyLive(body)) {
                            const geometry = GetBodyGeometry(world, body);
                            const mesh = showPhysicsBody(entry.viewer, body);
                            if (mesh) {
                                this._trackPhysicsMeshes(entry, [mesh]);
                                entry.entities.set(body, geometry);
                            }
                        }
                    }
                } else {
                    const constraints = CaptureMembership(getPhysicsConstraints(world));
                    const isConstraintLive = (constraint: PhysicsConstraint) => constraints.has(constraint) && isBodyLive(constraint.bodyA) && isBodyLive(constraint.bodyB);
                    let entry = helpers.constraintViewers.get(world);
                    if (!entry) {
                        entry = { viewer: createPhysicsViewer(scene, world), entities: new Set(), meshes: new Set() };
                        helpers.constraintViewers.set(world, entry);
                    }
                    if (!entry) {
                        continue;
                    }
                    for (const constraint of entry.entities) {
                        if (!isConstraintLive(constraint)) {
                            hidePhysicsConstraint(entry.viewer, getPhysicsConstraintDebug(constraint));
                            entry.entities.delete(constraint);
                        }
                    }
                    const pending = [...constraints.members].filter((constraint) => !entry.entities.has(constraint) && isConstraintLive(constraint));
                    if (pending.length) {
                        // Lite omits six arrowheads from each returned mesh group.
                        // Capture one combined synchronous delta per world batch, including
                        // partial creation on failure, without private fields or mesh names.
                        const before = new Set(scene.meshes);
                        try {
                            for (const constraint of pending) {
                                if (isConstraintLive(constraint)) {
                                    showPhysicsConstraint(entry.viewer, getPhysicsConstraintDebug(constraint));
                                    entry.entities.add(constraint);
                                }
                            }
                        } finally {
                            this._trackPhysicsMeshes(
                                entry,
                                scene.meshes.filter((mesh) => !before.has(mesh))
                            );
                        }
                    }
                }
            }
        } catch (error) {
            helpers[kind] = false;
            this._clearViewers(viewers);
            this.error = `${kind === "physicsBodies" ? "Physics bodies" : "Physics constraints"} failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
