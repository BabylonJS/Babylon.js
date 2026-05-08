/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryRendererBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryRendererBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphGeometryRendererBlock } from "./geometryRendererBlock.pure";

RegisterClass("BABYLON.NodeRenderGraphGeometryRendererBlock", NodeRenderGraphGeometryRendererBlock);
