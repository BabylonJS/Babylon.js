import { afterEach, describe, expect, it, vi } from "vitest";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { SphericalHarmonics, SphericalPolynomial } from "core/Maths/sphericalPolynomial";

function MakeHarmonics(scale = 1) {
    const harmonics = new SphericalHarmonics();
    harmonics.l00 = new Vector3(1, 0.8, 0.6).scaleInPlace(scale);
    harmonics.l10 = new Vector3(0.4, 0.3, 0.2).scaleInPlace(scale);
    harmonics.l22 = new Vector3(0.1, 0.05, 0.02).scaleInPlace(scale);
    return harmonics;
}

function MakePolynomial() {
    return SphericalPolynomial.FromHarmonics(MakeHarmonics());
}

describe("SphericalPolynomial", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("FromHarmonics keeps the supplied harmonics for rendering", () => {
        const fromPolynomial = vi.spyOn(SphericalHarmonics, "FromPolynomial");
        const harmonics = MakeHarmonics();
        const polynomial = SphericalPolynomial.FromHarmonics(harmonics);

        expect(polynomial.preScaledHarmonics).toBe(harmonics);
        expect(fromPolynomial).not.toHaveBeenCalled();
    });

    it("updateFromHarmonics keeps each newly supplied harmonics for rendering", () => {
        const fromPolynomial = vi.spyOn(SphericalHarmonics, "FromPolynomial");
        const polynomial = MakePolynomial();

        for (let i = 2; i <= 3; i++) {
            const harmonics = MakeHarmonics(i);
            polynomial.updateFromHarmonics(harmonics);

            expect(polynomial.preScaledHarmonics).toBe(harmonics);
        }
        expect(fromPolynomial).not.toHaveBeenCalled();
    });

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
