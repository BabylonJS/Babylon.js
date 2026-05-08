/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import icoSphereBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./icoSphereBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { IcoSphereBlock } from "./icoSphereBlock.pure";

RegisterClass("BABYLON.IcoSphereBlock", IcoSphereBlock);
