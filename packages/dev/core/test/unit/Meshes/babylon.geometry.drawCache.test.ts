import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Matrix } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { type Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers/buffer";
import "core/Meshes/thinInstanceMesh";

describe("Geometry WebGPU draw cache invalidation", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: Mesh;

    function cacheDraws(target: Mesh) {
        const subMesh = target.subMeshes[0];
        const wrappers = [0, 7].map((passId) => subMesh._getDrawWrapper(passId, true)!);
        for (const wrapper of wrappers) {
            // ShaderMaterial stores string defines, so attribute dirtiness alone does not reset these draws.
            wrapper.defines = "#define INSTANCES\n#define THIN_INSTANCES";
            vi.spyOn(wrapper, "dispose");
        }
        return wrappers;
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        mesh = CreateBox("box", {}, scene);
        mesh.thinInstanceSetBuffer("matrix", new Float32Array(Matrix.Identity().asArray()), 16, false);
        mesh.thinInstanceSetBuffer("tint", new Float32Array([1, 0, 0, 1]), 4, false);
        mesh.thinInstanceSetBuffer("previousMatrix", new Float32Array(Matrix.Identity().asArray()), 16, false);
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);
        vi.spyOn(engine, "compatibilityMode", "get").mockReturnValue(false);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it.each(["matrix", "previousMatrix", "tint"])("invalidates every render pass of shared geometry when replacing %s", (kind) => {
        const clone = mesh.clone("clone")!;
        expect(clone.geometry).toBe(mesh.geometry);
        const wrappers = [...cacheDraws(mesh), ...cacheDraws(clone)];
        const data = kind === "tint" ? new Float32Array([0, 1, 0, 1]) : new Float32Array(Matrix.Translation(0, 0, 3).asArray());

        mesh.thinInstanceSetBuffer(kind, data, kind === "tint" ? 4 : 16);

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).toHaveBeenCalledTimes(1);
        }
        expect(mesh.subMeshes[0]._drawWrappers).toHaveLength(0);
        expect(clone.subMeshes[0]._drawWrappers).toHaveLength(0);
    });

    it("invalidates cached draws when adding a vertex buffer", () => {
        const wrappers = cacheDraws(mesh);

        mesh.setVerticesBuffer(new VertexBuffer(engine, new Float32Array([1]), "custom", false, false, 1, true));

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).toHaveBeenCalledTimes(1);
        }
    });

    it("invalidates cached draws when removing a thin-instance attribute", () => {
        const wrappers = cacheDraws(mesh);

        mesh.thinInstanceSetBuffer("tint", null);

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).toHaveBeenCalledTimes(1);
        }
        expect(mesh.isVerticesDataPresent("tint")).toBe(false);
    });

    it("preserves cached draws when removing an absent attribute", () => {
        const wrappers = cacheDraws(mesh);

        mesh.removeVerticesData("absent");

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).not.toHaveBeenCalled();
        }
    });

    it("preserves cached draws for in-place vertex and thin-instance buffer updates", () => {
        mesh.setVerticesData("custom", [1], true, 1);
        const wrappers = cacheDraws(mesh);

        mesh.thinInstanceBufferUpdated("matrix");
        mesh.thinInstanceBufferUpdated("previousMatrix");
        mesh.thinInstanceBufferUpdated("tint");
        mesh.updateVerticesData("custom", [2]);
        mesh.geometry!.updateVerticesDataDirectly("custom", new Float32Array([3]), 0);

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).not.toHaveBeenCalled();
        }
        expect(mesh.subMeshes[0]._getDrawWrapper(0)).toBe(wrappers[0]);
        expect(mesh.subMeshes[0]._getDrawWrapper(7)).toBe(wrappers[1]);
    });

    it.each(["matrix", "tint"])("invalidates cached draws when automatically recreating a static %s buffer", (kind) => {
        const data = kind === "tint" ? new Float32Array([1, 0, 0, 1]) : new Float32Array(Matrix.Identity().asArray());
        mesh.thinInstanceSetBuffer(kind, data, kind === "tint" ? 4 : 16);
        mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true;
        const wrappers = cacheDraws(mesh);

        mesh.thinInstanceBufferUpdated(kind);

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).toHaveBeenCalledTimes(1);
        }
    });

    it("invalidates cached draws when the thin-instance matrix buffer grows", () => {
        engine.getCaps().instancedArrays = true;
        const wrappers = cacheDraws(mesh);

        mesh.thinInstanceAdd(Matrix.Identity());

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).toHaveBeenCalledTimes(1);
        }
        expect(mesh.thinInstanceCount).toBe(2);
    });

    it("invalidates cached draws even when temporarily using WebGPU compatibility mode", () => {
        const wrappers = cacheDraws(mesh);
        vi.spyOn(engine, "compatibilityMode", "get").mockReturnValue(true);

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).toHaveBeenCalledTimes(1);
        }
    });

    it("does not reset draw caches in WebGL", () => {
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(false);
        const wrappers = cacheDraws(mesh);

        mesh.thinInstanceSetBuffer("tint", new Float32Array([0, 1, 0, 1]), 4);
        mesh.thinInstanceSetBuffer("tint", null);

        for (const wrapper of wrappers) {
            expect(wrapper.dispose).not.toHaveBeenCalled();
        }
    });
});
