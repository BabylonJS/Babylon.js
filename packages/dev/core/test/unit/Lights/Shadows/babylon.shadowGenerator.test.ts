import { NullEngine } from "core/Engines";
import type { Engine } from "core/Engines";
import { PointLight } from "core/Lights/pointLight";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

import "core/Lights/Shadows/shadowGeneratorSceneComponent";

describe("ShadowGenerator", () => {
    describe("instantiate", () => {
        let subject: Engine;

        beforeEach(function () {
            subject = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
        });

        it("should be able to be instantiated with a null engine", () => {
            const scene = new Scene(subject);
            const light = new PointLight("Point", new Vector3(1,1,1), scene);
            const generator = new ShadowGenerator(1024, light);

            expect(generator).not.toBeUndefined();
        });
    });
});
