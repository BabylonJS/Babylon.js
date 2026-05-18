export * from "./geometryBufferRendererSceneComponent.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import geometryBufferRendererSceneComponent.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryBufferRendererSceneComponent.pure";

import { GeometryBufferRenderer } from "./geometryBufferRenderer.pure";
import { RegisterGeometryBufferRendererSceneComponent } from "./geometryBufferRendererSceneComponent.pure";
RegisterGeometryBufferRendererSceneComponent(GeometryBufferRenderer);
