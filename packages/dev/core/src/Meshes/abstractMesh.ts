/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import abstractMesh.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractMesh.pure";

import { RegisterClass } from "../Misc/typeStore";
import { AbstractMesh } from "./abstractMesh.pure";

RegisterClass("BABYLON.AbstractMesh", AbstractMesh);
