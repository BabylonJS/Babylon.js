/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import material.decalMapConfiguration.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./material.decalMapConfiguration.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { DecalMapConfiguration } from "./material.decalMapConfiguration.pure";

RegisterClass("BABYLON.DecalMapConfiguration", DecalMapConfiguration);
