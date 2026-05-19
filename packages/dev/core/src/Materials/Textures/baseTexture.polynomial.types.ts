import { type Nullable } from "../../types";
import { type SphericalPolynomial } from "../../Maths/sphericalPolynomial";
declare module "./baseTexture.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface BaseTexture {
        /**
         * Get the polynomial representation of the texture data.
         * This is mainly use as a fast way to recover IBL Diffuse irradiance data.
         * @see https://learnopengl.com/PBR/IBL/Diffuse-irradiance
         */
        sphericalPolynomial: Nullable<SphericalPolynomial>;

        /**
         * Force recomputation of spherical polynomials.
         * Can be useful if you generate a cubemap multiple times (from a probe for eg) and you need the proper polynomials each time
         */
        forceSphericalPolynomialsRecompute(): void;

        /** @internal */
        _sphericalPolynomialTargetSize: number;
    }
}
