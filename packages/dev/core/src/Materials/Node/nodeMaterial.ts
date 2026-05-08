/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import nodeMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nodeMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { NodeMaterial } from "./nodeMaterial.pure";

RegisterClass("BABYLON.NodeMaterial", NodeMaterial);
