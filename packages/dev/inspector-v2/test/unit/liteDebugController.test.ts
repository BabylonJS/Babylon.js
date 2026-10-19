import { type EngineContext, type Mesh, type SceneContext } from "@babylonjs/lite";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugController } from "../../src/lite/services/panes/debugController";

const { Ground, GridMaterial, Lines, UpdateLines, Add, Remove, Dispose } = vi.hoisted(() => ({
    Ground: vi.fn(),
    GridMaterial: vi.fn(),
    Lines: vi.fn(),
    UpdateLines: vi.fn(),
    Add: vi.fn(),
    Remove: vi.fn(),
    Dispose: vi.fn(),
}));

vi.mock("@babylonjs/lite", () => ({
    createGround: Ground,
    createGridMaterial: GridMaterial,
    createLineSystem: Lines,
    updateLineSystem: UpdateLines,
    addToScene: Add,
    removeFromScene: Remove,
    disposeMeshGpu: Dispose,
    getRenderingContexts: (surface: { contexts: SceneContext[] }) => surface.contexts,
    getRenderingContextKind: () => "scene",
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
        Ground.mockImplementation(() => ({}));
        GridMaterial.mockImplementation(() => ({}));
        Lines.mockImplementation(() => ({}));
        Add.mockImplementation((scene: SceneContext, mesh: Mesh) => scene.meshes.push(mesh));
        Remove.mockImplementation((scene: SceneContext, mesh: Mesh) => scene.meshes.splice(scene.meshes.indexOf(mesh), 1));
        UpdateLines.mockReset();
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
        expect(box.pickable).toBe(false);
        expect(box.parent?.worldMatrix).toBe(mesh.worldMatrix);
        const snapshot = h.controller.getSnapshot();
        Object.assign(mesh, { worldMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -10, -20, -30, 1], worldMatrixVersion: 1 });
        expect(box.parent?.worldMatrix).toBe(mesh.worldMatrix);
        expect(box.parent?.worldMatrixVersion).toBe(1);
        expect(h.controller.getSnapshot()).toEqual(snapshot);
        expect(UpdateLines).not.toHaveBeenCalled();
        expect(mesh.children).toEqual([]);
        mesh.visible = false;
        h.controller.refresh();
        expect(box.visible).toBe(false);
        expect(Lines).toHaveBeenCalledTimes(1);
        expect(UpdateLines).toHaveBeenCalledTimes(1);
        h.controller.setBounds(false);
        expect(box.parent).toBeNull();
        expect(h.scene.meshes).toHaveLength(2);
        h.controller.dispose();
        expect(h.scene.meshes).toEqual([mesh]);
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

    it("surfaces helper failures and cleans up partially created bounding boxes", () => {
        const h = Harness();
        h.scene.meshes.push(SourceMesh("Second"));
        Lines.mockImplementationOnce(() => ({})).mockImplementationOnce(() => {
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
