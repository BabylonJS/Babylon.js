export * from "./defaultRenderingPipeline";
export * from "./lensRenderingPipeline";
export * from "./ssao2RenderingPipeline";
export * from "./ssaoRenderingPipeline";
export * from "./standardRenderingPipeline";
export * from "./ssrRenderingPipeline";
export * from "./taaRenderingPipeline";
export * from "./fsr1RenderingPipeline";

// SSAO2 shaders
import "../../../Shaders/ssao2.fragment";
import "../../../Shaders/ssaoCombine.fragment";
import "../../../ShadersWGSL/ssao2.fragment";
import "../../../ShadersWGSL/ssaoCombine.fragment";

// SSR shaders
import "../../../Shaders/screenSpaceReflection2.fragment";
import "../../../Shaders/screenSpaceReflection2Blur.fragment";
import "../../../Shaders/screenSpaceReflection2BlurCombiner.fragment";
import "../../../ShadersWGSL/screenSpaceReflection2.fragment";
import "../../../ShadersWGSL/screenSpaceReflection2Blur.fragment";
import "../../../ShadersWGSL/screenSpaceReflection2BlurCombiner.fragment";

// TAA shaders
import "../../../Shaders/taa.fragment";
import "../../../ShadersWGSL/taa.fragment";

// FSR 1 shaders
import "../../../Shaders/fsr1Upscale.fragment";
import "../../../Shaders/fsr1Sharpen.fragment";
import "../../../ShadersWGSL/fsr1Upscale.fragment";
import "../../../ShadersWGSL/fsr1Sharpen.fragment";
