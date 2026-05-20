export * from "./lensFlareSystemSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lensFlareSystemSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lensFlareSystemSceneComponent.pure";

import { LensFlareSystem } from "./lensFlareSystem";
import { RegisterLensFlareSystemSceneComponent } from "./lensFlareSystemSceneComponent.pure";
RegisterLensFlareSystemSceneComponent(LensFlareSystem);
