export * from "./engine.pure";

import "./Extensions/engine.alpha";
import "./Extensions/engine.rawTexture";
import "./Extensions/engine.readTexture";
import "./Extensions/engine.dynamicBuffer";
import "./Extensions/engine.cubeTexture";
import "./Extensions/engine.renderTarget";
import "./Extensions/engine.renderTargetTexture";
import "./Extensions/engine.renderTargetCube";
import "./Extensions/engine.prefilteredCubeTexture";
import "./Extensions/engine.uniformBuffer";
import "./AbstractEngine/abstractEngine.loadingScreen";
import "./AbstractEngine/abstractEngine.dom";
import "./AbstractEngine/abstractEngine.states";
import "./AbstractEngine/abstractEngine.stencil";
import "./AbstractEngine/abstractEngine.renderPass";
import "./AbstractEngine/abstractEngine.texture";
import "./AbstractEngine/abstractEngine.loadFile";
import "./AbstractEngine/abstractEngine.textureLoaders";
import "./thinEngine.scissor";

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect } from "../Misc/devTools";
import { Engine } from "./engine.pure";

Engine.prototype.createMultiviewRenderTargetTexture ??= _MissingSideEffect("Engine", "createMultiviewRenderTargetTexture") as any;
Engine.prototype.bindMultiviewFramebuffer ??= _MissingSideEffect("Engine", "bindMultiviewFramebuffer") as any;
Engine.prototype.bindSpaceWarpFramebuffer ??= _MissingSideEffect("Engine", "bindSpaceWarpFramebuffer") as any;
Engine.prototype.createTransformFeedback ??= _MissingSideEffect("Engine", "createTransformFeedback") as any;
Engine.prototype.deleteTransformFeedback ??= _MissingSideEffect("Engine", "deleteTransformFeedback") as any;
Engine.prototype.bindTransformFeedback ??= _MissingSideEffect("Engine", "bindTransformFeedback") as any;
Engine.prototype.beginTransformFeedback ??= _MissingSideEffect("Engine", "beginTransformFeedback") as any;
Engine.prototype.endTransformFeedback ??= _MissingSideEffect("Engine", "endTransformFeedback") as any;
Engine.prototype.setTranformFeedbackVaryings ??= _MissingSideEffect("Engine", "setTranformFeedbackVaryings") as any;
Engine.prototype.bindTransformFeedbackBuffer ??= _MissingSideEffect("Engine", "bindTransformFeedbackBuffer") as any;
Engine.prototype.readTransformFeedbackBuffer ??= _MissingSideEffect("Engine", "readTransformFeedbackBuffer") as any;
// #endregion GENERATED_SIDE_EFFECT_STUBS
