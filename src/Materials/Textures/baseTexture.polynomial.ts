import { Nullable } from "../../types";
import { CubeMapToSphericalPolynomialTools } from "../../Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { SphericalPolynomial } from "../../Maths/sphericalPolynomial";
import { BaseTexture } from "./baseTexture";

declare module "./baseTexture" {
    export interface BaseTexture {
        /**
         * Get the polynomial representation of the texture data.
         * This is mainly use as a fast way to recover IBL Diffuse irradiance data.
         * @see https://learnopengl.com/PBR/IBL/Diffuse-irradiance
         */
        sphericalPolynomial: Nullable<SphericalPolynomial>;
    }
}

Object.defineProperty(BaseTexture.prototype, "sphericalPolynomial", {
    get: function(this: BaseTexture) {
        if (this._texture) {
            if (this._texture._sphericalPolynomial) {
                return this._texture._sphericalPolynomial;
            }

            if (this._texture.isReady) {
                this._texture._sphericalPolynomial =
                    CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial(this);
                return this._texture._sphericalPolynomial;
            }
        }

        return null;
    },
    set: function(this: BaseTexture, value: Nullable<SphericalPolynomial>) {
        if (this._texture) {
            this._texture._sphericalPolynomial = value;
        }
    },
    enumerable: true,
    configurable: true
});
