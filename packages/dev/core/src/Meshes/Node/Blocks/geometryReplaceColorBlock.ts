/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import geometryReplaceColorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./geometryReplaceColorBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { GeometryReplaceColorBlock } from "./geometryReplaceColorBlock.pure";

RegisterClass("BABYLON.GeometryReplaceColorBlock", GeometryReplaceColorBlock);
