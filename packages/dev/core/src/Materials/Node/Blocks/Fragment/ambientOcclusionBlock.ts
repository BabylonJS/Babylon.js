/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import ambientOcclusionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./ambientOcclusionBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { AmbientOcclusionBlock } from "./ambientOcclusionBlock.pure";

RegisterClass("BABYLON.AmbientOcclusionBlock", AmbientOcclusionBlock);
