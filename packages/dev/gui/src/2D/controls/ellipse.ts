/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./ellipse.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./ellipse.pure";

import { RegisterEllipse } from "./ellipse.pure";
RegisterEllipse();
