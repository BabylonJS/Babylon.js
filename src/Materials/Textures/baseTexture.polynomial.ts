import { Nullable } from "../../types";
import { CubeMapToSphericalPolynomialTools } from "../../Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { SphericalPolynomial } from "../../Maths/sphericalPolynomial";
import { BaseTexture } from "./baseTexture";
import { InternalTexture } from "./internalTexture";

declare module "./baseTexture" {
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
         * @param texture texture to recompute the spherical polynomials for
         */
        forceSphericalPolynomialsRecompute(texture: InternalTexture): void;
    }
}

BaseTexture.prototype.forceSphericalPolynomialsRecompute = function(texture: InternalTexture): void {
    texture._sphericalPolynomial = null;
    texture._sphericalPolynomialPromise = null;
    texture._sphericalPolynomialComputed = false;
}

Object.defineProperty(BaseTexture.prototype, "sphericalPolynomial", {
    get: function (this: BaseTexture) {
        if (this._texture) {
            if (this._texture._sphericalPolynomial || this._texture._sphericalPolynomialComputed) {
                return this._texture._sphericalPolynomial;
            }

            if (this._texture.isReady) {
                if (!this._texture._sphericalPolynomialPromise) {
                    this._texture._sphericalPolynomialPromise = CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this);
                    if (this._texture._sphericalPolynomialPromise === null) {
                        this._texture._sphericalPolynomialComputed = true;
                    } else {
                        this._texture._sphericalPolynomialPromise.then((sphericalPolynomial) => {
                            this._texture!._sphericalPolynomial = sphericalPolynomial;
                            this._texture!._sphericalPolynomialComputed = true;
                        });
                    }
                }

                return null;
            }
        }

        return null;
    },
    set: function (this: BaseTexture, value: Nullable<SphericalPolynomial>) {
        if (this._texture) {
            this._texture._sphericalPolynomial = value;
        }
    },
    enumerable: true,
    configurable: true
});
