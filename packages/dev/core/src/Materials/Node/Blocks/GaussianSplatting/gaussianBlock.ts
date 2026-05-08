/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import gaussianBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { GaussianBlock } from "./gaussianBlock.pure";

RegisterClass("BABYLON.GaussianBlock", GaussianBlock);
