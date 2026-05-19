// --- Core ---
import { RegisterAbstractEngineDom } from "../AbstractEngine/abstractEngine.dom.pure";
import { RegisterAbstractEngineRenderPass } from "../AbstractEngine/abstractEngine.renderPass.pure";
import { RegisterAbstractEngineStates } from "../AbstractEngine/abstractEngine.states.pure";
import { RegisterAbstractEngineStencil } from "../AbstractEngine/abstractEngine.stencil.pure";
import { RegisterNativeEngine } from "../nativeEngine.pure";

// --- Standard additions ---
import { RegisterAbstractEngineTexture } from "../AbstractEngine/abstractEngine.texture.pure";
import { RegisterAbstractEngineLoadFile } from "../AbstractEngine/abstractEngine.loadFile.pure";

// --- Full additions ---
import { RegisterAbstractEngineLoadingScreen } from "../AbstractEngine/abstractEngine.loadingScreen.pure";
import { RegisterAbstractEngineAlpha } from "../AbstractEngine/abstractEngine.alpha.pure";
import { RegisterAbstractEngineCubeTexture } from "../AbstractEngine/abstractEngine.cubeTexture.pure";
import { RegisterAbstractEngineQuery } from "../AbstractEngine/abstractEngine.query.pure";
import { RegisterAbstractEngineTextureSelector } from "../AbstractEngine/abstractEngine.textureSelector.pure";
import { RegisterAbstractEngineTimeQuery } from "../AbstractEngine/abstractEngine.timeQuery.pure";
import { RegisterAbstractEngineViews } from "../AbstractEngine/abstractEngine.views.pure";
import { RegisterNativeEngineCubeTexture } from "./Extensions/nativeEngine.cubeTexture.pure";
import { RegisterValidatedNativeDataStream } from "./validatedNativeDataStream.pure";

/**
 * Registers the minimum set of engine extensions required for basic rendering with NativeEngine.
 * Includes: DOM binding, render passes, GPU states, stencil, and the native engine mixins.
 */
export function RegisterCoreNativeEngineExtensions(): void {
    RegisterAbstractEngineDom();
    RegisterAbstractEngineRenderPass();
    RegisterAbstractEngineStates();
    RegisterAbstractEngineStencil();
    RegisterNativeEngine();
}

/**
 * Registers the standard set of engine extensions needed by most NativeEngine scenes.
 * Includes everything in {@link RegisterCoreNativeEngineExtensions} plus
 * textures and file loading.
 */
export function RegisterStandardNativeEngineExtensions(): void {
    RegisterCoreNativeEngineExtensions();
    RegisterAbstractEngineTexture();
    RegisterAbstractEngineLoadFile();
}

/**
 * Registers all available engine extensions for the NativeEngine.
 * Includes everything in {@link RegisterStandardNativeEngineExtensions} plus
 * cube textures, queries, views, loading screen, and native-specific extensions.
 */
export function RegisterFullNativeEngineExtensions(): void {
    RegisterStandardNativeEngineExtensions();
    RegisterAbstractEngineLoadingScreen();
    RegisterAbstractEngineAlpha();
    RegisterAbstractEngineCubeTexture();
    RegisterAbstractEngineQuery();
    RegisterAbstractEngineTextureSelector();
    RegisterAbstractEngineTimeQuery();
    RegisterAbstractEngineViews();
    RegisterNativeEngineCubeTexture();
    RegisterValidatedNativeDataStream();
}
