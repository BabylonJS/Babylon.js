/* eslint-disable @typescript-eslint/no-restricted-imports */
export * from "./Background/index";
export * from "./colorCurves";
export * from "./iEffectFallbacks";
export * from "./effectFallbacks";
export * from "./effect";
export * from "./fresnelParameters";
export * from "./imageProcessing";
export * from "./imageProcessingConfiguration";
export * from "./material";
export * from "./materialDefines";
export * from "./clipPlaneMaterialHelper";
export * from "./materialHelper";
export * from "./multiMaterial";
export * from "./Occlusion/index";
export * from "./PBR/index";
export * from "./pushMaterial";
export * from "./shaderLanguage";
export * from "./shaderMaterial";
export * from "./standardMaterial";
export * from "./Textures/index";
export * from "./uniformBuffer";
export * from "./materialFlags";
export * from "./Node/index";
export * from "./effectRenderer";
export * from "./shadowDepthWrapper";
export * from "./drawWrapper.functions";
export * from "./drawWrapper";
export * from "./materialPluginBase";
export * from "./materialPluginManager";
export * from "./materialPluginEvent";
export * from "./material.detailMapConfiguration";
export * from "./material.decalMapConfiguration";
export * from "./materialPluginFactoryExport";
export * from "./GreasedLine/greasedLinePluginMaterial";
export * from "./GreasedLine/greasedLineSimpleMaterial";
export * from "./GreasedLine/greasedLineMaterialInterfaces";
export * from "./GreasedLine/greasedLineMaterialDefaults";
export * from "./meshDebugPluginMaterial";
export * from "./GaussianSplatting/gaussianSplattingMaterial";
export * from "./materialHelper.functions";
export * from "./materialHelper.geometryrendering";
export * from "./materialStencilState";
export * from "./uv.defines";
import "./material.decalMap";

// async-loaded shaders

// StandardMaterial
export * from "../Shaders/default.fragment";
export * from "../Shaders/default.vertex";
export * from "../ShadersWGSL/default.fragment";
export * from "../ShadersWGSL/default.vertex";

// GreasedLineSimplMaterial
export * from "../Shaders/greasedLine.fragment";
export * from "../Shaders/greasedLine.vertex";
export * from "../ShadersWGSL/greasedLine.fragment";
export * from "../ShadersWGSL/greasedLine.vertex";
