export * from "./iblCdfGeneratorSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import iblCdfGeneratorSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iblCdfGeneratorSceneComponent.pure";

import { IblCdfGenerator } from "./iblCdfGenerator";
import { RegisterIblCdfGeneratorSceneComponent } from "./iblCdfGeneratorSceneComponent.pure";
RegisterIblCdfGeneratorSceneComponent(IblCdfGenerator);
