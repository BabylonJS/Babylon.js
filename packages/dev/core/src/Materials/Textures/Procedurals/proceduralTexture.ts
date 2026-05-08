/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import proceduralTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./proceduralTexture.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ProceduralTexture } from "./proceduralTexture.pure";

RegisterClass("BABYLON.ProceduralTexture", ProceduralTexture);
