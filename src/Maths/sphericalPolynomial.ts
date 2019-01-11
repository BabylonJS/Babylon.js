import { Vector3, Color3 } from "../Maths/math";
/**
 * Class representing spherical polynomial coefficients to the 3rd degree
 */
export class SphericalPolynomial {
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
    public scale(scale: number) {
        this.x = this.x.scale(scale);
        this.y = this.y.scale(scale);
        this.z = this.z.scale(scale);
        this.xx = this.xx.scale(scale);
        this.yy = this.yy.scale(scale);
        this.zz = this.zz.scale(scale);
        this.yz = this.yz.scale(scale);
        this.zx = this.zx.scale(scale);
        this.xy = this.xy.scale(scale);
    }

    /**
     * Gets the spherical polynomial from harmonics
     * @param harmonics the spherical harmonics
     * @returns the spherical polynomial
     */
    public static FromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial {
        var result = new SphericalPolynomial();

        result.x = harmonics.l11.scale(1.02333);
        result.y = harmonics.l1_1.scale(1.02333);
        result.z = harmonics.l10.scale(1.02333);

        result.xx = harmonics.l00.scale(0.886277).subtract(harmonics.l20.scale(0.247708)).add(harmonics.lL22.scale(0.429043));
        result.yy = harmonics.l00.scale(0.886277).subtract(harmonics.l20.scale(0.247708)).subtract(harmonics.lL22.scale(0.429043));
        result.zz = harmonics.l00.scale(0.886277).add(harmonics.l20.scale(0.495417));

        result.yz = harmonics.l2_1.scale(0.858086);
        result.zx = harmonics.l21.scale(0.858086);
        result.xy = harmonics.l2_2.scale(0.858086);

        result.scale(1.0 / Math.PI);

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

/**
 * Class representing spherical harmonics coefficients to the 3rd degree
 */
export class SphericalHarmonics {
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
    public lL22: Vector3 = Vector3.Zero();

    /**
     * Adds a light to the spherical harmonics
     * @param direction the direction of the light
     * @param color the color of the light
     * @param deltaSolidAngle the delta solid angle of the light
     */
    public addLight(direction: Vector3, color: Color3, deltaSolidAngle: number): void {
        var colorVector = new Vector3(color.r, color.g, color.b);
        var c = colorVector.scale(deltaSolidAngle);

        this.l00 = this.l00.add(c.scale(0.282095));

        this.l1_1 = this.l1_1.add(c.scale(0.488603 * direction.y));
        this.l10 = this.l10.add(c.scale(0.488603 * direction.z));
        this.l11 = this.l11.add(c.scale(0.488603 * direction.x));

        this.l2_2 = this.l2_2.add(c.scale(1.092548 * direction.x * direction.y));
        this.l2_1 = this.l2_1.add(c.scale(1.092548 * direction.y * direction.z));
        this.l21 = this.l21.add(c.scale(1.092548 * direction.x * direction.z));

        this.l20 = this.l20.add(c.scale(0.315392 * (3.0 * direction.z * direction.z - 1.0)));
        this.lL22 = this.lL22.add(c.scale(0.546274 * (direction.x * direction.x - direction.y * direction.y)));
    }

    /**
     * Scales the spherical harmonics by the given amount
     * @param scale the amount to scale
     */
    public scale(scale: number): void {
        this.l00 = this.l00.scale(scale);
        this.l1_1 = this.l1_1.scale(scale);
        this.l10 = this.l10.scale(scale);
        this.l11 = this.l11.scale(scale);
        this.l2_2 = this.l2_2.scale(scale);
        this.l2_1 = this.l2_1.scale(scale);
        this.l20 = this.l20.scale(scale);
        this.l21 = this.l21.scale(scale);
        this.lL22 = this.lL22.scale(scale);
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
        this.l00 = this.l00.scale(3.141593);

        // Linear (Band 1)
        this.l1_1 = this.l1_1.scale(2.094395);
        this.l10 = this.l10.scale(2.094395);
        this.l11 = this.l11.scale(2.094395);

        // Quadratic (Band 2)
        this.l2_2 = this.l2_2.scale(0.785398);
        this.l2_1 = this.l2_1.scale(0.785398);
        this.l20 = this.l20.scale(0.785398);
        this.l21 = this.l21.scale(0.785398);
        this.lL22 = this.lL22.scale(0.785398);
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
        this.scale(1.0 / Math.PI);

        // The resultant SH now represents outgoing radiance, so includes the Lambert 1/pi normalisation factor but without albedo (rho) applied
        // (The pixel shader must apply albedo after texture fetches, etc).
    }

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
        result.lL22 = polynomial.xx.scale(1.16538).subtract(polynomial.yy.scale(1.16538));

        result.scale(Math.PI);

        return result;
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
        Vector3.FromArrayToRef(data[8], 0, sh.lL22);
        return sh;
    }
}
