/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import materialPluginBase.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./materialPluginBase.pure";

import { RegisterClass } from "../Misc/typeStore";
import { MaterialPluginBase } from "./materialPluginBase.pure";

RegisterClass("BABYLON.MaterialPluginBase", MaterialPluginBase);
