/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import biPlanarBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./biPlanarBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { BiPlanarBlock } from "./biPlanarBlock.pure";

RegisterClass("BABYLON.BiPlanarBlock", BiPlanarBlock);
