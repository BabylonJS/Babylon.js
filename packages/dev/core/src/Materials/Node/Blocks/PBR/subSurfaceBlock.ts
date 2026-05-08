/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import subSurfaceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subSurfaceBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SubSurfaceBlock } from "./subSurfaceBlock.pure";

RegisterClass("BABYLON.SubSurfaceBlock", SubSurfaceBlock);
