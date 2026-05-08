/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import shaderMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shaderMaterial.pure";

import { RegisterClass } from "../Misc/typeStore";
import { ShaderMaterial } from "./shaderMaterial.pure";

RegisterClass("BABYLON.ShaderMaterial", ShaderMaterial);
