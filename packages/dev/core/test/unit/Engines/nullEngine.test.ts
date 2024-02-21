import { NullEngine } from "core/Engines";

describe("NullEngine", () => {
    describe("constructor", () => {
        it("returns a NullEngine", () => {
            const nullEngine = new NullEngine();
            expect(nullEngine).toBeInstanceOf(NullEngine);
        });
    });

    describe("Options", () => {
        it("returns a NullEngine with the correct options", () => {
            const nullEngine = new NullEngine({
                renderHeight: 128,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
            expect(nullEngine.getRenderHeight()).toBe(128);
            expect(nullEngine.getRenderWidth()).toBe(256);
            expect(nullEngine.isDeterministicLockStep()).toBe(false);
            expect(nullEngine.getLockstepMaxSteps()).toBe(1);
        });

        it("supports setting timeStep option", () => {
            const nullEngine = new NullEngine({
                renderHeight: 128,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: true,
                timeStep: 0.5,
                lockstepMaxSteps: 4,
            });
            expect(nullEngine.isDeterministicLockStep()).toBe(true);
            expect(nullEngine.getTimeStep()).toBe(500); // 0.5 seconds in ms
            expect(nullEngine.getLockstepMaxSteps()).toBe(4);
        });
    });
});
