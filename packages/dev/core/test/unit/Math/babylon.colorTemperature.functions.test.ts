import { Matrix, Vector3 } from "../../../src/Maths/math.vector.pure";
import { GetWhiteBalanceMatrix, TemperatureTintToXyz } from "../../../src/Maths/colorTemperature.functions";

// The sRGB / Rec.709 (D65) CIE XYZ to linear RGB matrix, matching the one used internally by
// colorTemperature.functions.ts, kept independent here so the self-consistency test below isn't
// tautological with the implementation it's checking.
// prettier-ignore
const XyzToRgbD65 = Matrix.FromArray([
    3.2404542, -0.969266, 0.0556434, 0,
    -1.5371385, 1.8760108, -0.2040259, 0,
    -0.4985314, 0.041556, 1.0572252, 0,
    0, 0, 0, 1,
]);

function applyColumnMajor(m: Float32Array, rgb: Vector3): Vector3 {
    return new Vector3(m[0] * rgb.x + m[3] * rgb.y + m[6] * rgb.z, m[1] * rgb.x + m[4] * rgb.y + m[7] * rgb.z, m[2] * rgb.x + m[5] * rgb.y + m[8] * rgb.z);
}

describe("Color temperature function tests", () => {
    describe("GetWhiteBalanceMatrix", () => {
        it.each([
            [6500, 0],
            [5000, 0],
            [3000, 0],
            [9000, 0],
            [4000, 30],
            [7500, -50],
        ])(
            "should map a patch that is the illuminant's own white point (T=%d, tint=%d) back to exactly neutral (1, 1, 1)",
            (temperatureKelvin, tint) => {
                // This is the defining correctness property of white balance: a surface that was the color of the
                // illuminant itself, once corrected, must read as neutral gray - regardless of which illuminant it
                // started as. It also implicitly verifies that the Bradford adaptation's destination white is the
                // same white point the RGB <-> XYZ matrices themselves already treat as neutral.
                const illuminantXYZ = TemperatureTintToXyz(temperatureKelvin, tint);
                const illuminantAsRgb = Vector3.TransformNormal(illuminantXYZ, XyzToRgbD65);

                const m = GetWhiteBalanceMatrix(temperatureKelvin, tint);
                const corrected = applyColumnMajor(m, illuminantAsRgb);

                expect(corrected.x).toBeCloseTo(1, 4);
                expect(corrected.y).toBeCloseTo(1, 4);
                expect(corrected.z).toBeCloseTo(1, 4);
            }
        );

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

        it("should stay bounded for a low temperature combined with an extreme tint, where the target illuminant approaches the edge of representable chromaticities", () => {
            // Regression test: temperature=3200, tint=99 previously produced matrix entries in the hundreds
            // because one of the target white's cone-response components approached zero, blowing up the
            // per-channel Bradford adaptation ratio.
            for (const tint of [90, 95, 99, 100, 120, 150]) {
                const m = GetWhiteBalanceMatrix(3200, tint);
                for (let i = 0; i < 9; i++) {
                    expect(Number.isFinite(m[i])).toBe(true);
                    expect(Math.abs(m[i])).toBeLessThan(15);
                }
            }
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
