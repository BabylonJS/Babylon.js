import { describe, expect, it } from "vitest";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { SphericalHarmonics, SphericalPolynomial } from "core/Maths/sphericalPolynomial";

function MakePolynomial() {
    const harmonics = new SphericalHarmonics();
    harmonics.l00 = new Vector3(1, 0.8, 0.6);
    harmonics.l10 = new Vector3(0.4, 0.3, 0.2);
    harmonics.l22 = new Vector3(0.1, 0.05, 0.02);
    return SphericalPolynomial.FromHarmonics(harmonics);
}

describe("SphericalPolynomial", () => {
    it("scaleInPlace updates the harmonics bound for rendering", () => {
        const reference = MakePolynomial().preScaledHarmonics;
        const scaled = MakePolynomial();
        scaled.scaleInPlace(0.5);
        expect(scaled.preScaledHarmonics.l00.x).toBeCloseTo(reference.l00.x * 0.5, 4);
        expect(scaled.preScaledHarmonics.l10.y).toBeCloseTo(reference.l10.y * 0.5, 4);
        expect(scaled.preScaledHarmonics.l22.z).toBeCloseTo(reference.l22.z * 0.5, 4);
    });

    it("scaleInPlace after the harmonics were already used still applies", () => {
        const polynomial = MakePolynomial();
        const before = polynomial.preScaledHarmonics.l00.x;
        polynomial.scaleInPlace(2);
        expect(polynomial.preScaledHarmonics.l00.x).toBeCloseTo(before * 2, 4);
    });

    it("addAmbient updates the harmonics bound for rendering", () => {
        const reference = MakePolynomial();
        const before = reference.preScaledHarmonics.l00.clone();
        reference.addAmbient(new Color3(0.3, 0.3, 0.3));
        expect(reference.preScaledHarmonics.l00.x).toBeGreaterThan(before.x);
    });
});
