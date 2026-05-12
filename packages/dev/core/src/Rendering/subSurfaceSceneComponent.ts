export * from "./subSurfaceSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import subSurfaceSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subSurfaceSceneComponent.pure";

import { SubSurfaceConfiguration } from "./subSurfaceConfiguration";
import { RegisterSubSurfaceSceneComponent } from "./subSurfaceSceneComponent.pure";
RegisterSubSurfaceSceneComponent(SubSurfaceConfiguration);
