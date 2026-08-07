/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import volumetricLightScatteringPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./volumetricLightScatteringPostProcess.pure";

import "../Shaders/depth.vertex";
import "../Shaders/volumetricLightScattering.fragment";
import "../Shaders/volumetricLightScatteringPass.vertex";
import "../Shaders/volumetricLightScatteringPass.fragment";
import "../ShadersWGSL/volumetricLightScattering.fragment";
import "../ShadersWGSL/volumetricLightScatteringPass.vertex";
import "../ShadersWGSL/volumetricLightScatteringPass.fragment";

import { RegisterVolumetricLightScatteringPostProcess } from "./volumetricLightScatteringPostProcess.pure";
RegisterVolumetricLightScatteringPostProcess();
