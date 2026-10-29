import {
    type EngineContext,
    type Mesh,
    type SceneContext,
    type SceneNode,
    type PhysicsWorld,
    type PhysicsBody,
    type PhysicsConstraint,
    type PhysicsViewer,
    type PhysicsConstraintDebug,
    type PhysicsShape,
} from "@babylonjs/lite";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugController } from "../../src/lite/services/panes/debugController";
import { GetSceneNodes, InspectorBoundsHelpers, InspectorUtilityScenes, InspectorPhysicsHelpers } from "../../src/lite/sceneEntityUtils";

vi.hoisted(() => {
    vi.stubGlobal("GPUBufferUsage", { VERTEX: 32, INDEX: 16, COPY_DST: 8 });
});

const Physics = vi.hoisted(() => ({
    worlds: new Map<SceneContext, PhysicsWorld[]>(),
    bodies: new Map<PhysicsWorld, PhysicsBody[]>(),
    constraints: new Map<PhysicsWorld, PhysicsConstraint[]>(),
    shapes: new Map<PhysicsBody, PhysicsShape | null>(),
    childCounts: new Map<PhysicsShape, number>(),
    create: vi.fn(),
    dispose: vi.fn(),
    showBody: vi.fn(),
    hideBody: vi.fn(),
    showConstraint: vi.fn(),
    hideConstraint: vi.fn(),
    meshes: new Map<PhysicsViewer, Map<PhysicsBody | PhysicsConstraintDebug, Mesh[]>>(),
}));

const { Ground, GridMaterial, Lines, UpdateLines, Add, Remove, Dispose, Parent, Visibility } = vi.hoisted(() => ({
    Ground: vi.fn(),
    GridMaterial: vi.fn(),
    Lines: vi.fn(),
    UpdateLines: vi.fn(),
    Add: vi.fn(),
    Remove: vi.fn(),
    Dispose: vi.fn(),
    Parent: vi.fn(),
    Visibility: vi.fn(),
}));

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    createGround: Ground,
    createGridMaterial: GridMaterial,
    createLineSystem: Lines,
    updateLineSystem: UpdateLines,
    addToScene: Add,
    removeFromScene: Remove,
    disposeMeshGpu: Dispose,
    setParent: Parent,
    setSubtreeVisible: Visibility,
    getRenderingContexts: (surface: { contexts: SceneContext[] }) => surface.contexts,
    getRenderingContextKind: () => "scene",
    getPhysicsWorlds: (scene: SceneContext) => Physics.worlds.get(scene) ?? [],
    getPhysicsBodies: (world: PhysicsWorld) => Physics.bodies.get(world) ?? [],
    getPhysicsConstraints: (world: PhysicsWorld) => Physics.constraints.get(world) ?? [],
    getPhysicsBodyShape: (body: PhysicsBody) => Physics.shapes.get(body) ?? null,
    getPhysicsShapeType: (shape: { type?: number }) => shape.type ?? 3,
    getPhysicsShapeChildCount: (_world: PhysicsWorld, shape: PhysicsShape) => Physics.childCounts.get(shape) ?? 0,
    createPhysicsViewer: Physics.create,
    disposePhysicsViewer: Physics.dispose,
    showPhysicsBody: Physics.showBody,
    hidePhysicsBody: Physics.hideBody,
    showPhysicsConstraint: Physics.showConstraint,
    hidePhysicsConstraint: Physics.hideConstraint,
}));

const Identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function SourceMesh(name = "Mesh"): Mesh {
    return { name, children: [], worldMatrix: [...Identity], worldMatrixVersion: 0, boundMin: [-1, -1, -1], boundMax: [1, 1, 1], visible: true } as Mesh;
}

function Harness() {
    const scene = { meshes: [SourceMesh()], name: "Scene" } as SceneContext;
    const contexts = [scene];
    const engine = { contexts } as unknown as EngineContext;
    Object.assign(engine, { surfaces: [engine] });
    Object.assign(scene, { surface: engine });
    return { scene, contexts, engine, controller: new DebugController(engine) };
}

describe("Babylon Lite debug helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Ground.mockImplementation(() => SourceMesh("Grid"));
        GridMaterial.mockImplementation(() => ({}));
        Lines.mockImplementation(() => SourceMesh("Bounds"));
        Add.mockImplementation((scene: SceneContext, mesh: Mesh) => scene.meshes.push(mesh));
        Remove.mockImplementation((scene: SceneContext, mesh: Mesh) => {
            const index = scene.meshes.indexOf(mesh);
            if (index >= 0) {
                scene.meshes.splice(index, 1);
            }
            for (const child of mesh.children.slice()) {
                Remove(scene, child);
            }
        });
        Parent.mockImplementation((child: Mesh, parent: Mesh | null) => {
            const previous = child.parent;
            if (previous && "children" in previous && Array.isArray(previous.children)) {
                const index = previous.children.indexOf(child);
                if (index >= 0) {
                    previous.children.splice(index, 1);
                }
            }
            child.parent = parent;
            parent?.children.push(child);
        });
        Visibility.mockImplementation((node: SceneNode, visible: boolean) => {
            Object.assign(node, { visible });
            node.children.forEach((child) => Visibility(child, visible));
        });
        UpdateLines.mockReset();
        Physics.worlds.clear();
        Physics.bodies.clear();
        Physics.constraints.clear();
        Physics.shapes.clear();
        Physics.childCounts.clear();
        Physics.meshes.clear();
        Physics.create.mockImplementation((scene: SceneContext, world: PhysicsWorld) => {
            const viewer = { scene, world } as PhysicsViewer;
            Physics.meshes.set(viewer, new Map());
            return viewer;
        });
        const show = (viewer: PhysicsViewer, entity: PhysicsBody | PhysicsConstraintDebug) => {
            const mesh = SourceMesh("Physics Helper");
            Add(viewer.scene, mesh);
            Physics.meshes.get(viewer)!.set(entity, [mesh]);
            return [mesh];
        };
        const hide = (viewer: PhysicsViewer, entity: PhysicsBody | PhysicsConstraintDebug) => {
            for (const mesh of Physics.meshes.get(viewer)?.get(entity) ?? []) {
                Remove(viewer.scene, mesh);
            }
            Physics.meshes.get(viewer)?.delete(entity);
            return true;
        };
        Physics.showBody.mockImplementation((viewer: PhysicsViewer, body: PhysicsBody) => show(viewer, body)[0]);
        Physics.showConstraint.mockImplementation(show);
        Physics.hideBody.mockImplementation(hide);
        Physics.hideConstraint.mockImplementation(hide);
        Physics.dispose.mockImplementation((viewer: PhysicsViewer) => {
            for (const entity of Physics.meshes.get(viewer)?.keys() ?? []) {
                hide(viewer, entity);
            }
            Physics.meshes.delete(viewer);
        });
    });

    function PhysicsFixture() {
        const h = Harness();
        Object.assign(h.scene.meshes[0], { position: {}, rotationQuaternion: {}, scaling: {}, parent: null });
        const world = {} as PhysicsWorld;
        const body = { node: h.scene.meshes[0], motionType: 2 } as PhysicsBody;
        const other = { node: h.scene.meshes[0], motionType: 0 } as PhysicsBody;
        const constraint = { bodyA: body, bodyB: other, type: 3, options: {} } as PhysicsConstraint;
        Physics.worlds.set(h.scene, [world]);
        Physics.bodies.set(world, [body, other]);
        Physics.constraints.set(world, [constraint]);
        return { ...h, world, body, other, constraint };
    }

    it("uses independent body/constraint viewers per world, makes helpers non-pickable, and leaves steady state unchanged", () => {
        const h = PhysicsFixture();
        const world2 = {} as PhysicsWorld;
        Physics.worlds.get(h.scene)!.push(world2);
        Physics.bodies.set(world2, []);
        Physics.constraints.set(world2, []);
        h.controller.setPhysicsBodies(true);
        h.controller.setPhysicsConstraints(true);
        expect(Physics.create).toHaveBeenCalledTimes(4);
        expect(Physics.showBody).toHaveBeenCalledTimes(2);
        expect(Physics.showConstraint).toHaveBeenCalledOnce();
        expect(Physics.showBody.mock.calls[0][0]).not.toBe(Physics.showConstraint.mock.calls[0][0]);
        for (const mesh of h.scene.meshes.slice(1)) {
            expect(mesh.pickable).toBe(false);
            expect(InspectorPhysicsHelpers.has(mesh)).toBe(true);
            expect(GetSceneNodes(h.scene)).not.toContain(mesh);
        }
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledTimes(2);
        expect(Physics.showConstraint).toHaveBeenCalledOnce();
        expect(Physics.dispose).not.toHaveBeenCalled();
        h.controller.setPhysicsConstraints(false);
        expect(Physics.dispose).toHaveBeenCalledTimes(2);
        expect(h.controller.physicsBodiesEnabled).toBe(true);
        expect(h.controller.physicsConstraintsEnabled).toBe(false);
        h.controller.setPhysicsConstraints(true);
        h.controller.setPhysicsBodies(false);
        expect(h.controller.physicsConstraintsEnabled).toBe(true);
        expect(h.controller.physicsBodiesEnabled).toBe(false);
        h.controller.dispose();
        expect(h.scene.meshes).toHaveLength(1);
    });

    it("retries empty body geometry after shape attachment and rebuilds wireframes when the shape changes", () => {
        const h = PhysicsFixture();
        Physics.bodies.set(h.world, [h.body]);
        Physics.showBody.mockReturnValueOnce(null);
        h.controller.setPhysicsBodies(true);
        expect(Physics.showBody).toHaveBeenCalledOnce();
        expect(h.scene.meshes).toHaveLength(1);
        const beforeAttachment = h.controller.getSnapshot();

        const shape = {} as PhysicsShape;
        Physics.shapes.set(h.body, shape);
        expect(h.controller.getSnapshot()).not.toEqual(beforeAttachment);
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledTimes(2);
        expect(Physics.hideBody).not.toHaveBeenCalled();
        expect(h.scene.meshes).toHaveLength(2);
        const originalWireframe = h.scene.meshes[1];
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledTimes(2);

        const beforeReplacement = h.controller.getSnapshot();
        const replacement = {} as PhysicsShape;
        Physics.shapes.set(h.body, replacement);
        expect(beforeReplacement).not.toContain(replacement);
        expect(h.controller.getSnapshot()).toContain(replacement);
        h.controller.refresh();
        expect(Physics.hideBody).toHaveBeenCalledExactlyOnceWith(Physics.showBody.mock.calls[0][0], h.body);
        expect(Physics.showBody).toHaveBeenCalledTimes(3);
        expect(h.scene.meshes).toHaveLength(2);
        expect(h.scene.meshes).not.toContain(originalWireframe);
        expect(InspectorPhysicsHelpers.has(originalWireframe)).toBe(false);
        expect(Physics.dispose).not.toHaveBeenCalled();
        h.controller.dispose();
    });

    it("shares one scene membership set for physics pruning across worlds and viewer kinds", () => {
        const h = PhysicsFixture();
        const world2 = {} as PhysicsWorld;
        Physics.worlds.get(h.scene)!.push(world2);
        h.controller.setPhysicsBodies(true);
        h.controller.setPhysicsConstraints(true);
        const includes = vi.spyOn(h.scene.meshes, "includes");
        const iterator = vi.spyOn(h.scene.meshes, Symbol.iterator);
        h.controller.refresh();
        expect(includes).not.toHaveBeenCalled();
        // One set for the existing bounds refresh, one shared by all physics pruning.
        expect(iterator).toHaveBeenCalledTimes(2);
        iterator.mockRestore();
        includes.mockRestore();
        h.controller.dispose();
    });

    it("reconciles an initially empty container and rebuilds its wireframe after child additions without replacing the shape", () => {
        const h = PhysicsFixture();
        Physics.bodies.set(h.world, [h.body]);
        const shape = { type: 5 } as unknown as PhysicsShape;
        Physics.shapes.set(h.body, shape);
        Physics.showBody.mockReturnValueOnce(null);
        h.controller.setPhysicsBodies(true);
        const empty = h.controller.getSnapshot();
        Physics.childCounts.set(shape, 1);
        expect(h.controller.getSnapshot()).not.toEqual(empty);
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledTimes(2);
        const wireframe = h.scene.meshes[1];
        const populated = h.controller.getSnapshot();
        Physics.childCounts.set(shape, 2);
        expect(h.controller.getSnapshot()).not.toEqual(populated);
        h.controller.refresh();
        expect(Physics.hideBody).toHaveBeenCalledOnce();
        expect(Physics.showBody).toHaveBeenCalledTimes(3);
        expect(h.scene.meshes).not.toContain(wireframe);
        expect(InspectorPhysicsHelpers.has(wireframe)).toBe(false);
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledTimes(3);
        h.controller.dispose();
    });

    it("omits thin-instance wireframes, including a single thin instance, and removes an existing carrier wireframe", () => {
        const h = PhysicsFixture();
        Physics.bodies.set(h.world, [h.body]);
        h.controller.setPhysicsBodies(true);
        expect(Physics.showBody).toHaveBeenCalledOnce();
        const before = h.controller.getSnapshot();
        Object.assign(h.body.node, { thinInstances: { count: 1 } });
        expect(h.controller.getSnapshot()).not.toEqual(before);
        h.controller.refresh();
        expect(Physics.hideBody).toHaveBeenCalledOnce();
        expect(h.scene.meshes).toHaveLength(1);
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledOnce();
        Object.assign(h.body.node, { thinInstances: null });
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledTimes(2);
        h.controller.dispose();
    });

    it("tracks the real Lite constraint viewer's six unreturned arrowheads and excludes the complete group from discovery and bounds", async () => {
        const lite = await vi.importActual<typeof import("@babylonjs/lite")>("@babylonjs/lite");
        const h = PhysicsFixture();
        // Only GPU storage is faked; the viewer, mesh factories, scene insertion,
        // and viewer cleanup below are the real Lite implementations.
        Object.assign(h.engine, {
            _device: {
                createBuffer: ({ size }: { size: number }) => ({
                    size,
                    getMappedRange: () => new ArrayBuffer(size),
                    unmap: vi.fn(),
                    destroy: vi.fn(),
                }),
                queue: { writeBuffer: vi.fn() },
            },
        });
        Object.assign(h.scene, lite.createSceneContext({ engine: h.engine } as SceneContext["surface"], { defaultRenderTask: false }));
        const source = lite.createBox(h.engine);
        lite.addToScene(h.scene, source);
        Object.assign(h.body, { node: source, _world: h.world });
        Object.assign(h.other, { node: source, _world: h.world });
        Physics.create.mockImplementation(lite.createPhysicsViewer);
        Physics.showConstraint.mockImplementation(lite.showPhysicsConstraint);
        Physics.hideConstraint.mockImplementation(lite.hidePhysicsConstraint);
        Physics.dispose.mockImplementation(lite.disposePhysicsViewer);
        h.controller.setPhysicsConstraints(true);
        expect(h.controller.error).toBeUndefined();
        const meshes = h.scene.meshes.slice(1);
        expect(meshes).toHaveLength(13); // Six axes, six heads, one hinge disk.
        expect(meshes.filter((mesh) => mesh.name.endsWith("Head"))).toHaveLength(6);
        for (const mesh of meshes) {
            expect(InspectorPhysicsHelpers.has(mesh)).toBe(true);
            expect(mesh.pickable).toBe(false);
            expect(GetSceneNodes(h.scene)).not.toContain(mesh);
        }
        h.controller.setBounds(true);
        expect(Lines).toHaveBeenCalledOnce();
        Physics.constraints.set(h.world, []);
        h.controller.refresh();
        for (const mesh of meshes) {
            expect(h.scene.meshes).not.toContain(mesh);
            expect(InspectorPhysicsHelpers.has(mesh)).toBe(false);
        }
        expect(GetSceneNodes(h.scene)).toContain(source);
        h.controller.dispose();
    });

    it("hides constraints with removed bodies, shows them on re-add, and uses hide rather than recreating a viewer", () => {
        const h = PhysicsFixture();
        h.controller.setPhysicsBodies(true);
        h.controller.setPhysicsConstraints(true);
        const original = h.controller.getSnapshot();
        Physics.bodies.set(h.world, [h.body]);
        expect(h.controller.getSnapshot()).not.toEqual(original);
        h.controller.refresh();
        expect(Physics.hideBody).toHaveBeenCalledWith(Physics.showBody.mock.calls[0][0], h.other);
        expect(Physics.hideConstraint).toHaveBeenCalledOnce();
        expect(Physics.dispose).not.toHaveBeenCalled();
        expect(Physics.create).toHaveBeenCalledTimes(2);
        Physics.bodies.set(h.world, [h.body, h.other]);
        h.controller.refresh();
        expect(Physics.showConstraint).toHaveBeenCalledTimes(2);
        expect(Physics.showBody).toHaveBeenCalledTimes(3);
        Physics.constraints.set(h.world, []);
        h.controller.refresh();
        expect(Physics.hideConstraint).toHaveBeenCalledTimes(2);
        expect(Physics.create).toHaveBeenCalledTimes(2);
        h.controller.dispose();
    });

    it("never visualizes a dead constraint and disposes dead-world viewers before showing new worlds", () => {
        const h = PhysicsFixture();
        Physics.bodies.set(h.world, [h.body]);
        h.controller.setPhysicsConstraints(true);
        expect(Physics.showConstraint).not.toHaveBeenCalled();
        h.controller.setPhysicsBodies(true);
        Physics.worlds.set(h.scene, []);
        h.controller.refresh();
        expect(Physics.dispose).toHaveBeenCalledTimes(2);
        const world2 = {} as PhysicsWorld;
        Physics.worlds.set(h.scene, [world2]);
        Physics.bodies.set(world2, [h.body]);
        h.controller.refresh();
        expect(Physics.showBody).toHaveBeenCalledTimes(2);
        expect(Physics.showBody.mock.calls[1][0].world).toBe(world2);
        expect(Physics.dispose.mock.invocationCallOrder[1]).toBeLessThan(Physics.showBody.mock.invocationCallOrder[1]);
        h.controller.dispose();
    });

    it.each(["body", "constraint"])("rolls back a failed %s switch without disposing the other viewer and supports retry", (kind) => {
        const h = PhysicsFixture();
        h.controller.setPhysicsBodies(true);
        h.controller.setPhysicsConstraints(true);
        const setFailing = kind === "body" ? (enabled: boolean) => h.controller.setPhysicsBodies(enabled) : (enabled: boolean) => h.controller.setPhysicsConstraints(enabled);
        const getFailingEnabled = () => (kind === "body" ? h.controller.physicsBodiesEnabled : h.controller.physicsConstraintsEnabled);
        const getOtherEnabled = () => (kind === "body" ? h.controller.physicsConstraintsEnabled : h.controller.physicsBodiesEnabled);
        const failingShow = kind === "body" ? Physics.showBody : Physics.showConstraint;
        const otherViewer = (kind === "body" ? Physics.showConstraint : Physics.showBody).mock.calls[0][0];
        setFailing(false);
        failingShow.mockImplementationOnce(() => {
            throw new Error("Native debug failed");
        });
        setFailing(true);
        expect(getFailingEnabled()).toBe(false);
        expect(getOtherEnabled()).toBe(true);
        expect(Physics.dispose.mock.calls.some(([viewer]) => viewer === otherViewer)).toBe(false);
        expect(h.controller.error).toContain("Native debug failed");
        setFailing(true);
        expect(getFailingEnabled()).toBe(true);
        expect(h.controller.error).toBeUndefined();
        h.controller.dispose();
    });

    it("keeps physics switches disabled without worlds and cleans viewers after scene unregistration", () => {
        const h = PhysicsFixture();
        Physics.worlds.set(h.scene, []);
        h.controller.setPhysicsBodies(true);
        h.controller.setPhysicsConstraints(true);
        expect(Physics.create).not.toHaveBeenCalled();
        expect(h.controller.hasPhysicsWorlds).toBe(false);
        Physics.worlds.set(h.scene, [h.world]);
        h.controller.setPhysicsBodies(true);
        h.controller.setPhysicsConstraints(true);
        h.contexts.length = 0;
        h.controller.refresh();
        expect(Physics.dispose).toHaveBeenCalledTimes(2);
        expect(h.controller.scene).toBeUndefined();
        h.controller.dispose();
    });

    it("creates a non-pickable grid in the selected scene and only removes its own resources", () => {
        const h = Harness();
        const original = h.scene.meshes.slice();
        h.controller.setGrid(true);
        const grid = Add.mock.calls[0][1] as Mesh;
        expect(grid.pickable).toBe(false);
        expect(grid.name).toBe("Inspector Ground Grid");
        expect(Ground).toHaveBeenCalledWith(h.engine, { width: 100, height: 100 });
        h.controller.setGrid(true);
        expect(Ground).toHaveBeenCalledTimes(1);
        expect(h.controller.gridEnabled).toBe(true);
        h.controller.setGrid(false);
        expect(h.scene.meshes).toEqual(original);
        expect(h.controller.gridEnabled).toBe(false);
    });

    it("keeps all twelve box edges local and inherits live transforms without modifying source children", () => {
        const h = Harness();
        const mesh = h.scene.meshes[0];
        Object.assign(mesh, { worldMatrix: [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 10, 20, 30, 1] });
        h.controller.setGrid(true);
        h.controller.setBounds(true);
        expect(Lines).toHaveBeenCalledTimes(1);
        const options = Lines.mock.calls[0][1];
        expect(options.lines).toHaveLength(12);
        expect(options.lines[0]).toEqual([
            { x: -1, y: -1, z: -1 },
            { x: 1, y: -1, z: -1 },
        ]);
        const box = h.scene.meshes[2];
        expect(Visibility).toHaveBeenCalledWith(box, true);
        expect(box.pickable).toBe(false);
        expect(InspectorBoundsHelpers.has(box)).toBe(true);
        expect(InspectorBoundsHelpers.has(mesh)).toBe(false);
        expect(box.parent?.worldMatrix).toBe(mesh.worldMatrix);
        const snapshot = h.controller.getSnapshot();
        Object.assign(mesh, { worldMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -10, -20, -30, 1], worldMatrixVersion: 1 });
        expect(box.parent?.worldMatrix).toBe(mesh.worldMatrix);
        expect(box.parent?.worldMatrixVersion).toBe(1);
        expect(h.controller.getSnapshot()).toEqual(snapshot);
        expect(UpdateLines).not.toHaveBeenCalled();
        expect(mesh.children).toEqual([]);
        Object.assign(mesh, { visible: false });
        h.controller.refresh();
        expect(Visibility).toHaveBeenLastCalledWith(box, false);
        expect(box.visible).toBe(false);
        expect(Lines).toHaveBeenCalledTimes(1);
        expect(UpdateLines).toHaveBeenCalledTimes(1);
        Object.assign(mesh, { visible: true });
        h.controller.refresh();
        expect(Visibility).toHaveBeenLastCalledWith(box, true);
        expect(box.visible).toBe(true);
        h.controller.setBounds(false);
        expect(box.parent).toBeNull();
        expect(h.scene.meshes).toHaveLength(2);
        h.controller.dispose();
        expect(h.scene.meshes).toEqual([mesh]);
    });

    it("uses the supported visibility setter without assigning a readonly helper property", () => {
        const h = Harness();
        h.controller.setBounds(true);
        const source = h.scene.meshes[0];
        const helper = h.scene.meshes[1];
        Object.defineProperty(helper, "visible", {
            get: () => true,
            set: () => {
                throw new Error("Direct helper visibility assignment");
            },
        });
        Visibility.mockImplementation(() => undefined);
        Object.assign(source, { visible: false });
        expect(() => h.controller.refresh()).not.toThrow();
        expect(Visibility).toHaveBeenLastCalledWith(helper, false);
        Object.assign(source, { visible: undefined });
        h.controller.refresh();
        expect(Visibility).toHaveBeenLastCalledWith(helper, true);
        h.controller.dispose();
    });

    it("adds and removes bounds as mesh topology changes and releases helpers when their scene is unregistered", () => {
        const h = Harness();
        h.controller.setBounds(true);
        const mesh = SourceMesh("Added");
        h.scene.meshes.push(mesh);
        h.controller.refresh();
        expect(Lines).toHaveBeenCalledTimes(2);
        h.scene.meshes.splice(h.scene.meshes.indexOf(mesh), 1);
        h.controller.refresh();
        expect(Remove).toHaveBeenCalledTimes(1);
        h.contexts.length = 0;
        h.controller.refresh();
        expect(h.controller.scene).toBeUndefined();
        expect(Remove).toHaveBeenCalledTimes(2);
    });

    it("keeps helper settings independent across scenes and handles an auxiliary surface", () => {
        const h = Harness();
        h.controller.setGrid(true);
        const auxiliaryScene = { meshes: [SourceMesh("Auxiliary")] } as SceneContext;
        const surface = { contexts: [auxiliaryScene] };
        Object.assign(auxiliaryScene, { surface });
        Object.assign(h.engine, { surfaces: [h.engine, surface] });
        h.controller.refresh();
        h.controller.selectScene(auxiliaryScene);
        expect(h.controller.gridEnabled).toBe(false);
        h.controller.setBounds(true);
        expect(Add.mock.calls[1][0]).toBe(auxiliaryScene);
        h.controller.selectScene(h.scene);
        expect(h.controller.gridEnabled).toBe(true);
        expect(h.controller.boundsEnabled).toBe(false);
        h.controller.dispose();
        expect(h.scene.meshes).toHaveLength(1);
        expect(auxiliaryScene.meshes).toHaveLength(1);
    });

    it("excludes Inspector gizmo overlays from helper controls without hiding application utility scenes", () => {
        const h = Harness();
        const gizmoScene = { name: "UtilityLayer", meshes: [SourceMesh("Gizmo")], surface: h.engine } as SceneContext;
        const applicationScene = { name: "UtilityLayer", meshes: [SourceMesh("Application")], surface: h.engine } as SceneContext;
        InspectorUtilityScenes.add(gizmoScene);
        h.contexts.push(gizmoScene, applicationScene);
        h.controller.refresh();

        expect(h.controller.scenes).toEqual([h.scene, applicationScene]);
        h.controller.selectScene(gizmoScene);
        expect(h.controller.scene).toBe(h.scene);
        h.controller.setBounds(true);
        expect(Add.mock.calls[0][0]).toBe(h.scene);
        expect(gizmoScene.meshes).toHaveLength(1);
        h.controller.selectScene(applicationScene);
        h.controller.setGrid(true);
        expect(Add.mock.calls[1][0]).toBe(applicationScene);
        h.controller.dispose();
        expect(gizmoScene.meshes).toHaveLength(1);
        expect(applicationScene.meshes).toHaveLength(1);
    });

    it("snapshots topology and local bounds only while bound helpers are enabled", () => {
        const h = Harness();
        Object.assign(h.scene.meshes[0], { worldMatrix: Object.assign({ length: 16 }, Identity) });
        expect(h.controller.getSnapshot()).toEqual([h.scene]);
        h.controller.setBounds(true);
        const initial = h.controller.getSnapshot();
        h.scene.meshes[0].boundMin![0] = -2;
        expect(h.controller.getSnapshot()).not.toEqual(initial);
        h.controller.setBounds(false);
        expect(h.controller.getSnapshot()).toEqual([h.scene]);
    });

    it.each(["grid", "bounds"] as const)("reconciles an externally removed %s without reusing the removed mesh", (kind) => {
        const h = Harness();
        h.controller.setGrid(true);
        h.controller.setBounds(true);
        const helper = h.scene.meshes[kind === "grid" ? 1 : 2];
        const snapshot = h.controller.getSnapshot();
        Remove(h.scene, helper);
        expect(h.controller.getSnapshot()).not.toEqual(snapshot);
        h.controller.refresh();
        if (kind === "grid") {
            expect(h.controller.gridEnabled).toBe(false);
            expect(Ground).toHaveBeenCalledTimes(1);
        } else {
            expect(h.controller.boundsEnabled).toBe(true);
            expect(Lines).toHaveBeenCalledTimes(2);
            expect(h.scene.meshes.find((mesh) => mesh.name.startsWith("Inspector Bounds:"))).not.toBe(helper);
        }
        h.controller.refresh();
        expect(UpdateLines.mock.calls.every((call) => call[1] !== helper)).toBe(true);
        expect(Dispose).not.toHaveBeenCalledWith(helper);
    });

    it("checks mesh membership without rescanning the scene for each bounding box", () => {
        const h = Harness();
        h.scene.meshes.push(...Array.from({ length: 200 }, (_, index) => SourceMesh(`Mesh ${index}`)));
        h.controller.setBounds(true);
        const includes = vi.spyOn(h.scene.meshes, "includes");
        try {
            h.controller.refresh();
            expect(UpdateLines).toHaveBeenCalledTimes(201);
            expect(includes).not.toHaveBeenCalled();
        } finally {
            includes.mockRestore();
        }
    });

    it.each(["disable", "dispose"] as const)("detaches application children before %s removes helpers recursively", (action) => {
        const h = Harness();
        const source = h.scene.meshes[0];
        const descendant = SourceMesh("Descendant");
        h.scene.meshes.push(descendant);
        source.children.push(descendant);
        descendant.parent = source;
        h.controller.setGrid(true);
        const grid = h.scene.meshes[2];
        grid.children.push(source);
        source.parent = grid;
        if (action === "disable") {
            h.controller.setGrid(false);
        } else {
            h.controller.dispose();
        }
        expect(Parent).toHaveBeenCalledWith(source, null);
        expect(source.parent).toBeNull();
        expect(source.children).toEqual([descendant]);
        expect(descendant.parent).toBe(source);
        expect(h.scene.meshes).toEqual([source, descendant]);
        expect(Remove).toHaveBeenCalledTimes(1);
        expect(Remove).toHaveBeenCalledWith(h.scene, grid);
    });

    it("surfaces helper failures and cleans up partially created bounding boxes", () => {
        const h = Harness();
        h.scene.meshes.push(SourceMesh("Second"));
        Lines.mockImplementationOnce(() => SourceMesh("Bounds")).mockImplementationOnce(() => {
            throw new Error("Line creation failed");
        });
        h.controller.setBounds(true);
        expect(h.controller.error).toContain("Line creation failed");
        expect(h.controller.boundsEnabled).toBe(false);
        expect(h.scene.meshes).toHaveLength(2);
        expect(Remove).toHaveBeenCalledTimes(1);
        GridMaterial.mockImplementationOnce(() => {
            throw new Error("Material creation failed");
        });
        h.controller.setGrid(true);
        expect(h.controller.error).toContain("Material creation failed");
        expect(Ground).not.toHaveBeenCalled();
    });
});
