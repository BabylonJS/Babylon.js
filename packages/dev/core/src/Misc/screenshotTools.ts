/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenshotTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenshotTools.pure";

import { registerScreenshotTools } from "./screenshotTools.pure";
registerScreenshotTools();
