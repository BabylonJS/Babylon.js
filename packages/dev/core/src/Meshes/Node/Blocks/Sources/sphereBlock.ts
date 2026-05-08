/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import sphereBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SphereBlock } from "./sphereBlock.pure";

RegisterClass("BABYLON.SphereBlock", SphereBlock);
