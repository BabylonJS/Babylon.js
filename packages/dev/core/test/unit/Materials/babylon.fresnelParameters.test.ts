import { NullEngine } from "core/Engines";
import { FresnelParameters, StandardMaterial } from "core/Materials";
import { Color3 } from "core/Maths";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

/**
 * Test Suite for FresnelParameters.
 */
describe("Babylon Material FresnelParameters", () => {
    describe("#FresnelParameters", () => {
        it("empty constructor has default values", () => {
            const subject = new FresnelParameters();
            expect(subject.bias).toBe(0);
            expect(subject.power).toBe(1);
            expect(subject.isEnabled).toBeTruthy();
            expect(subject.leftColor.equals(Color3.White())).toBeTruthy();
            expect(subject.rightColor.equals(Color3.Black())).toBeTruthy();
        });

        it("serialized empty constructor is serialized correctly", () => {
            const subject = new FresnelParameters().serialize();
            expect(subject).toStrictEqual({
                isEnabled: true,
                leftColor: [1, 1, 1],
                rightColor: [0, 0, 0],
                bias: 0,
                power: 1,
            });
        });

        it("new FresnelParameters({...}) with options specified", () => {
            const subject = new FresnelParameters({
                bias: 1,
                power: 0,
                isEnabled: false,
                leftColor: Color3.Black(),
                rightColor: Color3.White(),
            });
            expect(subject.bias).toBe(1);
            expect(subject.power).toBe(0);
            expect(subject.isEnabled).toBeFalsy();
            expect(subject.leftColor.equals(Color3.Black())).toBeTruthy();
            expect(subject.rightColor.equals(Color3.White())).toBeTruthy();
        });

        it("FresnelParameters.Parse({...}) with equality check", () => {
            const subject = FresnelParameters.Parse({
                isEnabled: true,
                leftColor: [1, 1, 1],
                rightColor: [0, 0, 0],
                bias: 0,
                power: 1,
            });

            expect(new FresnelParameters().equals(subject)).toBeTruthy();
        });

        it("disabling FresnelParameters should mark materials as dirty (not ready)", () => {
            const engine = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });

            const scene = new Scene(engine);
            const mesh = MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            const material = new StandardMaterial("material", scene);
            mesh.material = material;

            const subject = new FresnelParameters();
            material.refractionFresnelParameters = subject;

            expect(scene._cachedMaterial).not.toBeNull();

            // should mark materials as dirty and clear scene cache
            subject.isEnabled = false;
            expect(scene._cachedMaterial).toBeNull();
        });
    });
});
