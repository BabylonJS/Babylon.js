import { Vector3 } from "../Maths/math.vector";
import { Nullable } from "../types";
import { Color3 } from '../Maths/math.color';

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
    (direction: Vector3) => 1, // l00

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
const SHCosKernelConvolution = [
    Math.PI,

    2 * Math.PI / 3,
    2 * Math.PI / 3,
    2 * Math.PI / 3,

    Math.PI / 4,
    Math.PI / 4,
    Math.PI / 4,
    Math.PI / 4,
    Math.PI / 4,
];

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
        var colorVector = new Vector3(color.r, color.g, color.b);
        var c = colorVector.scale(deltaSolidAngle);

        this.l00 = this.l00.add(c.scale(applySH3(0, direction)));

        this.l1_1 = this.l1_1.add(c.scale(applySH3(1, direction)));
        this.l10 = this.l10.add(c.scale(applySH3(2, direction)));
        this.l11 = this.l11.add(c.scale(applySH3(3, direction)));

        this.l2_2 = this.l2_2.add(c.scale(applySH3(4, direction)));
        this.l2_1 = this.l2_1.add(c.scale(applySH3(5, direction)));
        this.l20 = this.l20.add(c.scale(applySH3(6, direction)));
        this.l21 = this.l21.add(c.scale(applySH3(7, direction)));
        this.l22 = this.l22.add(c.scale(applySH3(8, direction)));
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
     * Constructs a spherical harmonics from an array.
     * @param data defines the 9x3 coefficients (l00, l1-1, l10, l11, l2-2, l2-1, l20, l21, l22)
     * @returns the spherical harmonics
     */
    public static FromArray(data: ArrayLike<ArrayLike<number>>): SphericalHarmonics {
        const sh = new SphericalHarmonics();
        Vector3.FromArrayToRef(data[0], 0, sh.l00);
        Vector3.FromArrayToRef(data[1], 0, sh.l1_1);
        Vector3.FromArrayToRef(data[2], 0, sh.l10);
        Vector3.FromArrayToRef(data[3], 0, sh.l11);
        Vector3.FromArrayToRef(data[4], 0, sh.l2_2);
        Vector3.FromArrayToRef(data[5], 0, sh.l2_1);
        Vector3.FromArrayToRef(data[6], 0, sh.l20);
        Vector3.FromArrayToRef(data[7], 0, sh.l21);
        Vector3.FromArrayToRef(data[8], 0, sh.l22);
        return sh;
    }

    // Keep for references.
    /**
     * Gets the spherical harmonics from polynomial
     * @param polynomial the spherical polynomial
     * @returns the spherical harmonics
     */
    public static FromPolynomial(polynomial: SphericalPolynomial): SphericalHarmonics {
        var result = new SphericalHarmonics();

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
        var colorVector = new Vector3(color.r, color.g, color.b);
        this.xx = this.xx.add(colorVector);
        this.yy = this.yy.add(colorVector);
        this.zz = this.zz.add(colorVector);
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
     * Gets the spherical polynomial from harmonics
     * @param harmonics the spherical harmonics
     * @returns the spherical polynomial
     */
    public static FromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial {
        var result = new SphericalPolynomial();
        result._harmonics = harmonics;

        result.x = harmonics.l11.scale(1.02333).scale(-1);
        result.y = harmonics.l1_1.scale(1.02333).scale(-1);
        result.z = harmonics.l10.scale(1.02333);

        result.xx = harmonics.l00.scale(0.886277).subtract(harmonics.l20.scale(0.247708)).add(harmonics.l22.scale(0.429043));
        result.yy = harmonics.l00.scale(0.886277).subtract(harmonics.l20.scale(0.247708)).subtract(harmonics.l22.scale(0.429043));
        result.zz = harmonics.l00.scale(0.886277).add(harmonics.l20.scale(0.495417));

        result.yz = harmonics.l2_1.scale(0.858086).scale(-1);
        result.zx = harmonics.l21.scale(0.858086).scale(-1);
        result.xy = harmonics.l2_2.scale(0.858086);

        result.scaleInPlace(1.0 / Math.PI);

        return result;
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
