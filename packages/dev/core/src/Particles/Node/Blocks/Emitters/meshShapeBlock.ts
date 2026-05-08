/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import meshShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshShapeBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { MeshShapeBlock } from "./meshShapeBlock.pure";

RegisterClass("BABYLON.MeshShapeBlock", MeshShapeBlock);
