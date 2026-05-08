/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import simplexPerlin3DBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./simplexPerlin3DBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { SimplexPerlin3DBlock } from "./simplexPerlin3DBlock.pure";

RegisterClass("BABYLON.SimplexPerlin3DBlock", SimplexPerlin3DBlock);
