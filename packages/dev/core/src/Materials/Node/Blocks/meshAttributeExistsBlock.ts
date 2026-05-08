/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import meshAttributeExistsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshAttributeExistsBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MeshAttributeExistsBlock } from "./meshAttributeExistsBlock.pure";

RegisterClass("BABYLON.MeshAttributeExistsBlock", MeshAttributeExistsBlock);
