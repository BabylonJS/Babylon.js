/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import debugBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./debugBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NodeMaterialDebugBlock } from "./debugBlock.pure";

RegisterClass("BABYLON.NodeMaterialDebugBlock", NodeMaterialDebugBlock);
