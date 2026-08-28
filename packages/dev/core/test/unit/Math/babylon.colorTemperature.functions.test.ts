import { GetWhiteBalanceMatrix, TemperatureTintToXyz } from "../../../src/Maths/colorTemperature.functions";

describe("Color temperature function tests", () => {
    describe("GetWhiteBalanceMatrix", () => {
        it("should be the identity matrix at the default (6500 K, tint 0)", () => {
            const m = GetWhiteBalanceMatrix(6500, 0);
            const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            for (let i = 0; i < 9; i++) {
                expect(m[i]).toBeCloseTo(identity[i], 5);
            }
        });

        it("should not be symmetric for a non-trivial temperature/tint (catches row/column-major mixups)", () => {
            const m = GetWhiteBalanceMatrix(3000, 40);
            // m is column-major: m[3] is row0/col1, m[1] is row1/col0.
            expect(m[3]).not.toBeCloseTo(m[1], 3);
        });

        it("should warm-correct a low color temperature by boosting blue relative to red", () => {
            const m = GetWhiteBalanceMatrix(3000, 0);
            // Applying the matrix to a neutral gray patch should reduce red and boost blue,
            // since correcting for a warm (low Kelvin) light source shifts the image cooler.
            const r = m[0] + m[3] + m[6];
            const b = m[2] + m[5] + m[8];
            expect(r).toBeLessThan(1);
            expect(b).toBeGreaterThan(1);
        });

        it("should cool-correct a high color temperature by boosting red relative to blue", () => {
            const m = GetWhiteBalanceMatrix(9000, 0);
            const r = m[0] + m[3] + m[6];
            const b = m[2] + m[5] + m[8];
            expect(r).toBeGreaterThan(1);
            expect(b).toBeLessThan(1);
        });
    });

    describe("TemperatureTintToXyz", () => {
        it("should clamp temperature to the tabulated range without throwing", () => {
            expect(() => TemperatureTintToXyz(1, 0)).not.toThrow();
            expect(() => TemperatureTintToXyz(1000000, 0)).not.toThrow();
        });

        it("should clamp tint to +/-150", () => {
            const clamped = TemperatureTintToXyz(5500, 150);
            const overshoot = TemperatureTintToXyz(5500, 1000);
            expect(overshoot.x).toBeCloseTo(clamped.x, 10);
            expect(overshoot.y).toBeCloseTo(clamped.y, 10);
            expect(overshoot.z).toBeCloseTo(clamped.z, 10);
        });
    });
});
