/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import oneMinusBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./oneMinusBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { OneMinusBlock } from "./oneMinusBlock.pure";

RegisterClass("BABYLON.OneMinusBlock", OneMinusBlock);
RegisterClass("BABYLON.OppositeBlock", OneMinusBlock);
