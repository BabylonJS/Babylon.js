/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import frontFacingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./frontFacingBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FrontFacingBlock } from "./frontFacingBlock.pure";

RegisterClass("BABYLON.FrontFacingBlock", FrontFacingBlock);
