/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import refractionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./refractionBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { RefractionBlock } from "./refractionBlock.pure";

RegisterClass("BABYLON.RefractionBlock", RefractionBlock);
