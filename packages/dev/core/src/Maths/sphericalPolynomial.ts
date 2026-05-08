/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sphericalPolynomial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphericalPolynomial.pure";

import { registerSphericalPolynomial } from "./sphericalPolynomial.pure";
registerSphericalPolynomial();
