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
export * from "./GaussianSplatting/gaussianSplattingSolidColorMaterialPlugin";
export * from "./GaussianSplatting/gaussianSplattingGpuPickingMaterialPlugin";
export * from "./materialHelper.functions";
export * from "./materialHelper.geometryrendering";
export * from "./materialStencilState";
export * from "./uv.defines";
export * from "./floatingOriginMatrixOverrides";
export * from "./vertexPullingHelper.functions";

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

// Shared shader includes used by external material packages in UMD builds
export * from "../Shaders/ShadersInclude/bakedVertexAnimation";
export * from "../Shaders/ShadersInclude/bakedVertexAnimationDeclaration";
export * from "../Shaders/ShadersInclude/depthPrePass";
export * from "../Shaders/ShadersInclude/fogFragment";
export * from "../Shaders/ShadersInclude/fogVertex";
export * from "../Shaders/ShadersInclude/fogVertexDeclaration";
export * from "../Shaders/ShadersInclude/imageProcessingCompatibility";
export * from "../Shaders/ShadersInclude/instancesDeclaration";
export * from "../Shaders/ShadersInclude/instancesVertex";
export * from "../Shaders/ShadersInclude/logDepthFragment";
export * from "../Shaders/ShadersInclude/logDepthVertex";
export * from "../Shaders/ShadersInclude/sceneFragmentDeclaration";
export * from "../Shaders/ShadersInclude/sceneUboDeclaration";
export * from "../Shaders/ShadersInclude/sceneVertexDeclaration";
export * from "../Shaders/ShadersInclude/vertexColorMixing";
export * from "../ShadersWGSL/ShadersInclude/bakedVertexAnimation";
export * from "../ShadersWGSL/ShadersInclude/bakedVertexAnimationDeclaration";
export * from "../ShadersWGSL/ShadersInclude/depthPrePass";
export * from "../ShadersWGSL/ShadersInclude/fogFragment";
export * from "../ShadersWGSL/ShadersInclude/fogVertex";
export * from "../ShadersWGSL/ShadersInclude/fogVertexDeclaration";
export * from "../ShadersWGSL/ShadersInclude/imageProcessingCompatibility";
export * from "../ShadersWGSL/ShadersInclude/instancesDeclaration";
export * from "../ShadersWGSL/ShadersInclude/instancesVertex";
export * from "../ShadersWGSL/ShadersInclude/lightVxFragmentDeclaration";
export * from "../ShadersWGSL/ShadersInclude/logDepthFragment";
export * from "../ShadersWGSL/ShadersInclude/logDepthVertex";
export * from "../ShadersWGSL/ShadersInclude/sceneUboDeclaration";
export * from "../ShadersWGSL/ShadersInclude/vertexColorMixing";

import "./material.decalMap";
