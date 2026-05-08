/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryBufferRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryBufferRendererSceneComponent.pure";

import { registerGeometryBufferRendererSceneComponent } from "./geometryBufferRendererSceneComponent.pure";
registerGeometryBufferRendererSceneComponent();
