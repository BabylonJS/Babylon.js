/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import scene.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./scene.pure";

import { RegisterScene, Scene } from "./scene.pure";
RegisterScene();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect, _MissingSideEffectProperty } from "./Misc/devTools";

Scene.prototype.sortActiveAnimatables ??= _MissingSideEffect("Scene", "sortActiveAnimatables") as any;
Scene.prototype.beginWeightedAnimation ??= _MissingSideEffect("Scene", "beginWeightedAnimation") as any;
Scene.prototype.beginAnimation ??= _MissingSideEffect("Scene", "beginAnimation") as any;
Scene.prototype.beginHierarchyAnimation ??= _MissingSideEffect("Scene", "beginHierarchyAnimation") as any;
Scene.prototype.beginDirectAnimation ??= _MissingSideEffect("Scene", "beginDirectAnimation") as any;
Scene.prototype.beginDirectHierarchyAnimation ??= _MissingSideEffect("Scene", "beginDirectHierarchyAnimation") as any;
Scene.prototype.getAnimatableByTarget ??= _MissingSideEffect("Scene", "getAnimatableByTarget") as any;
Scene.prototype.getAllAnimatablesByTarget ??= _MissingSideEffect("Scene", "getAllAnimatablesByTarget") as any;
Scene.prototype.stopAllAnimations ??= _MissingSideEffect("Scene", "stopAllAnimations") as any;
Scene.prototype.getSoundByName ??= _MissingSideEffect("Scene", "getSoundByName") as any;
Scene.prototype.createOrUpdateSelectionOctree ??= _MissingSideEffect("Scene", "createOrUpdateSelectionOctree") as any;
Scene.prototype.createDefaultLight ??= _MissingSideEffect("Scene", "createDefaultLight") as any;
Scene.prototype.createDefaultCamera ??= _MissingSideEffect("Scene", "createDefaultCamera") as any;
Scene.prototype.createDefaultCameraOrLight ??= _MissingSideEffect("Scene", "createDefaultCameraOrLight") as any;
Scene.prototype.createDefaultSkybox ??= _MissingSideEffect("Scene", "createDefaultSkybox") as any;
Scene.prototype.createDefaultEnvironment ??= _MissingSideEffect("Scene", "createDefaultEnvironment") as any;
Scene.prototype.createDefaultVRExperience ??= _MissingSideEffect("Scene", "createDefaultVRExperience") as any;
Scene.prototype.createDefaultXRExperienceAsync ??= _MissingSideEffect("Scene", "createDefaultXRExperienceAsync") as any;
Scene.prototype.getGlowLayerByName ??= _MissingSideEffect("Scene", "getGlowLayerByName") as any;
Scene.prototype.getHighlightLayerByName ??= _MissingSideEffect("Scene", "getHighlightLayerByName") as any;
Scene.prototype.getSelectionOutlineLayerByName ??= _MissingSideEffect("Scene", "getSelectionOutlineLayerByName") as any;
Scene.prototype.removeLensFlareSystem ??= _MissingSideEffect("Scene", "removeLensFlareSystem") as any;
Scene.prototype.addLensFlareSystem ??= _MissingSideEffect("Scene", "addLensFlareSystem") as any;
Scene.prototype.getLensFlareSystemByName ??= _MissingSideEffect("Scene", "getLensFlareSystemByName") as any;
Scene.prototype.getLensFlareSystemByID ??= _MissingSideEffect("Scene", "getLensFlareSystemByID") as any;
Scene.prototype.getLensFlareSystemById ??= _MissingSideEffect("Scene", "getLensFlareSystemById") as any;
Scene.prototype.getPhysicsEngine ??= _MissingSideEffect("Scene", "getPhysicsEngine") as any;
Scene.prototype.enablePhysics ??= _MissingSideEffect("Scene", "enablePhysics") as any;
Scene.prototype.disablePhysicsEngine ??= _MissingSideEffect("Scene", "disablePhysicsEngine") as any;
Scene.prototype.isPhysicsEnabled ??= _MissingSideEffect("Scene", "isPhysicsEnabled") as any;
Scene.prototype.deleteCompoundImpostor ??= _MissingSideEffect("Scene", "deleteCompoundImpostor") as any;
Scene.prototype.removeReflectionProbe ??= _MissingSideEffect("Scene", "removeReflectionProbe") as any;
Scene.prototype.addReflectionProbe ??= _MissingSideEffect("Scene", "addReflectionProbe") as any;
Scene.prototype.getBoundingBoxRenderer ??= _MissingSideEffect("Scene", "getBoundingBoxRenderer") as any;
Scene.prototype.enableDepthRenderer ??= _MissingSideEffect("Scene", "enableDepthRenderer") as any;
Scene.prototype.disableDepthRenderer ??= _MissingSideEffect("Scene", "disableDepthRenderer") as any;
Scene.prototype.enableFluidRenderer ??= _MissingSideEffect("Scene", "enableFluidRenderer") as any;
Scene.prototype.disableFluidRenderer ??= _MissingSideEffect("Scene", "disableFluidRenderer") as any;
Scene.prototype.enableGeometryBufferRenderer ??= _MissingSideEffect("Scene", "enableGeometryBufferRenderer") as any;
Scene.prototype.disableGeometryBufferRenderer ??= _MissingSideEffect("Scene", "disableGeometryBufferRenderer") as any;
Scene.prototype.enableIblCdfGenerator ??= _MissingSideEffect("Scene", "enableIblCdfGenerator") as any;
Scene.prototype.disableIblCdfGenerator ??= _MissingSideEffect("Scene", "disableIblCdfGenerator") as any;
Scene.prototype.getOutlineRenderer ??= _MissingSideEffect("Scene", "getOutlineRenderer") as any;
Scene.prototype.enablePrePassRenderer ??= _MissingSideEffect("Scene", "enablePrePassRenderer") as any;
Scene.prototype.disablePrePassRenderer ??= _MissingSideEffect("Scene", "disablePrePassRenderer") as any;
Scene.prototype.enableSubSurfaceForPrePass ??= _MissingSideEffect("Scene", "enableSubSurfaceForPrePass") as any;
Scene.prototype.disableSubSurfaceForPrePass ??= _MissingSideEffect("Scene", "disableSubSurfaceForPrePass") as any;
Scene.prototype.pickSprite ??= _MissingSideEffect("Scene", "pickSprite") as any;
Scene.prototype.pickSpriteWithRay ??= _MissingSideEffect("Scene", "pickSpriteWithRay") as any;
Scene.prototype.multiPickSprite ??= _MissingSideEffect("Scene", "multiPickSprite") as any;
Scene.prototype.multiPickSpriteWithRay ??= _MissingSideEffect("Scene", "multiPickSpriteWithRay") as any;
Scene.prototype.setPointerOverSprite ??= _MissingSideEffect("Scene", "setPointerOverSprite") as any;
Scene.prototype.getPointerOverSprite ??= _MissingSideEffect("Scene", "getPointerOverSprite") as any;
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "mainSoundTrack")) {
    Object.defineProperty(Scene.prototype, "mainSoundTrack", _MissingSideEffectProperty("Scene", "mainSoundTrack"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "soundTracks")) {
    Object.defineProperty(Scene.prototype, "soundTracks", _MissingSideEffectProperty("Scene", "soundTracks"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "audioEnabled")) {
    Object.defineProperty(Scene.prototype, "audioEnabled", _MissingSideEffectProperty("Scene", "audioEnabled"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "headphone")) {
    Object.defineProperty(Scene.prototype, "headphone", _MissingSideEffectProperty("Scene", "headphone"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "audioListenerPositionProvider")) {
    Object.defineProperty(Scene.prototype, "audioListenerPositionProvider", _MissingSideEffectProperty("Scene", "audioListenerPositionProvider"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "audioListenerRotationProvider")) {
    Object.defineProperty(Scene.prototype, "audioListenerRotationProvider", _MissingSideEffectProperty("Scene", "audioListenerRotationProvider"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "audioPositioningRefreshRate")) {
    Object.defineProperty(Scene.prototype, "audioPositioningRefreshRate", _MissingSideEffectProperty("Scene", "audioPositioningRefreshRate"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "selectionOctree")) {
    Object.defineProperty(Scene.prototype, "selectionOctree", _MissingSideEffectProperty("Scene", "selectionOctree"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "debugLayer")) {
    Object.defineProperty(Scene.prototype, "debugLayer", _MissingSideEffectProperty("Scene", "debugLayer"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "gamepadManager")) {
    Object.defineProperty(Scene.prototype, "gamepadManager", _MissingSideEffectProperty("Scene", "gamepadManager"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "simplificationQueue")) {
    Object.defineProperty(Scene.prototype, "simplificationQueue", _MissingSideEffectProperty("Scene", "simplificationQueue"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "onBeforePhysicsObservable")) {
    Object.defineProperty(Scene.prototype, "onBeforePhysicsObservable", _MissingSideEffectProperty("Scene", "onBeforePhysicsObservable"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "onAfterPhysicsObservable")) {
    Object.defineProperty(Scene.prototype, "onAfterPhysicsObservable", _MissingSideEffectProperty("Scene", "onAfterPhysicsObservable"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "reflectionProbes")) {
    Object.defineProperty(Scene.prototype, "reflectionProbes", _MissingSideEffectProperty("Scene", "reflectionProbes"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "forceShowBoundingBoxes")) {
    Object.defineProperty(Scene.prototype, "forceShowBoundingBoxes", _MissingSideEffectProperty("Scene", "forceShowBoundingBoxes"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "depthPeelingRenderer")) {
    Object.defineProperty(Scene.prototype, "depthPeelingRenderer", _MissingSideEffectProperty("Scene", "depthPeelingRenderer"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "useOrderIndependentTransparency")) {
    Object.defineProperty(Scene.prototype, "useOrderIndependentTransparency", _MissingSideEffectProperty("Scene", "useOrderIndependentTransparency"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "fluidRenderer")) {
    Object.defineProperty(Scene.prototype, "fluidRenderer", _MissingSideEffectProperty("Scene", "fluidRenderer"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "geometryBufferRenderer")) {
    Object.defineProperty(Scene.prototype, "geometryBufferRenderer", _MissingSideEffectProperty("Scene", "geometryBufferRenderer"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "iblCdfGenerator")) {
    Object.defineProperty(Scene.prototype, "iblCdfGenerator", _MissingSideEffectProperty("Scene", "iblCdfGenerator"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "prePassRenderer")) {
    Object.defineProperty(Scene.prototype, "prePassRenderer", _MissingSideEffectProperty("Scene", "prePassRenderer"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "subSurfaceConfiguration")) {
    Object.defineProperty(Scene.prototype, "subSurfaceConfiguration", _MissingSideEffectProperty("Scene", "subSurfaceConfiguration"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "spriteManagers")) {
    Object.defineProperty(Scene.prototype, "spriteManagers", _MissingSideEffectProperty("Scene", "spriteManagers"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "onBeforeSpritesRenderingObservable")) {
    Object.defineProperty(Scene.prototype, "onBeforeSpritesRenderingObservable", _MissingSideEffectProperty("Scene", "onBeforeSpritesRenderingObservable"));
}
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "onAfterSpritesRenderingObservable")) {
    Object.defineProperty(Scene.prototype, "onAfterSpritesRenderingObservable", _MissingSideEffectProperty("Scene", "onAfterSpritesRenderingObservable"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
