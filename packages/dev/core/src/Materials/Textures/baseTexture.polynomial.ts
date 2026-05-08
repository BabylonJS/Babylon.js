export * from "./baseTexture.polynomial.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import baseTexture.polynomial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./baseTexture.polynomial.pure";

import { RegisterBaseTexturePolynomial } from "./baseTexture.polynomial.pure";
RegisterBaseTexturePolynomial();
