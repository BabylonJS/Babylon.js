/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import volumetricLightScatteringPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./volumetricLightScatteringPostProcess.pure";

import { RegisterVolumetricLightScatteringPostProcess } from "./volumetricLightScatteringPostProcess.pure";
RegisterVolumetricLightScatteringPostProcess();
