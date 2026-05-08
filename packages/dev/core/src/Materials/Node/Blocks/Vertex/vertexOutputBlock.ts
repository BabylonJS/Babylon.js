/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import vertexOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./vertexOutputBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { VertexOutputBlock } from "./vertexOutputBlock.pure";

RegisterClass("BABYLON.VertexOutputBlock", VertexOutputBlock);
