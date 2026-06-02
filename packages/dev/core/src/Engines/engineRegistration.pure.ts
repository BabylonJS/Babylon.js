/**
 * Tiered engine extension registration helpers for the WebGL2 engine.
 *
 * These helpers let tree-shaking users register only the engine extensions
 * they need, in three tiers: Core, Standard, and Full. Each tier includes
 * the one below it. All individual Register functions are idempotent, so
 * calling a higher tier after a lower one is safe.
 *
 * NOTE: This file is `.pure.ts` (not a plain `.ts`) even though it has no
 * side effects. This is intentional — the pure barrel generator's orphan
 * scan only discovers `.pure.ts` files that aren't exported from an
 * `index.ts`. Since these registration helpers are standalone utilities
 * not exported from any `index.ts`, the `.pure.ts` suffix ensures they
 * appear in the `pure.ts` barrel automatically. See
 * `scripts/treeshaking/generatePureBarrels.mjs` for details.
 */

// --- Core (minimum for a working engine) ---
import { RegisterAbstractEngineDom } from "./AbstractEngine/abstractEngine.dom.pure";
import { RegisterAbstractEngineRenderPass } from "./AbstractEngine/abstractEngine.renderPass.pure";
import { RegisterAbstractEngineStates } from "./AbstractEngine/abstractEngine.states.pure";
import { RegisterAbstractEngineStencil } from "./AbstractEngine/abstractEngine.stencil.pure";

// --- Standard additions ---
import { RegisterAbstractEngineTexture } from "./AbstractEngine/abstractEngine.texture.pure";
import { RegisterAbstractEngineLoadFile } from "./AbstractEngine/abstractEngine.loadFile.pure";
import { RegisterEnginesExtensionsEngineAlpha } from "./Extensions/engine.alpha.pure";
import { RegisterEnginesExtensionsEngineRenderTarget } from "./Extensions/engine.renderTarget.pure";
import { RegisterEnginesExtensionsEngineRenderTargetTexture } from "./Extensions/engine.renderTargetTexture.pure";
import { RegisterEngineUniformBuffer } from "./Extensions/engine.uniformBuffer.pure";

// --- Full additions ---
import { RegisterAbstractEngineLoadingScreen } from "./AbstractEngine/abstractEngine.loadingScreen.pure";
import { RegisterAbstractEngineAlpha } from "./AbstractEngine/abstractEngine.alpha.pure";
import { RegisterAbstractEngineCubeTexture } from "./AbstractEngine/abstractEngine.cubeTexture.pure";
import { RegisterAbstractEngineQuery } from "./AbstractEngine/abstractEngine.query.pure";
import { RegisterAbstractEngineTextureSelector } from "./AbstractEngine/abstractEngine.textureSelector.pure";
import { RegisterAbstractEngineTimeQuery } from "./AbstractEngine/abstractEngine.timeQuery.pure";
import { RegisterAbstractEngineViews } from "./AbstractEngine/abstractEngine.views.pure";
import { RegisterEnginesExtensionsEngineRawTexture } from "./Extensions/engine.rawTexture.pure";
import { RegisterEnginesExtensionsEngineReadTexture } from "./Extensions/engine.readTexture.pure";
import { RegisterEngineDynamicBuffer } from "./Extensions/engine.dynamicBuffer.pure";
import { RegisterEnginesExtensionsEngineCubeTexture } from "./Extensions/engine.cubeTexture.pure";
import { RegisterEnginesExtensionsEngineRenderTargetCube } from "./Extensions/engine.renderTargetCube.pure";
import { RegisterEnginePrefilteredCubeTexture } from "./Extensions/engine.prefilteredCubeTexture.pure";
import { RegisterEnginesExtensionsEngineDynamicTexture } from "./Extensions/engine.dynamicTexture.pure";
import { RegisterEnginesExtensionsEngineMultiRender } from "./Extensions/engine.multiRender.pure";
import { RegisterEngineMultiview } from "./Extensions/engine.multiview.pure";
import { RegisterEnginesExtensionsEngineQuery } from "./Extensions/engine.query.pure";
import { RegisterEngineTransformFeedback } from "./Extensions/engine.transformFeedback.pure";
import { RegisterEngineDebugging } from "./Extensions/engine.debugging.pure";
import { RegisterEnginesExtensionsEngineComputeShader } from "./Extensions/engine.computeShader.pure";
import { RegisterEnginesExtensionsEngineVideoTexture } from "./Extensions/engine.videoTexture.pure";

/**
 * Registers the minimum set of engine extensions required for basic rendering.
 * Includes: DOM binding, render passes, GPU states, and stencil.
 */
export function RegisterCoreEngineExtensions(): void {
    RegisterAbstractEngineDom();
    RegisterAbstractEngineRenderPass();
    RegisterAbstractEngineStates();
    RegisterAbstractEngineStencil();
}

/**
 * Registers the standard set of engine extensions needed by most scenes.
 * Includes everything in {@link RegisterCoreEngineExtensions} plus textures,
 * file loading, alpha blending, render targets, and uniform buffers.
 */
export function RegisterStandardEngineExtensions(): void {
    RegisterCoreEngineExtensions();
    RegisterAbstractEngineTexture();
    RegisterAbstractEngineLoadFile();
    RegisterEnginesExtensionsEngineAlpha();
    RegisterEnginesExtensionsEngineRenderTarget();
    RegisterEnginesExtensionsEngineRenderTargetTexture();
    RegisterEngineUniformBuffer();
}

/**
 * Registers all available engine extensions for the WebGL2 engine.
 * Includes everything in {@link RegisterStandardEngineExtensions} plus
 * cube textures, raw textures, dynamic textures, multi-render, multiview,
 * queries, compute shaders, video textures, debugging, and more.
 */
export function RegisterFullEngineExtensions(): void {
    RegisterStandardEngineExtensions();
    RegisterAbstractEngineLoadingScreen();
    RegisterAbstractEngineAlpha();
    RegisterAbstractEngineCubeTexture();
    RegisterAbstractEngineQuery();
    RegisterAbstractEngineTextureSelector();
    RegisterAbstractEngineTimeQuery();
    RegisterAbstractEngineViews();
    RegisterEnginesExtensionsEngineRawTexture();
    RegisterEnginesExtensionsEngineReadTexture();
    RegisterEngineDynamicBuffer();
    RegisterEnginesExtensionsEngineCubeTexture();
    RegisterEnginesExtensionsEngineRenderTargetCube();
    RegisterEnginePrefilteredCubeTexture();
    RegisterEnginesExtensionsEngineDynamicTexture();
    RegisterEnginesExtensionsEngineMultiRender();
    RegisterEngineMultiview();
    RegisterEnginesExtensionsEngineQuery();
    RegisterEngineTransformFeedback();
    RegisterEngineDebugging();
    RegisterEnginesExtensionsEngineComputeShader();
    RegisterEnginesExtensionsEngineVideoTexture();
}
