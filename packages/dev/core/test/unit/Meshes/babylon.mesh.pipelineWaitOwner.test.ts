import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { DirectionalLight } from "core/Lights/directionalLight";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import "core/Lights/Shadows/shadowGeneratorSceneComponent";
import { EffectRenderer, EffectWrapper } from "core/Materials/effectRenderer";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShadowDepthWrapper } from "core/Materials/shadowDepthWrapper";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { GaussianPointSplattingController } from "core/Meshes/GaussianSplatting/gaussianPointSplattingController";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import "core/Rendering/boundingBoxRenderer";
import { Scene } from "core/scene";
import "core/Shaders/pass.fragment";
import "core/Shaders/postprocess.vertex";

// what these tests wait for hangs on dynamic imports of shaders: bounded by time, not by a number of turns, which a busy machine spends first
async function WaitAsync(done: () => boolean, turn?: () => void): Promise<void> {
    const start = performance.now();
    while (!done() && performance.now() - start < 10000) {
        turn?.();
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

/**
 * Asynchronous pipeline creation (WebGPU): Mesh._processRendering gives the draws it submits their owner (AbstractEngine._pipelineWaitOwner):
 * the mesh, in all its passes and whatever draw context its material gives them, so that the passes of a mesh wait together for their
 * pipelines. Any other draw, like the bounding box of an occlusion query, has none and never waits.
 */
describe("The owner of the draws of a mesh", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 5, -10), scene).setTarget(Vector3.Zero());
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // each draw of the engine: the owner it was submitted with, and its render pass
    const watchDraws = () => {
        const draws: Array<{ owner: unknown; pass: number }> = [];
        const drawElementsType = engine.drawElementsType;
        vi.spyOn(engine, "drawElementsType").mockImplementation((...args) => {
            draws.push({ owner: engine._pipelineWaitOwner, pass: engine.currentRenderPassId });
            drawElementsType.call(engine, ...args);
        });
        return draws;
    };

    it("gives each mesh its own owner in its shadow map and main passes, with its own draw contexts or its material's", async () => {
        const light = new DirectionalLight("light", new Vector3(0, -1, 0.3), scene);
        light.position = new Vector3(0, 10, -3);
        const shadowGenerator = new ShadowGenerator(64, light);
        // a ShaderMaterial that keeps its effect itself (storeEffectOnSubMeshes false): its two meshes draw with its draw context
        const shader = new ShaderMaterial(
            "shader",
            scene,
            {
                vertexSource:
                    "precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; void main(void) { gl_Position = worldViewProjection * vec4(position, 1.0); }",
                fragmentSource: "precision highp float; void main(void) { gl_FragColor = vec4(1.0); }",
            },
            { attributes: ["position"], uniforms: ["worldViewProjection"] },
            false
        );
        const first = MeshBuilder.CreateBox("first", {}, scene);
        const second = MeshBuilder.CreateBox("second", {}, scene);
        first.material = shader;
        second.material = shader;
        // a StandardMaterial, and one whose shadow map draws go through a ShadowDepthWrapper
        const standard = MeshBuilder.CreateBox("standard", {}, scene);
        standard.material = new StandardMaterial("standard", scene);
        const wrapped = MeshBuilder.CreateBox("wrapped", {}, scene);
        const wrappedMaterial = new StandardMaterial("wrapped", scene);
        wrappedMaterial.shadowDepthWrapper = new ShadowDepthWrapper(wrappedMaterial, scene);
        wrapped.material = wrappedMaterial;
        const meshes: AbstractMesh[] = [first, second, standard, wrapped];
        meshes.forEach((mesh, i) => {
            mesh.position.x = 2 * i - 3;
            shadowGenerator.addShadowCaster(mesh);
        });
        await scene.whenReadyAsync();

        const draws = watchDraws();
        scene.render();

        const passes = [scene.activeCamera!.renderPassId, shadowGenerator.getShadowMap()!.renderPassId].sort((a, b) => a - b);
        for (const mesh of meshes) {
            const owned = draws.filter((draw) => draw.owner === mesh._internalAbstractMeshDataInfo);
            expect(owned.map((draw) => draw.pass).sort((a, b) => a - b)).toEqual(passes);
        }
        expect(draws.length).toBe(meshes.length * passes.length);
        expect(engine._pipelineWaitOwner).toBeNull();
    });

    it("gives no owner to the bounding box of an occlusion query, though it draws with a draw wrapper of its mesh's sub mesh", async () => {
        const box = MeshBuilder.CreateBox("box", {}, scene);
        const renderer = scene.getBoundingBoxRenderer();
        const draws = watchDraws();
        // the renderer draws once its shader is ready
        await WaitAsync(
            () => draws.length > 0,
            () => renderer.renderOcclusionBoundingBox(box)
        );
        expect(draws.length).toBeGreaterThan(0);
        expect(draws.map((draw) => draw.owner)).toEqual(draws.map(() => null));
    });

    it("gives no owner to what an observer of a mesh's draw draws (an EffectRenderer pass), and gives it back to the mesh's draw", async () => {
        const box = MeshBuilder.CreateBox("box", {}, scene);
        const effectRenderer = new EffectRenderer(engine);
        const pass = new EffectWrapper({ engine, name: "pass", fragmentShader: "pass", useShaderStore: true });
        await scene.whenReadyAsync();
        await WaitAsync(() => pass.isReady());
        expect(pass.isReady()).toBe(true);
        box.onBeforeDrawObservable.add(() => effectRenderer.render(pass));
        const draws = watchDraws();

        scene.render();

        // the observer's pass, then the box
        expect(draws.map((draw) => draw.owner)).toEqual([null, box._internalAbstractMeshDataInfo]);
        expect(engine._pipelineWaitOwner).toBeNull();
        pass.dispose();
        effectRenderer.dispose();
    });

    it("gives the compositors of a point-splatting mesh, its color and its depth, the owner of the mesh", async () => {
        const splat = new GaussianSplattingMesh("splat", null, scene);
        const controller = new GaussianPointSplattingController(splat);
        controller["_enableColorBlit"]();
        controller["_enableDepthBlit"]();
        // the compositors are drawn as the controller draws them (Mesh.render, in replacement mode), with a material this engine compiles
        const compositors = [controller["_blitMesh"]!, controller["_depthBlitMesh"]!];
        const shader = new ShaderMaterial(
            "compositor",
            scene,
            {
                vertexSource: "precision highp float; attribute vec3 position; void main(void) { gl_Position = vec4(position, 1.0); }",
                fragmentSource: "precision highp float; void main(void) { gl_FragColor = vec4(1.0); }",
            },
            { attributes: ["position"], uniforms: [] }
        );
        for (const compositor of compositors) {
            compositor.material = shader;
        }
        await WaitAsync(() => compositors.every((compositor) => shader.isReady(compositor)));
        const draws = watchDraws();

        for (const compositor of compositors) {
            compositor.render(compositor.subMeshes[0], false, compositor);
        }

        expect(draws.map((draw) => draw.owner)).toEqual([splat._internalAbstractMeshDataInfo, splat._internalAbstractMeshDataInfo]);
        controller.dispose();
    });

    it("gives the owner back after the draws of a mesh, also when one of them throws", async () => {
        MeshBuilder.CreateBox("box", {}, scene);
        await scene.whenReadyAsync();
        vi.spyOn(engine, "drawElementsType").mockImplementationOnce(() => {
            throw new Error("draw");
        });
        expect(() => scene.render()).toThrow("draw");
        expect(engine._pipelineWaitOwner).toBeNull();
    });
});
