/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import clipPlanesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clipPlanesBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ClipPlanesBlock } from "./clipPlanesBlock.pure";

RegisterClass("BABYLON.ClipPlanesBlock", ClipPlanesBlock);
