/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import sphereShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereShapeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SphereShapeBlock } from "./sphereShapeBlock.pure";

RegisterClass("BABYLON.SphereShapeBlock", SphereShapeBlock);
