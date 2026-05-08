/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updateFlowMapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateFlowMapBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdateFlowMapBlock } from "./updateFlowMapBlock.pure";

RegisterClass("BABYLON.UpdateFlowMapBlock", UpdateFlowMapBlock);
