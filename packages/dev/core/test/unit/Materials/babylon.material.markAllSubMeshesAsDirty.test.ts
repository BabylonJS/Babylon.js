import { AssetContainer } from "core/assetContainer";
import { FreeCamera } from "core/Cameras/freeCamera";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Vector3 } from "core/Maths/math.vector";
import { Material } from "core/Materials/material";
import { type MaterialDefines } from "core/Materials/materialDefines";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type InstancedMesh } from "core/Meshes/instancedMesh";
import { Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { CreateBoxVertexData } from "core/Meshes/Builders/boxBuilder";
import { SubMesh } from "core/Meshes/subMesh";
import { Scene } from "core/scene";
import { type Nullable } from "core/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "core/Engines/AbstractEngine/abstractEngine.renderPass";
import "core/Meshes/instancedMesh";

/** A mesh that keeps its material in its own field, without the mesh map (as GaussianSplattingMeshBase does) */
class OwnMaterialMesh extends Mesh {
    private _ownMaterial: Nullable<Material> = null;
    public override get material(): Nullable<Material> {
        return this._ownMaterial;
    }
    public override set material(value: Nullable<Material>) {
        this._ownMaterial = value;
    }
}

/** A mesh that resolves its render passes in an overridden getMaterialForRenderPass, without the per-pass material array */
class PassMaterialMesh extends Mesh {
    public passMaterials: { [renderPassId: number]: Material } = {};
    public override getMaterialForRenderPass(renderPassId: number): Material | undefined {
        return this.passMaterials?.[renderPassId];
    }
}

/**
 * Marking a material dirty must reach exactly the draw wrappers that resolve to it (SubMesh.getMaterial for their render
 * pass) among the scene's meshes, whatever the order of the material assignments that led there.
 */
describe("Material._markAllSubMeshesAsDirty", function () {
    let engine: Engine;
    let scene: Scene;
    let main: number;
    let passes: { [label: string]: number };

    beforeEach(function () {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -20), scene);
        new HemisphericLight("light", Vector3.Up(), scene);
        main = engine.currentRenderPassId;
        passes = { p1: engine.createRenderPassId("p1"), p2: engine.createRenderPassId("p2") };
    });

    afterEach(async function () {
        await scene.whenReadyAsync(); // no shader left loading once the test ends
        engine.dispose();
    });

    const box = (name: string, material: Nullable<Material> = null) => {
        const mesh = MeshBuilder.CreateBox(name, {}, scene);
        mesh.material = material;
        return mesh;
    };

    /** Prepares the draw wrapper of every submesh of the mesh for the render pass, with the material it resolves to */
    const prepare = (mesh: AbstractMesh, renderPassId = main) => {
        const previous = engine.currentRenderPassId;
        engine.currentRenderPassId = renderPassId;
        for (const subMesh of mesh.subMeshes) {
            subMesh.getMaterial(true, renderPassId)?.isReadyForSubMesh(mesh, subMesh, false);
        }
        engine.currentRenderPassId = previous;
    };

    /** The draw wrappers left dirty by marking the material's textures dirty, as "mesh.subMeshIndex[@pass]" */
    const marked = (material: Material) => {
        const label = (passId: number) => (passId === main ? "" : "@" + Object.keys(passes).find((k) => passes[k] === passId));
        const wrappers: { id: string; defines: MaterialDefines }[] = [];
        for (const mesh of scene.meshes) {
            mesh.subMeshes?.forEach((subMesh, index) =>
                subMesh._drawWrappers.forEach((drawWrapper, passId) => {
                    const defines = drawWrapper?.defines as MaterialDefines;
                    if (defines?.markAllAsDirty) {
                        wrappers.push({ id: `${mesh.name}.${index}${label(passId)}`, defines });
                    }
                })
            );
        }
        wrappers.forEach((w) => w.defines.markAsProcessed());
        material.markAsDirty(Material.TextureDirtyFlag);
        return wrappers
            .filter((w) => w.defines.isDirty)
            .map((w) => w.id)
            .sort();
    };

    it("follows a render pass material that is set and then removed (the pass falls back to the mesh material)", () => {
        const a = new StandardMaterial("a", scene);
        const mesh = box("mesh", a);
        mesh.setMaterialForRenderPass(passes.p1, a);
        mesh.setMaterialForRenderPass(passes.p1, undefined);
        prepare(mesh);
        prepare(mesh, passes.p1);
        expect(marked(a)).toEqual(["mesh.0", "mesh.0@p1"]);
    });

    it("follows a material used by two render passes when one of them is removed", () => {
        const a = new StandardMaterial("a", scene);
        const b = new StandardMaterial("b", scene);
        const mesh = box("mesh", b);
        mesh.setMaterialForRenderPass(passes.p1, a);
        mesh.setMaterialForRenderPass(passes.p2, a);
        mesh.setMaterialForRenderPass(passes.p1, undefined);
        prepare(mesh);
        prepare(mesh, passes.p1);
        prepare(mesh, passes.p2);
        expect(marked(a)).toEqual(["mesh.0@p2"]);
        expect(marked(b)).toEqual(["mesh.0", "mesh.0@p1"]);
    });

    it("follows a render pass material that is replaced", () => {
        const a = new StandardMaterial("a", scene);
        const b = new StandardMaterial("b", scene);
        const c = new StandardMaterial("c", scene);
        const mesh = box("mesh", b);
        mesh.setMaterialForRenderPass(passes.p1, a);
        mesh.setMaterialForRenderPass(passes.p1, c);
        prepare(mesh, passes.p1);
        expect(marked(a)).toEqual([]);
        expect(marked(c)).toEqual(["mesh.0@p1"]);
    });

    it("follows the mesh material changing while a render pass still uses the old one", () => {
        const a = new StandardMaterial("a", scene);
        const b = new StandardMaterial("b", scene);
        const mesh = box("mesh", a);
        mesh.setMaterialForRenderPass(passes.p1, a);
        mesh.material = b;
        prepare(mesh);
        prepare(mesh, passes.p1);
        expect(marked(a)).toEqual(["mesh.0@p1"]);
        expect(marked(b)).toEqual(["mesh.0"]);
    });

    it("marks the submeshes of a multi-material that resolve to the material, in the mesh material or a render pass", () => {
        const a = new StandardMaterial("a", scene);
        const b = new StandardMaterial("b", scene);
        const multi = new MultiMaterial("multi", scene);
        multi.subMaterials.push(b, a);
        const withMulti = (name: string) => {
            const mesh = box(name);
            const vertexCount = mesh.getTotalVertices();
            mesh.subMeshes = [];
            new SubMesh(0, 0, vertexCount, 0, 18, mesh);
            new SubMesh(1, 0, vertexCount, 18, 18, mesh);
            return mesh;
        };
        const multiMesh = withMulti("multiMesh");
        multiMesh.material = multi;
        const passMulti = withMulti("passMulti");
        passMulti.material = b;
        passMulti.setMaterialForRenderPass(passes.p1, multi);
        for (const mesh of [multiMesh, passMulti]) {
            prepare(mesh);
            prepare(mesh, passes.p1);
        }
        expect(marked(a)).toEqual(["multiMesh.1", "multiMesh.1@p1", "passMulti.1@p1"]);
        expect(marked(b)).toEqual(["multiMesh.0", "multiMesh.0@p1", "passMulti.0", "passMulti.0@p1", "passMulti.1"]);
        expect(marked(multi)).toEqual([]);
    });

    it("marks the instances that render with their own submeshes", () => {
        const a = new StandardMaterial("a", scene);
        const source = box("source", a);
        const instance = source.createInstance("instance");
        (instance as InstancedMesh)._internalAbstractMeshDataInfo._actAsRegularMesh = true;
        prepare(source);
        prepare(instance);
        expect(marked(a)).toEqual(["instance.0", "source.0"]);
    });

    it("marks the meshes without material through the scene's default material", () => {
        const a = new StandardMaterial("a", scene);
        const noMaterial = box("noMaterial");
        const withA = box("withA", a);
        prepare(noMaterial);
        prepare(withA);
        expect(marked(scene.defaultMaterial)).toEqual(["noMaterial.0"]);
        expect(marked(a)).toEqual(["withA.0"]);
    });

    it("marks a mesh that keeps its material outside the mesh map", () => {
        const a = new StandardMaterial("a", scene);
        const own = new OwnMaterialMesh("own", scene);
        CreateBoxVertexData({}).applyToMesh(own);
        own.material = a;
        prepare(own);
        expect(a.getBindedMeshes()).toEqual([]);
        expect(marked(a)).toEqual(["own.0"]);
    });

    it("marks only the meshes in the scene, across removal and asset container cycles", () => {
        const a = new StandardMaterial("a", scene);
        const kept = box("kept", a);
        const removed = box("removed", a);
        const contained = box("contained", a);
        for (const mesh of [kept, removed, contained]) {
            prepare(mesh);
        }
        const container = new AssetContainer(scene);
        container.meshes.push(contained);

        scene.removeMesh(removed);
        container.removeAllFromScene();
        const detached = [removed, contained].map((mesh) => mesh.subMeshes[0]._drawWrappers[main]!.defines as MaterialDefines);
        detached.forEach((defines) => defines.markAsProcessed());
        expect(marked(a)).toEqual(["kept.0"]);
        expect(detached.map((defines) => defines.isDirty)).toEqual([false, false]);

        scene.addMesh(removed);
        container.addAllToScene();
        expect(marked(a)).toEqual(["contained.0", "kept.0", "removed.0"]);
    });

    it("marks a mesh that resolves a render pass in an overridden getMaterialForRenderPass", () => {
        const a = new StandardMaterial("a", scene);
        const b = new StandardMaterial("b", scene);
        const custom = new PassMaterialMesh("custom", scene);
        CreateBoxVertexData({}).applyToMesh(custom);
        custom.material = b;
        custom.passMaterials[passes.p1] = a;
        prepare(custom);
        prepare(custom, passes.p1);
        expect(custom._internalAbstractMeshDataInfo._materialForRenderPass).toBeUndefined();
        expect(marked(a)).toEqual(["custom.0@p1"]);
        expect(marked(b)).toEqual(["custom.0"]);
    });

    it("reads only the render passes with a draw wrapper once a high render pass override is removed and the material reassigned", () => {
        const a = new StandardMaterial("a", scene);
        const b = new StandardMaterial("b", scene);
        const c = new StandardMaterial("c", scene);
        const mesh = box("mesh", a);
        const high = passes.p2 + 100000; // render pass ids only grow
        mesh.setMaterialForRenderPass(high, c);
        mesh.setMaterialForRenderPass(high, undefined);
        mesh.material = b; // resets the draw cache
        prepare(mesh);
        const info = mesh._internalAbstractMeshDataInfo;
        expect(info._materialForRenderPass.length).toBe(high + 1);
        expect(mesh.subMeshes[0]._drawWrappers.length).toBe(main + 1);

        let reads = 0;
        info._materialForRenderPass = new Proxy(info._materialForRenderPass, {
            get(target, key, receiver) {
                if (typeof key === "string" && /^\d+$/.test(key)) {
                    reads++;
                }
                return Reflect.get(target, key, receiver);
            },
        });
        expect(marked(a)).toEqual([]);
        expect(reads).toBeLessThanOrEqual(main + 1);
        expect(marked(b)).toEqual(["mesh.0"]);
        expect(marked(c)).toEqual([]);
    });

    it("does not resolve the passes of submeshes whose rendering mesh cannot use the material", () => {
        const a = new StandardMaterial("a", scene);
        const b = new StandardMaterial("b", scene);
        const meshes = [box("withA", a), box("withB1", b), box("withB2", b)];
        for (const mesh of meshes) {
            prepare(mesh);
            prepare(mesh, passes.p1);
        }
        const getMaterial = vi.spyOn(SubMesh.prototype, "getMaterial");
        expect(marked(a)).toEqual(["withA.0", "withA.0@p1"]);
        expect(getMaterial.mock.contexts.map((subMesh) => (subMesh as SubMesh).getMesh().name)).toEqual(["withA", "withA"]);
        getMaterial.mockRestore();
    });
});
