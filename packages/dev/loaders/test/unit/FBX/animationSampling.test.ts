import { describe, expect, it } from "vitest";
import { Matrix } from "core/Maths/math.vector";
import { FBXFileLoader } from "loaders/FBX/fbxFileLoader";

describe("FBX animation sample refinement", () => {
    it("does not subdivide a constant rotation", () => {
        const matrix = Matrix.RotationYawPitchRoll(0.13, 0.19, 0.23);
        expect(FBXFileLoader["_refineSampleTimes"]([0, 1], () => matrix)).toEqual([0, 1]);
    });

    it("does not treat the length of a near-linear quaternion interpolation as angular error", () => {
        expect(FBXFileLoader["_refineSampleTimes"]([0, 1], (time) => Matrix.RotationZ(time * 0.002))).toEqual([0, 1]);
    });

    it("retains authored times and refines nonlinear motion to the depth limit", () => {
        const times = [0, 0.3, 1];
        const refined = FBXFileLoader["_refineSampleTimes"](times, (time) => Matrix.Translation(time * time, 0, 0));

        expect(times).toEqual([0, 0.3, 1]);
        expect(refined).toHaveLength(9);
        for (const [index, time] of [0, 0.075, 0.15, 0.225, 0.3, 0.475, 0.65, 0.825, 1].entries()) {
            expect(refined[index]).toBeCloseTo(time, 12);
        }
    });
});
