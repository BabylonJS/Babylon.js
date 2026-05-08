/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import instantiateOnVolumeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnVolumeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { InstantiateOnVolumeBlock } from "./instantiateOnVolumeBlock.pure";

RegisterClass("BABYLON.InstantiateOnVolumeBlock", InstantiateOnVolumeBlock);
