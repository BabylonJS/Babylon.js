/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import instantiateLinearBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateLinearBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { InstantiateLinearBlock } from "./instantiateLinearBlock.pure";

RegisterClass("BABYLON.InstantiateLinearBlock", InstantiateLinearBlock);
