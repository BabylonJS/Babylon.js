/** This file must only contain pure code and pure imports */

import { Nullable } from "../../types";
import { CubeMapToSphericalPolynomialTools } from "../../Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { SphericalPolynomial } from "../../Maths/sphericalPolynomial.pure";
import { BaseTexture } from "./baseTexture.pure";

let _registered = false;
export function registerBaseTexturePolynomial(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    BaseTexture.prototype._sphericalPolynomialTargetSize = 0;

    BaseTexture.prototype.forceSphericalPolynomialsRecompute = function (): void {
        if (this._texture) {
            this._texture._sphericalPolynomial = null;
            this._texture._sphericalPolynomialPromise = null;
            this._texture._sphericalPolynomialComputed = false;
        }
    };

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
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
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
        configurable: true,
    });
}
