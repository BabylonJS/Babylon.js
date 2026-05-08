/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import instantiateOnVerticesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnVerticesBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { InstantiateOnVerticesBlock } from "./instantiateOnVerticesBlock.pure";

RegisterClass("BABYLON.InstantiateOnVerticesBlock", InstantiateOnVerticesBlock);
