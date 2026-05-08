/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import meshBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./meshBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { MeshBlock } from "./meshBlock.pure";

RegisterClass("BABYLON.MeshBlock", MeshBlock);
