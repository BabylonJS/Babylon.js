import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { type Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("RenderTargetTexture render ids", () => {
    let engine: NullEngine;
    let scene: Scene;
    let box: Mesh;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -5), scene);
        box = CreateBox("box", { size: 1 }, scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // A target rendering the box. At the start of each pass, the box's submesh is drawn only if its render id is not the scene's,
    // and then gets the scene's: what ShadowGenerator does to draw a submesh once per pass. The scene's render id is recorded at
    // the start and at the end of each pass. The same submesh in two shadow maps rendered by hand is the case of forum thread 64422.
    const target = (name: string, size: number | { width: number; height: number; layers: number }, kind: "2D" | "cube" | "array" = "2D") => {
        const rtt = new RenderTargetTexture(name, size, scene);
        // NullEngine makes a 2D texture for every target: render() runs the passes of a cube or array target from these getters
        if (kind === "cube") {
            Object.defineProperty(rtt, "isCube", { get: () => true });
        } else if (kind === "array") {
            Object.defineProperty(rtt, "is2DArray", { get: () => true });
        }
        rtt.renderList = [box];
        const passes: { id: number; after: number; drawn: boolean }[] = [];
        rtt.onBeforeRenderObservable.add(() => {
            const subMesh = box.subMeshes[0];
            const id = scene.getRenderId();
            passes.push({ id, after: -1, drawn: subMesh._renderId !== id });
            subMesh._renderId = id;
        });
        rtt.onAfterRenderObservable.add(() => (passes[passes.length - 1].after = scene.getRenderId()));
        return { rtt, passes };
    };

    // as after a render that drew the box with the current render id
    const drawnWithCurrentId = () => (box.subMeshes[0]._renderId = scene.getRenderId());

    it("gives each render of a 2D target by hand a fresh render id, so two of them draw the same submesh", () => {
        const a = target("a", 64);
        const b = target("b", 64);
        drawnWithCurrentId();
        const before = scene.getRenderId();

        a.rtt.render();
        b.rtt.render();

        expect(a.passes.map((pass) => pass.drawn)).toEqual([true]);
        expect(b.passes.map((pass) => pass.drawn)).toEqual([true]);
        expect(a.passes[0].id).toBeGreaterThan(before);
        expect(b.passes[0].id).toBeGreaterThan(a.passes[0].id);
    });

    it("gives the first face of a cube target a fresh render id, and each face its own", () => {
        const cube = target("cube", 64, "cube");
        drawnWithCurrentId();
        const before = scene.getRenderId();

        cube.rtt.render();

        expect(cube.passes).toHaveLength(6);
        expect(cube.passes.every((pass) => pass.drawn)).toBe(true);
        expect(cube.passes[0].id).toBeGreaterThan(before);
        for (let face = 1; face < 6; face++) {
            expect(cube.passes[face].id).toBeGreaterThan(cube.passes[face - 1].id);
        }
    });

    it("gives the first layer of an array target a fresh render id, and each layer its own", () => {
        const array = target("array", { width: 64, height: 64, layers: 3 }, "array");
        drawnWithCurrentId();
        const before = scene.getRenderId();

        array.rtt.render();

        expect(array.passes).toHaveLength(3);
        expect(array.passes.every((pass) => pass.drawn)).toBe(true);
        expect(array.passes[0].id).toBeGreaterThan(before);
        expect(array.passes[2].id).toBeGreaterThan(array.passes[1].id);
    });

    it("keeps one render id from the start to the end of each pass, so a submesh is drawn once in it", () => {
        const cube = target("cube", 64, "cube");

        cube.rtt.render();

        expect(cube.passes).toHaveLength(6);
        for (const pass of cube.passes) {
            expect(pass.after).toBe(pass.id);
        }
    });
});
