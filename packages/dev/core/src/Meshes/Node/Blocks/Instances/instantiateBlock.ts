/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import instantiateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { InstantiateBlock } from "./instantiateBlock.pure";

RegisterClass("BABYLON.InstantiateBlock", InstantiateBlock);
