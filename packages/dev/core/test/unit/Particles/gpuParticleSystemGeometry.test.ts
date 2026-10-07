import { describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Scene } from "core/scene";
import "core/Particles/webgl2ParticleSystem";

describe("GPU particle geometry", () => {
    it("preserves the complete quad outline when rendering wireframe", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const createIndexBuffer = vi.spyOn(engine, "createIndexBuffer");
        const particles = new GPUParticleSystem("test", { capacity: 1, randomTextureSize: 1 }, scene);

        try {
            vi.spyOn(particles["_platform"], "createVertexBuffers").mockImplementation(() => {});
            particles["_initialize"]();
            const sprite = particles["_spriteBuffer"].getData();
            const indices = createIndexBuffer.mock.calls.find((call) => (call as unknown[])[2] === "GPUParticleSystemLinesIndexBuffer")?.[0];
            if (!(sprite instanceof Float32Array) || !indices) {
                throw new Error("Missing particle geometry");
            }

            const topRight = [0.5, 0.5];
            const topLeft = [-0.5, 0.5];
            const bottomRight = [0.5, -0.5];
            const bottomLeft = [-0.5, -0.5];
            expect(Array.from(indices, (index) => [sprite[index * 4], sprite[index * 4 + 1]])).toEqual([
                topRight,
                topLeft,
                topLeft,
                bottomLeft,
                bottomLeft,
                bottomRight,
                bottomRight,
                topRight,
                topRight,
                bottomLeft,
            ]);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
