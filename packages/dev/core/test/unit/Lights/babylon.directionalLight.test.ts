import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { DirectionalLight } from "core/Lights/directionalLight";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";

describe("DirectionalLight", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("shadow projection depth mapping", () => {
        const minZ = 1;
        const maxZ = 60;
        const frustumSize = 24;

        function createLight(shadowFrustumSize: number): DirectionalLight {
            const light = new DirectionalLight("sun", new Vector3(-0.5, -1, 0.3), scene);
            light.position = new Vector3(10, 20, -6);
            light.autoUpdateExtends = false;
            light.shadowMinZ = minZ;
            light.shadowMaxZ = maxZ;
            light.shadowFrustumSize = shadowFrustumSize;
            return light;
        }

        function buildProjection(light: DirectionalLight): Matrix {
            const box = CreateBox("caster", { size: 2 }, scene);
            const projection = new Matrix();
            light.setShadowProjectionMatrix(projection, light.getViewMatrix() ?? Matrix.Identity(), [box]);
            return projection;
        }

        // Projected depth of a light-space point at distance z along the light's view axis.
        function depthAt(projection: Matrix, z: number): number {
            return Vector3.TransformCoordinates(new Vector3(0, 0, z), projection).z;
        }

        describe.each([
            { useReverseDepthBuffer: false, isNDCHalfZRange: false },
            { useReverseDepthBuffer: false, isNDCHalfZRange: true },
            { useReverseDepthBuffer: true, isNDCHalfZRange: false },
            { useReverseDepthBuffer: true, isNDCHalfZRange: true },
        ])("with useReverseDepthBuffer: $useReverseDepthBuffer, isNDCHalfZRange: $isNDCHalfZRange", ({ useReverseDepthBuffer, isNDCHalfZRange }) => {
            const nearDepth = isNDCHalfZRange ? 0 : -1;

            beforeEach(() => {
                engine.useReverseDepthBuffer = useReverseDepthBuffer;
                // isNDCHalfZRange is fixed per engine type (true on WebGPU); override it to cover the 0..1 range here.
                (engine as { isNDCHalfZRange: boolean }).isNDCHalfZRange = isNDCHalfZRange;
            });

            it("maps the fixed shadow frustum's near and far planes to the engine's depth range", () => {
                const projection = buildProjection(createLight(frustumSize));
                const expected = Matrix.OrthoLHToRef(
                    frustumSize,
                    frustumSize,
                    useReverseDepthBuffer ? maxZ : minZ,
                    useReverseDepthBuffer ? minZ : maxZ,
                    new Matrix(),
                    isNDCHalfZRange
                );

                // With reversed depth the near plane lands on the far end of the range and vice versa.
                expect(depthAt(projection, minZ)).toBeCloseTo(useReverseDepthBuffer ? 1 : nearDepth);
                expect(depthAt(projection, maxZ)).toBeCloseTo(useReverseDepthBuffer ? nearDepth : 1);
                expect(projection.asArray()).toEqual(expected.asArray());
            });

            it("maps depth the same way as the auto-extend shadow frustum", () => {
                const fixed = buildProjection(createLight(frustumSize));
                const autoExtend = buildProjection(createLight(0));

                for (const z of [minZ, (minZ + maxZ) / 2, maxZ]) {
                    expect(depthAt(fixed, z)).toBeCloseTo(depthAt(autoExtend, z));
                }
            });
        });
    });
});
