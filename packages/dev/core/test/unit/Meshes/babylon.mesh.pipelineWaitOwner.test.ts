import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { DirectionalLight } from "core/Lights/directionalLight";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import "core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShadowDepthWrapper } from "core/Materials/shadowDepthWrapper";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import "core/Rendering/boundingBoxRenderer";
import { Scene } from "core/scene";

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
        const drawElementsType = engine.drawElementsType.bind(engine);
        vi.spyOn(engine, "drawElementsType").mockImplementation((...args) => {
            draws.push({ owner: engine._pipelineWaitOwner, pass: engine.currentRenderPassId });
            drawElementsType(...args);
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
        for (let i = 0; i < 20 && draws.length === 0; i++) {
            renderer.renderOcclusionBoundingBox(box);
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        expect(draws.length).toBeGreaterThan(0);
        expect(draws.map((draw) => draw.owner)).toEqual(draws.map(() => null));
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
