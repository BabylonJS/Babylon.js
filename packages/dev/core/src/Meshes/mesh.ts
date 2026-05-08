/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import mesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mesh.pure";

import { RegisterClass } from "../Misc/typeStore";
import { Mesh } from "./mesh.pure";

RegisterClass("BABYLON.Mesh", Mesh);
