module BABYLON {
    export class SphericalPolynomial {
        public x: Vector3 = Vector3.Zero();
        public y: Vector3 = Vector3.Zero();
        public z: Vector3 = Vector3.Zero();
        public xx: Vector3 = Vector3.Zero();
        public yy: Vector3 = Vector3.Zero();
        public zz: Vector3 = Vector3.Zero();
        public xy: Vector3 = Vector3.Zero();
        public yz: Vector3 = Vector3.Zero();
        public zx: Vector3 = Vector3.Zero();

        public addAmbient(color: Color3): void {
            var colorVector = new Vector3(color.r, color.g, color.b);
            this.xx = this.xx.add(colorVector);
            this.yy = this.yy.add(colorVector);
            this.zz = this.zz.add(colorVector);
        }

        public static getSphericalPolynomialFromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial {
            var result = new SphericalPolynomial();

            result.x = harmonics.L11.scale(1.02333);
            result.y = harmonics.L1_1.scale(1.02333);
            result.z = harmonics.L10.scale(1.02333);

            result.xx = harmonics.L00.scale(0.886277).subtract(harmonics.L20.scale(0.247708)).add(harmonics.L22.scale(0.429043));
            result.yy = harmonics.L00.scale(0.886277).subtract(harmonics.L20.scale(0.247708)).subtract(harmonics.L22.scale(0.429043));
            result.zz = harmonics.L00.scale(0.886277).add(harmonics.L20.scale(0.495417));

            result.yz = harmonics.L2_1.scale(0.858086);
            result.zx = harmonics.L21.scale(0.858086);
            result.xy = harmonics.L2_2.scale(0.858086);

            result.scale(1.0 / Math.PI);

            return result;
        }

        public scale(scale: number)
        {
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
    }

    export class SphericalHarmonics {
        public L00: Vector3 = Vector3.Zero();
        public L1_1: Vector3 = Vector3.Zero();
        public L10: Vector3 = Vector3.Zero();
        public L11: Vector3 = Vector3.Zero();
        public L2_2: Vector3 = Vector3.Zero();
        public L2_1: Vector3 = Vector3.Zero();
        public L20: Vector3 = Vector3.Zero();
        public L21: Vector3 = Vector3.Zero();
        public L22: Vector3 = Vector3.Zero();

        public addLight(direction: Vector3, color: Color3, deltaSolidAngle: number): void {
            var colorVector = new Vector3(color.r, color.g, color.b);
            var c = colorVector.scale(deltaSolidAngle);

            this.L00 = this.L00.add(c.scale(0.282095));

            this.L1_1 = this.L1_1.add(c.scale(0.488603 * direction.y));
            this.L10 = this.L10.add(c.scale(0.488603 * direction.z));
            this.L11 = this.L11.add(c.scale(0.488603 * direction.x));

            this.L2_2 = this.L2_2.add(c.scale(1.092548 * direction.x * direction.y));
            this.L2_1 = this.L2_1.add(c.scale(1.092548 * direction.y * direction.z));
            this.L21 = this.L21.add(c.scale(1.092548 * direction.x * direction.z));

            this.L20 = this.L20.add(c.scale(0.315392 * (3.0 * direction.z * direction.z - 1.0)));
            this.L22 = this.L22.add(c.scale(0.546274 * (direction.x * direction.x - direction.y * direction.y)));
        }

        public scale(scale: number): void {
            this.L00 = this.L00.scale(scale);
            this.L1_1 = this.L1_1.scale(scale);
            this.L10 = this.L10.scale(scale);
            this.L11 = this.L11.scale(scale);
            this.L2_2 = this.L2_2.scale(scale);
            this.L2_1 = this.L2_1.scale(scale);
            this.L20 = this.L20.scale(scale);
            this.L21 = this.L21.scale(scale);
            this.L22 = this.L22.scale(scale);
        }

        public convertIncidentRadianceToIrradiance(): void
        {
            // Convert from incident radiance (Li) to irradiance (E) by applying convolution with the cosine-weighted hemisphere.
            //
            //      E_lm = A_l * L_lm
            // 
            // In spherical harmonics this convolution amounts to scaling factors for each frequency band.
            // This corresponds to equation 5 in "An Efficient Representation for Irradiance Environment Maps", where
            // the scaling factors are given in equation 9.

            // Constant (Band 0)
            this.L00 = this.L00.scale(3.141593);

            // Linear (Band 1)
            this.L1_1 = this.L1_1.scale(2.094395);
            this.L10 = this.L10.scale(2.094395);
            this.L11 = this.L11.scale(2.094395);

            // Quadratic (Band 2)
            this.L2_2 = this.L2_2.scale(0.785398);
            this.L2_1 = this.L2_1.scale(0.785398);
            this.L20 = this.L20.scale(0.785398);
            this.L21 = this.L21.scale(0.785398);
            this.L22 = this.L22.scale(0.785398);
        }

        public convertIrradianceToLambertianRadiance(): void
        {
            // Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
            //      L = (1/pi) * E * rho
            // 
            // This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.

            this.scale(1.0 / Math.PI);

            // The resultant SH now represents outgoing radiance, so includes the Lambert 1/pi normalisation factor but without albedo (rho) applied
            // (The pixel shader must apply albedo after texture fetches, etc).
        }

        public static getsphericalHarmonicsFromPolynomial(polynomial: SphericalPolynomial): SphericalHarmonics
        {
            var result = new SphericalHarmonics();

            result.L00 = polynomial.xx.scale(0.376127).add(polynomial.yy.scale(0.376127)).add(polynomial.zz.scale(0.376126));
            result.L1_1 = polynomial.y.scale(0.977204);
            result.L10 = polynomial.z.scale(0.977204);
            result.L11 = polynomial.x.scale(0.977204);
            result.L2_2 = polynomial.xy.scale(1.16538);
            result.L2_1 = polynomial.yz.scale(1.16538);
            result.L20 = polynomial.zz.scale(1.34567).subtract(polynomial.xx.scale(0.672834)).subtract(polynomial.yy.scale(0.672834));
            result.L21 = polynomial.zx.scale(1.16538);
            result.L22 = polynomial.xx.scale(1.16538).subtract(polynomial.yy.scale(1.16538));

            result.scale(Math.PI);

            return result;
        }
    }
}