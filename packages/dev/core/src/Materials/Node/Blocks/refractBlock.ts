/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import refractBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { RefractBlock } from "./refractBlock.pure";

RegisterClass("BABYLON.RefractBlock", RefractBlock);
