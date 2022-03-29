/* eslint-disable @typescript-eslint/naming-convention */
import { Vector3 } from "../Maths/math.vector";
import type { Nullable } from "../types";
import type { Color3 } from "../Maths/math.color";
import { TmpVectors } from "./math";

// https://dickyjim.wordpress.com/2013/09/04/spherical-harmonics-for-beginners/
// http://silviojemma.com/public/papers/lighting/spherical-harmonic-lighting.pdf
// https://www.ppsloan.org/publications/StupidSH36.pdf
// http://cseweb.ucsd.edu/~ravir/papers/envmap/envmap.pdf
// https://www.ppsloan.org/publications/SHJCGT.pdf
// https://www.ppsloan.org/publications/shdering.pdf
// https://google.github.io/filament/Filament.md.html#annex/sphericalharmonics
// https://patapom.com/blog/SHPortal/
// https://imdoingitwrong.wordpress.com/2011/04/14/spherical-harmonics-wtf/

// Using real SH basis:
//  m>0             m   m
// y   = sqrt(2) * K * P * cos(m*phi) * cos(theta)
//  l               l   l
//
//  m<0             m   |m|
// y   = sqrt(2) * K * P * sin(m*phi) * cos(theta)
//  l               l   l
//
//  m=0   0   0
// y   = K * P * trigono terms
//  l     l   l
//
//  m       (2l + 1)(l - |m|)!
// K = sqrt(------------------)
//  l           4pi(l + |m|)!
//
// and P by recursion:
//
// P00(x) = 1
// P01(x) = x
// Pll(x) = (-1^l)(2l - 1)!!(1-x*x)^(1/2)
//          ((2l - 1)x[Pl-1/m]-(l + m - 1)[Pl-2/m])
// Plm(x) = ---------------------------------------
//                         l - m
// Leaving the trigonometric terms aside we can precompute the constants to :
const SH3ylmBasisConstants = [
    Math.sqrt(1 / (4 * Math.PI)), // l00

    -Math.sqrt(3 / (4 * Math.PI)), // l1_1
    Math.sqrt(3 / (4 * Math.PI)), // l10
    -Math.sqrt(3 / (4 * Math.PI)), // l11

    Math.sqrt(15 / (4 * Math.PI)), // l2_2
    -Math.sqrt(15 / (4 * Math.PI)), // l2_1
    Math.sqrt(5 / (16 * Math.PI)), // l20
    -Math.sqrt(15 / (4 * Math.PI)), // l21
    Math.sqrt(15 / (16 * Math.PI)), // l22
];

// cm = cos(m * phi)
// sm = sin(m * phi)
// {x,y,z} = {cos(phi)sin(theta), sin(phi)sin(theta), cos(theta)}
// By recursion on using trigo identities:
const SH3ylmBasisTrigonometricTerms = [
    () => 1, // l00

    (direction: Vector3) => direction.y, // l1_1
    (direction: Vector3) => direction.z, // l10
    (direction: Vector3) => direction.x, // l11

    (direction: Vector3) => direction.x * direction.y, // l2_2
    (direction: Vector3) => direction.y * direction.z, // l2_1
    (direction: Vector3) => 3 * direction.z * direction.z - 1, // l20
    (direction: Vector3) => direction.x * direction.z, // l21
    (direction: Vector3) => direction.x * direction.x - direction.y * direction.y, // l22
];

// Wrap the full compute
const applySH3 = (lm: number, direction: Vector3) => {
    return SH3ylmBasisConstants[lm] * SH3ylmBasisTrigonometricTerms[lm](direction);
};

// Derived from the integration of the a kernel convolution to SH.
// Great explanation here: https://patapom.com/blog/SHPortal/#about-distant-radiance-and-irradiance-environments
const SHCosKernelConvolution = [Math.PI, (2 * Math.PI) / 3, (2 * Math.PI) / 3, (2 * Math.PI) / 3, Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4];

/**
 * Class representing spherical harmonics coefficients to the 3rd degree
 */
export class SphericalHarmonics {
    /**
     * Defines whether or not the harmonics have been prescaled for rendering.
     */
    public preScaled = false;

    /**
     * The l0,0 coefficients of the spherical harmonics
     */
    public l00: Vector3 = Vector3.Zero();

    /**
     * The l1,-1 coefficients of the spherical harmonics
     */
    public l1_1: Vector3 = Vector3.Zero();

    /**
     * The l1,0 coefficients of the spherical harmonics
     */
    public l10: Vector3 = Vector3.Zero();

    /**
     * The l1,1 coefficients of the spherical harmonics
     */
    public l11: Vector3 = Vector3.Zero();

    /**
     * The l2,-2 coefficients of the spherical harmonics
     */
    public l2_2: Vector3 = Vector3.Zero();

    /**
     * The l2,-1 coefficients of the spherical harmonics
     */
    public l2_1: Vector3 = Vector3.Zero();

    /**
     * The l2,0 coefficients of the spherical harmonics
     */
    public l20: Vector3 = Vector3.Zero();

    /**
     * The l2,1 coefficients of the spherical harmonics
     */
    public l21: Vector3 = Vector3.Zero();

    /**
     * The l2,2 coefficients of the spherical harmonics
     */
    public l22: Vector3 = Vector3.Zero();

    /**
     * Adds a light to the spherical harmonics
     * @param direction the direction of the light
     * @param color the color of the light
     * @param deltaSolidAngle the delta solid angle of the light
     */
    public addLight(direction: Vector3, color: Color3, deltaSolidAngle: number): void {
        TmpVectors.Vector3[0].set(color.r, color.g, color.b);
        const colorVector = TmpVectors.Vector3[0];
        const c = TmpVectors.Vector3[1];
        colorVector.scaleToRef(deltaSolidAngle, c);

        c.scaleToRef(applySH3(0, direction), TmpVectors.Vector3[2]);
        this.l00.addInPlace(TmpVectors.Vector3[2]);

        c.scaleToRef(applySH3(1, direction), TmpVectors.Vector3[2]);
        this.l1_1.addInPlace(TmpVectors.Vector3[2]);
        c.scaleToRef(applySH3(2, direction), TmpVectors.Vector3[2]);
        this.l10.addInPlace(TmpVectors.Vector3[2]);
        c.scaleToRef(applySH3(3, direction), TmpVectors.Vector3[2]);
        this.l11.addInPlace(TmpVectors.Vector3[2]);

        c.scaleToRef(applySH3(4, direction), TmpVectors.Vector3[2]);
        this.l2_2.addInPlace(TmpVectors.Vector3[2]);
        c.scaleToRef(applySH3(5, direction), TmpVectors.Vector3[2]);
        this.l2_1.addInPlace(TmpVectors.Vector3[2]);
        c.scaleToRef(applySH3(6, direction), TmpVectors.Vector3[2]);
        this.l20.addInPlace(TmpVectors.Vector3[2]);
        c.scaleToRef(applySH3(7, direction), TmpVectors.Vector3[2]);
        this.l21.addInPlace(TmpVectors.Vector3[2]);
        c.scaleToRef(applySH3(8, direction), TmpVectors.Vector3[2]);
        this.l22.addInPlace(TmpVectors.Vector3[2]);
    }

    /**
     * Scales the spherical harmonics by the given amount
     * @param scale the amount to scale
     */
    public scaleInPlace(scale: number): void {
        this.l00.scaleInPlace(scale);
        this.l1_1.scaleInPlace(scale);
        this.l10.scaleInPlace(scale);
        this.l11.scaleInPlace(scale);
        this.l2_2.scaleInPlace(scale);
        this.l2_1.scaleInPlace(scale);
        this.l20.scaleInPlace(scale);
        this.l21.scaleInPlace(scale);
        this.l22.scaleInPlace(scale);
    }

    /**
     * Convert from incident radiance (Li) to irradiance (E) by applying convolution with the cosine-weighted hemisphere.
     *
     * ```
     * E_lm = A_l * L_lm
     * ```
     *
     * In spherical harmonics this convolution amounts to scaling factors for each frequency band.
     * This corresponds to equation 5 in "An Efficient Representation for Irradiance Environment Maps", where
     * the scaling factors are given in equation 9.
     */
    public convertIncidentRadianceToIrradiance(): void {
        // Constant (Band 0)
        this.l00.scaleInPlace(SHCosKernelConvolution[0]);

        // Linear (Band 1)
        this.l1_1.scaleInPlace(SHCosKernelConvolution[1]);
        this.l10.scaleInPlace(SHCosKernelConvolution[2]);
        this.l11.scaleInPlace(SHCosKernelConvolution[3]);

        // Quadratic (Band 2)
        this.l2_2.scaleInPlace(SHCosKernelConvolution[4]);
        this.l2_1.scaleInPlace(SHCosKernelConvolution[5]);
        this.l20.scaleInPlace(SHCosKernelConvolution[6]);
        this.l21.scaleInPlace(SHCosKernelConvolution[7]);
        this.l22.scaleInPlace(SHCosKernelConvolution[8]);
    }

    /**
     * Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
     *
     * ```
     * L = (1/pi) * E * rho
     * ```
     *
     * This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.
     */
    public convertIrradianceToLambertianRadiance(): void {
        this.scaleInPlace(1.0 / Math.PI);

        // The resultant SH now represents outgoing radiance, so includes the Lambert 1/pi normalisation factor but without albedo (rho) applied
        // (The pixel shader must apply albedo after texture fetches, etc).
    }

    /**
     * Integrates the reconstruction coefficients directly in to the SH preventing further
     * required operations at run time.
     *
     * This is simply done by scaling back the SH with Ylm constants parameter.
     * The trigonometric part being applied by the shader at run time.
     */
    public preScaleForRendering(): void {
        this.preScaled = true;

        this.l00.scaleInPlace(SH3ylmBasisConstants[0]);

        this.l1_1.scaleInPlace(SH3ylmBasisConstants[1]);
        this.l10.scaleInPlace(SH3ylmBasisConstants[2]);
        this.l11.scaleInPlace(SH3ylmBasisConstants[3]);

        this.l2_2.scaleInPlace(SH3ylmBasisConstants[4]);
        this.l2_1.scaleInPlace(SH3ylmBasisConstants[5]);
        this.l20.scaleInPlace(SH3ylmBasisConstants[6]);
        this.l21.scaleInPlace(SH3ylmBasisConstants[7]);
        this.l22.scaleInPlace(SH3ylmBasisConstants[8]);
    }

    /**
     * update the spherical harmonics coefficients from the given array
     * @param data defines the 9x3 coefficients (l00, l1-1, l10, l11, l2-2, l2-1, l20, l21, l22)
     * @returns the spherical harmonics (this)
     */
    public updateFromArray(data: ArrayLike<ArrayLike<number>>): SphericalHarmonics {
        Vector3.FromArrayToRef(data[0], 0, this.l00);
        Vector3.FromArrayToRef(data[1], 0, this.l1_1);
        Vector3.FromArrayToRef(data[2], 0, this.l10);
        Vector3.FromArrayToRef(data[3], 0, this.l11);
        Vector3.FromArrayToRef(data[4], 0, this.l2_2);
        Vector3.FromArrayToRef(data[5], 0, this.l2_1);
        Vector3.FromArrayToRef(data[6], 0, this.l20);
        Vector3.FromArrayToRef(data[7], 0, this.l21);
        Vector3.FromArrayToRef(data[8], 0, this.l22);
        return this;
    }

    /**
     * update the spherical harmonics coefficients from the given floats array
     * @param data defines the 9x3 coefficients (l00, l1-1, l10, l11, l2-2, l2-1, l20, l21, l22)
     * @returns the spherical harmonics (this)
     */
    public updateFromFloatsArray(data: ArrayLike<number>): SphericalHarmonics {
        Vector3.FromFloatsToRef(data[0], data[1], data[2], this.l00);
        Vector3.FromFloatsToRef(data[3], data[4], data[5], this.l1_1);
        Vector3.FromFloatsToRef(data[6], data[7], data[8], this.l10);
        Vector3.FromFloatsToRef(data[9], data[10], data[11], this.l11);
        Vector3.FromFloatsToRef(data[12], data[13], data[14], this.l2_2);
        Vector3.FromFloatsToRef(data[15], data[16], data[17], this.l2_1);
        Vector3.FromFloatsToRef(data[18], data[19], data[20], this.l20);
        Vector3.FromFloatsToRef(data[21], data[22], data[23], this.l21);
        Vector3.FromFloatsToRef(data[24], data[25], data[26], this.l22);
        return this;
    }

    /**
     * Constructs a spherical harmonics from an array.
     * @param data defines the 9x3 coefficients (l00, l1-1, l10, l11, l2-2, l2-1, l20, l21, l22)
     * @returns the spherical harmonics
     */
    public static FromArray(data: ArrayLike<ArrayLike<number>>): SphericalHarmonics {
        const sh = new SphericalHarmonics();
        return sh.updateFromArray(data);
    }

    // Keep for references.
    /**
     * Gets the spherical harmonics from polynomial
     * @param polynomial the spherical polynomial
     * @returns the spherical harmonics
     */
    public static FromPolynomial(polynomial: SphericalPolynomial): SphericalHarmonics {
        const result = new SphericalHarmonics();

        result.l00 = polynomial.xx.scale(0.376127).add(polynomial.yy.scale(0.376127)).add(polynomial.zz.scale(0.376126));
        result.l1_1 = polynomial.y.scale(0.977204);
        result.l10 = polynomial.z.scale(0.977204);
        result.l11 = polynomial.x.scale(0.977204);
        result.l2_2 = polynomial.xy.scale(1.16538);
        result.l2_1 = polynomial.yz.scale(1.16538);
        result.l20 = polynomial.zz.scale(1.34567).subtract(polynomial.xx.scale(0.672834)).subtract(polynomial.yy.scale(0.672834));
        result.l21 = polynomial.zx.scale(1.16538);
        result.l22 = polynomial.xx.scale(1.16538).subtract(polynomial.yy.scale(1.16538));

        result.l1_1.scaleInPlace(-1);
        result.l11.scaleInPlace(-1);
        result.l2_1.scaleInPlace(-1);
        result.l21.scaleInPlace(-1);

        result.scaleInPlace(Math.PI);

        return result;
    }
}

/**
 * Class representing spherical polynomial coefficients to the 3rd degree
 */
export class SphericalPolynomial {
    private _harmonics: Nullable<SphericalHarmonics>;

    /**
     * The spherical harmonics used to create the polynomials.
     */
    public get preScaledHarmonics(): SphericalHarmonics {
        if (!this._harmonics) {
            this._harmonics = SphericalHarmonics.FromPolynomial(this);
        }
        if (!this._harmonics.preScaled) {
            this._harmonics.preScaleForRendering();
        }
        return this._harmonics;
    }

    /**
     * The x coefficients of the spherical polynomial
     */
    public x: Vector3 = Vector3.Zero();

    /**
     * The y coefficients of the spherical polynomial
     */
    public y: Vector3 = Vector3.Zero();

    /**
     * The z coefficients of the spherical polynomial
     */
    public z: Vector3 = Vector3.Zero();

    /**
     * The xx coefficients of the spherical polynomial
     */
    public xx: Vector3 = Vector3.Zero();

    /**
     * The yy coefficients of the spherical polynomial
     */
    public yy: Vector3 = Vector3.Zero();

    /**
     * The zz coefficients of the spherical polynomial
     */
    public zz: Vector3 = Vector3.Zero();

    /**
     * The xy coefficients of the spherical polynomial
     */
    public xy: Vector3 = Vector3.Zero();

    /**
     * The yz coefficients of the spherical polynomial
     */
    public yz: Vector3 = Vector3.Zero();

    /**
     * The zx coefficients of the spherical polynomial
     */
    public zx: Vector3 = Vector3.Zero();

    /**
     * Adds an ambient color to the spherical polynomial
     * @param color the color to add
     */
    public addAmbient(color: Color3): void {
        TmpVectors.Vector3[0].copyFromFloats(color.r, color.g, color.b);
        const colorVector = TmpVectors.Vector3[0];
        this.xx.addInPlace(colorVector);
        this.yy.addInPlace(colorVector);
        this.zz.addInPlace(colorVector);
    }

    /**
     * Scales the spherical polynomial by the given amount
     * @param scale the amount to scale
     */
    public scaleInPlace(scale: number) {
        this.x.scaleInPlace(scale);
        this.y.scaleInPlace(scale);
        this.z.scaleInPlace(scale);
        this.xx.scaleInPlace(scale);
        this.yy.scaleInPlace(scale);
        this.zz.scaleInPlace(scale);
        this.yz.scaleInPlace(scale);
        this.zx.scaleInPlace(scale);
        this.xy.scaleInPlace(scale);
    }

    /**
     * Updates the spherical polynomial from harmonics
     * @param harmonics the spherical harmonics
     * @returns the spherical polynomial
     */
    public updateFromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial {
        this._harmonics = harmonics;

        this.x.copyFrom(harmonics.l11);
        this.x.scaleInPlace(1.02333).scaleInPlace(-1);
        this.y.copyFrom(harmonics.l1_1);
        this.y.scaleInPlace(1.02333).scaleInPlace(-1);
        this.z.copyFrom(harmonics.l10);
        this.z.scaleInPlace(1.02333);

        this.xx.copyFrom(harmonics.l00);
        TmpVectors.Vector3[0].copyFrom(harmonics.l20).scaleInPlace(0.247708);
        TmpVectors.Vector3[1].copyFrom(harmonics.l22).scaleInPlace(0.429043);
        this.xx.scaleInPlace(0.886277).subtractInPlace(TmpVectors.Vector3[0]).addInPlace(TmpVectors.Vector3[1]);
        this.yy.copyFrom(harmonics.l00);
        this.yy.scaleInPlace(0.886277).subtractInPlace(TmpVectors.Vector3[0]).subtractInPlace(TmpVectors.Vector3[1]);
        this.zz.copyFrom(harmonics.l00);
        TmpVectors.Vector3[0].copyFrom(harmonics.l20).scaleInPlace(0.495417);
        this.zz.scaleInPlace(0.886277).addInPlace(TmpVectors.Vector3[0]);

        this.yz.copyFrom(harmonics.l2_1);
        this.yz.scaleInPlace(0.858086).scaleInPlace(-1);
        this.zx.copyFrom(harmonics.l21);
        this.zx.scaleInPlace(0.858086).scaleInPlace(-1);
        this.xy.copyFrom(harmonics.l2_2);
        this.xy.scaleInPlace(0.858086);

        this.scaleInPlace(1.0 / Math.PI);

        return this;
    }

    /**
     * Gets the spherical polynomial from harmonics
     * @param harmonics the spherical harmonics
     * @returns the spherical polynomial
     */
    public static FromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial {
        const result = new SphericalPolynomial();
        return result.updateFromHarmonics(harmonics);
    }

    /**
     * Constructs a spherical polynomial from an array.
     * @param data defines the 9x3 coefficients (x, y, z, xx, yy, zz, yz, zx, xy)
     * @returns the spherical polynomial
     */
    public static FromArray(data: ArrayLike<ArrayLike<number>>): SphericalPolynomial {
        const sp = new SphericalPolynomial();
        Vector3.FromArrayToRef(data[0], 0, sp.x);
        Vector3.FromArrayToRef(data[1], 0, sp.y);
        Vector3.FromArrayToRef(data[2], 0, sp.z);
        Vector3.FromArrayToRef(data[3], 0, sp.xx);
        Vector3.FromArrayToRef(data[4], 0, sp.yy);
        Vector3.FromArrayToRef(data[5], 0, sp.zz);
        Vector3.FromArrayToRef(data[6], 0, sp.yz);
        Vector3.FromArrayToRef(data[7], 0, sp.zx);
        Vector3.FromArrayToRef(data[8], 0, sp.xy);
        return sp;
    }
}
