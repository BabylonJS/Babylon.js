/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import colorGradingTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorGradingTexture.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { ColorGradingTexture } from "./colorGradingTexture.pure";

RegisterClass("BABYLON.ColorGradingTexture", ColorGradingTexture);
