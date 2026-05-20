// --- Core (minimum for a working engine) ---
import { RegisterAbstractEngineDom } from "../AbstractEngine/abstractEngine.dom.pure";
import { RegisterAbstractEngineRenderPass } from "../AbstractEngine/abstractEngine.renderPass.pure";
import { RegisterAbstractEngineStates } from "../AbstractEngine/abstractEngine.states.pure";
import { RegisterAbstractEngineStencil } from "../AbstractEngine/abstractEngine.stencil.pure";

// --- Standard additions ---
import { RegisterAbstractEngineLoadFile } from "../AbstractEngine/abstractEngine.loadFile.pure";
import { RegisterEnginesWebGPUExtensionsEngineAlpha } from "./Extensions/engine.alpha.pure";
import { RegisterEnginesWebGPUExtensionsEngineRenderTarget } from "./Extensions/engine.renderTarget.pure";
import { RegisterEnginesWebGPUExtensionsEngineRenderTargetTexture } from "./Extensions/engine.renderTargetTexture.pure";

// --- Full additions ---
import { RegisterAbstractEngineLoadingScreen } from "../AbstractEngine/abstractEngine.loadingScreen.pure";
import { RegisterAbstractEngineAlpha } from "../AbstractEngine/abstractEngine.alpha.pure";
import { RegisterAbstractEngineTexture } from "../AbstractEngine/abstractEngine.texture.pure";
import { RegisterAbstractEngineCubeTexture } from "../AbstractEngine/abstractEngine.cubeTexture.pure";
import { RegisterAbstractEngineQuery } from "../AbstractEngine/abstractEngine.query.pure";
import { RegisterAbstractEngineTextureSelector } from "../AbstractEngine/abstractEngine.textureSelector.pure";
import { RegisterAbstractEngineTimeQuery } from "../AbstractEngine/abstractEngine.timeQuery.pure";
import { RegisterAbstractEngineViews } from "../AbstractEngine/abstractEngine.views.pure";
import { RegisterEnginesWebGPUExtensionsEngineRawTexture } from "./Extensions/engine.rawTexture.pure";
import { RegisterEnginesWebGPUExtensionsEngineReadTexture } from "./Extensions/engine.readTexture.pure";
import { RegisterEnginesWebGPUExtensionsEngineCubeTexture } from "./Extensions/engine.cubeTexture.pure";
import { RegisterEnginesWebGPUExtensionsEngineRenderTargetCube } from "./Extensions/engine.renderTargetCube.pure";
import { RegisterEnginesWebGPUExtensionsEngineQuery } from "./Extensions/engine.query.pure";
import { RegisterEnginesWebGPUExtensionsEngineDynamicTexture } from "./Extensions/engine.dynamicTexture.pure";
import { RegisterEnginesWebGPUExtensionsEngineMultiRender } from "./Extensions/engine.multiRender.pure";
import { RegisterEnginesWebGPUExtensionsEngineComputeShader } from "./Extensions/engine.computeShader.pure";
import { RegisterWebGPUDebugging } from "./Extensions/engine.debugging.pure";
import { RegisterEnginesWebGPUExtensionsEngineVideoTexture } from "./Extensions/engine.videoTexture.pure";

/**
 * Registers the minimum set of engine extensions required for basic rendering with WebGPU.
 * Includes: DOM binding, render passes, GPU states, and stencil.
 */
export function RegisterCoreWebGPUEngineExtensions(): void {
    RegisterAbstractEngineDom();
    RegisterAbstractEngineRenderPass();
    RegisterAbstractEngineStates();
    RegisterAbstractEngineStencil();
}

/**
 * Registers the standard set of engine extensions needed by most WebGPU scenes.
 * Includes everything in {@link RegisterCoreWebGPUEngineExtensions} plus
 * file loading, alpha blending, render targets, and render target textures.
 */
export function RegisterStandardWebGPUEngineExtensions(): void {
    RegisterCoreWebGPUEngineExtensions();
    RegisterAbstractEngineLoadFile();
    RegisterEnginesWebGPUExtensionsEngineAlpha();
    RegisterEnginesWebGPUExtensionsEngineRenderTarget();
    RegisterEnginesWebGPUExtensionsEngineRenderTargetTexture();
}

/**
 * Registers all available engine extensions for the WebGPU engine.
 * Includes everything in {@link RegisterStandardWebGPUEngineExtensions} plus
 * cube textures, raw textures, dynamic textures, multi-render, queries,
 * compute shaders, video textures, debugging, and more.
 */
export function RegisterFullWebGPUEngineExtensions(): void {
    RegisterStandardWebGPUEngineExtensions();
    RegisterAbstractEngineLoadingScreen();
    RegisterAbstractEngineAlpha();
    RegisterAbstractEngineTexture();
    RegisterAbstractEngineCubeTexture();
    RegisterAbstractEngineQuery();
    RegisterAbstractEngineTextureSelector();
    RegisterAbstractEngineTimeQuery();
    RegisterAbstractEngineViews();
    RegisterEnginesWebGPUExtensionsEngineRawTexture();
    RegisterEnginesWebGPUExtensionsEngineReadTexture();
    RegisterEnginesWebGPUExtensionsEngineCubeTexture();
    RegisterEnginesWebGPUExtensionsEngineRenderTargetCube();
    RegisterEnginesWebGPUExtensionsEngineQuery();
    RegisterEnginesWebGPUExtensionsEngineDynamicTexture();
    RegisterEnginesWebGPUExtensionsEngineMultiRender();
    RegisterEnginesWebGPUExtensionsEngineComputeShader();
    RegisterWebGPUDebugging();
    RegisterEnginesWebGPUExtensionsEngineVideoTexture();
}
