import * as fs from "fs";
import * as path from "path";
import { NullEngine } from "core/Engines";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { VertexAnimationBaker } from "core/BakedVertexAnimation/vertexAnimationBaker";
import { AnimationRange } from "core/Animations";
import { ImportMeshAsync } from "core/Loading";
import type { Mesh } from "core/Meshes";
import "core/Animations/animatable";
import { FreeCamera } from "core/Cameras";
import { Vector3 } from "core/Maths";

/**
 * Describes the test suite for VertexAnimationBaker.
 */
describe("VertexAnimationBaker", function () {
    let subject: Engine;
    let scene: Scene;
    let mesh: Mesh;

    const animationRanges = [
        { from: 7, to: 31 },
        { from: 33, to: 61 },
        { from: 63, to: 91 },
        { from: 93, to: 130 },
    ];

    /**
     * Create a new engine, scene, and skeleton before each test.
     */
    beforeEach(async function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        // Avoid creating normals in PBR materials.
        subject.getCaps().standardDerivatives = true;

        // Create a scene
        scene = new Scene(subject);
        new FreeCamera("camera", new Vector3(0, 0, 0), scene);
        const meshPath = path.join(__dirname, "../../../../../../packages/tools/playground/public/scenes/arr.babylon");
        const meshBuffer = fs.readFileSync(meshPath);
        const dataUrl = `data:model/gltf-binary;base64,${meshBuffer.toString("base64")}`;

        const result = await ImportMeshAsync(dataUrl, scene);
        mesh = result.meshes[0] as Mesh;

        subject.runRenderLoop(() => {
            scene.render();
        });
    });

    /**
     * Tests for bakeVertexDataSync.
     */
    describe("#bakeVertexDataSync", () => {
        it("should bake vertex data as Float32Array for given ranges and produce data ~equal to async bake", async () => {
            // Arrange: Create a VertexAnimationBaker with the skeleton
            const baker = new VertexAnimationBaker(scene, mesh);

            // Act: Bake vertex data with halfFloat: false
            let start = performance.now();
            const vertexData = baker.bakeVertexDataSync(animationRanges as AnimationRange[], false);
            let end = performance.now();
            console.log(`Synchronous bake took: ${end - start} ms`);
            const asyncVertexData = await baker.bakeVertexData(animationRanges as AnimationRange[]);
            end = performance.now();
            console.log(`Asynchronous bake took: ${end - start} ms`);
            // Assert: Check type and size
            expect(vertexData.length).toEqual(asyncVertexData.length, "Synchronous and asynchronous vertex data should match");
            expect(vertexData).toBeInstanceOf(Float32Array, "Vertex data should be Float32Array");
        });

        it("should bake vertex data as Uint16Array for half-float", () => {
            const baker = new VertexAnimationBaker(scene, mesh);
            const vertexData = baker.bakeVertexDataSync(animationRanges as AnimationRange[], true);
            expect(vertexData).toBeInstanceOf(Uint16Array, "Vertex data should be Uint16Array");
        });

        it("should throw an error if no skeleton is provided", () => {
            const mesh = { skeleton: null }; // Mock mesh with no skeleton
            const baker = new VertexAnimationBaker(scene, mesh as any);
            expect(() => baker.bakeVertexDataSync(animationRanges as AnimationRange[], false)).toThrow("No skeleton provided.");
        });
    });

    /**
     * Clean up after each test.
     */
    afterEach(function () {
        subject.dispose();
    });
});
