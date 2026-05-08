/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import teleportOutBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./teleportOutBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeMaterialTeleportOutBlock } from "./teleportOutBlock.pure";

RegisterClass("BABYLON.NodeMaterialTeleportOutBlock", NodeMaterialTeleportOutBlock);
