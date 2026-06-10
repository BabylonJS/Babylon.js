import { FromHalfFloat, ToHalfFloat } from "core/Misc/halfFloat";

describe("HalfFloat", () => {
    describe("ToHalfFloat", () => {
        it("encodes exact bit patterns", () => {
            expect(ToHalfFloat(0)).toBe(0x0000);
            expect(ToHalfFloat(-0)).toBe(0x8000);
            expect(ToHalfFloat(1)).toBe(0x3c00);
            expect(ToHalfFloat(-1)).toBe(0xbc00);
            expect(ToHalfFloat(0.5)).toBe(0x3800);
            expect(ToHalfFloat(2)).toBe(0x4000);
            expect(ToHalfFloat(65504)).toBe(0x7bff); // max finite half
        });

        it("encodes the smallest normal and a denormal", () => {
            expect(ToHalfFloat(Math.pow(2, -14))).toBe(0x0400); // smallest positive normal
            expect(ToHalfFloat(Math.pow(2, -24))).toBe(0x0001); // smallest positive denormal
        });

        it("overflows to +/-Infinity at and beyond 2^16 (no clamping)", () => {
            // Mode-agnostic: 2^16+ exceeds the half exponent range under any rounding mode.
            expect(ToHalfFloat(65536)).toBe(0x7c00);
            expect(ToHalfFloat(70000)).toBe(0x7c00);
            expect(ToHalfFloat(-70000)).toBe(0xfc00);
        });

        it("preserves Infinity and NaN", () => {
            expect(ToHalfFloat(Infinity)).toBe(0x7c00);
            expect(ToHalfFloat(-Infinity)).toBe(0xfc00);
            // NaN stays NaN: exponent all ones with a non-zero mantissa
            const half = ToHalfFloat(NaN);
            expect((half & 0x7c00) === 0x7c00 && (half & 0x03ff) !== 0).toBe(true);
        });

        // These assertions are specific to the current round-toward-zero (truncation) algorithm.
        // When ToHalfFloat moves to the native Float16Array / Math.f16round (round-to-nearest-even,
        // e.g. Node 24+), they MUST be updated to the round-to-nearest-even results:
        //   ToHalfFloat(65520)       0x7bff -> 0x7c00 (+Inf)
        //   ToHalfFloat(1 + 3*2^-12) 0x3c00 -> 0x3c01
        describe("round-toward-zero specific (changes under round-to-nearest-even)", () => {
            it("keeps [65504, 65536) at the max finite half instead of rounding up to Infinity", () => {
                expect(ToHalfFloat(65520)).toBe(0x7bff);
            });
            it("drops the surplus mantissa bits instead of rounding up", () => {
                // 3/4 ULP above 1.0: truncation drops to 1.0 (0x3c00); round-to-nearest-even gives 0x3c01.
                expect(ToHalfFloat(1 + 3 * Math.pow(2, -12))).toBe(0x3c00);
            });
        });
    });

    describe("FromHalfFloat", () => {
        it("decodes special values", () => {
            expect(FromHalfFloat(0x0000)).toBe(0);
            expect(FromHalfFloat(0x7c00)).toBe(Infinity);
            expect(FromHalfFloat(0xfc00)).toBe(-Infinity);
            expect(Number.isNaN(FromHalfFloat(0x7e00))).toBe(true);
        });

        it("decodes the smallest normal and a denormal exactly", () => {
            expect(FromHalfFloat(0x0400)).toBe(Math.pow(2, -14));
            expect(FromHalfFloat(0x0001)).toBe(Math.pow(2, -24));
        });
    });

    describe("round-trip", () => {
        it("is exact for representable values", () => {
            const values = [0, 1, -1, 0.5, -0.5, 2, 0.25, 65504, Math.pow(2, -14), Math.pow(2, -24)];
            for (const value of values) {
                expect(FromHalfFloat(ToHalfFloat(value))).toBe(value);
            }
        });

        it("maps NaN back to NaN", () => {
            expect(Number.isNaN(FromHalfFloat(ToHalfFloat(NaN)))).toBe(true);
        });
    });
});
